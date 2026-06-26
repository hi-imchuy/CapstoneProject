from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree

DOCX = Path(r"D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-da-cap-nhat.docx")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def text_of(el):
    return "".join(el.xpath(".//w:t/text()", namespaces=NS)).strip()


def set_paragraph_text(p, text):
    texts = p.xpath(".//w:t", namespaces=NS)
    if not texts:
        return
    texts[0].text = text
    for node in texts[1:]:
        node.text = ""


replacements = {
    "Bảng 2.8. Thiết kế collection users": "Bảng 2.3. Thiết kế collection users",
    "Bảng 2.9. Thiết kế collection conversations": "Bảng 2.4. Thiết kế collection conversations",
    "Bảng 2.10. Thiết kế collection messages": "Bảng 2.5. Thiết kế collection messages",
    "Bảng 2.11. Thiết kế collection ai_conversations": "Bảng 2.6. Thiết kế collection ai_conversations",
    "Bảng 2.12. Thiết kế collection ai_messages": "Bảng 2.7. Thiết kế collection ai_messages",
    "Bảng 2.13. Thiết kế collection skin_detections": "Bảng 2.8. Thiết kế collection skin_detections",
}

with ZipFile(DOCX, "r") as zin:
    entries = {info.filename: zin.read(info.filename) for info in zin.infolist()}

root = etree.fromstring(entries["word/document.xml"])
body = root.find("w:body", NS)

count = 0
for child in body:
    if etree.QName(child).localname != "p":
        continue
    txt = text_of(child)
    if txt in replacements:
        set_paragraph_text(child, replacements[txt])
        count += 1

entries["word/document.xml"] = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone="yes")
tmp = DOCX.with_name(DOCX.stem + ".tables.tmp.docx")
with ZipFile(tmp, "w", ZIP_DEFLATED) as zout:
    for name, data in entries.items():
        zout.writestr(name, data)
tmp.replace(DOCX)

print(f"Renumbered {count} table captions")
