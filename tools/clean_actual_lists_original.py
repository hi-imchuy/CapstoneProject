import re
from pathlib import Path
from zipfile import ZipFile

from lxml import etree
import pdfplumber

DOCX = Path(r"D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN.docx")
PDF = Path(r"D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-original-readonly.pdf")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def norm(text):
    return re.sub(r"\s+", " ", text or "").strip()


def text_of(el):
    return "".join(el.xpath(".//w:t/text()", namespaces=NS)).strip()


with ZipFile(DOCX) as z:
    root = etree.fromstring(z.read("word/document.xml"))

body = root.find("w:body", NS)
paragraphs = [text_of(el) for el in body if etree.QName(el).localname == "p"]

body_start = max(i for i, text in enumerate(paragraphs) if text == "MỞ ĐẦU")
captions = []
seen = set()
for text in paragraphs[body_start:]:
    if re.match(r"^Hình\s+\d+\.\d+:", text) or re.match(r"^Bảng\s+\d+\.\d+\.\s+", text):
        if text not in seen:
            seen.add(text)
            captions.append(text)

with pdfplumber.open(PDF) as pdf:
    page_texts = [(i, norm(page.extract_text())) for i, page in enumerate(pdf.pages, start=1)]

physical_body_start = None
for i, text in page_texts:
    if "MỞ ĐẦU" in text and "Tổng quan đề tài" in text and "Da là cơ quan" in text:
        physical_body_start = i
        break
if physical_body_start is None:
    raise RuntimeError("Cannot identify real body start in PDF")

offset = physical_body_start - 1

def page_for(caption):
    needle = norm(caption)
    for physical_page, text in page_texts:
        if physical_page < physical_body_start:
            continue
        if needle in text:
            return physical_page - offset
    raise RuntimeError(f"Cannot locate caption: {caption}")

figures = []
tables = []
for caption in captions:
    page = page_for(caption)
    if caption.startswith("Hình "):
        figures.append((caption, page))
    else:
        tables.append((caption, page))

print("DANH MỤC HÌNH VẼ")
for caption, page in figures:
    print(f"{caption}\t{page}")
print()
print("DANH MỤC BẢNG BIỂU")
for caption, page in tables:
    print(f"{caption}\t{page}")
