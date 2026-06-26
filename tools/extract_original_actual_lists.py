import re
from pathlib import Path

import pdfplumber

PDF = Path(r"D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-original-readonly.pdf")


def norm(text):
    return re.sub(r"\s+", " ", text or "").strip()


with pdfplumber.open(PDF) as pdf:
    page_texts = [(i, norm(page.extract_text())) for i, page in enumerate(pdf.pages, start=1)]

body_start = None
for i, text in page_texts:
    # Avoid front-matter TOC hits: the real body page has the opening section text.
    if "MỞ ĐẦU" in text and "Tổng quan đề tài" in text and "Da liễu là lĩnh vực" in text:
        body_start = i
        break

if body_start is None:
    # Fallback: find the last MỞ ĐẦU occurrence before CHƯƠNG 1 in the rendered document.
    candidates = [i for i, text in page_texts if "MỞ ĐẦU" in text]
    body_start = max(candidates)

offset = body_start - 1
fig_pat = re.compile(r"(Hình\s+\d+\.\d+:\s+.+)")
tbl_pat = re.compile(r"(Bảng\s+\d+\.\d+\.\s+.+)")

figures = []
tables = []
seen = set()

for physical_page, text in page_texts:
    if physical_page < body_start:
        continue
    logical_page = physical_page - offset
    for line in text.splitlines():
        line = norm(line)
        for kind, pat, dest in [("fig", fig_pat, figures), ("tbl", tbl_pat, tables)]:
            match = pat.search(line)
            if not match:
                continue
            caption = match.group(1).strip()
            if "Bên cạnh mAP" in caption:
                continue
            key = (kind, caption)
            if key in seen:
                continue
            seen.add(key)
            dest.append((caption, logical_page))

print("DANH MỤC HÌNH VẼ")
for caption, page in figures:
    print(f"{caption} ... {page}")

print("\nDANH MỤC BẢNG BIỂU")
for caption, page in tables:
    print(f"{caption} ... {page}")
