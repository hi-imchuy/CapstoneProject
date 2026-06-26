import argparse
import json
import os
import random
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib import error as urllib_error
from urllib import request as urllib_request

try:
  from dotenv import load_dotenv
except ImportError:
  load_dotenv = None


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "dermatology_rag_chunks.json"
DEFAULT_CHROMA_DIR = BASE_DIR / "data" / "chroma_db"
DEFAULT_EMBEDDING_MODEL = "intfloat/multilingual-e5-base"
DEFAULT_TOP_K = 6
DEFAULT_NINE_ROUTER_BASE_URL = "http://localhost:20128/v1"
DEFAULT_NINE_ROUTER_MODEL = "cx/gpt-5.5"
LLM_REQUEST_TIMEOUT_SECONDS = 120
INSUFFICIENT_INFO_ANSWER = "Mình chưa có đủ thông tin trong tài liệu được cung cấp về nội dung này."
DETECTION_DISEASE_NAME_MAP = {
  "BenhLyNiemMacMieng": "Bệnh lý niêm mạc miệng",
  "GiangMai": "Giang mai",
  "MayDay": "Mày đay",
  "MunCoc": "Mụn cóc",
  "MunTrungCa": "Mụn trứng cá",
  "VayNen": "Vảy nến",
  "ViemDaCoDia": "Viêm da cơ địa",
  "ZonaThanKinh": "Zona thần kinh",
}
MAX_HISTORY_MESSAGES = 20
HISTORY_CONTENT_LIMIT = 800


class RagConfigurationError(RuntimeError):
  pass


@dataclass
class RetrievalResult:
  chunk: Dict[str, Any]
  semantic_score: float
  metadata_score: float
  final_score: float


def load_environment():
  if load_dotenv is not None:
    load_dotenv(BASE_DIR / ".env", override=True)


def normalize_text(value: str) -> str:
  value = value.lower()
  value = value.replace("_", " ")
  return re.sub(r"\s+", " ", value).strip()


def normalize_lookup_text(value: str) -> str:
  value = DETECTION_DISEASE_NAME_MAP.get(str(value).strip(), str(value))
  value = unicodedata.normalize("NFD", value)
  value = "".join(char for char in value if unicodedata.category(char) != "Mn")
  value = value.replace("đ", "d").replace("Đ", "D")
  value = re.sub(r"(?<!^)(?=[A-Z])", " ", value)
  value = value.lower().replace("_", " ").replace("-", " ")
  return re.sub(r"\s+", " ", value).strip()


def as_list(value: Any) -> List[str]:
  if isinstance(value, list):
    return [str(item) for item in value if item]
  if isinstance(value, str) and value:
    return [value]
  return []


def join_terms(value: Any) -> str:
  return " | ".join(as_list(value))


def build_embedding_text(chunk: Dict[str, Any]) -> str:
  fields = [
    chunk.get("title", ""),
    chunk.get("disease", ""),
    join_terms(chunk.get("aliases", [])),
    chunk.get("section", ""),
    str(chunk.get("subtopic", "")).replace("_", " "),
    join_terms(chunk.get("questions", [])),
    join_terms(chunk.get("boost_terms", [])),
    join_terms(chunk.get("symptom_tags", [])),
    join_terms(chunk.get("body_site_tags", [])),
    chunk.get("content", ""),
  ]
  return "\n".join(part for part in fields if part)


def flatten_metadata(chunk: Dict[str, Any]) -> Dict[str, Any]:
  audience = chunk.get("audience") or {}
  return {
    "id": chunk.get("id", ""),
    "disease": chunk.get("disease", ""),
    "section": chunk.get("section", ""),
    "subtopic": chunk.get("subtopic", ""),
    "access_level": chunk.get("access_level", ""),
    "risk_level": chunk.get("risk_level", ""),
    "retrieval_role": chunk.get("retrieval_role", ""),
    "retrieval_priority": int(chunk.get("retrieval_priority", 0) or 0),
    "requires_doctor": bool(chunk.get("requires_doctor", False)),
    "audience_primary": audience.get("primary", ""),
    "audience_visibility": audience.get("visibility", ""),
    "symptom_tags": join_terms(chunk.get("symptom_tags", [])),
    "body_site_tags": join_terms(chunk.get("body_site_tags", [])),
    "trigger_tags": join_terms(chunk.get("trigger_tags", [])),
    "treatment_tags": join_terms(chunk.get("treatment_tags", [])),
    "red_flag_tags": join_terms(chunk.get("red_flag_tags", [])),
    "population_tags": join_terms(chunk.get("population_tags", [])),
  }


class LocalEmbeddingFunction:
  def __init__(self, model_name: str):
    try:
      from sentence_transformers import SentenceTransformer
    except ImportError as error:
      raise RagConfigurationError(
        "Missing dependency: sentence-transformers. Run pip install -r requirements.txt"
      ) from error

    try:
      self.model = SentenceTransformer(model_name, local_files_only=True)
    except Exception:
      self.model = SentenceTransformer(model_name)
    self.model_name = model_name

  def name(self) -> str:
    return f"sentence-transformers:{self.model_name}"

  def __call__(self, input: List[str]) -> List[List[float]]:
    return self._encode(input)

  def embed_query(self, input: List[str]) -> List[List[float]]:
    return self._encode(input)

  def embed_documents(self, input: List[str]) -> List[List[float]]:
    return self._encode(input)

  def _encode(self, input: List[str]) -> List[List[float]]:
    embeddings = self.model.encode(
      input,
      normalize_embeddings=True,
      show_progress_bar=False,
    )
    return embeddings.tolist()


class RagChatbot:
  def __init__(
    self,
    data_path: Path = DATA_PATH,
    chroma_dir: Optional[Path] = None,
    embedding_model: Optional[str] = None,
    top_k: Optional[int] = None,
  ):
    load_environment()
    self.data_path = Path(data_path)
    self.chroma_dir = Path(chroma_dir or os.getenv("RAG_CHROMA_DIR") or DEFAULT_CHROMA_DIR)
    if not self.chroma_dir.is_absolute():
      self.chroma_dir = BASE_DIR / self.chroma_dir
    self.embedding_model = embedding_model or os.getenv("RAG_EMBEDDING_MODEL") or DEFAULT_EMBEDDING_MODEL
    self.top_k = int(top_k or os.getenv("RAG_TOP_K") or DEFAULT_TOP_K)
    self.collection_name = "dermatology_rag_chunks"
    self._payload: Optional[Dict[str, Any]] = None
    self._chunks_by_id: Dict[str, Dict[str, Any]] = {}
    self._client = None
    self._collection = None
    self._embedding_function = None
    self._supported_diseases: Optional[List[str]] = None
    self._disease_lookup_entries: Optional[List[tuple[str, str]]] = None

  def load_chunks(self) -> List[Dict[str, Any]]:
    if not self.data_path.exists():
      raise RagConfigurationError(f"RAG data file not found: {self.data_path}")

    self._payload = json.loads(self.data_path.read_text(encoding="utf-8"))
    chunks = self._payload.get("chunks", [])
    if not chunks:
      raise RagConfigurationError("RAG data file has no chunks")
    self._chunks_by_id = {chunk["id"]: chunk for chunk in chunks}
    return chunks

  def _get_embedding_function(self):
    if self._embedding_function is None:
      self._embedding_function = LocalEmbeddingFunction(self.embedding_model)
    return self._embedding_function

  def _get_collection(self):
    if self._collection is not None:
      return self._collection

    try:
      import chromadb
    except ImportError as error:
      raise RagConfigurationError(
        "Missing dependency: chromadb. Run pip install -r requirements.txt"
      ) from error

    self.chroma_dir.mkdir(parents=True, exist_ok=True)
    self._client = chromadb.PersistentClient(path=str(self.chroma_dir))
    self._collection = self._client.get_or_create_collection(
      name=self.collection_name,
      embedding_function=self._get_embedding_function(),
      metadata={"hnsw:space": "cosine"},
    )
    return self._collection

  def rebuild_index(self) -> Dict[str, Any]:
    chunks = self.load_chunks()

    try:
      import chromadb
    except ImportError as error:
      raise RagConfigurationError(
        "Missing dependency: chromadb. Run pip install -r requirements.txt"
      ) from error

    self.chroma_dir.mkdir(parents=True, exist_ok=True)
    self._client = chromadb.PersistentClient(path=str(self.chroma_dir))
    try:
      self._client.delete_collection(self.collection_name)
    except Exception:
      pass
    self._collection = self._client.get_or_create_collection(
      name=self.collection_name,
      embedding_function=self._get_embedding_function(),
      metadata={"hnsw:space": "cosine"},
    )

    ids = [chunk["id"] for chunk in chunks]
    documents = [build_embedding_text(chunk) for chunk in chunks]
    metadatas = [flatten_metadata(chunk) for chunk in chunks]

    batch_size = 64
    for start in range(0, len(chunks), batch_size):
      end = start + batch_size
      self._collection.add(
        ids=ids[start:end],
        documents=documents[start:end],
        metadatas=metadatas[start:end],
      )

    llm_api_key = os.getenv("NINE_ROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    llm_base_url = os.getenv("NINE_ROUTER_BASE_URL") or DEFAULT_NINE_ROUTER_BASE_URL
    llm_model = os.getenv("NINE_ROUTER_MODEL") or DEFAULT_NINE_ROUTER_MODEL

    return {
      "status": "ready",
      "chunks": len(chunks),
      "collection": self.collection_name,
      "chromaDir": str(self.chroma_dir),
      "embeddingModel": self.embedding_model,
    }

  def ensure_index(self):
    chunks = self.load_chunks()
    collection = self._get_collection()
    if collection.count() != len(chunks):
      self.rebuild_index()

  def health(self) -> Dict[str, Any]:
    data_exists = self.data_path.exists()
    chunk_count = 0
    collection_count = None
    error = None

    try:
      chunks = self.load_chunks() if data_exists else []
      chunk_count = len(chunks)
      collection = self._get_collection()
      collection_count = collection.count()
    except Exception as exc:
      error = str(exc)

    llm_api_key = os.getenv("NINE_ROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    llm_base_url = os.getenv("NINE_ROUTER_BASE_URL") or DEFAULT_NINE_ROUTER_BASE_URL
    llm_model = os.getenv("NINE_ROUTER_MODEL") or DEFAULT_NINE_ROUTER_MODEL

    return {
      "dataPath": str(self.data_path),
      "dataExists": data_exists,
      "chunkCount": chunk_count,
      "chromaDir": str(self.chroma_dir),
      "collectionCount": collection_count,
      "embeddingModel": self.embedding_model,
      "llmProvider": "9router",
      "llmBaseUrl": llm_base_url,
      "llmModel": llm_model,
      "llmConfigured": bool(llm_api_key),
      "ready": data_exists and error is None and collection_count == chunk_count and bool(llm_api_key),
      "error": error,
    }

  def extract_query_tags(self, message: str) -> Dict[str, List[str]]:
    chunks = self.load_chunks()
    normalized = normalize_text(message)
    tag_fields = [
      "symptom_tags",
      "body_site_tags",
      "trigger_tags",
      "treatment_tags",
      "red_flag_tags",
      "population_tags",
    ]
    known_terms = {field: set() for field in tag_fields}
    diseases = set()

    for chunk in chunks:
      diseases.add(str(chunk.get("disease", "")))
      for alias in as_list(chunk.get("aliases", [])):
        diseases.add(alias)
      for field in tag_fields:
        for term in as_list(chunk.get(field, [])):
          known_terms[field].add(term)

    matches = {}
    for field, terms in known_terms.items():
      matches[field] = sorted(term for term in terms if normalize_text(term) in normalized)
    matches["diseases"] = sorted(term for term in diseases if term and normalize_text(term) in normalized)
    return matches

  def supported_diseases(self) -> List[str]:
    if self._supported_diseases is None:
      chunks = self.load_chunks()
      self._supported_diseases = sorted({
        str(chunk.get("disease", "")).strip()
        for chunk in chunks
        if str(chunk.get("disease", "")).strip()
      })
    return self._supported_diseases

  def disease_lookup_entries(self) -> List[tuple[str, str]]:
    if self._disease_lookup_entries is None:
      chunks = self.load_chunks()
      entries = {}
      for chunk in chunks:
        disease = str(chunk.get("disease", "")).strip()
        if not disease:
          continue
        terms = [disease, *as_list(chunk.get("aliases", []))]
        for term in terms:
          normalized_term = normalize_lookup_text(term)
          if normalized_term:
            entries[(disease, normalized_term)] = (disease, normalized_term)

      self._disease_lookup_entries = sorted(
        entries.values(),
        key=lambda item: len(item[1]),
        reverse=True
      )
    return self._disease_lookup_entries

  def find_disease_mentions(self, text: str) -> List[str]:
    normalized_text = normalize_lookup_text(text)
    if not normalized_text:
      return []

    matches = []
    for disease, normalized_term in self.disease_lookup_entries():
      if re.search(rf"(?<!\w){re.escape(normalized_term)}(?!\w)", normalized_text):
        if disease not in matches:
          matches.append(disease)
    return matches

  def latest_history_disease(self, history: Optional[List[Dict[str, str]]]) -> Optional[str]:
    for item in reversed((history or [])[-MAX_HISTORY_MESSAGES:]):
      content = str(item.get("content", ""))
      mentions = self.find_disease_mentions(content)
      if mentions:
        return mentions[0]
    return None

  def is_supported_disease(self, disease: str) -> bool:
    normalized_disease = normalize_lookup_text(disease)
    return any(
      normalized_term == normalized_disease
      for _, normalized_term in self.disease_lookup_entries()
    )

  def parse_json_object(self, text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if match:
      cleaned = match.group(0)
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
      raise ValueError("Expected a JSON object")
    return parsed

  def call_llm(self, messages: List[Dict[str, str]]) -> str:
    api_key = os.getenv("NINE_ROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
      raise RagConfigurationError("NINE_ROUTER_API_KEY is missing. Add it to python-server/.env")

    base_url = (os.getenv("NINE_ROUTER_BASE_URL") or DEFAULT_NINE_ROUTER_BASE_URL).rstrip("/")
    model = os.getenv("NINE_ROUTER_MODEL") or DEFAULT_NINE_ROUTER_MODEL

    try:
      request_body = json.dumps({
        "model": model,
        "messages": messages
      }, ensure_ascii=False).encode("utf-8")
      request = urllib_request.Request(
        f"{base_url}/chat/completions",
        data=request_body,
        headers={
          "Authorization": f"Bearer {api_key}",
          "Content-Type": "application/json"
        },
        method="POST"
      )
      with urllib_request.urlopen(request, timeout=LLM_REQUEST_TIMEOUT_SECONDS) as response:
        response_data = json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as error:
      error_body = error.read().decode("utf-8", errors="replace")
      raise RagConfigurationError(f"9router API request failed: HTTP {error.code} {error_body}") from error
    except (urllib_error.URLError, TimeoutError, json.JSONDecodeError) as error:
      raise RagConfigurationError(f"9router API request failed: {error}") from error

    return self._response_text(response_data)

  def rewrite_query_with_history(
    self,
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
    mode: str = "patient"
  ) -> Dict[str, Any]:
    supported_diseases = ", ".join(self.supported_diseases())

    system_prompt = (
      "Bạn là bộ phận rewrite câu hỏi cho hệ thống RAG y khoa da liễu. "
      "Đọc lịch sử hội thoại và câu hỏi hiện tại của người dùng, sau đó viết lại câu hỏi hiện tại thành MỘT câu hỏi tiếng Việt tự nhiên, đầy đủ ngữ cảnh, giống như một người dùng bình thường tự gõ. "
      "Chỉ rewrite câu hỏi, không trả lời câu hỏi. "
      "Nếu câu hỏi hiện tại thiếu chủ thể/bệnh nhưng lịch sử đang nói rõ về một bệnh, hãy thêm tên bệnh đó vào câu hỏi. "
      "Nếu câu hỏi hiện tại đã nêu rõ bệnh, ưu tiên bệnh trong câu hỏi hiện tại. "
      "Không thêm kiến thức y khoa mới. "
      "Không thêm metadata, không ghi 'ngữ cảnh', 'chủ đề', 'context', 'history'. "
      "Không xuống dòng giải thích. "
      "Câu rewrite phải là một câu hỏi tự nhiên duy nhất. "
      "Nếu không xác định được bệnh/chủ đề từ lịch sử hoặc câu hỏi hiện tại, giữ nguyên câu hỏi hiện tại. "
      f"The only supported disease topics are: {supported_diseases}. "
      "Chỉ trả về JSON hợp lệ với keys: standalone_question, resolved_topic, confidence."
    )
    user_prompt = (
      "Ví dụ:\n"
      "Lịch sử: Người dùng hỏi \"Mụn trứng cá là bệnh gì?\"\n"
      "Câu hỏi hiện tại: \"Chữa trị như nào?\"\n"
      "Rewrite: \"Mụn trứng cá chữa trị như thế nào?\"\n\n"
      "Lịch sử: Người dùng hỏi \"Vảy nến có nguy hiểm không?\"\n"
      "Câu hỏi hiện tại: \"Triệu chứng ra sao?\"\n"
      "Rewrite: \"Vảy nến có triệu chứng ra sao?\"\n\n"
      "Lịch sử: Người dùng hỏi về vảy nến\n"
      "Câu hỏi hiện tại: \"Mụn trứng cá chữa trị như thế nào?\"\n"
      "Rewrite: \"Mụn trứng cá chữa trị như thế nào?\"\n\n"
      f"Dữ liệu đầu vào:\n"
      f"Mode: {mode}\n"
      f"Danh sách bệnh hệ thống hỗ trợ: {supported_diseases}\n\n"
      f"Lịch sử hội thoại:\n{self.format_history_for_prompt(history)}\n\n"
      f"Câu hỏi hiện tại:\n{message}\n\n"
      "Chỉ trả về JSON hợp lệ:\n"
      "{\n"
      "  \"standalone_question\": \"câu hỏi đã rewrite\",\n"
      "  \"resolved_topic\": \"tên bệnh/chủ đề nếu xác định được, nếu không thì để chuỗi rỗng\",\n"
      "  \"confidence\": số từ 0 đến 1\n"
      "}"
    )

    try:
      rewrite_text = self.call_llm([
        { "role": "system", "content": system_prompt },
        { "role": "user", "content": user_prompt }
      ])
      rewrite_data = self.parse_json_object(rewrite_text)
    except Exception:
      return {
        "standalone_question": message,
        "resolved_topic": None,
        "confidence": 0.0,
        "used_fallback": True
      }

    standalone_question = str(rewrite_data.get("standalone_question", "")).strip()
    resolved_topic = str(rewrite_data.get("resolved_topic", "")).strip()
    try:
      confidence = float(rewrite_data.get("confidence", 0) or 0)
    except (TypeError, ValueError):
      confidence = 0.0

    if not standalone_question:
      return {
        "standalone_question": message,
        "resolved_topic": None,
        "confidence": 0.0,
        "used_fallback": True
      }

    if resolved_topic and not self.is_supported_disease(resolved_topic):
      return {
        "standalone_question": message,
        "resolved_topic": None,
        "confidence": 0.0,
        "used_fallback": True
      }

    if confidence < 0.35 and not self.find_disease_mentions(standalone_question):
      return {
        "standalone_question": message,
        "resolved_topic": None,
        "confidence": confidence,
        "used_fallback": True
      }

    return {
      "standalone_question": standalone_question,
      "resolved_topic": resolved_topic or None,
      "confidence": max(0.0, min(confidence, 1.0)),
      "used_fallback": False
    }

  def metadata_score(self, chunk: Dict[str, Any], query_tags: Dict[str, List[str]], mode: str) -> float:
    score = 0.0
    priority = int(chunk.get("retrieval_priority", 0) or 0)
    score += priority * 0.04

    for field, weight in [
      ("symptom_tags", 0.18),
      ("body_site_tags", 0.14),
      ("red_flag_tags", 0.25),
      ("trigger_tags", 0.10),
      ("treatment_tags", 0.12),
      ("population_tags", 0.10),
    ]:
      chunk_terms = set(as_list(chunk.get(field, [])))
      query_terms = set(query_tags.get(field, []))
      score += len(chunk_terms & query_terms) * weight

    disease_terms = set(query_tags.get("diseases", []))
    if chunk.get("disease") in disease_terms or disease_terms.intersection(set(as_list(chunk.get("aliases", [])))):
      score += 0.25

    if mode == "patient" and chunk.get("access_level") == "clinician_only" and not self._patient_can_use_chunk(chunk, query_tags):
      score -= 2.0
    elif mode == "patient" and chunk.get("access_level") == "clinician_only":
      score += 0.1

    return score

  def chunk_matches_query_disease(self, chunk: Dict[str, Any], query_tags: Dict[str, List[str]]) -> bool:
    disease_terms = {
      normalize_lookup_text(term)
      for term in query_tags.get("diseases", [])
      if str(term).strip()
    }
    if not disease_terms:
      return False

    chunk_terms = {
      normalize_lookup_text(chunk.get("disease", "")),
      *[normalize_lookup_text(alias) for alias in as_list(chunk.get("aliases", []))]
    }
    return bool(disease_terms & chunk_terms)

  def query_has_treatment_intent(self, message: str, query_tags: Dict[str, List[str]]) -> bool:
    normalized_message = normalize_lookup_text(message)
    treatment_terms = [
      "dieu tri",
      "ddieu tri",
      "chua tri",
      "cach tri",
      "tri benh",
      "thuoc",
      "khang sinh",
    ]
    return bool(query_tags.get("treatment_tags")) or any(term in normalized_message for term in treatment_terms)

  def query_has_diagnosis_intent(self, message: str) -> bool:
    normalized_message = normalize_lookup_text(message)
    diagnosis_terms = [
      "chan doan",
      "xet nghiem",
      "kiem tra",
      "phan biet",
    ]
    return any(term in normalized_message for term in diagnosis_terms)

  def query_has_symptom_intent(self, message: str) -> bool:
    normalized_message = normalize_lookup_text(message)
    symptom_terms = [
      "trieu chung",
      "dau hieu",
      "bieu hien",
    ]
    return any(term in normalized_message for term in symptom_terms)

  def query_has_risk_intent(self, message: str, query_tags: Dict[str, List[str]]) -> bool:
    normalized_message = normalize_lookup_text(message)
    risk_terms = [
      "nguy hiem",
      "nang khong",
      "co nang",
      "can di kham",
      "khi nao di kham",
      "bien chung",
      "de lai seo",
      "rui ro",
    ]
    return bool(query_tags.get("red_flag_tags")) or any(term in normalized_message for term in risk_terms)

  def disease_candidates(
    self,
    message: str,
    query_tags: Dict[str, List[str]],
    mode: str
  ) -> List[RetrievalResult]:
    if not query_tags.get("diseases"):
      return []

    treatment_intent = self.query_has_treatment_intent(message, query_tags)
    diagnosis_intent = self.query_has_diagnosis_intent(message)
    symptom_intent = self.query_has_symptom_intent(message)
    risk_intent = self.query_has_risk_intent(message, query_tags)
    candidates = []

    for chunk in self._chunks_by_id.values():
      if not self.chunk_matches_query_disease(chunk, query_tags):
        continue
      if mode == "patient" and not self._patient_can_use_chunk(chunk, query_tags):
        continue
      if mode == "patient" and int(chunk.get("retrieval_priority", 0) or 0) < 3:
        continue
      if mode == "doctor" and int(chunk.get("retrieval_priority", 0) or 0) < 2:
        continue

      section = normalize_lookup_text(chunk.get("section", ""))
      subtopic = normalize_lookup_text(chunk.get("subtopic", ""))
      score = self.metadata_score(chunk, query_tags, mode) + 0.75
      if treatment_intent and ("dieu tri" in section or "dieu tri" in subtopic or "ddieu tri" in subtopic):
        score += 0.55
      if diagnosis_intent and ("chan doan" in section or "xet nghiem" in subtopic):
        score += 0.35
      if symptom_intent and ("trieu chung" in section or "dau hieu" in subtopic):
        score += 0.35
      if risk_intent and "dau hieu can di kham" in subtopic:
        score += 0.65
      elif risk_intent and as_list(chunk.get("red_flag_tags", [])):
        score += 0.45
      elif risk_intent and chunk.get("requires_doctor"):
        score += 0.2

      candidates.append(RetrievalResult(chunk, 0.0, score, score))

    return candidates

  def retrieve(self, message: str, mode: str = "patient", top_k: Optional[int] = None) -> List[RetrievalResult]:
    mode = mode if mode in ("patient", "doctor") else "patient"
    requested_top_k = int(top_k or self.top_k)
    self.ensure_index()
    collection = self._get_collection()
    query_tags = self.extract_query_tags(message)

    query_text = f"query: {message}"
    raw_results = collection.query(
      query_texts=[query_text],
      n_results=min(max(requested_top_k * 5, 20), len(self._chunks_by_id)),
    )
    ids = raw_results.get("ids", [[]])[0]
    distances = raw_results.get("distances", [[]])[0]

    results = []
    for chunk_id, distance in zip(ids, distances):
      chunk = self._chunks_by_id.get(chunk_id)
      if not chunk:
        continue
      if mode == "patient" and not self._patient_can_use_chunk(chunk, query_tags):
        continue
      if mode == "patient" and int(chunk.get("retrieval_priority", 0) or 0) < 3:
        continue
      if mode == "doctor" and int(chunk.get("retrieval_priority", 0) or 0) < 2:
        continue

      semantic_score = max(0.0, 1.0 - float(distance))
      meta_score = self.metadata_score(chunk, query_tags, mode)
      final_score = semantic_score + meta_score
      results.append(RetrievalResult(chunk, semantic_score, meta_score, final_score))

    results.extend(self.disease_candidates(message, query_tags, mode))

    if query_tags.get("red_flag_tags") or query_tags.get("treatment_tags"):
      red_flag_results = self._red_flag_candidates(query_tags, mode)
      results.extend(red_flag_results)

    deduped = {}
    for result in results:
      current = deduped.get(result.chunk["id"])
      if current is None or result.final_score > current.final_score:
        deduped[result.chunk["id"]] = result

    return sorted(deduped.values(), key=lambda item: item.final_score, reverse=True)[:requested_top_k]

  def _red_flag_candidates(self, query_tags: Dict[str, List[str]], mode: str) -> List[RetrievalResult]:
    candidates = []
    for chunk in self._chunks_by_id.values():
      if int(chunk.get("retrieval_priority", 0) or 0) != 5:
        continue
      if mode == "patient" and not self._patient_can_use_chunk(chunk, query_tags):
        continue
      overlap = (
        set(as_list(chunk.get("red_flag_tags", []))) & set(query_tags.get("red_flag_tags", []))
        or set(as_list(chunk.get("treatment_tags", []))) & set(query_tags.get("treatment_tags", []))
      )
      if not overlap:
        continue
      meta_score = self.metadata_score(chunk, query_tags, mode) + 0.5
      candidates.append(RetrievalResult(chunk, 0.0, meta_score, meta_score))
    return candidates

  def _patient_can_use_chunk(self, chunk: Dict[str, Any], query_tags: Dict[str, List[str]]) -> bool:
    if chunk.get("access_level") != "clinician_only":
      return True
    if int(chunk.get("retrieval_priority", 0) or 0) != 5:
      return False
    has_disease_overlap = self.chunk_matches_query_disease(chunk, query_tags)
    has_red_flag_overlap = bool(
      set(as_list(chunk.get("red_flag_tags", []))) & set(query_tags.get("red_flag_tags", []))
    )
    has_treatment_overlap = bool(
      set(as_list(chunk.get("treatment_tags", []))) & set(query_tags.get("treatment_tags", []))
    )
    return has_disease_overlap or has_red_flag_overlap or has_treatment_overlap

  def build_context(self, results: List[RetrievalResult], mode: str) -> str:
    blocks = []
    for index, result in enumerate(results, start=1):
      chunk = result.chunk
      content = chunk.get("content", "")
      if mode == "patient" and (chunk.get("access_level") == "clinician_only" or chunk.get("requires_doctor")):
        content = self.sanitize_patient_context(content)
      blocks.append(
        "\n".join([
          f"[Source {index}]",
          f"Disease: {chunk.get('disease', '')}",
          f"Section: {chunk.get('section', '')} / {str(chunk.get('subtopic', '')).replace('_', ' ')}",
          f"Retrieval priority: {chunk.get('retrieval_priority', '')}",
          f"Requires doctor: {chunk.get('requires_doctor', False)}",
          f"Warning signs: {join_terms(chunk.get('red_flag_tags', [])) or 'None'}",
          f"Content: {content}",
          f"Safety note: {chunk.get('safe_answer', '')}",
        ])
      )
    return "\n\n".join(blocks)

  def sanitize_patient_context(self, content: str) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", content)
    unsafe_patterns = [
      r"\b\d+([,.]\s?\d+)?\s*(mg|g|mcg|%)",
      r"mg/kg",
      r"lan/ngay",
      r"dose",
      r"dosage",
      r"recommended dose",
      r"usual dose",
    ]
    safe_sentences = []
    for sentence in sentences:
      lowered = sentence.lower()
      if any(re.search(pattern, lowered) for pattern in unsafe_patterns):
        continue
      safe_sentences.append(sentence)
    cleaned = " ".join(safe_sentences).strip()
    return cleaned or "This context involves medication or treatment details that require direct medical evaluation."

  def format_history_for_prompt(self, history: Optional[List[Dict[str, str]]]) -> str:
    lines = []
    for item in (history or [])[-MAX_HISTORY_MESSAGES:]:
      role = item.get("role")
      if role not in ("user", "assistant"):
        continue
      content = str(item.get("content", "")).strip()
      if not content:
        continue
      label = "Người dùng" if role == "user" else "Trợ lý"
      lines.append(f"{label}: {content[:HISTORY_CONTENT_LIMIT]}")
    return "\n".join(lines) or "None"

  def generate_answer(
    self,
    message: str,
    results: List[RetrievalResult],
    mode: str,
    history: Optional[List[Dict[str, str]]] = None,
    resolved_topic: Optional[str] = None,
    rewritten_question: Optional[str] = None
  ) -> str:
    context = self.build_context(results, mode)
    supported_diseases = ", ".join(self.supported_diseases())
    retrieved_diseases = ", ".join(sorted({
      str(result.chunk.get("disease", "")).strip()
      for result in results
      if str(result.chunk.get("disease", "")).strip()
    }))
    system_prompt = (
      "You are a Vietnamese dermatology information chatbot. "
      "Always answer the end user in natural, friendly, easy-to-understand Vietnamese. "
      "Use only the provided RAG context. Do not invent facts outside the context. "
      "Conversation history may only be used to understand what vague words like 'đó' or 'này' refer to; never use it as a medical knowledge source. "
      f"The knowledge base only supports these diseases: {supported_diseases}. "
      "Silently check whether the user's exact disease or topic is directly supported by the RAG context before answering. "
      f"If the user asks about a disease or topic that is not directly covered by the RAG context, answer exactly: {INSUFFICIENT_INFO_ANSWER} "
      "Do not add explanations, general disease information, safety advice, or follow-up questions in that case. "
      "Output plain text only. Do not use Markdown. Do not use **bold**, *, # headings, or '-' bullet markers. "
      "If a list is needed, use short paragraphs or numbered items like 1., 2., 3. "
      "Do not return JSON. Do not list metadata. Do not mention chunks, source numbers, or internal retrieval details. "
      "Do not make a definitive diagnosis, prescribe medication, or provide prescription drug dosing instructions. "
      f"If the context is insufficient, answer exactly: {INSUFFICIENT_INFO_ANSWER} "
      "Only when the context is sufficient and directly answers the user's topic, advise the user in Vietnamese to seek appropriate medical care if there are warning signs or the topic requires a clinician."
    )
    user_prompt = (
      "Format rule: plain text for a chat bubble only. Never include **, *, #, or '-' bullet markers.\n"
      f"Insufficient-information answer rule: if the RAG context does not directly answer the user's exact disease/topic, return only this sentence and nothing else: {INSUFFICIENT_INFO_ANSWER}\n"
      f"Supported diseases in the knowledge base: {supported_diseases}\n"
      f"Diseases found in retrieved context: {retrieved_diseases or 'None'}\n"
      f"Mode: {mode}\n"
      f"Resolved conversation topic: {resolved_topic or 'None'}\n"
      f"Standalone retrieval question: {rewritten_question or message}\n"
      f"Conversation history for reference resolution only:\n{self.format_history_for_prompt(history)}\n\n"
      f"User question: {message}\n\n"
      f"RAG context:\n{context}\n\n"
      "Write the final answer for the end user in Vietnamese."
    )

    answer = self.call_llm([
      { "role": "system", "content": system_prompt },
      { "role": "user", "content": user_prompt }
    ])
    return self.sanitize_model_output(answer)

  def _response_text(self, response: Any) -> str:
    if isinstance(response, dict):
      choices = response.get("choices") or []
      for choice in choices:
        message = choice.get("message") or {}
        content = message.get("content")
        if isinstance(content, str) and content.strip():
          return content

      output_text = response.get("output_text")
      if isinstance(output_text, str) and output_text.strip():
        return output_text

    raise RagConfigurationError("9router response did not contain text output")

  def sanitize_model_output(self, text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(
      r"\*\*(.+?)\*\*",
      lambda match: match.group(1).strip().upper(),
      cleaned,
      flags=re.DOTALL
    )
    cleaned = re.sub(r"(?m)^\s*[-*]\s+", "", cleaned)
    cleaned = re.sub(r"(?m)^#{1,6}\s*", "", cleaned)
    cleaned = cleaned.replace("**", "").replace("*", "")
    return cleaned.strip()

  def generate_suggested_questions(
    self,
    diseases: List[str],
    count: int = 5,
    mode: str = "patient"
  ) -> Dict[str, Any]:
    normalized_diseases = []
    disease_lookup_terms = set()
    for disease in diseases:
      disease_name = str(disease or "").strip()
      if disease_name and disease_name not in normalized_diseases:
        normalized_diseases.append(disease_name)
      lookup_name = normalize_lookup_text(disease_name)
      if lookup_name:
        disease_lookup_terms.add(lookup_name)

    if not normalized_diseases:
      raise RagConfigurationError("At least one detected disease is required")

    requested_count = min(max(int(count or 5), 1), 8)
    mode = mode if mode in ("patient", "doctor") else "patient"
    chunks = self.load_chunks()
    candidates = []

    for chunk in chunks:
      chunk_disease_terms = {
        normalize_lookup_text(chunk.get("disease", "")),
        *[normalize_lookup_text(alias) for alias in as_list(chunk.get("aliases", []))]
      }
      if not disease_lookup_terms.intersection(chunk_disease_terms):
        continue
      if mode == "patient" and chunk.get("access_level") == "clinician_only":
        continue

      chunk_questions = as_list(chunk.get("questions", []))
      if not chunk_questions:
        continue

      priority = int(chunk.get("retrieval_priority", 0) or 0)
      for question in chunk_questions:
        cleaned_question = re.sub(r"^\d+[\.)]\s*", "", str(question or "")).strip()
        if cleaned_question:
          candidates.append((priority, cleaned_question))

    high_priority_questions = [
      question
      for priority, question in candidates
      if priority >= 3
    ]
    fallback_questions = [question for _, question in candidates]
    source_questions = high_priority_questions or fallback_questions

    deduped_questions = []
    seen_questions = set()
    for question in source_questions:
      normalized_question = normalize_lookup_text(question)
      if normalized_question in seen_questions:
        continue
      seen_questions.add(normalized_question)
      deduped_questions.append(question)

    if len(deduped_questions) < requested_count:
      raise RagConfigurationError("RAG data does not contain enough suggested questions for detected diseases")

    random.shuffle(deduped_questions)

    return {
      "questions": deduped_questions[:requested_count],
      "diseases": normalized_diseases,
      "mode": mode,
    }

  def chat(
    self,
    message: str,
    mode: str = "patient",
    top_k: Optional[int] = None,
    history: Optional[List[Dict[str, str]]] = None
  ) -> Dict[str, Any]:
    rewrite_result = self.rewrite_query_with_history(message, history, mode=mode)
    retrieval_query = rewrite_result["standalone_question"]
    resolved_topic = rewrite_result.get("resolved_topic")
    results = self.retrieve(retrieval_query, mode=mode, top_k=top_k)
    if not results:
      return {
        "answer": INSUFFICIENT_INFO_ANSWER,
        "rawAnswer": "",
        "mode": mode,
        "rewrittenQuestion": retrieval_query,
        "resolvedTopic": resolved_topic,
        "rewriteConfidence": rewrite_result.get("confidence", 0.0),
        "safetyFlags": [],
        "sources": [],
      }

    raw_answer = self.build_context(results, mode)
    answer = self.generate_answer(
      message,
      results,
      mode,
      history=history,
      resolved_topic=resolved_topic,
      rewritten_question=retrieval_query
    )
    safety_flags = sorted({
      tag
      for result in results
      for tag in as_list(result.chunk.get("red_flag_tags", []))
    })
    return {
      "answer": answer,
      "rawAnswer": raw_answer,
      "mode": mode,
      "rewrittenQuestion": retrieval_query,
      "resolvedTopic": resolved_topic,
      "rewriteConfidence": rewrite_result.get("confidence", 0.0),
      "safetyFlags": safety_flags,
      "sources": [self.source_payload(result) for result in results],
    }

  def source_payload(self, result: RetrievalResult) -> Dict[str, Any]:
    chunk = result.chunk
    return {
      "id": chunk.get("id"),
      "title": chunk.get("title"),
      "disease": chunk.get("disease"),
      "section": chunk.get("section"),
      "subtopic": chunk.get("subtopic"),
      "retrievalPriority": chunk.get("retrieval_priority"),
      "accessLevel": chunk.get("access_level"),
      "requiresDoctor": chunk.get("requires_doctor"),
      "score": round(result.final_score, 4),
    }


def print_search_results(bot: RagChatbot, query: str, mode: str, top_k: int):
  results = bot.retrieve(query, mode=mode, top_k=top_k)
  for index, result in enumerate(results, start=1):
    chunk = result.chunk
    print(f"{index}. {chunk.get('title')} [{chunk.get('id')}]")
    print(f"   score={result.final_score:.4f} priority={chunk.get('retrieval_priority')} access={chunk.get('access_level')}")
    print(f"   {chunk.get('content', '')[:220]}")


def main():
  parser = argparse.ArgumentParser(description="Dermatology RAG chatbot utilities")
  parser.add_argument("--rebuild-index", action="store_true", help="Rebuild Chroma index from JSON data")
  parser.add_argument("--search", help="Run retrieval only")
  parser.add_argument("--ask", help="Run retrieval and Gemini answer generation")
  parser.add_argument("--mode", choices=["patient", "doctor"], default="patient")
  parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K)
  args = parser.parse_args()

  bot = RagChatbot(top_k=args.top_k)

  if args.rebuild_index:
    print(json.dumps(bot.rebuild_index(), ensure_ascii=False, indent=2))
  elif args.search:
    print_search_results(bot, args.search, args.mode, args.top_k)
  elif args.ask:
    print(bot.chat(args.ask, mode=args.mode, top_k=args.top_k)["answer"])
  else:
    print(json.dumps(bot.health(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
  main()
