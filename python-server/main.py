#Run server:
#python -m uvicorn main:app --host 0.0.0.0 --port 8000

from contextlib import asynccontextmanager
from io import BytesIO
import json
from pathlib import Path
from threading import Lock
from typing import List
from urllib.parse import quote
from urllib.parse import urlparse

import requests
import supervision as sv
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Response
from PIL import Image
from PIL import UnidentifiedImageError
from pydantic import BaseModel
from rfdetr import RFDETR

from rag_chatbot import RagChatbot
from rag_chatbot import RagConfigurationError


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model_DETR" / "checkpoint_best_ema.pth"
REQUEST_TIMEOUT_SECONDS = 20
DETECTION_THRESHOLD = 0.25

model = None
model_load_error = None
model_lock = Lock()
rag_chatbot = None
rag_load_error = None


class DetectionRequest(BaseModel):
  imageUrl: str


class ChatRequest(BaseModel):
  message: str
  mode: str = "patient"
  topK: int | None = None


def load_model():
  global model, model_load_error
  try:
    if not MODEL_PATH.exists():
      raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    model = RFDETR.from_checkpoint(MODEL_PATH, num_classes=9)
    model_load_error = None
  except Exception as error:
    model = None
    model_load_error = str(error)


def load_rag_chatbot():
  global rag_chatbot, rag_load_error
  try:
    rag_chatbot = RagChatbot()
    rag_load_error = None
  except Exception as error:
    rag_chatbot = None
    rag_load_error = str(error)


@asynccontextmanager
async def lifespan(app: FastAPI):
  load_model()
  load_rag_chatbot()
  yield


app = FastAPI(title="Skin Disease Detection RF-DETR Server", lifespan=lifespan)


@app.get("/health")
def health():
  return {
    "status": "ready" if model is not None else "error",
    "modelPath": str(MODEL_PATH),
    "modelLoaded": model is not None,
    "error": model_load_error,
    "ragLoaded": rag_chatbot is not None,
    "ragError": rag_load_error
  }


@app.get("/rag/health")
def rag_health():
  if rag_chatbot is None:
    raise HTTPException(
      status_code=500,
      detail=f"RAG chatbot is not initialized: {rag_load_error or 'unknown error'}"
    )
  return rag_chatbot.health()


def ensure_model_ready():
  if model is None:
    raise HTTPException(
      status_code=500,
      detail=f"Model is not ready: {model_load_error or 'unknown error'}"
    )


def ensure_rag_ready():
  if rag_chatbot is None:
    raise HTTPException(
      status_code=500,
      detail=f"RAG chatbot is not initialized: {rag_load_error or 'unknown error'}"
    )


def validate_image_url(image_url: str):
  parsed_url = urlparse(image_url)
  if parsed_url.scheme not in ("http", "https") or not parsed_url.netloc:
    raise HTTPException(status_code=422, detail="imageUrl must be a valid http/https URL")


def download_image(image_url: str):
  try:
    response = requests.get(
      image_url,
      timeout=REQUEST_TIMEOUT_SECONDS,
      headers={"User-Agent": "Skin-Disease-Detection/1.0"}
    )
    response.raise_for_status()
  except requests.RequestException as error:
    raise HTTPException(status_code=400, detail="Cannot download image from Cloudinary URL")

  try:
    image = Image.open(BytesIO(response.content))
    image.load()
  except (UnidentifiedImageError, OSError) as error:
    raise HTTPException(status_code=400, detail="Downloaded URL is not a valid image")

  return image.convert("RGB")


def get_class_name(detections, index, class_id):
  class_names = detections.data.get("class_name")
  if class_names is not None and index < len(class_names):
    return str(class_names[index])

  model_class_names = getattr(model, "class_names", [])
  if 0 <= class_id < len(model_class_names):
    return str(model_class_names[class_id])

  return f"class_{class_id}"


def build_detection_results(model_detections) -> List[dict]:
  results = []

  for index, (class_id, confidence) in enumerate(zip(
    model_detections.class_id,
    model_detections.confidence
  )):
    class_id = int(class_id)
    results.append({
      "ten_benh": get_class_name(model_detections, index, class_id),
      "do_chinh_xac": round(float(confidence) * 100, 2)
    })

  return results


def encode_jpeg(image):
  output = BytesIO()
  Image.fromarray(image).save(output, format="JPEG", quality=95)
  return output.getvalue()


def annotate_image(image, model_detections):
  result_image = model_detections.metadata.get("source_image")
  if result_image is None:
    result_image = image.copy()
  else:
    result_image = result_image.copy()

  labels = []
  for index, (class_id, confidence) in enumerate(zip(
    model_detections.class_id,
    model_detections.confidence
  )):
    class_name = get_class_name(model_detections, index, int(class_id))
    labels.append(f"{class_name} {float(confidence):.2f}")

  result_image = sv.BoxAnnotator().annotate(
    scene=result_image,
    detections=model_detections
  )
  return sv.LabelAnnotator().annotate(
    scene=result_image,
    detections=model_detections,
    labels=labels
  )


@app.post("/detect")
def detect(request_body: DetectionRequest):
  ensure_model_ready()
  validate_image_url(request_body.imageUrl)

  image = download_image(request_body.imageUrl)

  try:
    with model_lock:
      model_detections = model.predict(
        image,
        threshold=DETECTION_THRESHOLD
      )
  except Exception as error:
    raise HTTPException(status_code=500, detail=f"RF-DETR inference failed: {error}")

  detections = build_detection_results(model_detections)
  result_image = annotate_image(image, model_detections)

  image_bytes = encode_jpeg(result_image)
  message = "Detection completed" if detections else "No skin disease detected"

  return Response(
    content=image_bytes,
    media_type="image/jpeg",
    headers={
      "X-Detections": quote(json.dumps(detections, ensure_ascii=False)),
      "X-Detection-Message": quote(message)
    }
  )


@app.post("/chat")
def chat(request_body: ChatRequest):
  ensure_rag_ready()
  message = request_body.message.strip()
  if not message:
    raise HTTPException(status_code=422, detail="message must not be empty")

  mode = request_body.mode if request_body.mode in ("patient", "doctor") else "patient"
  top_k = request_body.topK
  if top_k is not None and (top_k < 1 or top_k > 12):
    raise HTTPException(status_code=422, detail="topK must be between 1 and 12")

  try:
    return rag_chatbot.chat(message, mode=mode, top_k=top_k)
  except RagConfigurationError as error:
    raise HTTPException(status_code=500, detail=str(error))
  except Exception as error:
    raise HTTPException(status_code=500, detail=f"RAG chat failed: {error}")
