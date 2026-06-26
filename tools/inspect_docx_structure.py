from pathlib import Path
import sys
from zipfile import ZipFile
from lxml import etree

DOCX = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN.docx")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def text_of(el):
    return "".join(el.xpath(".//w:t/text()", namespaces=NS)).strip()


def style_of(p):
    vals = p.xpath("./w:pPr/w:pStyle/@w:val", namespaces=NS)
    return vals[0] if vals else ""


def has_drawing(el):
    return bool(el.xpath(".//*[local-name()='drawing' or local-name()='pict']"))


with ZipFile(DOCX) as z:
    xml = z.read("word/document.xml")

root = etree.fromstring(xml)
body = root.find("w:body", NS)

for i, child in enumerate(body):
    tag = etree.QName(child).localname
    if tag == "p":
        txt = text_of(child)
        sty = style_of(child)
        if (
            sty
            or "Sơ đồ" in txt
            or "sơ đồ" in txt
            or "2.3" in txt
            or "2.4" in txt
            or "Phạm vi dữ liệu" in txt
            or "hoạt động" in txt.lower()
            or "Hình" in txt
            or has_drawing(child)
        ):
            marker = " IMG" if has_drawing(child) else ""
            print(f"{i:05d} P {sty:<24}{marker} {txt[:180]}")
    elif tag == "tbl":
        txt = text_of(child)
        if "Sơ đồ" in txt or "2.3" in txt or "2.4" in txt or "Phạm vi" in txt or "hoạt động" in txt.lower():
            print(f"{i:05d} TBL {txt[:180]}")

print("\n--- Window 400-510 ---")
for i, child in enumerate(body):
    if not (400 <= i <= 510):
        continue
    tag = etree.QName(child).localname
    txt = text_of(child).replace("\n", " ")
    if tag == "p":
        marker = " IMG" if has_drawing(child) else ""
        print(f"{i:05d} P {style_of(child):<24}{marker} {txt[:240]}")
    elif tag == "tbl":
        print(f"{i:05d} TBL {txt[:240]}")
    else:
        print(f"{i:05d} {tag}")

print("\n--- Front matter 200-315 ---")
for i, child in enumerate(body):
    if not (200 <= i <= 315):
        continue
    tag = etree.QName(child).localname
    txt = text_of(child).replace("\n", " ")
    if tag == "p":
        marker = " IMG" if has_drawing(child) else ""
        print(f"{i:05d} P {style_of(child):<24}{marker} {txt[:240]}")
    elif tag == "tbl":
        print(f"{i:05d} TBL {txt[:240]}")
    else:
        print(f"{i:05d} {tag}")
