#!/usr/bin/env python3
"""Build sample CV files from a .txt source.

    mkcv.py <stem> [formats]        e.g.  mkcv.py grace-achieng-cv docx

PDF uses the base-14 Helvetica with WinAnsi encoding, so it handles Latin text
including French accents but NOT Japanese — a CJK PDF needs an embedded CID
font, which is well past what a fixture generator should be doing. Japanese
sources are emitted as DOCX, which is UTF-8 XML and is what a Japanese
candidate would actually send anyway.
"""
import re, zipfile, os, sys

# Alongside this script, wherever it has been checked out.
OUT = os.path.dirname(os.path.abspath(__file__))
STEM = sys.argv[1] if len(sys.argv) > 1 else "amara-nwosu-cv"
FORMATS = (sys.argv[2] if len(sys.argv) > 2 else "pdf,docx").split(",")

raw = open(os.path.join(OUT, STEM + ".txt"), encoding="utf-8").read().rstrip("\n").split("\n")
NAME_LINE = next((l.rstrip() for l in raw if l.strip()), "")

HEAD_RE = re.compile(r"^[A-ZÀ-Þ][A-ZÀ-Þ \-'/]{3,}$")

def classify(line):
    s = line.rstrip()
    if not s.strip():
        return ("blank", "", 0)
    if s == NAME_LINE:
        return ("name", s, 0)
    t = s.strip()
    if HEAD_RE.match(t) and len(t) < 40:
        return ("head", t, 0)
    return ("body", t, len(s) - len(s.lstrip(" ")))

def is_role_line(text):
    return text.count(" - ") == 1 and bool(re.match(r"^[A-ZÀ-Þ][\wÀ-ÿ ,/]+ - [A-ZÀ-Þ]", text))

# ---------------- PDF ----------------
if "pdf" in FORMATS:
    PW, PH, ML, MT, MB, LEAD = 595.28, 841.89, 56, 56, 56, 13.2

    items = []
    for ln in raw:
        kind, text, indent = classify(ln)
        if kind == "blank":   items.append(("gap", 0, "", 0, 0))
        elif kind == "name":  items.append(("F2", 17, text, 0, 0))
        elif kind == "head":  items.append(("F2", 10.5, text, 0, 6))
        else:                 items.append(("F2" if is_role_line(text) else "F1", 9.6, text, indent * 3, 0))

    pages, cur, y = [], [], PH - MT
    for font, size, text, indent, before in items:
        if font == "gap":
            y -= LEAD * 0.55
            continue
        y -= before
        if y < MB:
            pages.append(cur); cur, y = [], PH - MT
        cur.append((font, size, ML + indent, y, text))
        y -= LEAD if size < 12 else LEAD * 1.7
    pages.append(cur)

    esc = lambda t: t.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
    streams = []
    for pg in pages:
        parts = ["BT"]
        for font, size, x, y, text in pg:
            parts.append(f"/{font} {size} Tf 1 0 0 1 {x:.2f} {y:.2f} Tm ({esc(text)}) Tj")
        parts.append("ET")
        streams.append("\n".join(parts).encode("latin-1", "replace"))

    n = len(streams)
    page_ids    = [5 + 2 * i for i in range(n)]
    content_ids = [6 + 2 * i for i in range(n)]
    body = {
        1: b"<< /Type /Catalog /Pages 2 0 R >>",
        2: f"<< /Type /Pages /Count {n} /Kids [{' '.join(f'{i} 0 R' for i in page_ids)}] >>".encode(),
        3: b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        4: b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    }
    for i in range(n):
        body[page_ids[i]] = (f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PW} {PH}] "
                             f"/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> "
                             f"/Contents {content_ids[i]} 0 R >>").encode()
        body[content_ids[i]] = (b"<< /Length " + str(len(streams[i])).encode() + b" >>\nstream\n"
                                + streams[i] + b"\nendstream")

    out, offsets = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"), {}
    for num in sorted(body):
        offsets[num] = len(out)
        out += f"{num} 0 obj\n".encode() + body[num] + b"\nendobj\n"
    xref, maxn = len(out), max(body) + 1
    out += f"xref\n0 {maxn}\n".encode() + b"0000000000 65535 f \n"
    for num in range(1, maxn):
        out += (f"{offsets[num]:010d} 00000 n \n").encode() if num in offsets else b"0000000000 65535 f \n"
    out += f"trailer\n<< /Size {maxn} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    open(os.path.join(OUT, STEM + ".pdf"), "wb").write(bytes(out))
    print(f"{STEM}.pdf  {len(out)} bytes, {n} pages")

# ---------------- DOCX ----------------
if "docx" in FORMATS:
    xesc = lambda t: t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    paras = []
    for ln in raw:
        kind, text, indent = classify(ln)
        if kind == "blank":
            paras.append("<w:p/>")
        elif kind == "name":
            paras.append('<w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r><w:rPr><w:b/>'
                         f'<w:sz w:val="34"/></w:rPr><w:t xml:space="preserve">{xesc(text)}</w:t></w:r></w:p>')
        elif kind == "head":
            paras.append('<w:p><w:pPr><w:spacing w:before="200" w:after="60"/></w:pPr><w:r><w:rPr><w:b/>'
                         f'<w:sz w:val="21"/></w:rPr><w:t xml:space="preserve">{xesc(text)}</w:t></w:r></w:p>')
        else:
            ind = f'<w:ind w:left="{indent*120}"/>' if indent else ""
            bold = "<w:b/>" if is_role_line(text) else ""
            paras.append(f'<w:p><w:pPr>{ind}<w:spacing w:after="0"/></w:pPr><w:r><w:rPr>{bold}'
                         f'<w:sz w:val="19"/></w:rPr><w:t xml:space="preserve">{xesc(text)}</w:t></w:r></w:p>')

    document = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
                + "".join(paras) +
                '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
                '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>'
                '</w:body></w:document>')
    content_types = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      '<Default Extension="xml" ContentType="application/xml"/>'
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
      '</Types>')
    root_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
      '</Relationships>')

    path = os.path.join(OUT, STEM + ".docx")
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", root_rels)
        z.writestr("word/document.xml", document)
    print(f"{STEM}.docx {os.path.getsize(path)} bytes")
