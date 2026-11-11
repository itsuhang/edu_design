"""Create the Office samples. Run generate-samples.mjs to also produce the PDF."""
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_DEFLATED

OUT = Path("public/samples")
OUT.mkdir(parents=True, exist_ok=True)
ROWS = [
    ["课程名称", "适用年级", "任课教师", "时间", "课时"],
    ["科学探索", "三至四年级", "陈老师", "周一", "2 课时"],
    ["创意绘画", "一至三年级", "王老师", "周二", "2 课时"],
    ["趣味编程", "四至六年级", "李老师", "周三", "2 课时"],
    ["阅读与表达", "三至六年级", "林老师", "周四", "2 课时"],
]

rel_ns = "http://schemas.openxmlformats.org/package/2006/relationships"
office_rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
with ZipFile(OUT / "education-sample.xlsx", "w", ZIP_DEFLATED) as archive:
    archive.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
    archive.writestr("_rels/.rels", f'<Relationships xmlns="{rel_ns}"><Relationship Id="rId1" Type="{office_rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    archive.writestr("xl/workbook.xml", f'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="{office_rel}"><sheets><sheet name="秋季课程安排（演示）" sheetId="1" r:id="rId1"/></sheets></workbook>')
    archive.writestr("xl/_rels/workbook.xml.rels", f'<Relationships xmlns="{rel_ns}"><Relationship Id="rId1" Type="{office_rel}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
    rows_xml = ""
    for row_index, row in enumerate(ROWS, 1):
        cells = "".join(f'<c r="{chr(65 + col)}{row_index}" t="inlineStr"><is><t>{escape(text)}</t></is></c>' for col, text in enumerate(row))
        rows_xml += f'<row r="{row_index}">{cells}</row>'
    archive.writestr("xl/worksheets/sheet1.xml", '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="5" width="24" customWidth="1"/></cols><sheetData>' + rows_xml + "</sheetData></worksheet>")

with ZipFile(OUT / "education-sample.docx", "w", ZIP_DEFLATED) as archive:
    archive.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
    archive.writestr("_rels/.rels", f'<Relationships xmlns="{rel_ns}"><Relationship Id="rId1" Type="{office_rel}/officeDocument" Target="word/document.xml"/></Relationships>')
    paragraphs = ["校园文化活动方案（演示样本）", "2026 年秋季学期 · 杭州市实验小学", "一、活动目标", "丰富校园文化生活，促进学生全面发展，营造积极向上、健康文明的校园文化氛围。", "二、活动安排", "围绕科学探索、创意绘画、趣味编程与阅读表达等主题，组织丰富多彩的校园活动。", "三、工作要求", "加强组织领导，落实安全保障，关注学生参与情况，及时总结活动经验。", "本文件为通用演示样本，不包含真实业务数据。"]
    body = "".join(f"<w:p><w:r><w:t>{escape(p)}</w:t></w:r></w:p>" for p in paragraphs)
    archive.writestr("word/document.xml", f'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{body}</w:body></w:document>')
