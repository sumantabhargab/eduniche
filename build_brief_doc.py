"""
PadhaiShuru — Executive Brief DOCX Generator
Generates a professional ~3-page Word document from the executive brief.
"""

from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

# ── Color Palette ────────────────────────────────────────────────────────
BG_DARK      = RGBColor(0x0A, 0x0A, 0x0A)   # near-black
BG_CARD      = RGBColor(0x13, 0x13, 0x16)   # card bg
WHITE        = RGBColor(0xFA, 0xFA, 0xFA)
TEXT_LIGHT   = RGBColor(0xA1, 0xA1, 0xAA)   # secondary
TEXT_MUTED   = RGBColor(0x71, 0x71, 0x7A)   # tertiary
ACCENT       = RGBColor(0x3B, 0x82, 0xF6)   # electric blue
TEAL         = RGBColor(0x14, 0xB8, 0xA6)
GREEN        = RGBColor(0x22, 0xC5, 0x5E)
AMBER        = RGBColor(0xF5, 0x9E, 0x0B)
PURPLE       = RGBColor(0xA8, 0x55, 0xF7)

def set_cell_bg(cell, rgb: RGBColor):
    """Set table cell background color."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    r, g, b = rgb[0], rgb[1], rgb[2]
    hex_color = '{:02X}{:02X}{:02X}'.format(r, g, b)
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def add_heading_styled(doc, text, level=1, color=ACCENT, size=16, bold=True, space_before=18, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = 'Calibri'
    return p

def add_body(doc, text, color=WHITE, size=10, space_before=2, space_after=4, bold=False, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.name = 'Calibri'
    run.font.bold = bold
    run.font.italic = italic
    return p

def add_label(doc, text, color=TEXT_MUTED, size=9, space_before=1, space_after=1):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.name = 'Calibri'
    run.font.italic = True
    return p

def add_bullet(doc, text, color=TEXT_LIGHT, size=10, indent=Inches(0.3)):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent = indent
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.name = 'Calibri'
    return p

def add_divider(doc, color=ACCENT, thickness=1):
    """Add a horizontal line paragraph."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), str(thickness * 8))
    bottom.set(qn('w:space'), '1')
    # Convert RGBColor to hex string
    r, g, b = color[0], color[1], color[2]
    bottom.set(qn('w:color'), '{:02X}{:02X}{:02X}'.format(r, g, b))
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p

def add_section_header(doc, label, title, subtitle=None):
    """Add a labeled section header like 'THE PROBLEM' with a sub-headline."""
    add_label(doc, label, color=ACCENT, size=9, space_before=14, space_after=2)
    add_heading_styled(doc, title, level=1, color=WHITE, size=15, bold=True, space_before=2, space_after=4)
    if subtitle:
        add_body(doc, subtitle, color=TEXT_LIGHT, size=10, space_before=0, space_after=6, italic=True)

# ── Document Setup ────────────────────────────────────────────────────────
doc = Document()

# Page margins
section = doc.sections[0]
section.page_height = Inches(11)
section.page_width = Inches(8.5)
section.top_margin = Inches(0.7)
section.bottom_margin = Inches(0.7)
section.left_margin = Inches(0.8)
section.right_margin = Inches(0.8)

# Default style
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(10)
style.font.color.rgb = WHITE

# Note: python-docx doesn't support document-level background color directly.
# We achieve a dark-theme look through colored table cells, dividers, and text colors.

# ── COVER / HEADER ────────────────────────────────────────────────────────
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
p.paragraph_format.space_before = Pt(0)
p.paragraph_format.space_after = Pt(2)
run = p.add_run('PADHAISHURU')
run.font.size = Pt(11)
run.font.bold = True
run.font.color.rgb = ACCENT
run.font.name = 'Calibri'

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.LEFT
p.paragraph_format.space_before = Pt(4)
p.paragraph_format.space_after = Pt(4)
run = p.add_run('WHERE STUDENTS LEARN AND TEACHERS EARN.')
run.font.size = Pt(28)
run.font.bold = True
run.font.color.rgb = WHITE
run.font.name = 'Calibri'

add_divider(doc, color=ACCENT, thickness=2)

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(2)
p.paragraph_format.space_after = Pt(2)
run = p.add_run('AI-Native Two-Sided Learning Platform for India')
run.font.size = Pt(11)
run.font.color.rgb = TEXT_LIGHT
run.font.name = 'Calibri'

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(0)
p.paragraph_format.space_after = Pt(2)
run = p.add_run('padhaishuru.com  ·  Confidential  ·  September 2026')
run.font.size = Pt(9)
run.font.color.rgb = TEXT_MUTED
run.font.name = 'Calibri'

doc.add_paragraph().paragraph_format.space_after = Pt(4)

# ═══════════════════════════════════════════════════════════════════════════
# PAGE 1
# ═══════════════════════════════════════════════════════════════════════════

add_section_header(doc, 'SECTION 01', 'WHAT WE ARE, WHAT WE BUILD, WHY IT MATTERS')

# The Company
add_heading_styled(doc, 'The Company', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'PadhaiShuru is an AI-native, two-sided learning platform built for Indian students and teachers. '
    'The name means "start learning." The platform replaces the fragmented toolchain that every student '
    'currently manages by hand. A student preparing for any exam or learning any skill today opens six or '
    'more disconnected apps: a video platform for concepts, a question bank for practice, a study planner, '
    'a focus timer, an AI chatbot for doubts, and a spreadsheet to track progress. None of these tools share '
    'information. None of them know the student. The student spends more mental energy deciding what to study '
    'next than actually studying.',
    space_before=0, space_after=4)
add_body(doc,
    'On the other side, millions of skilled Indians could teach but existing platforms make it nearly impossible '
    'to earn fairly. Unacademy takes thirty to seventy percent of what a teacher earns. BYJU\'S employs teachers '
    'as wage labor with no ownership. Other platforms lock teachers into employment contracts or demand they build '
    'an audience from scratch with no support. A mechanical engineer from a small town in Assam should be able to '
    'teach GATE preparation to students across India and earn a living wage without moving to a metro city or '
    'surrendering most of their income to a platform.',
    space_before=0, space_after=4)
add_body(doc,
    'PadhaiShuru fixes both problems at the same time on the same platform.',
    space_before=0, space_after=6, bold=True, italic=True)

# The Two-Sided Model
add_heading_styled(doc, 'The Two-Sided Model', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'The platform operates on a two-sided marketplace model. This is the fundamental structural insight that '
    'defines everything about the business.',
    space_before=0, space_after=4)

add_heading_styled(doc, 'For Students', level=3, color=WHITE, size=11, bold=True, space_before=6, space_after=3)
add_body(doc,
    'PadhaiShuru gives students an AI-native learning environment. An AI doubt engine that answers questions with '
    'context-aware explanations powered by Groq with RAG grounded in actual platform content. A searchable PYQ '
    'library with seven hundred ninety seven previous year questions across twenty GATE branches, AI-generated '
    'solutions, and topic-level filtering. Adaptive study plans that adjust based on actual performance patterns. '
    'Mistake banks, performance heatmaps, and predicted papers. A 3D virtual library where students study together '
    'in real time with ambient focus music and peer presence powered by Supabase Realtime. No card required to start. '
    'Five free AI doubts per day, forever. Paid plans at twenty rupees per week or forty nine rupees per month '
    'unlock unlimited AI access, advanced analytics, mock tests, and premium content. Projected average revenue '
    'per user: approximately one thousand rupees per year.',
    space_before=0, space_after=4)

add_heading_styled(doc, 'For Teachers', level=3, color=WHITE, size=11, bold=True, space_before=6, space_after=3)
add_body(doc,
    'PadhaiShuru gives teachers the infrastructure to teach any subject or skill and keep seventy to eighty percent '
    'of what they earn. The platform provides the audience, AI teaching tools, payment processing through Razorpay, '
    'hosting, and analytics. A GATE instructor can upload a course and start earning. A coder can run live programming '
    'sessions. A musician can teach production. Teachers focus on teaching. The platform handles everything else.',
    space_before=0, space_after=4)

add_heading_styled(doc, 'The Flywheel', level=3, color=WHITE, size=11, bold=True, space_before=6, space_after=3)
add_body(doc,
    'Every feature serves both sides simultaneously. More teachers attract more students. More students attract more '
    'teachers. Network effects compound over time. This is the moat.',
    space_before=0, space_after=6, bold=True, italic=True)

# Tech Stack
add_heading_styled(doc, 'Technology Stack', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'The platform is built on a modern, scalable stack. Next.js 16 for the frontend and API layer. Supabase for '
    'authentication, database, and real-time multiplayer functionality. Groq for AI inference in the doubt engine, '
    'providing blazing-fast responses with retrieval-augmented generation over platform content. Razorpay for payment '
    'processing on both student subscriptions and teacher payouts. Capacitor for the Android app packaging. The entire '
    'stack is designed to be AI-native from the ground up, not AI bolted onto a content platform.',
    space_before=0, space_after=6)

# What Makes Us Different
add_heading_styled(doc, 'What Makes PadhaiShuru Different', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'No competitor in India is building the complete orchestration layer. Unacademy and PhysicsWallah are content '
    'and coaching platforms. BYJU\'S is a K-12 and test prep giant with declining trust. ChatGPT and Gemini wrappers '
    'offer open-ended AI tutoring with no exam specialization, no curriculum mapping, and no persistent learner model. '
    'Notion and Forest are productivity tools with no educational intelligence. PadhaiShuru is the only platform '
    'connecting planning, content, practice, focus, and analytics into one adaptive system that models each student\'s '
    'knowledge state and forgetting curve, while simultaneously giving teachers a fair marketplace to earn from their expertise.',
    space_before=0, space_after=6)

# Current State
add_heading_styled(doc, 'Current State', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'The product is live. Open beta. Pre-revenue. Five hundred plus sign-ups. Fifty plus daily active users with a peak '
    'of approximately four hundred. Five thousand plus page views. Three point eight lakh plus organic reach across social '
    'media. One hundred and forty willingness-to-pay respondents before any monetization was introduced. The teacher '
    'marketplace is designed and ready to build. This is not an idea stage.',
    space_before=0, space_after=6)

add_divider(doc, color=ACCENT, thickness=1)

# ═══════════════════════════════════════════════════════════════════════════
# PAGE 2
# ═══════════════════════════════════════════════════════════════════════════

add_section_header(doc, 'SECTION 02', 'MARKET SIZE, COMPETITION, AND STRATEGIC POSITION')

# TAM
add_heading_styled(doc, 'Total Addressable Market (TAM)', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'The global online education market was valued at two hundred seventy eight to four hundred billion USD in 2024. '
    'India\'s share is approximately ten point four billion USD, or roughly eighty seven thousand crore rupees, in 2025. '
    'At a compound annual growth rate of twenty two point three percent, India\'s edtech market is projected to reach '
    'approximately twenty nine billion USD, or roughly two point four lakh crore rupees, by 2030.',
    space_before=0, space_after=4)
add_body(doc,
    'India has over one hundred million active learners, seven hundred sixty million smartphone users, and eight hundred '
    'fifty to nine hundred million internet subscribers. Internet penetration stands at sixty to sixty five percent of the '
    'population. Higher education enrollment exceeds forty million students. There are over four thousand five hundred '
    'edtech startups in India.',
    space_before=0, space_after=6)

# SAM
add_heading_styled(doc, 'Serviceable Available Market (SAM)', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'PadhaiShuru directly serves India\'s online learning market for students aged eighteen to thirty in higher education, '
    'test preparation, and upskilling. The SAM breaks down as follows.',
    space_before=0, space_after=4)

# SAM table
sam_data = [
    ('Segment', 'Size (USD)', 'Share', 'PadhaiShuru Fit'),
    ('Test Preparation (GATE, NEET, JEE, UPSC, CAT, SSC, Banking)', '~$1.5B (~₹12,500 Cr)', '~14%', 'Core (Phase 1)'),
    ('Upskilling / Professional Learning', '~$1.3B (~₹10,900 Cr)', '~12%', 'Expansion (Phase 2+)'),
    ('Higher Education / College', '~$0.8B (~₹6,700 Cr)', '~8%', 'Expansion (Phase 2+)'),
    ('Language Learning', '~$0.5B (~₹4,200 Cr)', '~5%', 'Future Opportunity'),
    ('Other (Edutainment, VR, etc.)', '~$0.3B (~₹2,500 Cr)', '~3%', 'Future Opportunity'),
    ('K-12', '~$6.0B', '~58%', 'Not targeting initially'),
]

table = doc.add_table(rows=len(sam_data), cols=4)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
table.style = 'Table Grid'

col_widths = [Inches(2.8), Inches(1.6), Inches(0.9), Inches(1.6)]
for i, width in enumerate(col_widths):
    for cell in table.columns[i].cells:
        cell.width = width

for row_idx, row_data in enumerate(sam_data):
    row = table.rows[row_idx]
    for col_idx, cell_text in enumerate(row_data):
        cell = row.cells[col_idx]
        set_cell_bg(cell, BG_CARD if row_idx > 0 else RGBColor(0x1E, 0x1E, 0x24))
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(cell_text)
        run.font.name = 'Calibri'
        run.font.size = Pt(9)
        if row_idx == 0:
            run.font.bold = True
            run.font.color.rgb = ACCENT
        else:
            run.font.color.rgb = TEXT_LIGHT
            if col_idx == 3:
                run.font.color.rgb = TEAL if 'Core' in cell_text or 'Expansion' in cell_text else TEXT_MUTED
                if 'Core' in cell_text:
                    run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(4)

add_body(doc,
    'PadhaiShuru\'s SAM: ~$3.6B USD (~₹30,000 Cr) — approximately 35% of the total Indian edtech market.',
    color=ACCENT, size=10, bold=True, space_before=0, space_after=6)

# SOM
add_heading_styled(doc, 'Serviceable Obtainable Market (SOM)', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'What PadhaiShuru can realistically capture in three to five years. Target addressable users: approximately '
    'twenty five million competitive exam candidates and college students across India. At a blended ARPU of '
    'approximately two thousand rupees per year, the SAM in paying users is approximately fifty thousand crore rupees, '
    'or six hundred million USD. The conservative SOM target for year four to five is two to five percent of SAM, '
    'or approximately one thousand to twenty five hundred crore rupees, equivalent to twelve to thirty million USD '
    'in annual recurring revenue.',
    space_before=0, space_after=4)

# Year-by-year table
add_label(doc, 'Year-by-Year Projection', color=TEXT_MUTED, size=9, space_before=2, space_after=2)

proj_data = [
    ('Year', 'Total Users', 'Paying', 'Conversion', 'ARR (INR)', 'ARR (USD)', 'Teachers'),
    ('Y1', '50,000', '5,000', '10%', '~₹12 lakh', '~$14K', '50'),
    ('Y2', '200,000', '25,000', '12.5%', '~₹1 Cr', '~$120K', '200'),
    ('Y3', '800,000', '100,000', '12.5%', '~₹8 Cr', '~$960K', '2,000'),
    ('Y4', '2,000,000', '250,000', '12.5%', '~₹25 Cr', '~$3M', '8,000'),
    ('Y5', '5,000,000', '500,000', '10%', '~₹50 Cr', '~$6M', '25,000'),
]

table2 = doc.add_table(rows=len(proj_data), cols=7)
table2.alignment = WD_TABLE_ALIGNMENT.CENTER
table2.style = 'Table Grid'

col_widths2 = [Inches(0.9), Inches(1.1), Inches(0.9), Inches(0.9), Inches(1.0), Inches(0.9), Inches(0.9)]
for i, width in enumerate(col_widths2):
    for cell in table2.columns[i].cells:
        cell.width = width

for row_idx, row_data in enumerate(proj_data):
    row = table2.rows[row_idx]
    for col_idx, cell_text in enumerate(row_data):
        cell = row.cells[col_idx]
        set_cell_bg(cell, BG_CARD if row_idx > 0 else RGBColor(0x1E, 0x1E, 0x24))
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(cell_text)
        run.font.name = 'Calibri'
        run.font.size = Pt(8)
        if row_idx == 0:
            run.font.bold = True
            run.font.color.rgb = ACCENT
        else:
            run.font.color.rgb = TEXT_LIGHT
            if col_idx == 4 and row_idx >= 3:
                run.font.color.rgb = ACCENT
                run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(2)
add_body(doc,
    'Revenue mix by year five: student subscriptions ~40%, teacher commission ~35%, institutional licensing ~25%.',
    color=TEXT_MUTED, size=9, italic=True, space_before=0, space_after=6)

# Market Tailwinds
add_heading_styled(doc, 'Market Tailwinds (Why Now)', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)

tailwinds = [
    ('AI-driven personalization is the #1 differentiator.',
     'Groq integration gives PadhaiShuru inference speeds that static content players cannot match. AI marginal cost is near zero. Teacher marginal cost is not. This enables scalable personalization.'),
    ('The trust deficit is real.',
     'BYJU\'S collapsed from a $22B valuation to near zero. Unacademy\'s valuation also cratered. PadhaiShuru\'s fair-by-design positioning (70-80% teacher revenue share) directly addresses this.'),
    ('AI infrastructure costs have collapsed.',
     'Groq, Supabase, and open models make AI-native products viable at early-stage budgets. A product that cost ₹50L+ in 2022 can now be built for ₹5-10L.'),
    ('Freemium with no-card entry removes friction.',
     'Every competitor uses credit card trials that silently convert. PadhaiShuru earns trust first with real value before any payment.'),
    ('Mobile-first demographics.',
     '760M smartphone users in India. 6-7 hrs/day average screen time. Capacitor Android app ready. Tier-2/3 city adoption accelerating.'),
    ('Creator economy wave.',
     'India has millions of skilled people who could teach but lack platform access. PadhaiShuru\'s 70-80% revenue share is the most competitive in the market.'),
    ('Government support.',
     'NEP 2020 emphasizes technology-enabled learning. Assam Innovation and Startup Foundation actively funds edtech/AI startups. Regional focus on Northeast India creates a unique advantage.'),
]

for title, desc in tailwinds:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(1)
    run = p.add_run('▸  ')
    run.font.color.rgb = ACCENT
    run.font.size = Pt(10)
    run = p.add_run(title + ' ')
    run.font.color.rgb = WHITE
    run.font.size = Pt(10)
    run.font.bold = True
    run = p.add_run(desc)
    run.font.color.rgb = TEXT_LIGHT
    run.font.size = Pt(9)

# Competitive Landscape
add_heading_styled(doc, 'Competitive Landscape', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'No incumbent is building the full orchestration layer. The category is being defined right now.',
    color=ACCENT, size=10, bold=True, italic=True, space_before=0, space_after=4)

comp_data = [
    ('Player', 'Focus', 'Critical Weakness'),
    ('Unacademy / PW / Testbook', 'Content + Coaching', 'Takes 30-70% from teachers. No AI orchestration. No personalization.'),
    ('BYJU\'S', 'K-12 + Test Prep', 'High burn, trust deficit. Teachers are employees, not partners. No learner intelligence.'),
    ('Vedantu', 'K-12 Live Classes', 'Narrow focus. No AI-first architecture.'),
    ('PhysicsWallah', 'Affordable Test Prep', 'YouTube-first. Limited platform features. No AI orchestration.'),
    ('ChatGPT / Gemini Wrappers', 'Open-ended AI Tutoring', 'No exam specialization, no curriculum mapping, no persistent learner model. Reactive, not proactive.'),
    ('Notion / Forest', 'Study Productivity', 'Manage time and focus. No educational intelligence.'),
    ('PadhaiShuru', 'Study Orchestration + Teacher Marketplace', 'AI-native, fair by design, two-sided flywheel. The only platform building the complete loop.'),
]

table3 = doc.add_table(rows=len(comp_data), cols=3)
table3.alignment = WD_TABLE_ALIGNMENT.CENTER
table3.style = 'Table Grid'

col_widths3 = [Inches(1.8), Inches(1.8), Inches(3.8)]
for i, width in enumerate(col_widths3):
    for cell in table3.columns[i].cells:
        cell.width = width

for row_idx, row_data in enumerate(comp_data):
    row = table3.rows[row_idx]
    for col_idx, cell_text in enumerate(row_data):
        cell = row.cells[col_idx]
        is_padhaishuru = 'PadhaiShuru' in cell_text
        set_cell_bg(cell, RGBColor(0x1E, 0x2A, 0x3A) if is_padhaishuru else BG_CARD)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(cell_text)
        run.font.name = 'Calibri'
        run.font.size = Pt(8)
        if row_idx == 0:
            run.font.bold = True
            run.font.color.rgb = ACCENT
        elif is_padhaishuru:
            run.font.bold = True
            run.font.color.rgb = ACCENT
        else:
            run.font.color.rgb = TEXT_LIGHT

doc.add_paragraph().paragraph_format.space_after = Pt(4)

add_divider(doc, color=ACCENT, thickness=1)

# ═══════════════════════════════════════════════════════════════════════════
# PAGE 3
# ═══════════════════════════════════════════════════════════════════════════

add_section_header(doc, 'SECTION 03', 'THE MOAT, REVENUE, ROADMAP, RISKS, AND THE ASK')

# Six Pillars
add_heading_styled(doc, 'The Six Pillars (The Moat)', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)

pillars = [
    ('1. AI-First, Not Content-First',
     'Competitors hoard lectures and hire thousands of teachers. Marginal cost scales linearly. PadhaiShuru treats AI as the product. AI marginal cost is near zero. This enables personalized learning for every student without proportional cost increases.'),
    ('2. Two-Sided Marketplace',
     'Every feature serves both students and teachers simultaneously. More teachers attract more students. More students attract more teachers. Network effects compound over time. This cannot be replicated by a content-only player.'),
    ('3. Zero-Friction Freemium',
     'No card required to start. Five free AI doubts per day, forever. Students experience real value before any payment is requested. Competitors use credit card trials that silently convert. PadhaiShuru earns trust first.'),
    ('4. Open, Trusted Content',
     'Previous year questions are public data. PadhaiShuru centralizes and makes them searchable and AI-augmented. Students trust the platform because it does not exploit them. Content becomes a distribution channel, not a locked asset.'),
    ('5. Fair Teacher Economics (The Wedge)',
     'Unacademy takes 30-70% commission. BYJU\'S employs teachers as wage labor. PadhaiShuru lets teachers keep 70-80%. Incumbents cannot copy this because their revenue models depend on high commission rates. Quality creators bring students. Students bring more creators. The flywheel compounds.'),
    ('6. Immersive Experience',
     'A 3D virtual library with real-time multiplayer. Students walk into a space, study alongside peers, with ambient focus music. Emotional engagement drives retention and word-of-mouth. This requires genuine investment in game design and 3D engineering. It cannot be added as a feature later.'),
]

for title, desc in pillars:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(1)
    run = p.add_run(title + ': ')
    run.font.color.rgb = WHITE
    run.font.size = Pt(10)
    run.font.bold = True
    run = p.add_run(desc)
    run.font.color.rgb = TEXT_LIGHT
    run.font.size = Pt(9)

# Revenue Model
add_heading_styled(doc, 'Revenue Model', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)

add_heading_styled(doc, 'Student Revenue', level=3, color=WHITE, size=11, bold=True, space_before=4, space_after=2)
add_body(doc,
    'Freemium subscription model. Students start free with five AI doubts per day and open PYQ access. Paid plans at '
    'twenty rupees per week or forty nine rupees per month unlock unlimited AI access, advanced analytics, mock tests, '
    'and premium content. No credit card required to start. Projected ARPU: approximately one thousand rupees per year. '
    'Low-friction onboarding drives volume. Conversion driven by habit and demonstrated value.',
    space_before=0, space_after=4)

add_heading_styled(doc, 'Teacher Revenue', level=3, color=WHITE, size=11, bold=True, space_before=4, space_after=2)
add_body(doc,
    'Teachers keep seventy to eighty percent of their earnings. Students pay for courses, live sessions, and mentorship. '
    'PadhaiShuru handles payments through Razorpay, automated teacher payouts, audience discovery, AI teaching tools, '
    'and hosting. Teachers focus on teaching. The platform keeps a small commission on transactions. At scale, additional '
    'revenue comes from institutional licensing and premium subscriptions.',
    space_before=0, space_after=4)

add_body(doc,
    'Revenue mix by year five: student subscriptions ~40%, teacher commission ~35%, institutional licensing ~25%.',
    color=TEXT_MUTED, size=9, italic=True, space_before=0, space_after=6)

# Product Architecture
add_heading_styled(doc, 'Product Architecture', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'The platform operates on a six-stage loop: Plan, Learn, Practice, Focus, Measure, Adapt. At the center is the '
    'Student Intelligence layer that continuously uses context, performance, behavior, and study history to personalize '
    'what comes next. The AI Study Planner creates intelligent schedules. The AI Doubt Engine provides context-aware '
    'tutoring. The Virtual Library offers a collaborative 3D study environment. The GATE Practice Engine provides '
    'branch-aware practice with 797 PYQs across 20 branches. Learning Analytics provides real-time insights. The Teacher '
    'Marketplace, currently in the design phase, will provide course creation tools, live sessions, teacher dashboard, '
    'and automated payouts.',
    space_before=0, space_after=6)

# Traction
add_heading_styled(doc, 'Traction and User Validation', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)

traction_items = [
    ('5,000+ page views', 'Total engagement across all sessions'),
    ('3.8L+ organic reach', 'Social media impressions across platforms'),
    ('~400 peak daily users', 'During launch period, organic acquisition only'),
    ('140 WTP respondents', 'Indicated willingness to pay before any monetization'),
    ('WTP range: ₹100–₹500/month', 'Median: ₹325–₹350. 100+ of 126 willing to pay ≥ ₹100'),
    ('Cross-branch appeal', 'BTech, MCA, ECE, CSE, Civil, Biotech — demand beyond GATE CSE'),
    ('324,764 social views · +2,340 followers · 23,415 interactions', 'Organic traction across platforms'),
]

for metric, desc in traction_items:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(1)
    run = p.add_run('▸  ')
    run.font.color.rgb = ACCENT
    run.font.size = Pt(9)
    run = p.add_run(metric + ' — ')
    run.font.color.rgb = WHITE
    run.font.size = Pt(9)
    run.font.bold = True
    run = p.add_run(desc)
    run.font.color.rgb = TEXT_LIGHT
    run.font.size = Pt(9)

# Roadmap
add_heading_styled(doc, 'Strategic Roadmap', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)

roadmap_phases = [
    ('Phase 1 — NOW: GATE Preparation',
     'Deep integration with GATE syllabi across 20 branches. Branch-specific practice for CSE, ECE, IN. AI Study Planner, '
     'Virtual Library multiplayer, AI Doubt Engine with Groq plus RAG. PYQ Library: 797 questions across 20 branches. '
     'Android app via Capacitor. This is the proving ground. High-intent users, measurable outcomes, passionate community.'),
    ('Phase 2 — 6-12 Months (2026-2027): Expansion + Teacher Marketplace',
     'Expand to JEE, NEET, UPSC, and CAT. Activate Focus and Pomodoro tools. Activate monetization at ₹20/week or ₹49/month. '
     'Launch Teacher Marketplace MVP: course creation, live sessions, teacher dashboard, automated payouts. The orchestration '
     'engine is exam-agnostic.'),
    ('Phase 3 — 12-18 Months: Scale',
     'Advanced analytics dashboard. Peer learning features. Native mobile app replacing Capacitor. Institutional licensing '
     'pilot. First 50 teachers onboarded and earning. 1,000+ teachers, 5 lakh+ students.'),
    ('Phase 4 — 18+ Months (2027+): Platform',
     'Full AI Tutoring. Adaptive Engine v2. Multi-language support. Platform API for third-party integrations. '
     '1,000+ teachers, 5 lakh+ students, ₹50 Cr ARR.'),
]

for title, desc in roadmap_phases:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(1)
    run = p.add_run(title)
    run.font.color.rgb = WHITE
    run.font.size = Pt(10)
    run.font.bold = True
    add_body(doc, desc, color=TEXT_LIGHT, size=9, space_before=1, space_after=3)

# Risks
add_heading_styled(doc, 'Risks and Mitigations', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)

risks = [
    ('Market crowding (4,500+ edtech startups)',
     'High — Sharp AI differentiation + teacher economics wedge + niche-first GATE positioning + two-sided flywheel.'),
    ('Incumbents with massive brand recall and VC war chests',
     'High — They are not building the orchestration layer. Their trust deficit is an opportunity. PadhaiShuru occupies a different category.'),
    ('Teacher acquisition bottleneck',
     'Medium — Fair economics (70-80% revenue share) is the strongest attractor. Assam-based educators as initial cohort. PYQ library provides immediate value.'),
    ('Payment trust',
     'Low — Razorpay integration already built. Freemium entry means no payment needed to start.'),
    ('Regulatory (UGC/NEP, DPDP Act)',
     'Low-Medium — Designed for compliance from ground up. No PII collection beyond what is necessary.'),
    ('AI infrastructure dependency (Groq)',
     'Low — Open models as fallback. Groq is a speed advantage, not a dependency.'),
    ('Brand awareness = 0',
     'Medium — Organic social traction (3.8L+ reach) is proof of concept. Content marketing, student ambassadors, referral program.'),
]

for risk, mitigation in risks:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(1)
    run = p.add_run('▸  ' + risk + '. ')
    run.font.color.rgb = WHITE
    run.font.size = Pt(9)
    run.font.bold = True
    run = p.add_run('Mitigation: ' + mitigation)
    run.font.color.rgb = TEXT_LIGHT
    run.font.size = Pt(9)

# The Ask
add_heading_styled(doc, 'The Ask', level=2, color=ACCENT, size=12, bold=True, space_before=8, space_after=4)
add_body(doc,
    'For the Assam Innovation and Startup Foundation grant, PadhaiShuru is requesting five lakh rupees.',
    color=WHITE, size=10, bold=True, space_before=0, space_after=4)

ask_data = [
    ('Product Development', '35%', '₹1,75,000', 'Complete premium features: mock tests, advanced analytics, spaced revision. Expand multi-branch GATE. Refine mobile app. Build teacher marketplace: course tools, live sessions, teacher dashboard, automated payouts.'),
    ('Teacher Acquisition', '20%', '₹1,00,000', 'Recruit the first 50 teachers and creators from engineering colleges, coaching institutes, and professional networks. Focus on Assam-based educators who can reach students nationally. Onboarding program, content incentives, success stories.'),
    ('Content', '25%', '₹1,25,000', 'Expand PYQ library to 5,000+ questions. Produce concept content. Onboard teachers with incentives.'),
    ('Student Acquisition', '15%', '₹75,000', 'Content marketing on YouTube, Instagram, SEO. Community engagement in GATE spaces. Referral program.'),
]

table4 = doc.add_table(rows=len(ask_data), cols=4)
table4.alignment = WD_TABLE_ALIGNMENT.CENTER
table4.style = 'Table Grid'

col_widths4 = [Inches(1.5), Inches(0.7), Inches(0.9), Inches(3.5)]
for i, width in enumerate(col_widths4):
    for cell in table4.columns[i].cells:
        cell.width = width

for row_idx, row_data in enumerate(ask_data):
    row = table4.rows[row_idx]
    for col_idx, cell_text in enumerate(row_data):
        cell = row.cells[col_idx]
        set_cell_bg(cell, BG_CARD if row_idx > 0 else RGBColor(0x1E, 0x1E, 0x24))
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(cell_text)
        run.font.name = 'Calibri'
        run.font.size = Pt(9)
        if row_idx == 0:
            run.font.bold = True
            run.font.color.rgb = ACCENT
        else:
            if col_idx == 0:
                run.font.color.rgb = WHITE
                run.font.bold = True
            elif col_idx == 1:
                run.font.color.rgb = ACCENT
                run.font.bold = True
            elif col_idx == 2:
                run.font.color.rgb = GREEN
                run.font.bold = True
            else:
                run.font.color.rgb = TEXT_LIGHT

doc.add_paragraph().paragraph_format.space_after = Pt(4)

add_divider(doc, color=ACCENT, thickness=2)

# Closing statement
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(4)
p.paragraph_format.space_after = Pt(2)
run = p.add_run('What this funding buys: ')
run.font.color.rgb = WHITE
run.font.size = Pt(10)
run.font.bold = True
run = p.add_run('A complete AI-native learning platform serving thousands of students and dozens of teachers within twelve months. Revenue activation. Pathway to Series A.')
run.font.color.rgb = TEXT_LIGHT
run.font.size = Pt(10)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(6)
p.paragraph_format.space_after = Pt(2)
run = p.add_run('padhaishuru.com  ·  Confidential  ·  September 2026')
run.font.color.rgb = TEXT_MUTED
run.font.size = Pt(8)

# ── KEY NUMBERS TABLE (full page appendix feel) ───────────────────────────
doc.add_page_break()
add_section_header(doc, 'APPENDIX', 'KEY NUMBERS REFERENCE')

add_label(doc, 'All figures consolidated for quick reference', color=TEXT_MUTED, size=9, space_before=0, space_after=6)

categories = [
    ('Market', [
        ('Global online education', '$278B – $400B'),
        ('India edtech', '$10.4B (~₹87,000 Cr)'),
        ('India edtech (2030 projected)', '~$29B (~₹2.4 lakh Cr)'),
        ('Market CAGR', '22.3%'),
        ('SAM (test prep + college + upskilling)', '~$3.6B (~₹30,000 Cr)'),
        ('SOM (5-year target)', '~₹1,000 – 2,500 Cr (~$12 – 30M ARR)'),
        ('2nd largest edtech market', 'Globally'),
        ('Smartphone users (India)', '~760M'),
        ('Active learners (India)', '100M+'),
        ('Higher-ed enrollment', '~40M+'),
        ('Edtech startups (India)', '4,500+'),
    ]),
    ('Competitive & Target', [
        ('GATE registrations', '~1 lakh'),
        ('All competitive exam candidates', '50L+'),
        ('Higher-ed students', '4Cr+'),
        ('Target addressable users', '~25M'),
    ]),
    ('Product', [
        ('PYQs in library', '797 across 20 branches'),
        ('AI doubts (free tier)', '5/day forever'),
        ('AI doubts (paid)', 'Unlimited'),
        ('Student pricing', '₹20/week or ₹49/month'),
        ('Student ARPU (projected)', '~₹1,000/year'),
        ('Tech stack', 'Next.js 16, Supabase, Groq, Razorpay, Capacitor'),
    ]),
    ('Traction', [
        ('Page views', '5,000+'),
        ('Organic reach', '3.8L+'),
        ('Peak daily users', '~400'),
        ('WTP respondents', '140'),
        ('WTP range', '₹100 – ₹500/month'),
        ('WTP median', '₹325 – ₹350'),
        ('Social views', '324,764'),
        ('Social followers', '+2,340'),
        ('Social interactions', '23,415'),
    ]),
    ('Teacher', [
        ('Teacher revenue share', '70 – 80%'),
        ('Platform commission', '20 – 30%'),
        ('Year 1 target', '50 teachers'),
        ('Year 3 target', '2,000 teachers'),
        ('Year 5 target', '25,000 teachers'),
    ]),
    ('Revenue & Ask', [
        ('Year 1 ARR', '₹12 lakh'),
        ('Year 3 ARR', '₹8 crore'),
        ('Year 5 ARR', '₹50 crore'),
        ('Revenue mix (Year 5)', '40% student subs + 35% teacher commission + 25% institutional'),
        ('Grant amount', '₹5 lakh'),
        ('Product development', '35% (₹1.75L)'),
        ('Teacher acquisition', '20% (₹1L)'),
        ('Content', '25% (₹1.25L)'),
        ('Student acquisition', '15% (₹0.75L)'),
    ]),
]

for category, items in categories:
    add_heading_styled(doc, category, level=3, color=TEAL, size=11, bold=True, space_before=8, space_after=3)

    tbl = doc.add_table(rows=len(items), cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
    tbl.style = 'Table Grid'

    for row_idx, (label, value) in enumerate(items):
        row = tbl.rows[row_idx]
        set_cell_bg(row.cells[0], BG_CARD)
        set_cell_bg(row.cells[1], BG_CARD)

        p0 = row.cells[0].paragraphs[0]
        p0.paragraph_format.space_before = Pt(2)
        p0.paragraph_format.space_after = Pt(2)
        run0 = p0.add_run(label)
        run0.font.name = 'Calibri'
        run0.font.size = Pt(9)
        run0.font.color.rgb = TEXT_LIGHT

        p1 = row.cells[1].paragraphs[0]
        p1.paragraph_format.space_before = Pt(2)
        p1.paragraph_format.space_after = Pt(2)
        run1 = p1.add_run(value)
        run1.font.name = 'Calibri'
        run1.font.size = Pt(9)
        run1.font.bold = True
        run1.font.color.rgb = WHITE

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

# Footer
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(12)
p.paragraph_format.space_after = Pt(0)
run = p.add_run('— End of Document —')
run.font.color.rgb = TEXT_MUTED
run.font.size = Pt(9)
run.font.italic = True

# ── Save ──────────────────────────────────────────────────────────────────
out_dir = r'D:\padhaishuru\eduniche\eduniche'
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, 'PadhaiShuru_Executive_Brief.docx')
doc.save(out_path)
print(f'[OK] Saved -> {out_path}')
print(f'    Sections: 3 main + 1 appendix')
print(f'    Tables: 7')
