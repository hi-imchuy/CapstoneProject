from copy import deepcopy
from pathlib import Path
from shutil import copy2
from zipfile import ZipFile, ZIP_DEFLATED
import re

from lxml import etree

DOCX = Path(r"D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN.docx")
BACKUP = DOCX.with_name(DOCX.stem + ".before-restructure.docx")
OUT = DOCX.with_name(DOCX.stem + "-da-cap-nhat.docx")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W_NS = NS["w"]


def qn(name):
    return f"{{{W_NS}}}{name}"


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
    run = etree.SubElement(p, qn("r"))
    t = etree.SubElement(run, qn("t"))
    t.text = text


def find_idx(body, exact):
    for i, child in enumerate(body):
        if is_para(child) and text_of(child) == exact:
            return i
    raise ValueError(f"Cannot find paragraph: {exact}")


def find_idx_starts(body, prefix):
    for i, child in enumerate(body):
        if is_para(child) and text_of(child).startswith(prefix):
            return i
    raise ValueError(f"Cannot find paragraph starting with: {prefix}")


def replace_text_in_paragraphs(body, replacements):
    for child in body:
        if not is_para(child):
            continue
        txt = text_of(child)
        if txt in replacements:
            set_paragraph_text(child, replacements[txt])


if not BACKUP.exists():
    copy2(DOCX, BACKUP)

with ZipFile(DOCX, "r") as zin:
    entries = {info.filename: zin.read(info.filename) for info in zin.infolist()}

root = etree.fromstring(entries["word/document.xml"])
body = root.find("w:body", NS)

# Move the activity-diagram section immediately after the use-case section.
activity_start = find_idx(body, "2.6. Sơ đồ hoạt động")
activity_end = find_idx(body, "2.7. Thiết kế pipeline nhận diện bệnh da liễu")
activity_nodes = [deepcopy(node) for node in body[activity_start:activity_end]]
for node in list(body[activity_start:activity_end]):
    body.remove(node)

# Remove the obsolete disease-data scope section.
scope_start = find_idx(body, "2.4. Phạm vi dữ liệu bệnh")
scope_end = find_idx(body, "2.5. Thiết kế cơ sở dữ liệu")
for node in list(body[scope_start:scope_end]):
    body.remove(node)

insert_after = find_idx(body, "Hình 2.6: Use case trò chuyện bác sĩ - bệnh nhân")
for offset, node in enumerate(activity_nodes, start=1):
    body.insert(insert_after + offset, node)

replace_text_in_paragraphs(
    body,
    {
        "2.6. Sơ đồ hoạt động": "2.4. Sơ đồ hoạt động",
        "2.6.1. Đăng ký và quên mật khẩu": "2.4.1. Đăng ký và quên mật khẩu",
        "2.6.2. Nhận diện ảnh": "2.4.2. Nhận diện ảnh",
        "2.6.3. Chatbot RAG": "2.4.3. Chatbot RAG",
        "2.7. Thiết kế pipeline nhận diện bệnh da liễu": "2.6. Thiết kế pipeline nhận diện bệnh da liễu",
        "2.8. Thiết kế pipeline RAG": "2.7. Thiết kế pipeline RAG",
        "2.9. Thiết kế bảo mật và xử lý lỗi": "2.8. Thiết kế bảo mật và xử lý lỗi",
        "2.10. Kết chương": "2.9. Kết chương",
        "Hình 2.8: Sơ đồ hoạt động đăng ký và quên mật khẩu bằng OTP": "Hình 2.7: Sơ đồ hoạt động đăng ký và quên mật khẩu bằng OTP",
        "Hình 2.9: Sơ đồ hoạt động nhận diện ảnh": "Hình 2.8: Sơ đồ hoạt động nhận diện ảnh",
        "Hình 2.10: Sơ đồ hoạt động chatbot RAG": "Hình 2.9: Sơ đồ hoạt động chatbot RAG",
        "Hình 2.7: Sơ đồ dữ liệu MongoDB": "Hình 2.10: Sơ đồ dữ liệu MongoDB",
        "Hình 2.15: Pipeline suy luận RF-DETR": "Hình 2.11: Pipeline suy luận RF-DETR",
        "Hình 2.16: Pipeline truy xuất và sinh câu trả lời RAG": "Hình 2.12: Pipeline truy xuất và sinh câu trả lời RAG",
        "Bảng 2.9. Thiết kế collection users": "Bảng 2.8. Thiết kế collection users",
        "Bảng 2.10. Thiết kế collection conversations": "Bảng 2.9. Thiết kế collection conversations",
        "Bảng 2.11. Thiết kế collection messages": "Bảng 2.10. Thiết kế collection messages",
        "Bảng 2.12. Thiết kế collection ai_conversations": "Bảng 2.11. Thiết kế collection ai_conversations",
        "Bảng 2.13. Thiết kế collection ai_messages": "Bảng 2.12. Thiết kế collection ai_messages",
        "Bảng 2.14. Thiết kế collection skin_detections": "Bảng 2.13. Thiết kế collection skin_detections",
    },
)

entries["word/document.xml"] = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone="yes")

tmp_path = OUT

with ZipFile(tmp_path, "w", ZIP_DEFLATED) as zout:
    for name, data in entries.items():
        zout.writestr(name, data)

print(f"Updated {OUT}")
print(f"Backup {BACKUP}")
