import re
from pathlib import Path

import pdfplumber

PDF = Path(r"D:\Ki10\CapstoneProject\ChauHoangHuy-BaoCaoDATN-da-cap-nhat.pdf")

patterns = [
    re.compile(r"(Hình\s+\d+\.\d+:\s+.+)"),
    re.compile(r"(Bảng\s+\d+\.\d+\.\s+.+)"),
]

seen = set()
with pdfplumber.open(PDF) as pdf:
    for page_index, page in enumerate(pdf.pages, start=1):
        text = page.extract_text() or ""
        logical_page = page_index - 15
        for line in text.splitlines():
            line = re.sub(r"\s+", " ", line).strip()
            for pat in patterns:
                m = pat.search(line)
                if not m:
                    continue
                caption = m.group(1).strip()
                key = (caption, logical_page)
                if key not in seen:
                    seen.add(key)
                    print(f"{logical_page:03d}\t{caption}")
