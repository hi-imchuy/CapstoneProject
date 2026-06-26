from copy import deepcopy
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
import re
import tempfile

from lxml import etree
import pdfplumber

DOCX = Path(r"D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-da-cap-nhat.docx")
PDF = Path(r"D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-da-cap-nhat.pdf")
PAGE_MAP = Path(r"D:\Ki10\CapstoneProject\docx_page_map.json")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W_NS = NS["w"]


def text_of(el):
    return "".join(el.xpath(".//w:t/text()", namespaces=NS)).strip()


def is_para(el):
    return etree.QName(el).localname == "p"


def set_paragraph_text(p, text):
    texts = p.xpath(".//w:t", namespaces=NS)
    if texts:
        texts[0].text = text
        for node in texts[1:]:
            node.text = ""
        return
    run = etree.SubElement(p, f"{{{W_NS}}}r")
    t = etree.SubElement(run, f"{{{W_NS}}}t")
    t.text = text


def find_para_idx(body, exact):
    for i, child in enumerate(body):
        if is_para(child) and text_of(child) == exact:
            return i
    raise ValueError(f"Cannot find paragraph {exact!r}")


def find_para_idx_starts(body, prefix):
    for i, child in enumerate(body):
        if is_para(child) and text_of(child).startswith(prefix):
            return i
    raise ValueError(f"Cannot find paragraph starting {prefix!r}")


def replace_block(body, start, end, lines):
    old_nodes = [node for node in body[start:end] if is_para(node)]
    template = deepcopy(old_nodes[-1] if old_nodes else body[start - 1])
    for node in list(body[start:end]):
        body.remove(node)
    new_nodes = []
    for line in lines:
        node = deepcopy(template)
        set_paragraph_text(node, line)
        new_nodes.append(node)
    for offset, node in enumerate(new_nodes):
        body.insert(start + offset, node)


def logical(page):
    return page - 15


with PAGE_MAP.open(encoding="utf-8-sig") as f:
    raw_map = json.load(f)

heading_pages = {}
heading_physical_pages = {}
for item in raw_map:
    text = item["text"]
    if "\t" in text:
        continue
    heading_pages[text] = logical(item["page"])
    heading_physical_pages[text] = item["page"]

special_pages = {
    "MỞ ĐẦU": 1,
    "CHƯƠNG 1: CƠ SỞ LÝ THUYẾT": 4,
    "CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG": 11,
    "CHƯƠNG 3: TRIỂN KHAI VÀ ĐÁNH GIÁ": 28,
    "KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN": 53,
    "TÀI LIỆU THAM KHẢO": 55,
}

toc_titles = [
    "MỞ ĐẦU",
    "1. Tổng quan đề tài",
    "2. Mục tiêu đề tài",
    "3. Đối tượng và phạm vi nghiên cứu",
    "4. Phương pháp nghiên cứu",
    "5. Giới hạn sử dụng và trách nhiệm y khoa",
    "6. Cấu trúc báo cáo",
    "CHƯƠNG 1: CƠ SỞ LÝ THUYẾT",
    "1.1. Đặc thù bài toán nhận diện bệnh da liễu từ hình ảnh",
    "1.2. Bài toán phát hiện đối tượng trong ảnh y khoa",
    "1.3. Các hướng mô hình phát hiện đối tượng",
    "1.4. YOLO và hướng tiếp cận CNN một giai đoạn",
    "1.5. RF-DETR và hướng tiếp cận Transformer",
    "1.6. So sánh lý thuyết giữa YOLO và RF-DETR",
    "1.7. Bài toán chatbot tư vấn da liễu",
    "1.8. Retrieval-Augmented Generation",
    "1.9. Embedding, truy xuất vector và cơ sở dữ liệu vector",
    "1.10. Kết chương",
    "CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG",
    "2.1. Phân tích yêu cầu",
    "2.1.1. Tác nhân của hệ thống",
    "2.1.2. Yêu cầu chức năng",
    "2.1.3. Yêu cầu phi chức năng",
    "2.2. Kiến trúc tổng thể",
    "2.3. Sơ đồ use case",
    "2.3.1. Use case tổng quan",
    "2.3.2. Use case quản lý tài khoản",
    "2.3.3. Use case nhận diện bệnh da liễu",
    "2.3.4. Use case chatbot AI",
    "2.3.5. Use case trò chuyện bác sĩ - bệnh nhân",
    "2.4. Sơ đồ hoạt động",
    "2.4.1. Đăng ký và quên mật khẩu",
    "2.4.2. Nhận diện ảnh",
    "2.4.3. Chatbot RAG",
    "2.5. Thiết kế cơ sở dữ liệu",
    "2.5.1. Collection users",
    "2.5.2. Collection conversations và messages",
    "2.5.3. Collection ai_conversations và ai_messages",
    "2.5.4. Collection skin_detections",
    "2.6. Thiết kế pipeline nhận diện bệnh da liễu",
    "2.7. Thiết kế pipeline RAG",
    "2.8. Thiết kế bảo mật và xử lý lỗi",
    "2.9. Kết chương",
    "CHƯƠNG 3: TRIỂN KHAI VÀ ĐÁNH GIÁ",
    "3.1. Dữ liệu hình ảnh",
    "3.2. Đánh giá mô hình YOLO và RF-DETR",
    "3.3. Dữ liệu tri thức và quy trình xây dựng chatbot RAG",
    "3.4. Môi trường triển khai",
    "3.5. Triển khai chức năng tài khoản",
    "3.6. Triển khai chức năng nhận diện",
    "3.7. Triển khai chatbot AI",
    "3.8. Triển khai chat bác sĩ - bệnh nhân",
    "3.9. Kiểm thử chức năng",
    "3.10. Kiểm thử an toàn chatbot",
    "3.11. Đánh giá hệ thống",
    "3.11.1. Kết quả đạt được",
    "3.11.2. Hạn chế",
    "3.12. Kết chương",
    "KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN",
    "1. Kết quả đạt được",
    "2. Hạn chế",
    "3. Hướng phát triển",
    "TÀI LIỆU THAM KHẢO",
]

toc_lines = []
for title in toc_titles:
    page = special_pages.get(title, heading_pages.get(title))
    if page is None:
        raise ValueError(f"Missing page for TOC title: {title}")
    toc_lines.append(f"{title}{page}")

with ZipFile(DOCX, "r") as zin:
    entries = {info.filename: zin.read(info.filename) for info in zin.infolist()}

root = etree.fromstring(entries["word/document.xml"])
body = root.find("w:body", NS)

toc_start = find_para_idx_starts(body, "MỞ ĐẦU")
fig_title = find_para_idx(body, "DANH MỤC HÌNH VẼ")
table_title = find_para_idx(body, "DANH MỤC BẢNG BIỂU")
body_start = find_para_idx(body, "MỞ ĐẦU")

body_captions = []
seen_body_captions = set()
for child in body[body_start:]:
    if not is_para(child):
        continue
    txt = text_of(child)
    if not txt or txt in seen_body_captions:
        continue
    if re.match(r"^Hình\s+\d+\.\d+:", txt):
        body_captions.append(("fig", txt))
        seen_body_captions.add(txt)
    elif re.match(r"^Bảng\s+\d+\.\d+\.\s+", txt) and not re.match(r"^Bảng\s+\d+\.\d+\s+cho\s+", txt):
        body_captions.append(("tbl", txt))
        seen_body_captions.add(txt)

body_offset = heading_physical_pages["1. Tổng quan đề tài"] - 1

def norm_text(value):
    return re.sub(r"\s+", " ", value).strip()

with pdfplumber.open(PDF) as pdf:
    page_texts = [(i, norm_text(page.extract_text() or "")) for i, page in enumerate(pdf.pages, start=1)]

def find_caption_logical_page(caption):
    needle = norm_text(caption)
    for page_index, text in page_texts:
        if page_index <= body_offset:
            continue
        if needle in text:
            return page_index - body_offset
    raise ValueError(f"Could not locate caption in PDF: {caption}")

figures, tables = [], []
for kind, caption in body_captions:
    line = f"{caption}{find_caption_logical_page(caption)}"
    if kind == "fig":
        figures.append(line)
    else:
        tables.append(line)

replace_block(body, toc_start, fig_title, toc_lines)
fig_title = find_para_idx(body, "DANH MỤC HÌNH VẼ")
table_title = find_para_idx(body, "DANH MỤC BẢNG BIỂU")
body_start = find_para_idx(body, "MỞ ĐẦU")
replace_block(body, fig_title + 1, table_title, figures)
table_title = find_para_idx(body, "DANH MỤC BẢNG BIỂU")
body_start = find_para_idx(body, "MỞ ĐẦU")
replace_block(body, table_title + 1, body_start, tables)

entries["word/document.xml"] = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone="yes")

tmp = DOCX.with_name(DOCX.stem + ".frontmatter.tmp.docx")
with ZipFile(tmp, "w", ZIP_DEFLATED) as zout:
    for name, data in entries.items():
        zout.writestr(name, data)
tmp.replace(DOCX)

print(f"Updated front matter in {DOCX}")
print(f"TOC lines: {len(toc_lines)}, figures: {len(figures)}, tables: {len(tables)}")
