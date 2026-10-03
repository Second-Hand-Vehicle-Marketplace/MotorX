"""Combine the two codebase guides into a bookmarked PDF. Run from any directory."""
from pathlib import Path
from html import escape
import re
import markdown
from bs4 import BeautifulSoup, NavigableString
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Flowable

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'MotorX_Codebase_Guide.pdf'
for name, filename in [('Arial', 'arial.ttf'), ('Arial-Bold', 'arialbd.ttf'), ('Arial-Italic', 'ariali.ttf'), ('Arial-BoldItalic', 'arialbi.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / filename)))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial-Italic', boldItalic='Arial-BoldItalic')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyGuide', fontName='Arial', fontSize=9, leading=13, spaceAfter=7))
styles.add(ParagraphStyle(name='CellGuide', parent=styles['BodyGuide'], fontSize=7.6, leading=10.4, spaceAfter=0))
styles.add(ParagraphStyle(name='HeadingGuide', fontName='Arial-Bold', fontSize=12, leading=16, textColor=colors.HexColor('#163858'), spaceBefore=14, spaceAfter=8, keepWithNext=True))
styles.add(ParagraphStyle(name='TitleGuide', parent=styles['HeadingGuide'], fontSize=26, leading=33, alignment=TA_CENTER, spaceAfter=20))
styles.add(ParagraphStyle(name='CodeGuide', fontName='Courier', fontSize=7.6, leading=11, backColor=colors.HexColor('#f1f4f7'), borderPadding=7, spaceAfter=10))

def inline(node):
    if isinstance(node, NavigableString):
        return escape(str(node))
    content = ''.join(inline(child) for child in node.children)
    if node.name in ('strong', 'b'):
        return '<b>' + content + '</b>'
    if node.name in ('em', 'i'):
        return '<i>' + content + '</i>'
    if node.name == 'code':
        return '<font name="Courier">' + content + '</font>'
    if node.name == 'br':
        return '<br/>'
    if node.name == 'a':
        href = node.get('href', '')
        if href in ('CODEBASE_WALKTHROUGH.md', 'CODEBASE_FILE_FUNCTION_INDEX.md'):
            return '<link href="#' + ('walkthrough' if 'WALKTHROUGH' in href else 'index') + '" color="#195580">' + content + '</link>'
        if href.startswith(('https://', 'http://')):
            return '<link href="' + escape(href, quote=True) + '" color="#195580">' + content + '</link>'
        # Relative source links are readable paths, not machine-specific PDF links.
        return content
    return content

class Architecture(Flowable):
    width = 499
    height = 270
    def draw(self):
        c = self.canv
        positions = {'React frontend': (175, 222), 'Firebase Auth': (345, 222), 'Express backend': (175, 150), 'MongoDB': (0, 78), 'Redis / BullMQ': (175, 78), 'S3 storage': (345, 78), 'Inventory worker': (175, 6), 'SMTP email': (345, 6)}
        def arrow(a, b):
            ax, ay = positions[a]; bx, by = positions[b]
            x1, y1, x2, y2 = ax + 68, ay + 18, bx + 68, by + 18
            if ay == by:
                x1 += 68 if bx > ax else -68
                x2 += -68 if bx > ax else 68
            else:
                y1 += -18 if by < ay else 18
                y2 += 18 if by < ay else -18
            c.setStrokeColor(colors.HexColor('#6c8295')); c.line(x1, y1, x2, y2)
            import math
            angle = math.atan2(y2-y1, x2-x1)
            for delta in (-0.5, 0.5):
                c.line(x2, y2, x2-6*math.cos(angle+delta), y2-6*math.sin(angle+delta))
        for a,b in [('React frontend','Firebase Auth'), ('React frontend','Express backend'), ('Express backend','Firebase Auth'), ('Express backend','MongoDB'), ('Express backend','Redis / BullMQ'), ('Express backend','S3 storage'), ('Redis / BullMQ','Inventory worker'), ('Inventory worker','MongoDB'), ('Inventory worker','S3 storage'), ('Inventory worker','SMTP email')]:
            arrow(a,b)
        for name,(x,y) in positions.items():
            c.setFillColor(colors.HexColor('#edf3f8')); c.setStrokeColor(colors.HexColor('#163858'))
            c.roundRect(x,y,136,36,5,fill=1,stroke=1)
            c.setFont('Arial-Bold',9); c.setFillColor(colors.HexColor('#163858')); c.drawCentredString(x+68,y+14,name)

class GuideDoc(SimpleDocTemplate):
    def afterFlowable(self, flow):
        if isinstance(flow, Paragraph) and hasattr(flow, 'bookmark'):
            key, title, level = flow.bookmark
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, level=level, closed=level > 0)

story = []
story += [Spacer(1,120), Paragraph('MotorX<br/>Codebase Guide',styles['TitleGuide']), Paragraph('Architecture, files, functions and automated tests',styles['HeadingGuide']), Spacer(1,25)]
story.append(Paragraph('Part 1: Codebase walkthrough<br/>Part 2: Complete file and function index',styles['BodyGuide']))
story.append(Paragraph('Combined from CODEBASE_WALKTHROUGH.md and CODEBASE_FILE_FUNCTION_INDEX.md. Source snapshot: 28 September 2026. Use PDF bookmarks to navigate sections and files.',styles['BodyGuide']))
story.append(Paragraph('Source file paths refer to D:/MotorX/MotorX. Paths are retained as readable references; the PDF does not embed the source files. Architecture arrows are reproduced as a diagram.',styles['BodyGuide']))

counter = 0
for part, filename in [('walkthrough','CODEBASE_WALKTHROUGH.md'), ('index','CODEBASE_FILE_FUNCTION_INDEX.md')]:
    story.append(PageBreak())
    soup = BeautifulSoup(markdown.markdown((ROOT/filename).read_text(encoding='utf-8'), extensions=['tables','fenced_code']), 'html.parser')
    first_heading = True
    for node in soup.children:
        if isinstance(node, NavigableString):
            continue
        if node.name == 'p':
            children = [child for child in node.children if not isinstance(child,NavigableString) or str(child).strip()]
            is_heading = len(children)==1 and getattr(children[0], 'name', '') == 'strong'
            para = Paragraph(inline(node),styles['HeadingGuide' if is_heading else 'BodyGuide'])
            if is_heading:
                counter += 1
                key = part if first_heading else f'section-{counter}'
                para.bookmark = (key,node.get_text(),0 if first_heading else 1)
                first_heading = False
            story.append(para)
        elif node.name == 'table':
            rows = []
            for tr in node.find_all('tr'):
                rows.append([Paragraph(inline(cell),styles['CellGuide']) for cell in tr.find_all(['td','th'],recursive=False)])
            n = len(rows[0])
            proportions = [0.29,0.16,0.55] if part=='index' and n==3 else ([0.36,0.64] if n==2 else [0.28,0.44,0.28] if n==3 else [1/n]*n)
            table = Table(rows,colWidths=[499*p for p in proportions],repeatRows=1,hAlign='LEFT',splitByRow=1,splitInRow=1)
            table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dce7f0')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f5f7fa')]),('GRID',(0,0),(-1,-1),0.3,colors.HexColor('#cbd5df')),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
            story += [table, Spacer(1,9)]
        elif node.name in ('ul','ol'):
            for i,li in enumerate(node.find_all('li',recursive=False),1):
                prefix = f'{i}.' if node.name=='ol' else '\u2022'
                story.append(Paragraph(prefix+' '+inline(li),styles['BodyGuide']))
        elif node.name == 'pre':
            code = node.find('code')
            if code and 'language-mermaid' in code.get('class',[]):
                story += [Architecture(),Spacer(1,8)]
            else:
                text = escape(node.get_text().rstrip()).replace(' ', '&#160;').replace('\n','<br/>')
                story.append(Paragraph(text,styles['CodeGuide']))
        elif node.name == 'hr':
            story.append(Spacer(1,8))
        else:
            story.append(Paragraph(inline(node),styles['BodyGuide']))

def footer(canvas,doc):
    canvas.saveState()
    canvas.setFont('Arial',8); canvas.setFillColor(colors.HexColor('#66798a'))
    canvas.drawString(48,25,'MotorX | Codebase walkthrough and function index')
    canvas.drawRightString(A4[0]-48,25,str(doc.page))
    canvas.restoreState()

doc = GuideDoc(str(OUT),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=42,bottomMargin=44,title='MotorX Codebase Guide',author='MotorX',pageCompression=1)
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
