#!/usr/bin/env python3
"""
Generate three professional PDF documents for EduNeuro incubation application.
"""
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether, ListFlowable, ListItem
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

OUTPUT_DIR = r"C:\Users\Sumanta Bhargab\eduniche\eduniche"

# Professional colour palette
PRIMARY = HexColor("#1a3c5e")      # Deep navy blue
SECONDARY = HexColor("#2c6fad")    # Medium blue
ACCENT = HexColor("#d4a853")       # Muted gold
LIGHT_BG = HexColor("#f0f4f8")     # Light blue-grey
DARK_TEXT = HexColor("#1a1a2e")    # Near-black
GREY_TEXT = HexColor("#4a4a4a")    # Medium grey
LIGHT_GREY = HexColor("#e8e8e8")   # Table borders
WHITE = HexColor("#ffffff")

def add_page_header(canvas_obj, doc, title_text, subtitle_text=""):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica-Bold", 8)
    canvas_obj.setFillColor(PRIMARY)
    header_y = A4[1] - 15 * mm
    canvas_obj.drawString(20 * mm, header_y, "EduNeuro — Confidential Business Document")
    if subtitle_text:
        canvas_obj.setFont("Helvetica", 7)
        canvas_obj.setFillColor(GREY_TEXT)
        canvas_obj.drawRightString(A4[0] - 20 * mm, header_y, subtitle_text)
    # Thin line under header
    canvas_obj.setStrokeColor(ACCENT)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(20 * mm, header_y - 3, A4[0] - 20 * mm, header_y - 3)
    # Footer
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.setFillColor(GREY_TEXT)
    footer_y = 12 * mm
    canvas_obj.drawString(20 * mm, footer_y, "EduNeuro")
    canvas_obj.drawCentredString(A4[0] / 2, footer_y, f"Page {doc.page}")
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.drawRightString(A4[0] - 20 * mm, footer_y, "Confidential")
    canvas_obj.setStrokeColor(LIGHT_GREY)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(20 * mm, footer_y + 4 * mm, A4[0] - 20 * mm, footer_y + 4 * mm)
    canvas_obj.restoreState()

# ─── STYLES ───
BASE_FONT = "Helvetica"
BASE_FONT_BOLD = "Helvetica-Bold"
BASE_FONT_OBLIQUE = "Helvetica-Oblique"

styles = getSampleStyleSheet()

def make_style(name, parent="Normal", **kwargs):
    defaults = dict(fontName=BASE_FONT, fontSize=10, leading=14,
                    textColor=DARK_TEXT, alignment=TA_JUSTIFY,
                    spaceAfter=6, spaceBefore=2)
    defaults.update(kwargs)
    s = ParagraphStyle(name, parent=styles[parent], **defaults)
    return s

H1 = make_style("H1", fontSize=18, leading=22, fontName=BASE_FONT_BOLD,
                textColor=PRIMARY, alignment=TA_LEFT, spaceAfter=10, spaceBefore=16)
H2 = make_style("H2", fontSize=14, leading=18, fontName=BASE_FONT_BOLD,
                textColor=PRIMARY, spaceAfter=8, spaceBefore=14)
H3 = make_style("H3", fontSize=12, leading=16, fontName=BASE_FONT_BOLD,
                textColor=SECONDARY, spaceAfter=6, spaceBefore=10)
BODY = make_style("BODY", fontSize=10, leading=15, alignment=TA_JUSTIFY,
                  spaceAfter=8, spaceBefore=2)
BODY_LEFT = make_style("BODY_LEFT", fontSize=10, leading=15, alignment=TA_LEFT,
                        spaceAfter=6)
CAPTION = make_style("CAPTION", fontSize=9, leading=13, fontName=BASE_FONT_OBLIQUE,
                      textColor=GREY_TEXT, alignment=TA_LEFT, spaceAfter=4)
NOTE = make_style("NOTE", fontSize=9, leading=13, fontName=BASE_FONT_OBLIQUE,
                   textColor=GREY_TEXT, alignment=TA_JUSTIFY, spaceAfter=6)
TOC_ENTRY = make_style("TOC_ENTRY", fontSize=10, leading=16, alignment=TA_LEFT,
                        spaceAfter=3)
TOC_H2 = make_style("TOC_H2", fontSize=10, leading=16, fontName=BASE_FONT_BOLD,
                     textColor=SECONDARY, alignment=TA_LEFT, spaceAfter=2)
COVER_TITLE = make_style("COVER_TITLE", fontSize=26, leading=32,
                          fontName=BASE_FONT_BOLD, textColor=PRIMARY,
                          alignment=TA_CENTER, spaceAfter=12)
COVER_SUB = make_style("COVER_SUB", fontSize=14, leading=20, fontName=BASE_FONT_BOLD,
                        textColor=SECONDARY, alignment=TA_CENTER, spaceAfter=8)
COVER_TEXT = make_style("COVER_TEXT", fontSize=11, leading=17,
                         textColor=GREY_TEXT, alignment=TA_CENTER, spaceAfter=6)
LABEL = make_style("LABEL", fontSize=9, leading=13, fontName=BASE_FONT_BOLD,
                   textColor=PRIMARY, spaceAfter=2)
BULLET = make_style("BULLET", fontSize=10, leading=15, alignment=TA_LEFT,
                     leftIndent=14, spaceAfter=4, bulletIndent=4)
BULLET2 = make_style("BULLET2", fontSize=9.5, leading=14, alignment=TA_LEFT,
                      leftIndent=24, spaceAfter=3, bulletIndent=14)
META = make_style("META", fontSize=9, leading=14, fontName=BASE_FONT_OBLIQUE,
                   textColor=GREY_TEXT, spaceAfter=3)

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=ACCENT, spaceAfter=6, spaceBefore=4)

def section(title):
    return [hr(), Paragraph(title, H2)]

def subsection(title):
    return Paragraph(title, H3)

def p(text, style=BODY):
    return Paragraph(text, style)

def bullet(text, level=1):
    bullet_char = "\u2022" if level == 1 else "\u2013"
    return Paragraph(f"<b>{bullet_char}</b>&nbsp;&nbsp;{text}", BULLET if level == 1 else BULLET2)

def bullets(items, level=1):
    return [bullet(item, level) for item in items]

def spacer(h=6):
    return Spacer(1, h)

def two_col_table(data, col_widths=None):
    if col_widths is None:
        col_widths = [60, None]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), BASE_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, -1), 0),
        ("LEFTPADDING", (1, 0), (1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
    ]))
    return t


def make_doc(filename, title, subtitle, meta_lines, content_builder, extra_header=""):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=28*mm, bottomMargin=22*mm,
        title=title,
        author="EduNeuro",
        subject="Incubation Application Document",
        creator="EduNeuro",
    )

    def on_page(canvas_obj, doc_obj):
        header_title = title
        if extra_header:
            header_title = f"{title} — {extra_header}"
        add_page_header(canvas_obj, doc_obj, header_title, subtitle)

    story = []
    story.extend(content_builder())
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"  [OK] Created {filename}")
    return filepath


# ═══════════════════════════════════════════════════════════════════════════════
#  DOCUMENT 1: BUSINESS PLAN
# ═══════════════════════════════════════════════════════════════════════════════

def build_doc1():
    story = []

    # ── COVER PAGE ──
    story.append(spacer(60))
    story.append(Paragraph("BUSINESS PLAN", COVER_TITLE))
    story.append(spacer(8))
    story.append(HRFlowable(width="60%", thickness=2, color=ACCENT,
                             hAlign="CENTER", spaceAfter=16))
    story.append(Paragraph("EduNeuro", COVER_SUB))
    story.append(spacer(4))
    story.append(Paragraph("AI-Native Study Orchestration and Learning Platform", COVER_TEXT))
    story.append(spacer(20))
    story.append(Paragraph("Prepared for", make_style("CF1", fontSize=11, leading=16,
                          textColor=GREY_TEXT, alignment=TA_CENTER, spaceAfter=2)))
    story.append(Paragraph("IIT Guwahati Technology Incubation Centre (TIC)", COVER_SUB))
    story.append(spacer(30))
    meta_cover = [
        ["Founder:", "Sumanta"],
        ["Entity:", "EduNeuro"],
        ["Stage:", "Open Beta / Pre-Incubation"],
        ["Document Date:", "September 2026"],
        ["Classification:", "Confidential"],
    ]
    ct = Table(meta_cover, colWidths=[70, None])
    ct.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), BASE_FONT_BOLD),
        ("FONTNAME", (1, 0), (1, -1), BASE_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "LEFT"),
    ]))
    from reportlab.platypus.flowables import KeepTogether
    story.append(KeepTogether([
        ct,
    ]))
    story.append(spacer(20))
    story.append(Paragraph(
        "<i>This document is submitted in connection with EduNeuro's application for "
        "incubation support at IIT Guwahati Technology Incubation Centre. All information "
        "contained herein is confidential and intended solely for the purpose of evaluating "
        "EduNeuro's application.</i>",
        make_style("DISCLAIMER", fontSize=8, leading=12, textColor=GREY_TEXT,
                   alignment=TA_CENTER, spaceAfter=4)
    ))
    story.append(PageBreak())

    # ── TABLE OF CONTENTS ──
    story.append(Paragraph("Table of Contents", H1))
    story.append(hr())
    story.append(spacer(4))

    toc_data = [
        ("1.", "Executive Summary", "3"),
        ("2.", "Company Overview", "4"),
        ("3.", "Vision and Mission", "5"),
        ("4.", "Problem Statement", "5"),
        ("5.", "Market Opportunity", "6"),
        ("6.", "Target Customers", "7"),
        ("7.", "Proposed Solution", "7"),
        ("8.", "Product Description", "8"),
        ("9.", "Technology and AI Architecture", "9"),
        ("10.", "Competitive Landscape", "10"),
        ("11.", "Competitive Advantage", "11"),
        ("12.", "Market Entry Strategy", "11"),
        ("13.", "Business Model", "12"),
        ("14.", "Marketing and User Acquisition", "13"),
        ("15.", "Current Validation and Traction", "13"),
        ("16.", "Product Development Roadmap", "14"),
        ("17.", "Operations", "15"),
        ("18.", "Risk Analysis and Mitigation", "16"),
        ("19.", "Social and Educational Impact", "17"),
        ("20.", "Financial Strategy", "17"),
        ("21.", "Incubation and Funding Requirements", "18"),
        ("22.", "Milestones", "19"),
        ("23.", "Conclusion", "20"),
    ]
    for num, title_, pg in toc_data:
        story.append(two_col_table(
            [(Paragraph(f"<b>{num}</b>", BODY_LEFT), Paragraph(f"{title_}", BODY_LEFT))],
            col_widths=[12, None]
        ))
    story.append(PageBreak())

    # ── 1. EXECUTIVE SUMMARY ──
    story += section("1. Executive Summary")
    story.append(p(
        "EduNeuro is developing an AI-native study orchestration and learning platform "
        "designed to unify the fragmented landscape of educational tools that students "
        "currently rely on for examination preparation and self-directed learning."
    ))
    story.append(spacer(4))
    story.append(p(
        "The platform's core thesis is that the fundamental problem for students is not a "
        "lack of educational content, but the absence of an intelligent system that "
        "continuously understands each learner's state — their knowledge, gaps, study "
        "behaviour, schedule adherence, and performance trajectory — and uses this "
        "understanding to recommend the most valuable next learning action."
    ))
    story.append(spacer(4))
    story.append(p(
        "The initial market wedge is competitive examination preparation, beginning with "
        "the Graduate Aptitude Test in Engineering (GATE). The GATE market was selected "
        "as the proving ground because the candidate population is large, preparation "
        "behaviours are well-structured, and the stakes are high enough that students "
        "actively seek optimisation tools."
    ))
    story.append(spacer(4))
    story.append(p(
        "EduNeuro is currently in an open beta phase, with early validation signals "
        "including website visits, organic content reach, and user sign-ups. The platform "
        "has zero paying users at this stage, and no product-market fit has been claimed. "
        "Monetisation is planned through a freemium/subscription model, with pricing to "
        "be validated during the beta phase."
    ))
    story.append(spacer(4))
    story.append(p(
        "EduNeuro is applying to IIT Guwahati TIC for incubation support to access "
        "mentorship, refine product-market strategy, engage with the research and "
        "startup ecosystem, and prepare for structured fundraising."
    ))

    # ── 2. COMPANY OVERVIEW ──
    story += section("2. Company Overview")
    story.append(p(
        "<b>Entity:</b> EduNeuro<br/>"
        "<b>Founder:</b> Sumanta<br/>"
        "<b>Founder Background:</b> Student researcher with a focus on Artificial "
        "Intelligence. The founding team currently consists of the founder as the "
        "primary operator. The venture is at an early stage with no external team "
        "members formally onboarded.<br/>"
        "<b>Current Stage:</b> Open Beta / Pre-Incubation<br/>"
        "<b>Legal Status:</b> [TO BE FILLED — e.g., Pvt. Ltd. / LLP / Proprietorship]<br/>"
        "<b>Registered Address:</b> [TO BE FILLED]"
    ))
    story.append(spacer(4))
    story.append(p(
        "EduNeuro was founded with the objective of applying AI-driven systems thinking "
        "to a genuinely unmet problem in education technology: the fragmentation of the "
        "student's learning journey across disconnected tools, and the resulting inability "
        "of any single system to understand the learner well enough to provide genuinely "
        "personalised guidance."
    ))

    # ── 3. VISION AND MISSION ──
    story += section("3. Vision and Mission")
    story.append(subsection("Vision"))
    story.append(p(
        "To build an intelligent learning system that understands an individual learner's "
        "goals, knowledge state, behaviour, constraints, and progress, and continuously "
        "adapts the learning process around them. Over time, EduNeuro aims to become "
        "the foundational student intelligence layer that makes personalised, effective "
        "learning accessible at scale."
    ))
    story.append(subsection("Mission"))
    story.append(p(
        "EduNeuro's mission is to create a unified, AI-native study orchestration "
        "platform that replaces the student's fragmented toolchain with a single system "
        "that learns from their behaviour and guides their preparation more effectively. "
        "The platform begins with the GATE examination preparation market as its initial "
        "validating wedge and will expand to other competitive examinations and broader "
        "learning contexts as the core technology matures."
    ))

    # ── 4. PROBLEM STATEMENT ──
    story += section("4. Problem Statement")
    story.append(p(
        "Students preparing for competitive examinations and managing academic learning "
        "routinely operate across five or more disconnected digital tools: video platforms "
        "for concept learning, question banks for practice, separate study planners, "
        "productivity and focus apps, and increasingly, general-purpose AI assistants. "
        "None of these tools share information about the student."
    ))
    story.append(spacer(4))
    story.append(p("The consequence is a set of persistent, systemic problems:"))
    story += bullets([
        "The student may know what topics they studied, but cannot confidently determine "
        "what they should study next based on their current mastery level.",
        "Weak areas deserving targeted attention are not automatically surfaced; the "
        "student must manually identify them.",
        "There is no reliable way to know whether study effort is translating into "
        "measurable improvement over time.",
        "The relationship between study behaviour (consistency, session quality, "
        "distraction levels) and outcomes is invisible to the tools being used.",
        "Revision scheduling is typically manual or based on crude heuristics rather "
        "than the student's actual forgetting curve.",
        "The effectiveness of a given study plan cannot be evaluated without manual "
        "tracking and analysis that most students do not perform.",
    ])
    story.append(spacer(4))
    story.append(p(
        "EduNeuro's thesis is that the problem is not merely a lack of educational "
        "content. It is the absence of an intelligent, longitudinal system that "
        "continuously models the student's learning state and orchestrates the next "
        "best action across the full preparation journey."
    ))

    # ── 5. MARKET OPPORTUNITY ──
    story += section("5. Market Opportunity")
    story.append(p(
        "The addressable opportunity for EduNeuro spans multiple interconnected segments "
        "of the education technology market, each characterised by high student "
        "populations, competitive selection pressure, and willingness to invest in "
        "preparation tools."
    ))
    story.append(spacer(4))

    market_data = [
        ["Segment", "Description", "Student Population (India)"],
        ["GATE", "Graduate Aptitude Test in Engineering — initial wedge", "~1M+ registered annually"],
        ["JEE Main/Advanced", "Undergraduate engineering entrance exams", "~1M+ registered annually"],
        ["NEET", "Medical entrance examination", "~2M+ registered annually"],
        ["UPSC CSE", "Civil Services Examination", "~1M+ registered annually"],
        ["CAT/XAT", "MBA entrance examinations", "~300,000+ registered annually"],
        ["University Students", "Self-directed learners across disciplines", "~40M+ in higher education"],
    ]
    mt = Table(market_data, colWidths=[50, 110, None])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("FONTNAME", (1, 1), (-1, -1), BASE_FONT),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(mt)
    story.append(spacer(4))
    story.append(Paragraph(
        "Note: Registration figures are publicly available estimates and are provided for "
        "contextual reference only. EduNeuro does not claim to serve all segments listed above.",
        NOTE
    ))
    story.append(spacer(4))
    story.append(p(
        "EduNeuro's initial focus is exclusively on the GATE segment. The long-term "
        "opportunity lies in replicating the orchestration technology across the other "
        "examination and learning contexts listed above, contingent on successful validation "
        "in the initial wedge."
    ))

    # ── 6. TARGET CUSTOMERS ──
    story += section("6. Target Customers")
    story.append(p(
        "The primary target customer for EduNeuro's initial phase is the GATE aspirant "
        "in India — typically a final-year undergraduate or a working professional with "
        "1–2 years of preparation experience."
    ))
    story += bullets([
        "Demographics: Ages 21–26, predominantly engineering graduates.",
        "Behaviour: Self-directed learners who supplement coaching or self-study with "
        "digital tools. High digital fluency. Comfortable with AI-augmented tools.",
        "Pain: Aware that their current toolchain is fragmented but uncertain how to "
        "optimise it. Frequently struggle with prioritisation, revision, and focus.",
        "Motivation: The stakes of GATE are significant — admission to premier M.Tech "
        "programmes, PSU recruitment, and research positions — which drives willingness "
        "to adopt tools that genuinely improve preparation efficiency.",
    ])
    story.append(spacer(4))
    story.append(p(
        "Secondary and future segments (not currently targeted) include JEE aspirants, "
        "NEET aspirants, UPSC candidates, CAT aspirants, and university students seeking "
        "structured self-learning support."
    ))

    # ── 7. PROPOSED SOLUTION ──
    story += section("7. Proposed Solution")
    story.append(p(
        "EduNeuro proposes a unified, AI-native study orchestration platform that "
        "continuously understands the learner and determines the most useful next action "
        "across the full preparation journey."
    ))
    story.append(spacer(4))
    story.append(p(
        "Rather than optimising individual activities (watching videos, solving questions, "
        "planning schedules), EduNeuro's approach treats the student's entire learning "
        "process as a connected system. The platform integrates:"
    ))
    story += bullets([
        "Learning and tutoring support",
        "Study planning and scheduling",
        "Practice and assessment",
        "Adaptive evaluation",
        "Focus and productivity support",
        "Progress tracking and analytics",
        "Personalised recommendations",
    ])
    story.append(spacer(4))
    story.append(p(
        "The system models the learner's state across multiple dimensions — goal, syllabus "
        "coverage, topic mastery, performance history, study behaviour, focus quality, "
        "schedule adherence, and the effectiveness of prior interventions — and uses this "
        "model to generate contextually appropriate next actions."
    ))
    story.append(spacer(4))
    story.append(p(
        "This architecture is designed to become more useful over time as it accumulates "
        "longitudinal data about the learner, creating a flywheel effect where the system's "
        "recommendations improve with continued use."
    ))

    # ── 8. PRODUCT DESCRIPTION ──
    story += section("8. Product Description")
    story.append(p(
        "EduNeuro is being developed as a web-based platform. The current open beta "
        "version includes core functionality in active development. The platform is "
        "designed around the following capability areas:"
    ))

    capabilities = [
        ["Capability Area", "Current Status", "Description"],
        ["AI Learning Support", "In Development", "Concept explanation and tutoring assistance for GATE subjects"],
        ["Study Planning", "In Development", "Adaptive study schedule generation based on exam timeline and learner state"],
        ["Practice Engine", "In Development", "Curated question practice with difficulty adaptation"],
        ["Assessment", "In Development", "Topic-wise and full-length test simulation with analytics"],
        ["Focus Tools", "Planned", "Session-level focus tracking and distraction management"],
        ["Progress Analytics", "In Development", "Longitudinal tracking of mastery, velocity, and behaviour patterns"],
        ["Personalised Recommendations", "Planned", "AI-driven next-action suggestions based on learner model"],
    ]
    ct2 = Table(capabilities, colWidths=[60, 55, 130])
    ct2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(ct2)
    story.append(spacer(4))
    story.append(Paragraph(
        "Note: The product is in active development. Capability status reflects the "
        "current beta state as of September 2026.",
        NOTE
    ))
    story.append(spacer(6))

    # ── 9. TECHNOLOGY AND AI ARCHITECTURE ──
    story += section("9. Technology and AI Architecture")
    story.append(p(
        "EduNeuro's technology architecture is designed around three foundational principles:"
    ))
    story += bullets([
        "<b>Learner State Modelling:</b> A persistent, multi-dimensional model of each "
        "learner's knowledge, behaviour, and progress that grows more accurate with use.",
        "<b>Orchestration Engine:</b> A decision system that uses the learner model to "
        "determine the most valuable next action — whether that is learning a concept, "
        "practising a topic, revising previously studied material, or adjusting the study schedule.",
        "<b>Longitudinal Data Accumulation:</b> The architecture is designed to improve "
        "as more data about each learner is collected, creating a compounding "
        "personalisation effect.",
    ])
    story.append(spacer(6))
    story.append(p(
        "The platform is built on a modern web technology stack. AI components leverage "
        "large language models for content generation and reasoning, supplemented by "
        "custom algorithms for mastery tracking, spaced-repetition scheduling, and "
        "behavioural analytics. The architecture is being designed to support responsible "
        "AI deployment, including content quality assurance and learner data governance."
    ))
    story.append(spacer(4))
    story.append(p(
        "Key technical considerations being addressed include: scalable AI inference, "
        "real-time learner state updates, evaluation of AI-generated educational content, "
        "privacy-preserving learner data handling, and the design of evaluation frameworks "
        "to measure learning outcome improvement attributable to the platform."
    ))

    # ── 10. COMPETITIVE LANDSCAPE ──
    story += section("10. Competitive Landscape")
    story.append(p(
        "The competitive landscape for EduNeuro can be understood across four broad "
        "categories of existing solutions. No single competitor currently addresses the "
        "full orchestration thesis EduNeuro is pursuing."
    ))
    story += bullets([
        "<b>Traditional Coaching Platforms:</b> Established players such as Unacademy, "
        "BYJU'S, and others primarily deliver structured video courses and live classes. "
        "Their strength is content depth and brand recognition. They do not model "
        "individual learner state longitudinally or orchestrate personalised next actions.",
        "<b>Question Banks and Practice Platforms:</b> Tools such as Gradeup (now "
        "part of Byju's) and Testbook focus on practice and assessment. They provide "
        "performance analytics but do not extend into study planning, focus support, "
        "or longitudinal learner modelling.",
        "<b>AI Tutors and Chatbots:</b> Emerging AI-powered tools such as Khan Academy's "
        "Khanmigo and various ChatGPT-based tutoring wrappers offer conversational "
        "learning support. They are reactive rather than proactive — they respond to "
        "student queries rather than anticipating the student's needs.",
        "<b>Productivity and Study-Planning Apps:</b> Tools such as Notion, Todoist, "
        "Forest, and similar productivity applications help students manage time and "
        "focus but lack educational intelligence — they do not understand what the "
        "student is learning or how well.",
    ])
    story.append(spacer(4))
    story.append(p(
        "EduNeuro's differentiation lies in the system-level integration of these "
        "capabilities around a longitudinal learner model, rather than optimising any "
        "single activity in isolation."
    ))

    # ── 11. COMPETITIVE ADVANTAGE ──
    story += section("11. Competitive Advantage")
    story += bullets([
        "<b>System-Level Architecture:</b> EduNeuro is designed from the ground up as an "
        "integrated system rather than a collection of disconnected tools. The learner "
        "state model acts as the connective tissue across all capabilities.",
        "<b>Longitudinal Learner Intelligence:</b> As the platform accumulates data about "
        "each learner over time, its recommendations become increasingly personalised and "
        "accurate. This flywheel effect is the intended long-term defensibility mechanism.",
        "<b>Exam-First Focus:</b> By concentrating deeply on a single examination (GATE) "
        "before expanding, EduNeuro can develop domain-specific learning intelligence "
        "that generalist tools cannot replicate.",
        "<b>AI-Native from Inception:</b> Unlike legacy platforms adding AI as an "
        "afterthought, EduNeuro's entire architecture is designed around AI-driven "
        "orchestration rather than passive content delivery.",
        "<b>Lean Development Approach:</b> The team's research orientation enables "
        "rapid experimentation with learning science models and AI techniques, "
        "potentially leading to faster iteration on the core intellectual challenge.",
    ])
    story.append(spacer(4))
    story.append(Paragraph(
        "Note: The longitudinal data flywheel and resulting defensibility are described as "
        "the intended architectural outcome. This data moat does not yet exist at "
        "significant scale and is contingent on sustained product adoption.",
        NOTE
    ))

    # ── 12. MARKET ENTRY STRATEGY ──
    story += section("12. Market Entry Strategy")
    story.append(p(
        "EduNeuro's market entry strategy is based on a wedge-and-expand model, "
        "beginning with deep penetration in a single examination segment before "
        "diversifying."
    ))
    story.append(subsection("Phase 1: GATE Wedge (Current — Months 1–12)"))
    story += bullets([
        "Establish product-market fit with GATE aspirants through open beta.",
        "Build a focused content and learner model for the GATE syllabus across "
        "major branches (CS, EC, EE, ME, CE, IN).",
        "Develop community presence through organic content and student engagement.",
        "Validate monetisation signals through freemium offering.",
    ])
    story.append(subsection("Phase 2: GATE Deepening (Months 12–24)"))
    story += bullets([
        "Expand feature depth within GATE: advanced analytics, cohort comparisons, "
        "mentor integration.",
        "Strengthen the longitudinal learner model with extended usage data.",
        "Transition from open beta to a structured paid tier.",
    ])
    story.append(subsection("Phase 3: Controlled Expansion (Month 24+)"))
    story += bullets([
        "Evaluate expansion to JEE Main and JEE Advanced based on validated GATE model.",
        "Subsequent expansion to NEET, UPSC CSE, and CAT contingent on "
        "examination-specific validation.",
        "University-level and general learning use cases as the longest-term horizon.",
    ])

    # ── 13. BUSINESS MODEL ──
    story += section("13. Business Model")
    story.append(p(
        "EduNeuro's business model is designed around a software/platform approach. "
        "The planned monetisation structure is as follows:"
    ))
    story += bullets([
        "<b>Freemium Tier:</b> A free tier providing core study planning, basic practice, "
        "and limited AI support. This tier is intended to drive acquisition and allow "
        "students to experience the platform's value.",
        "<b>Subscription Tier:</b> A paid subscription providing full access to advanced "
        "AI tutoring, comprehensive analytics, personalised recommendations, focus tools, "
        "and priority support. Pricing will be validated during the beta phase and "
        "positioned to be accessible to the target student demographic.",
    ])
    story.append(spacer(4))
    story.append(p(
        "Current monetisation status: EduNeuro has zero paying users at the time of "
        "this submission. The platform is in open beta and monetisation features have "
        "not yet been activated."
    ))
    story.append(spacer(4))
    story.append(p(
        "Alternative or supplementary revenue streams may be explored in the future, "
        "including institutional partnerships with coaching organisations, B2B offerings "
        "for educational institutions, and curated content licensing. These are not part "
        "of the current plan."
    ))

    # ── 14. MARKETING AND USER ACQUISITION ──
    story += section("14. Marketing and User Acquisition")
    story.append(p(
        "EduNeuro's user acquisition strategy centres on content-driven organic growth, "
        "community building, and targeted outreach within the GATE aspirant ecosystem."
    ))
    story += bullets([
        "<b>Content Marketing:</b> Publishing educational content — study strategies, "
        "syllabus analysis, preparation tips — on platforms where GATE aspirants are "
        "active. Early organic content reach has demonstrated the viability of this channel.",
        "<b>Student Community Engagement:</b> Building trust within GATE preparation "
        "communities through genuine value contribution rather than promotional activity.",
        "<b>Platform Virality:</b> Designing for organic sharing — study plans, "
        "performance summaries, achievement milestones — that naturally expose the "
        "platform to new users.",
        "<b>Institutional Outreach:</b> In later stages, engaging with coaching "
        "institutions, engineering colleges, and student bodies for structured adoption.",
    ])
    story.append(spacer(4))
    story.append(p(
        "Paid advertising is not part of the current strategy and will be evaluated "
        "only after organic channels are validated."
    ))

    # ── 15. CURRENT VALIDATION AND TRACTION ──
    story += section("15. Current Validation and Traction")
    story.append(p(
        "EduNeuro is in an early open-beta stage. The following signals represent "
        "early-stage validation. They should be interpreted as directional indicators "
        "rather than evidence of product-market fit."
    ))
    story.append(spacer(4))

    traction_data = [
        ["Metric", "Figure", "Period / Notes"],
        ["Website Visitors", "505", "Cumulative, early beta period"],
        ["Page Views", "3,093", "Cumulative, early beta period"],
        ["Platform Responses", "126", "Cumulative, early beta period"],
        ["Organic Content Reach", "200,000+", "Social media content impressions"],
        ["Organic Content Views", "150,000+", "Content engagement views"],
        ["User Sign-ups", "500+", "Expressions of interest / waitlist"],
        ["Daily Active Users", "50+", "Current DAU (recent measurement)"],
        ["Peak Daily Users", "~400", "Observed at one point during early launch"],
        ["Website Views (6-day period)", "2,565 page views", "Specific 6-day observation period"],
        ["Website Views (8-day period)", "4,000+ views", "Specific 8-day observation period"],
        ["Instagram Content Views", "2.6 lakh+", "Organic content impressions on Instagram"],
    ]
    tt = Table(traction_data, colWidths=[70, 65, 110])
    tt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(tt)
    story.append(spacer(4))
    story.append(Paragraph(
        "Important: These figures come from different measurement periods and definitions "
        "and should not be combined into a single traction metric. They represent early "
        "validation signals from the open beta phase. EduNeuro has not claimed "
        "product-market fit and has zero paying users.",
        NOTE
    ))
    story.append(spacer(4))
    story.append(p(
        "User research has been conducted through surveys administered alongside content "
        "distribution, providing qualitative insights into user needs and pain points."
    ))

    # ── 16. PRODUCT DEVELOPMENT ROADMAP ──
    story += section("16. Product Development Roadmap")
    roadmap_data = [
        ["Phase", "Timeline", "Key Deliverables"],
        ["Beta Foundation", "Months 1–3", "Core GATE syllabus mapping, basic study planner, "
         "AI tutoring MVP, learner model foundations"],
        ["Beta Expansion", "Months 4–6", "Practice engine, assessment module, progress analytics, "
         "focus tools, user research iteration"],
        ["Beta Maturation", "Months 7–9", "Personalised recommendations, longitudinal learner model, "
         "freemium infrastructure, retention optimisation"],
        ["Launch Readiness", "Months 10–12", "Full feature suite, paid tier activation, "
         "community features, institutional outreach preparation"],
        ["Scale Preparation", "Months 12–18", "Advanced analytics, cohort features, "
         "infrastructure scaling, multi-branch GATE support"],
    ]
    rt = Table(roadmap_data, colWidths=[50, 50, 155])
    rt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(rt)
    story.append(spacer(4))
    story.append(Paragraph(
        "Note: Timelines are indicative and will be refined based on incubation feedback, "
        "user research, and development progress.",
        NOTE
    ))

    # ── 17. OPERATIONS ──
    story += section("17. Operations")
    story.append(p(
        "EduNeuro's operations are structured around a lean, founder-led model at the "
        "current stage."
    ))
    story += bullets([
        "<b>Development:</b> The platform is being developed using modern web technologies "
        "with AI components integrated through API-based and custom model approaches. "
        "Development is ongoing with iterative releases.",
        "<b>Hosting and Infrastructure:</b> Cloud-based hosting with plans to scale "
        "infrastructure as user base grows. Performance and reliability are priority "
        "considerations for the user experience.",
        "<b>Content Development:</b> GATE syllabus content, question sets, and "
        "study materials are being curated and developed as part of product development. "
        "Content quality assurance processes are being established.",
        "<b>User Support:</b> Currently handled directly by the founder. Structured "
        "support channels will be established as the user base grows.",
        "<b>Team:</b> The current team consists of the founder as the primary operator. "
        "Planned expansion includes technical co-founder/CTO-level capability, "
        "content development resources, and community management.",
    ])

    # ── 18. RISK ANALYSIS AND MITIGATION ──
    story += section("18. Risk Analysis and Mitigation")
    risks = [
        ["Risk", "Impact", "Likelihood", "Mitigation"],
        ["No Product-Market Fit",
         "High",
         "Medium",
         "Continuous user research, rapid iteration, beta user engagement"],
        ["AI Content Quality",
         "High",
         "Medium",
         "Content validation pipelines, human review, evaluation frameworks"],
        ["Long Development Cycle",
         "Medium",
         "Medium",
         "MVP-first approach, phased feature releases"],
        ["Competitive Pressure",
         "Medium",
         "High",
         "Deep domain focus (GATE), system-level differentiation"],
        ["User Acquisition Cost",
         "Medium",
         "Medium",
         "Content-driven organic growth as primary channel"],
        ["Data Privacy Concerns",
         "High",
         "Medium",
         "Privacy-by-design architecture, transparent data policies"],
        ["Team Scaling",
         "Medium",
         "High",
         "Incubation network access, structured hiring plans"],
    ]
    rt2 = Table(risks, colWidths=[60, 30, 35, 120])
    rt2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ALIGN", (1, 0), (2, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(rt2)
    story.append(spacer(4))

    # ── 19. SOCIAL AND EDUCATIONAL IMPACT ──
    story += section("19. Social and Educational Impact")
    story += bullets([
        "Democratising access to AI-powered personalised learning for students who cannot "
        "afford expensive one-on-one coaching.",
        "Reducing the cognitive load on students by automating the meta-cognitive task "
        "of deciding what to study next — a task that currently consumes significant "
        "mental energy without adding to learning.",
        "Providing data-driven insights into learning patterns that can inform broader "
        "educational research on effective preparation strategies.",
        "Making quality preparation support accessible in Tier-2 and Tier-3 cities where "
        "premium coaching infrastructure is limited.",
        "Contributing to the body of knowledge on AI applications in education through "
        "responsible deployment and transparent evaluation of learning outcomes.",
    ])

    # ── 20. FINANCIAL STRATEGY ──
    story += section("20. Financial Strategy")
    story.append(p(
        "EduNeuro is currently in a pre-revenue, pre-funding stage. Financial management "
        "at this phase is focused on minimising burn while maximising product development "
        "velocity and validation speed."
    ))
    story += bullets([
        "<b>Current Expenditure:</b> Minimal, primarily covering cloud infrastructure, "
        "AI API costs, and essential development tools. Exact figures: [TO BE FILLED].",
        "<b>Revenue:</b> Zero. No monetisation features are currently active.",
        "<b>Funding:</b> No external funding has been raised to date.",
        "<b>Planned Financial Management:</b> Post-incubation, financial planning will "
        "focus on a disciplined 18–24 month runway, structured accounting from day one, "
        "and clear unit economics for the subscription model.",
        "<b>Projected Revenue:</b> [TO BE FILLED — detailed projections will be developed "
        "during incubation with mentor guidance].",
    ])

    # ── 21. INCUBATION AND FUNDING REQUIREMENTS ──
    story += section("21. Incubation and Funding Requirements")
    story.append(p(
        "EduNeuro is seeking incubation support from IIT Guwahati TIC to accelerate its "
        "development and increase the probability of successful product-market validation."
    ))
    story += bullets([
        "<b>Incubation Duration:</b> 12–18 months (preferred)",
        "<b>Incubation Space:</b> Co-working / dedicated workspace at IIT Guwahati TIC",
        "<b>Mentorship:</b> Access to mentors in AI/ML, educational technology, "
        "product management, and startup operations (detailed in the accompanying "
        "Mentorship Form)",
        "<b>Seed Funding:</b> [TO BE FILLED — amount to be determined in discussion "
        "with TIC, aligned with incubation programme terms]",
        "<b>Technical Resources:</b> Access to computing infrastructure, research "
        "collaboration opportunities, and potential student researcher engagement",
        "<b>Network Access:</b> Introduction to potential investors, industry partners, "
        "and the broader startup ecosystem",
        "<b>Funding Beyond Incubation:</b> Planning for a pre-seed/seed round of "
        "[TO BE FILLED] following incubation, contingent on achieving defined milestones",
    ])

    # ── 22. MILESTONES ──
    story += section("22. Milestones")
    milestones_data = [
        ["Milestone", "Target Timeline", "Status"],
        ["Open Beta Launch", "Completed", "Achieved"],
        ["500+ User Sign-ups", "Completed", "Achieved"],
        ["50+ DAU", "Completed", "Achieved"],
        ["Incubation Admission", "Target Q4 2026", "Planned"],
        ["Full Feature Beta", "Months 4–6", "Planned"],
        ["Paid Tier Activation", "Month 10–12", "Planned"],
        ["1,000 Paying Users", "Month 18", "Planned"],
        ["Pre-Seed Fundraise", "Month 12–15", "Planned"],
    ]
    mt2 = Table(milestones_data, colWidths=[80, 65, 65])
    mt2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(mt2)
    story.append(spacer(4))
    story.append(Paragraph(
        "Note: Future milestones are projections based on current trajectory and will "
        "be refined during incubation. Achieving them depends on product-market validation, "
        "team capacity, and incubation support.",
        NOTE
    ))

    # ── 23. CONCLUSION ──
    story += section("23. Conclusion")
    story.append(p(
        "EduNeuro represents a focused, technically ambitious attempt to address a "
        "genuinely underserved problem in the education technology landscape: the "
        "fragmentation of the student's learning journey and the resulting inability "
        "of any single tool to understand and guide the learner as an individual."
    ))
    story.append(spacer(4))
    story.append(p(
        "The venture is at an early but promising stage. The founder brings a research "
        "background in AI and a clear technical vision for the platform. Early traction "
        "signals — including website engagement, content reach, and user sign-ups — "
        "suggest that the core idea resonates with the target audience, though "
        "product-market fit has not been achieved and the platform has zero paying users."
    ))
    story.append(spacer(4))
    story.append(p(
        "The GATE market was selected deliberately as the proving ground: it offers a "
        "large, motivated, digitally literate user base with well-defined preparation "
        "needs and clear enough success metrics that learning outcome improvement can "
        "be measured credibly."
    ))
    story.append(spacer(4))
    story.append(p(
        "EduNeuro is seeking IIT Guwahati TIC's incubation support to access the "
        "mentorship, technical resources, ecosystem connections, and structured "
        "accountability that will maximise the venture's probability of success. "
        "The combination of the founder's technical orientation, the institution's "
        "educational mission, and TIC's startup support infrastructure creates a "
        "well-matched partnership opportunity."
    ))
    story.append(spacer(8))
    story.append(p(
        "We welcome the opportunity to discuss EduNeuro's development plan in greater "
        "detail and to explore how IIT Guwahati TIC can support this venture."
    ))
    story.append(spacer(30))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GREY, spaceAfter=10))
    story.append(two_col_table([
        (Paragraph("<b>Submitted by:</b>", BODY_LEFT), Paragraph("Sumanta, Founder, EduNeuro", BODY_LEFT)),
        (Paragraph("<b>Date:</b>", BODY_LEFT), Paragraph("September 2026", BODY_LEFT)),
        (Paragraph("<b>Contact:</b>", BODY_LEFT), Paragraph("[TO BE FILLED]", BODY_LEFT)),
    ]))
    story.append(PageBreak())

    return story


# ═══════════════════════════════════════════════════════════════════════════════
#  DOCUMENT 2: BUSINESS PLAN FOR START UP
# ═══════════════════════════════════════════════════════════════════════════════

def build_doc2():
    story = []

    # COVER PAGE
    story.append(spacer(60))
    story.append(Paragraph("BUSINESS PLAN", COVER_TITLE))
    story.append(spacer(4))
    story.append(Paragraph("FOR STARTUP", make_style("COVER_TITLE2", fontSize=22, leading=28,
                         fontName=BASE_FONT_BOLD, textColor=SECONDARY,
                         alignment=TA_CENTER, spaceAfter=16)))
    story.append(HRFlowable(width="60%", thickness=2, color=ACCENT,
                             hAlign="CENTER", spaceAfter=16))
    story.append(Paragraph("EduNeuro", COVER_SUB))
    story.append(spacer(4))
    story.append(Paragraph("AI-Native Study Orchestration and Learning Platform", COVER_TEXT))
    story.append(spacer(20))
    story.append(Paragraph("Submission to IIT Guwahati Technology Incubation Centre (TIC)", COVER_TEXT))
    story.append(spacer(30))
    meta_cover = [
        ["Founder:", "Sumanta"],
        ["Entity:", "EduNeuro"],
        ["Stage:", "Open Beta / Pre-Incubation"],
        ["Document Date:", "September 2026"],
        ["Classification:", "Confidential"],
    ]
    ct = Table(meta_cover, colWidths=[70, None])
    ct.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), BASE_FONT_BOLD),
        ("FONTNAME", (1, 0), (1, -1), BASE_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "LEFT"),
    ]))
    story.append(KeepTogether([ct]))
    story.append(spacer(20))
    story.append(Paragraph(
        "<i>This document is submitted in connection with EduNeuro's application for "
        "incubation support at IIT Guwahati Technology Incubation Centre. All information "
        "contained herein is confidential and intended solely for evaluating the venture.</i>",
        make_style("DISCLAIMER", fontSize=8, leading=12, textColor=GREY_TEXT,
                   alignment=TA_CENTER, spaceAfter=4)
    ))
    story.append(PageBreak())

    # ── 1. STARTUP OVERVIEW ──
    story += section("1. Startup Overview")
    story.append(p(
        "EduNeuro is an early-stage technology startup developing an AI-native study "
        "orchestration and learning platform. The venture was founded by Sumanta, a "
        "student researcher with a focus on Artificial Intelligence, with the objective "
        "of applying AI systems thinking to a systemic problem in education technology: "
        "the fragmentation of the student learning journey."
    ))
    story.append(spacer(4))
    story += bullets([
        "<b>Venture Name:</b> EduNeuro",
        "<b>Founder:</b> Sumanta",
        "<b>Founder Background:</b> Student researcher, Artificial Intelligence",
        "<b>Current Stage:</b> Open Beta / Pre-Incubation",
        "<b>Entity Status:</b> [TO BE FILLED]",
        "<b>Target Incubator:</b> IIT Guwahati Technology Incubation Centre (TIC)",
        "<b>Initial Market:</b> GATE examination preparation (Graduate Aptitude Test in Engineering)",
    ])
    story.append(spacer(4))
    story.append(p(
        "The venture is self-funded at the founder level with no external investment to date. "
        "Development has been carried out through the open beta phase to validate core "
        "assumptions and gather early user feedback."
    ))

    # ── 2. FOUNDER ──
    story += section("2. Founder")
    story.append(p(
        "Sumanta is a student researcher working in Artificial Intelligence. The "
        "founding perspective combines:"
    ))
    story += bullets([
        "Technical depth in AI systems and machine learning, providing the ability to "
        "evaluate and implement AI-driven product architectures.",
        "Direct experience with examination preparation, providing first-hand understanding "
        "of the problem space and the target user's needs.",
        "Research orientation, enabling rigorous experimentation with learning models, "
        "evaluation frameworks, and AI product design.",
    ])
    story.append(spacer(4))
    story.append(p(
        "The founder is the primary operator at this stage. Plans to strengthen the "
        "team — including technical co-founder capability, content development resources, "
        "and community management — are contingent on incubation admission and progress "
        "towards product-market validation."
    ))
    story.append(spacer(4))
    story.append(p(
        "The founder's academic and research background in AI is well-suited to the "
        "technical challenges EduNeuro faces: learner state modelling, recommendation "
        "systems, AI content quality evaluation, and responsible AI deployment in "
        "educational contexts."
    ))

    # ── 3. PROBLEM ──
    story += section("3. Problem")
    story.append(p(
        "A student preparing for a competitive examination such as GATE typically uses "
        "five or more separate digital tools: video platforms for concept learning, "
        "question banks for practice, a study planner, a productivity/focus app, and "
        "increasingly, an AI chatbot for doubt resolution."
    ))
    story.append(spacer(4))
    story.append(p(
        "These tools are optimised for individual activities, not for the student's "
        "entire learning process. They do not share information. They do not understand "
        "the student as an individual. And they leave the student to answer the most "
        "difficult questions alone:"
    ))
    story += bullets([
        "What should I study next?",
        "Which of my weak areas need the most attention?",
        "Am I actually improving, or just staying busy?",
        "How does my study behaviour affect my outcomes?",
        "When should I revise what I have already learned?",
        "Is my study plan working, or should I change it?",
    ])
    story.append(spacer(4))
    story.append(p(
        "These are not content problems. They are intelligence problems — the student "
        "needs a system that understands their complete learning state and can reason "
        "about their next best action."
    ))
    story.append(spacer(4))
    story.append(p(
        "This gap is particularly acute for competitive examination preparation because:"
    ))
    story += bullets([
        "The syllabus is large and the timeline is fixed, making prioritisation critical.",
        "Performance is measured precisely, creating demand for measurable improvement.",
        "The population is digitally fluent and receptive to AI-augmented tools.",
        "The investment (time and money) is significant, creating willingness to pay "
        "for tools that genuinely improve efficiency.",
    ])

    # ── 4. SOLUTION ──
    story += section("4. Solution")
    story.append(p(
        "EduNeuro proposes an AI-native study orchestration platform that unifies the "
        "student's fragmented toolchain around a continuous, longitudinal learner model."
    ))
    story.append(spacer(4))
    story.append(p(
        "The platform does not simply add AI to existing educational tools. It is "
        "designed from the ground up as an intelligent system that:"
    ))
    story += bullets([
        "Models the learner across multiple dimensions: knowledge state, topic mastery, "
        "performance history, study behaviour, focus quality, schedule adherence, and "
        "intervention effectiveness.",
        "Uses this model to determine the most valuable next learning action — whether "
        "that is learning a new concept, practising a weak area, revising spaced material, "
        "or adjusting the study plan.",
        "Improves its recommendations as it accumulates more data about the learner, "
        "creating a compounding personalisation effect.",
        "Connects every platform capability — learning, practice, planning, assessment, "
        "focus support — through the learner model, so the student experiences a "
        "coherent rather than fragmented system.",
    ])
    story.append(spacer(4))
    story.append(p(
        "This is fundamentally different from existing solutions. A question bank does "
        "not know your study schedule. A study planner does not know your mastery level. "
        "An AI chatbot does not know your forgetting curve. EduNeuro connects these "
        "capabilities through a shared learner intelligence layer."
    ))

    # ── 5. INNOVATION ──
    story += section("5. Innovation")
    story.append(p(
        "EduNeuro's innovation is architectural rather than incremental. It rests on "
        "three pillars:"
    ))
    story += bullets([
        "<b>Pillar 1 — The Longitudinal Learner Model:</b> Unlike tools that capture "
        "snapshot data (last test score, last topic studied), EduNeuro builds a "
        "persistent, evolving model of each learner. This model is the platform's "
        "intelligence backbone.",
        "<b>Pillar 2 — Proactive Orchestration:</b> Rather than waiting for the student "
        "to ask a question or request an action, the platform actively recommends the "
        "next best action based on the learner model. This shifts the relationship from "
        "reactive tool to proactive guide.",
        "<b>Pillar 3 — Compound Learning Intelligence:</b> The system is designed to "
        "become more useful over time. As it accumulates data about a learner's goals, "
        "behaviours, and outcomes, its recommendations become more personalised and "
        "accurate. This flywheel is the intended long-term defensibility mechanism.",
    ])
    story.append(spacer(4))
    story.append(p(
        "AI is not an add-on feature in EduNeuro. It is the organising principle of "
        "the entire product architecture. This is a meaningful distinction from "
        "competitors who are retrofitting AI capabilities onto legacy platform structures."
    ))

    # ── 6. PRODUCT ──
    story += section("6. Product")
    story.append(p(
        "EduNeuro is a web-based platform under active development. The current open "
        "beta includes core capabilities in development, with a phased rollout planned "
        "through the incubation period."
    ))
    story.append(subsection("Current Beta Capabilities (In Development)"))
    story += bullets([
        "AI-powered concept tutoring for GATE subjects",
        "Adaptive study planning based on exam timeline and syllabus",
        "Practice engine with curated question sets and difficulty adaptation",
        "Progress analytics with longitudinal tracking",
        "Assessment modules with topic-wise and full-length test simulation",
    ])
    story.append(subsection("Planned Capabilities (During Incubation)"))
    story += bullets([
        "Personalised next-action recommendations driven by the learner model",
        "Focus and session management tools",
        "Spaced repetition and revision scheduling",
        "Community and peer comparison features",
        "Freemium subscription infrastructure",
    ])
    story.append(spacer(4))
    story.append(p(
        "The platform is designed to evolve with the learner. Early-stage users provide "
        "the data that makes the system progressively more valuable — to themselves "
        "and to the platform's improving models."
    ))

    # ── 7. TARGET MARKET ──
    story += section("7. Target Market")
    story.append(p(
        "EduNeuro's addressable market spans competitive examination aspirants and "
        "self-directed learners in India. The market is large, digitally connected, "
        "and increasingly receptive to AI-augmented tools."
    ))
    story += bullets([
        "<b>Primary Segment:</b> GATE aspirants (~1M+ registered annually in India). "
        "High digital literacy, high preparation intensity, willingness to invest in "
        "tools that improve outcomes.",
        "<b>Secondary Segments (Future):</b> JEE, NEET, UPSC, CAT aspirants, and "
        "university students. These segments share the preparation-intensity profile "
        "of GATE aspirants but require examination-specific adaptation.",
    ])
    story.append(spacer(4))
    story.append(p(
        "EduNeuro's initial focus is exclusively on GATE. The platform's architecture "
        "is designed to generalise across examinations, but expansion into other segments "
        "will only occur after validated product-market fit in the initial wedge."
    ))

    # ── 8. INITIAL MARKET WEDGE ──
    story += section("8. Initial Market Wedge: GATE")
    story.append(p(
        "GATE was selected as the initial market wedge deliberately. The selection was "
        "based on the following reasoning:"
    ))
    story += bullets([
        "<b>Large and Defined Audience:</b> Over 1 million candidates register for "
        "GATE annually across multiple engineering disciplines, providing a substantial "
        "addressable population.",
        "<b>High Stakes:</b> GATE scores determine admission to premier M.Tech "
        "programmes, PSU recruitment, and research positions. The high stakes create "
        "strong motivation to adopt tools that genuinely improve preparation efficiency.",
        "<b>Structured Preparation Behaviour:</b> GATE preparation follows relatively "
        "well-defined patterns — syllabus-based learning, topic-wise practice, "
        "mock testing, revision cycles. This structure makes it possible to build "
        "effective learner models and recommendation logic.",
        "<b>Digital Fluency:</b> The target demographic — engineering graduates aged "
        "21–26 — is highly comfortable with digital tools and increasingly receptive "
        "to AI-augmented platforms.",
        "<b>Proving Ground for Generalisation:</b> Successfully solving the orchestration "
        "problem for GATE provides a repeatable template for expansion to JEE, NEET, "
        "UPSC, CAT, and beyond.",
        "<b>Competitive Positioning:</b> The GATE preparation tool market is served by "
        "established players but none has solved the orchestration thesis, leaving "
        "an opening for a system-level solution.",
    ])
    story.append(spacer(4))
    story.append(p(
        "GATE is not just a convenient starting point — it is a strategically chosen "
        "proving ground where EduNeuro can demonstrate the value of its approach before "
        "committing resources to broader market expansion."
    ))

    # ── 9. TECHNOLOGY ──
    story += section("9. Technology")
    story.append(p(
        "EduNeuro's technology stack is designed for scalability, AI integration, and "
        "responsible deployment. The architecture comprises:"
    ))
    story += bullets([
        "<b>Frontend:</b> Modern web framework providing responsive, accessible user "
        "interfaces across devices.",
        "<b>Backend:</b> Scalable service architecture handling user management, "
        "learner state persistence, content delivery, and AI service orchestration.",
        "<b>AI Layer:</b> Large language models for reasoning and content generation, "
        "complemented by custom algorithms for mastery tracking, spaced-repetition "
        "scheduling, and behavioural pattern analysis.",
        "<b>Data Layer:</b> Longitudinal learner data stored with privacy-by-design "
        "principles, enabling the compounding intelligence effect.",
        "<b>Infrastructure:</b> Cloud-hosted with auto-scaling capabilities to manage "
        "variable user loads.",
    ])
    story.append(spacer(4))
    story.append(p(
        "The AI components are being designed with responsible deployment in mind: "
        "content quality evaluation, learner data governance, transparency in "
        "recommendation logic, and mechanisms for learners to understand and influence "
        "the system's guidance."
    ))

    # ── 10. CURRENT STAGE ──
    story += section("10. Current Stage")
    story.append(p(
        "EduNeuro is in open beta. The following describes the current state of the venture:"
    ))
    stage_data = [
        ["Dimension", "Current State"],
        ["Product Status", "Open Beta — core features in active development"],
        ["Team Size", "1 (founder-led)"],
        ["Revenue", "None — zero paying users"],
        ["External Funding", "None raised to date"],
        ["User Base", "500+ sign-ups, 50+ DAU (recent measurement)"],
        ["Product-Market Fit", "Not claimed — early validation only"],
        ["Legal Entity", "[TO BE FILLED]"],
        ["Office Space", "Founder-operated remotely"],
    ]
    st = Table(stage_data, colWidths=[80, 175])
    st.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(st)
    story.append(spacer(4))
    story.append(p(
        "The venture is self-sustaining at minimal burn rate and has been developed "
        "through a lean, iterative approach. Incubation support would enable acceleration "
        "of development, structured mentorship, and fundraising preparation."
    ))

    # ── 11. VALIDATION / TRACTION ──
    story += section("11. Validation and Traction")
    story.append(p(
        "EduNeuro has gathered the following early-stage validation signals during the "
        "open beta period. These are directional indicators, not evidence of product-market fit."
    ))
    story.append(spacer(4))
    story.append(p("<b>Engagement Metrics:</b>"))
    story += bullets([
        "505 website visitors (cumulative, early beta period)",
        "3,093 page views (cumulative, early beta period)",
        "126 platform responses (cumulative, early beta period)",
        "Peak of approximately 400 daily users observed during early launch period",
        "2,565 page views and ~400 daily users recorded within a specific 6-day period",
        "3,000+ users and 4,000+ website views recorded within an 8-day period",
        "50+ current daily active users (recent measurement)",
    ])
    story.append(spacer(4))
    story.append(p("<b>Content and Acquisition Signals:</b>"))
    story += bullets([
        "200,000+ organic content reach (social media impressions)",
        "150,000+ organic content views (engagement views)",
        "500+ user sign-ups / expressions of interest",
        "2.6 lakh Instagram content views (organic)",
    ])
    story.append(spacer(4))
    story.append(p("<b>Research:</b>"))
    story.append(p(
        "User research has been conducted through surveys administered alongside "
        "content distribution, providing qualitative insights into user pain points, "
        "feature preferences, and willingness to pay."
    ))
    story.append(spacer(4))
    story.append(Paragraph(
        "Important: These figures come from different measurement periods and definitions. "
        "They should not be combined into a single traction number. EduNeuro has zero "
        "paying users and has not claimed product-market fit.",
        NOTE
    ))

    # ── 12. BUSINESS MODEL ──
    story += section("12. Business Model")
    story.append(p(
        "EduNeuro's business model is built on a software/platform approach with a "
        "freemium/subscription structure."
    ))
    story += bullets([
        "<b>Freemium Tier (Acquisition):</b> A free tier providing access to core "
        "study planning, basic practice, and limited AI support. This tier serves as "
        "the user acquisition channel and allows students to experience the platform's "
        "differentiation before committing to payment.",
        "<b>Premium Subscription (Revenue):</b> A paid subscription tier providing "
        "full access to advanced AI tutoring, comprehensive analytics, personalised "
        "recommendations, focus tools, and priority support. Pricing will be validated "
        "during the beta phase and positioned to be accessible to the target demographic "
        "(engineering students and young professionals in India).",
    ])
    story.append(spacer(4))
    story.append(p(
        "Current monetisation status: Zero paying users. Monetisation features are not "
        "yet active. Pricing strategy will be refined during incubation based on user "
        "research, competitive analysis, and mentor guidance."
    ))
    story.append(spacer(4))
    story.append(p(
        "Future monetisation opportunities may include institutional licensing to "
        "coaching organisations, B2B offerings for educational institutions, and "
        "curated content partnerships. These are not part of the current plan and "
        "will be evaluated after the primary subscription model is validated."
    ))

    # ── 13. COMPETITIVE ADVANTAGE ──
    story += section("13. Competitive Advantage")
    story.append(p(
        "EduNeuro's competitive advantage is rooted in its architectural differentiation "
        "rather than in feature parity with existing tools. The key advantage dimensions are:"
    ))
    story += bullets([
        "<b>System-Level Integration:</b> Competitors optimise individual activities. "
        "EduNeuro connects them through a shared learner model, creating a coherent "
        "experience rather than a collection of tools.",
        "<b>Longitudinal Intelligence:</b> The platform's value compounds over time as "
        "it accumulates learner data. This creates a flywheel that shallow integrations "
        "cannot replicate.",
        "<b>Exam-First Depth:</b> Deep focus on a single examination (GATE) enables "
        "domain-specific intelligence that generalist tools lack.",
        "<b>AI-Native Architecture:</b> Every component is designed around AI-driven "
        "reasoning rather than content delivery, making the platform structurally "
        "different from legacy education technology.",
        "<b>Research-Led Development:</b> The founder's research background enables "
        "rigorous experimentation with learning models, potentially yielding "
        "differentiation through methodological rather than merely product innovation.",
    ])
    story.append(spacer(4))
    story.append(p(
        "The intended long-term defensibility mechanism is the accumulation of "
        "longitudinal learner-state data and the resulting compounding intelligence "
        "effect. This is a planned outcome, not an existing advantage."
    ))

    # ── 14. GO-TO-MARKET STRATEGY ──
    story += section("14. Go-to-Market Strategy")
    story.append(p(
        "EduNeuro's go-to-market strategy prioritises organic, community-driven growth "
        "over paid acquisition, reflecting both the lean operational model and the "
        "nature of the target audience."
    ))
    story += bullets([
        "<b>Content-Driven Acquisition:</b> Publishing high-quality educational content — "
        "GATE preparation strategies, syllabus analysis, topic deep-dives — on platforms "
        "where aspirants are active. Early organic reach of 200,000+ validates this channel.",
        "<b>Community Trust Building:</b> Engaging authentically within GATE preparation "
        "communities (forums, social media groups, student networks) to build trust "
        "rather than relying on promotional messaging.",
        "<b>Product-Led Virality:</b> Designing sharing mechanisms — study plan exports, "
        "performance summaries, achievement milestones — that naturally expose the "
        "platform to new users.",
        "<b>Freemium Conversion:</b> Using the free tier as the primary conversion "
        "funnel, allowing students to experience the platform's value before upgrading.",
        "<b>Institutional Outreach (Phase 2):</b> Once product-market fit is demonstrated, "
        "engaging with coaching institutions, engineering colleges, and student bodies "
        "for structured adoption.",
    ])
    story.append(spacer(4))
    story.append(p(
        "Paid advertising is not part of the current go-to-market strategy and will "
        "only be evaluated after organic channels are validated at scale."
    ))

    # ── 15. DEVELOPMENT ROADMAP ──
    story += section("15. Development Roadmap")
    roadmap2 = [
        ["Phase", "Duration", "Focus", "Key Outcomes"],
        ["Beta Foundation", "Months 1–3",
         "Core platform, GATE syllabus, AI tutoring MVP",
         "Functional platform, 200+ beta users, initial learner model"],
        ["Beta Expansion", "Months 4–6",
         "Practice engine, assessment, analytics",
         "Complete learning loop, retention metrics, user research insights"],
        ["Beta Maturation", "Months 7–9",
         "Recommendations, focus tools, longitudinal model",
         "Personalisation engine, freemium infrastructure, retention improvement"],
        ["Launch Readiness", "Months 10–12",
         "Full feature suite, paid tier, community",
         "Paid tier activated, 1,000+ total users, monetisation validation"],
        ["Scale Preparation", "Months 12–18",
         "Infrastructure scaling, multi-branch support, expansion prep",
         "Multi-GATE-branch support, institutional outreach, pre-seed fundraising"],
    ]
    rt3 = Table(roadmap2, colWidths=[40, 40, 70, 105])
    rt3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(rt3)
    story.append(spacer(4))
    story.append(Paragraph(
        "Note: Roadmap timelines are indicative and will be refined during incubation "
        "based on progress, user feedback, and mentor input.",
        NOTE
    ))

    # ── 16. SCALABILITY ──
    story += section("16. Scalability")
    story.append(p(
        "EduNeuro's architecture is designed for scalability along three dimensions:"
    ))
    story += bullets([
        "<b>User Scalability:</b> Cloud-native infrastructure with auto-scaling "
        "capabilities to handle growing user loads without proportional infrastructure "
        "cost increases.",
        "<b>Content Scalability:</b> AI-assisted content generation and curation "
        "pipelines that can extend across GATE branches and, subsequently, across "
        "other examination syllabi without linear increases in human content effort.",
        "<b>Examination Scalability:</b> The learner model and orchestration engine "
        "are designed as general-purpose components. Expanding to a new examination "
        "primarily requires syllabus mapping and content curation — not rebuilding "
        "the core platform.",
    ])
    story.append(spacer(4))
    story.append(p(
        "The economics of the platform improve with scale. AI infrastructure costs "
        "grow sub-linearly with user volume due to caching, prompt optimisation, and "
        "model efficiency improvements. Content development costs are front-loaded "
        "and amortised across users. Subscription revenue is recurring."
    ))
    story.append(spacer(4))
    story.append(p(
        "Long-term scalability to millions of users across multiple examination segments "
        "is contingent on successful validation in the initial GATE wedge and subsequent "
        "staged expansion."
    ))

    # ── 17. SOCIAL AND ECONOMIC IMPACT ──
    story += section("17. Social and Economic Impact")
    story.append(p(
        "EduNeuro's mission aligns with broader educational equity and technology-for-good "
        "objectives:"
    ))
    story += bullets([
        "<b>Access to Personalised Learning:</b> AI-driven personalisation at EduNeuro's "
        "target price point can make quality learning guidance accessible to students "
        "who cannot afford expensive one-on-one coaching.",
        "<b>Geographic Reach:</b> As a web-based platform, EduNeuro is accessible from "
        "any location with internet connectivity, potentially reaching students in "
        "Tier-2 and Tier-3 cities where premium coaching infrastructure is limited.",
        "<b>Reducing Preparation Inequality:</b> By providing sophisticated learning "
        "intelligence at scale, EduNeuro can help level the playing field between "
        "students with access to premium coaching and those without.",
        "<b>Educational Research Contribution:</b> The longitudinal learner data "
        "collected by the platform — anonymised and aggregated — can contribute to "
        "research on effective learning strategies, spaced repetition, and AI-augmented "
        "education.",
        "<b>Economic Mobility:</b> Improved GATE preparation outcomes translate directly "
        "into better postgraduate education opportunities and employment outcomes, "
        "contributing to economic mobility for students from diverse backgrounds.",
    ])

    # ── 18. INCUBATION REQUIREMENTS ──
    story += section("18. Incubation Requirements")
    story.append(p(
        "EduNeuro is applying to IIT Guwahati TIC for structured incubation support. "
        "The specific requirements are:"
    ))
    story += bullets([
        "<b>Physical Workspace:</b> Dedicated co-working space at IIT Guwahati TIC "
        "for the incubation period (12–18 months preferred).",
        "<b>Mentorship Network:</b> Access to mentors in AI/ML, educational technology, "
        "product management, startup operations, and fundraising. Specific mentorship "
        "areas are detailed in the accompanying Mentorship Form.",
        "<b>Seed Funding:</b> [TO BE FILLED — to be discussed with TIC, aligned with "
        "incubation programme terms].",
        "<b>Technical Infrastructure:</b> Access to computing resources, potential "
        "collaboration with IIT Guwahati's research community, and opportunities for "
        "student researcher engagement.",
        "<b>Ecosystem Access:</b> Introduction to potential investors, industry partners, "
        "legal and accounting services, and the broader startup ecosystem in the Northeast "
        "and nationally.",
        "<b>Structured Programme:</b> Participation in TIC's incubation curriculum, "
        "including workshops, pitch sessions, and milestone-based accountability.",
        "<b>Credibility and Visibility:</b> Association with IIT Guwahati's brand to "
        "support customer trust, investor introductions, and partnership conversations.",
    ])

    # ── 19. FUNDING REQUIREMENTS ──
    story += section("19. Funding Requirements")
    story.append(p(
        "EduNeuro's funding requirements are structured in two phases: incubation "
        "funding and post-incubation fundraising."
    ))
    story.append(subsection("Incubation Phase Funding"))
    story += bullets([
        "Incubation grant from IIT Guwahati TIC: [TO BE FILLED]",
        "This funding will cover development costs, cloud infrastructure, AI API "
        "expenses, and essential operational costs for the 12–18 month incubation period.",
    ])
    story.append(subsection("Post-Incubation: Pre-Seed / Seed Round"))
    story += bullets([
        "Target raise: [TO BE FILLED]",
        "Target timing: Month 12–15, contingent on achieving defined incubation milestones",
        "Use of funds: Team expansion (technical, content, community), marketing "
        "acceleration, infrastructure scaling, and multi-examination expansion preparation",
        "Target investors: [TO BE FILLED — angel networks, micro-VCs, edtech-focused funds]",
    ])
    story.append(spacer(4))
    story.append(p(
        "Funding amounts will be refined during incubation with mentor and TIC guidance, "
        "based on validated unit economics and detailed financial projections."
    ))

    # ── 20. KEY MILESTONES ──
    story += section("20. Key Milestones")
    story.append(p(
        "The following milestones define EduNeuro's intended trajectory through the "
        "incubation period and beyond."
    ))
    milestones2 = [
        ["Milestone", "Timeline", "Significance"],
        ["Open Beta Launch", "Completed", "Platform available to early users"],
        ["500+ Sign-ups", "Completed", "Early demand validation"],
        ["50+ DAU", "Completed", "Ongoing user engagement"],
        ["Incubation Admission", "Q4 2026", "Institutional validation and support"],
        ["Complete Feature Beta", "Month 6", "Full learning loop functional"],
        ["1,000+ Registered Users", "Month 9", "Growing user base"],
        ["Freemium → Paid Transition", "Month 10–12", "Monetisation validation"],
        ["1,000 Paying Users", "Month 18", "Revenue traction"],
        ["Pre-Seed Fundraise", "Month 12–15", "Capital for scaling"],
    ]
    mt3 = Table(milestones2, colWidths=[70, 55, 130])
    mt3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(mt3)
    story.append(spacer(4))
    story.append(Paragraph(
        "Note: Future milestones are projections based on current trajectory and will "
        "be refined during incubation. Achievement depends on product-market validation, "
        "team capacity, and incubation support.",
        NOTE
    ))

    # ── 21. RISKS AND MITIGATION ──
    story += section("21. Risks and Mitigation")
    risks2 = [
        ["Risk", "Mitigation Strategy"],
        ["Failure to achieve product-market fit",
         "Continuous user research, rapid iteration, mentor-guided pivot readiness"],
        ["AI-generated content quality issues",
         "Content validation pipelines, human review processes, evaluation frameworks"],
        ["Prolonged development timeline",
         "MVP discipline, phased releases, incubation structure for accountability"],
        ["Increased competitive pressure",
         "Deep GATE-specific differentiation, system-level architecture, community trust"],
        ["User acquisition cost escalation",
         "Content-driven organic growth as primary channel; paid acquisition only after organic validation"],
        ["Data privacy and regulatory concerns",
         "Privacy-by-design architecture, transparent policies, compliance-first approach"],
        ["Founder bandwidth limitations",
         "Team expansion plan, task prioritisation, incubation access to talent network"],
    ]
    rt4 = Table(risks2, colWidths=[85, 170])
    rt4.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("FONTNAME", (0, 1), (0, -1), BASE_FONT_BOLD),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(rt4)

    # ── 22. FUTURE EXPANSION ──
    story += section("22. Future Expansion")
    story.append(p(
        "EduNeuro's long-term vision extends well beyond the GATE wedge. The platform's "
        "architecture is designed for eventual expansion across multiple examinations "
        "and learning contexts."
    ))
    story.append(subsection("Phase 2: JEE and NEET (Year 2–3)"))
    story.append(p(
        "Following validated success in GATE, the platform would expand to JEE Main/"
        "Advanced and NEET preparation. These examinations share the "
        "high-stakes, structured-preparation profile of GATE and represent adjacent "
        "markets with significant overlap in the target demographic."
    ))
    story.append(subsection("Phase 3: UPSC, CAT, and Broader Competitive Examinations (Year 3–4)"))
    story.append(p(
        "Expansion to UPSC CSE, CAT/XAT, and other competitive examinations. Each "
        "requires examination-specific adaptation but can leverage the core orchestration "
        "technology and learner model architecture."
    ))
    story.append(subsection("Phase 4: University and Lifelong Learning (Year 4+)"))
    story.append(p(
        "The broadest horizon involves generalising the platform for university students "
        "and lifelong learners. This requires rethinking the syllabus-bound preparation "
        "model for open-ended learning goals but leverages the same learner intelligence "
        "principles."
    ))
    story.append(spacer(4))
    story.append(p(
        "Each expansion phase is contingent on successful validation in the preceding "
        "phase. EduNeuro will not pursue broad expansion before establishing a solid "
        "foundation in its initial market."
    ))
    story.append(spacer(30))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GREY, spaceAfter=10))
    story.append(two_col_table([
        (Paragraph("<b>Submitted by:</b>", BODY_LEFT), Paragraph("Sumanta, Founder, EduNeuro", BODY_LEFT)),
        (Paragraph("<b>Date:</b>", BODY_LEFT), Paragraph("September 2026", BODY_LEFT)),
        (Paragraph("<b>Contact:</b>", BODY_LEFT), Paragraph("[TO BE FILLED]", BODY_LEFT)),
    ]))
    story.append(PageBreak())

    return story


# ═══════════════════════════════════════════════════════════════════════════════
#  DOCUMENT 3: MENTORSHIP FORM
# ═══════════════════════════════════════════════════════════════════════════════

def build_doc3():
    story = []

    # COVER
    story.append(spacer(60))
    story.append(Paragraph("MENTORSHIP", COVER_TITLE))
    story.append(spacer(4))
    story.append(Paragraph("REQUIREMENT FORM", make_style("COVER_TITLE2", fontSize=20, leading=26,
                         fontName=BASE_FONT_BOLD, textColor=SECONDARY,
                         alignment=TA_CENTER, spaceAfter=16)))
    story.append(HRFlowable(width="60%", thickness=2, color=ACCENT,
                             hAlign="CENTER", spaceAfter=16))
    story.append(Paragraph("EduNeuro", COVER_SUB))
    story.append(spacer(4))
    story.append(Paragraph("Submission to IIT Guwahati Technology Incubation Centre (TIC)", COVER_TEXT))
    story.append(spacer(30))
    meta_cover = [
        ["Founder:", "Sumanta"],
        ["Entity:", "EduNeuro"],
        ["Stage:", "Open Beta / Pre-Incubation"],
        ["Document Date:", "September 2026"],
        ["Classification:", "Confidential"],
    ]
    ct = Table(meta_cover, colWidths=[70, None])
    ct.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), BASE_FONT_BOLD),
        ("FONTNAME", (1, 0), (1, -1), BASE_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "LEFT"),
    ]))
    story.append(KeepTogether([ct]))
    story.append(spacer(20))
    story.append(Paragraph(
        "<i>This document details the specific mentorship areas and support required by "
        "EduNeuro during its incubation period at IIT Guwahati Technology Incubation Centre. "
        "All information is confidential.</i>",
        make_style("DISCLAIMER", fontSize=8, leading=12, textColor=GREY_TEXT,
                   alignment=TA_CENTER, spaceAfter=4)
    ))
    story.append(PageBreak())

    # ── 1. STARTUP NAME ──
    story += section("1. Startup Name")
    story.append(p("<b>EduNeuro</b> — AI-Native Study Orchestration and Learning Platform"))

    # ── 2. FOUNDER ──
    story += section("2. Founder")
    story += bullets([
        "<b>Name:</b> Sumanta",
        "<b>Background:</b> Student researcher working in Artificial Intelligence",
        "<b>Role:</b> Founder and primary operator",
        "<b>Contact:</b> [TO BE FILLED]",
    ])

    # ── 3. STARTUP STAGE ──
    story += section("3. Startup Stage")
    story.append(p(
        "<b>Open Beta / Pre-Incubation.</b> EduNeuro is currently operating in an open "
        "beta phase. The core platform is under active development. Early user validation "
        "signals are encouraging but product-market fit has not been achieved. The "
        "venture has not received external funding, has zero paying users, and is "
        "self-funded at the founder level."
    ))

    # ── 4. BRIEF DESCRIPTION ──
    story += section("4. Brief Description")
    story.append(p(
        "EduNeuro is developing an AI-native study orchestration platform for competitive "
        "examination preparation. The platform's core thesis is that students need not "
        "more educational content, but an intelligent system that continuously understands "
        "their learning state — their knowledge, gaps, behaviour, and progress — and "
        "recommends the most valuable next learning action. The initial market wedge is "
        "GATE (Graduate Aptitude Test in Engineering) preparation in India. The platform "
        "is designed to generalise across examinations and learning contexts once the "
        "core orchestration technology is validated."
    ))

    # ── 5. PROBLEM ──
    story += section("5. Problem Being Addressed")
    story.append(p(
        "Students preparing for competitive examinations use multiple disconnected tools "
        "for different aspects of their preparation. These tools are optimised for "
        "individual activities rather than the student's entire learning process. The "
        "result is that students know what they studied but cannot confidently answer:"
    ))
    story += bullets([
        "What should I study next?",
        "Which weak areas need targeted attention?",
        "Am I actually improving?",
        "How does my study behaviour affect outcomes?",
        "When should I revise?",
        "Is my study plan working?",
    ])
    story.append(spacer(4))
    story.append(p(
        "EduNeuro addresses this by building a unified, AI-driven system that models "
        "the learner continuously and orchestrates the complete preparation journey."
    ))

    # ── 6. PROPOSED SOLUTION ──
    story += section("6. Proposed Solution")
    story.append(p(
        "An AI-native study orchestration platform that integrates learning support, "
        "study planning, practice, assessment, focus management, and progress tracking "
        "around a longitudinal learner model. The platform uses AI to reason about the "
        "learner's current state and recommend the next best action, with the system "
        "becoming more personalised and effective over time as it accumulates learner data."
    ))

    # ── 7. CURRENT PROGRESS ──
    story += section("7. Current Progress")
    story.append(p("<b>Product Development:</b>"))
    story += bullets([
        "Open beta platform with core capabilities in active development",
        "GATE syllabus mapping in progress across major branches",
        "AI tutoring, study planning, practice engine, and analytics modules under development",
    ])
    story.append(p("<b>User Validation:</b>"))
    story += bullets([
        "500+ sign-ups / expressions of interest",
        "50+ current DAU (recent measurement)",
        "Peak of ~400 daily users observed during early launch period",
        "505 website visitors, 3,093 page views (cumulative, early beta)",
        "200,000+ organic content reach; 150,000+ organic content views",
        "2.6 lakh+ Instagram content views (organic)",
        "User research conducted via survey instruments",
    ])
    story.append(p("<b>Operational:</b>"))
    story += bullets([
        "Self-funded at founder level",
        "Zero paying users; no external funding raised",
        "Founder-led development with lean operational model",
    ])

    # ── 8. KEY CHALLENGES ──
    story += section("8. Key Challenges")
    story += bullets([
        "<b>Product-Market Fit Validation:</b> Moving from early traction signals to "
        "demonstrable product-market fit requires focused user research, rapid iteration, "
        "and structured experimentation.",
        "<b>AI Content Quality:</b> Ensuring that AI-generated educational content is "
        "accurate, pedagogically sound, and aligned with examination requirements is a "
        "critical challenge that requires robust evaluation frameworks.",
        "<b>Learner Model Design:</b> Designing a multi-dimensional learner state model "
        "that is both computationally tractable and genuinely useful requires expertise "
        "in learning science, AI systems, and educational product design.",
        "<b>Retention:</b> Keeping students engaged with the platform over the long "
        "preparation周期 (often 6–18 months) requires sustained value delivery and "
        "habit-forming product design.",
        "<b>Team Scaling:</b> The founder-led model is insufficient for scaling. "
        "Recruiting and integrating technical, content, and community talent is a priority.",
        "<b>Monetisation:</b> Pricing strategy and freemium conversion mechanics "
        "require careful validation with the target demographic.",
        "<b>Competitive Landscape:</b> Established players have significant brand "
        "recognition and content resources. EduNeuro must differentiate on system-level "
        "value rather than feature parity.",
        "<b>Responsible AI Deployment:</b> Deploying AI in an educational context "
        "requires careful attention to content accuracy, learner data privacy, "
        "transparency, and potential negative impacts on learning autonomy.",
    ])

    # ── 9–16. MENTORSHIP AREAS ──
    story += section("9. Mentorship Required (Overview)")
    story.append(p(
        "EduNeuro requires structured mentorship across six interconnected areas. "
        "Each area is detailed in the following sections."
    ))
    story += bullets([
        "Technical Mentorship (Section 10)",
        "Product Mentorship (Section 11)",
        "Business Mentorship (Section 12)",
        "Market / GTM Mentorship (Section 13)",
        "AI/ML Research Guidance (Section 14)",
        "Incubation and Ecosystem Support (Section 15)",
    ])

    # ── 10. TECHNICAL MENTORSHIP ──
    story += section("10. Technical Mentorship")
    story.append(p(
        "EduNeuro requires technical mentorship in the following specific areas:"
    ))
    story += bullets([
        "<b>Scalable AI Architecture:</b> Guidance on designing and deploying "
        "AI services that can scale from hundreds to tens of thousands of users while "
        "managing API costs, latency, and reliability.",
        "<b>Learner Modelling Systems:</b> Expertise in designing multi-dimensional "
        "learner state models, including knowledge tracing, mastery estimation, and "
        "behavioural pattern recognition.",
        "<b>Recommendation and Personalisation:</b> Guidance on building recommendation "
        "systems that can determine the optimal next learning action for each individual "
        "learner based on their state model.",
        "<b>AI-Generated Content Evaluation:</b> Frameworks and methodologies for "
        "evaluating the accuracy, pedagogical quality, and examination-relevance of "
        "AI-generated educational content.",
        "<b>Evaluation and Experimentation:</b> Designing rigorous A/B testing and "
        "experimentation frameworks to measure the platform's impact on learning outcomes.",
        "<b>Technical Scalability:</b> Guidance on infrastructure scaling, database "
        "design for longitudinal learner data, and performance optimisation.",
        "<b>Security and Data Governance:</b> Best practices for securing learner data, "
        "implementing privacy-preserving architectures, and ensuring compliance with "
        "data protection regulations.",
    ])

    # ── 11. PRODUCT MENTORSHIP ──
    story += section("11. Product Mentorship")
    story += bullets([
        "<b>GATE Use Case Definition:</b> Identifying the strongest, most differentiated "
        "use case within the GATE preparation market — the one feature or workflow that "
        "creates the most compelling reason for students to adopt the platform.",
        "<b>User Experience Design:</b> Guidance on designing intuitive, engaging "
        "workflows for complex study orchestration tasks. The product must simplify "
        "the student's life, not add another tool to manage.",
        "<b>Retention and Engagement:</b> Strategies for maintaining student engagement "
        "over long preparation cycles (6–18 months). Understanding habit formation, "
        "motivation design, and re-engagement mechanics.",
        "<b>Learning Outcome Measurement:</b> Defining and implementing metrics that "
        "credibly measure the platform's impact on learning effectiveness — not just "
        "engagement, but actual improvement in test performance and knowledge retention.",
        "<b>Feature Prioritisation:</b> Making disciplined decisions about which "
        "features to build first, based on user value, technical feasibility, and "
        "strategic importance.",
        "<b>User Research Design:</b> Structuring user research programmes that "
        "generate actionable insights about student needs, pain points, and feature "
        "preferences.",
    ])

    # ── 12. BUSINESS MENTORSHIP ──
    story += section("12. Business Mentorship")
    story += bullets([
        "<b>Monetisation Validation:</b> Designing and executing experiments to validate "
        "freemium pricing, willingness to pay, price sensitivity, and conversion "
        "mechanics among the target demographic.",
        "<b>Customer Segmentation:</b> Identifying distinct user segments within the "
        "GATE aspirant population and tailoring product positioning and features accordingly.",
        "<b>Business Model Refinement:</b> Evaluating and refining the subscription "
        "model, exploring potential B2B/institutional opportunities, and assessing "
        "alternative revenue streams.",
        "<b>Go-to-Market Strategy:</b> Developing a structured GTM plan that builds on "
        "the content-driven organic approach while identifying scalable acquisition channels.",
        "<b>Institutional Partnerships:</b> Guidance on approaching and structuring "
        "partnerships with coaching institutions, universities, and student bodies.",
        "<b>Startup Operations:</b> Advice on lean operations, financial management, "
        "accounting practices, and building operational infrastructure appropriate for "
        "the current stage.",
        "<b>Fundraising Readiness:</b> Preparing for pre-seed/seed fundraising — pitch "
        "development, investor targeting, financial modelling, and term sheet negotiation.",
        "<b>Legal and Compliance:</b> Guidance on entity formation, intellectual property "
        "strategy, terms of service, privacy policies, and regulatory compliance.",
    ])

    # ── 13. MARKET / GTM MENTORSHIP ──
    story += section("13. Market and GTM Mentorship")
    story += bullets([
        "<b>GATE Market Understanding:</b> Deep insights into the GATE preparation "
        "ecosystem — student demographics, coaching landscape, decision-making factors, "
        "and unmet needs.",
        "<b>Competitive Positioning:</b> Guidance on positioning EduNeuro against "
        "established players (Unacademy, BYJU'S, Gradeup, Testbook) and emerging AI "
        "tools, identifying the messaging that resonates with the target audience.",
        "<b>Customer Acquisition Strategy:</b> Advice on scaling the content-driven "
        "organic acquisition approach, identifying high-impact content formats and "
        "distribution channels.",
        "<b>Community Building:</b> Strategies for building and nurturing a community "
        "of GATE aspirants around the platform, creating organic advocacy and retention.",
        "<b>Geographic Targeting:</b> Insights into regional differences in GATE "
        "preparation behaviour and how to tailor the platform for different geographic "
        "segments of the Indian market.",
        "<b>Brand Development:</b> Guidance on building a credible, trusted brand "
        "in the education technology space — particularly important for a platform "
        "using AI in a context where accuracy and reliability are paramount.",
    ])

    # ── 14. AI/ML RESEARCH GUIDANCE ──
    story += section("14. AI/ML Research Guidance")
    story += bullets([
        "<b>Learning Science Integration:</b> Guidance on integrating evidence-based "
        "learning science principles — spaced repetition, retrieval practice, interleaving, "
        "metacognitive scaffolding — into the platform's AI architecture.",
        "<b>Adaptive Learning Models:</b> Research guidance on state-of-the-art adaptive "
        "learning algorithms, knowledge tracing methods (e.g., Bayesian Knowledge Tracing, "
        "Deep Knowledge Tracing), and their application to examination preparation.",
        "<b>Student Modelling:</b> Expertise in designing learner state models that "
        "capture knowledge, behaviour, and affective states, and using these models to "
        "drive personalisation.",
        "<b>Educational AI:</b> Guidance on the emerging research in AI for education, "
        "including large language model applications, AI tutoring systems, and "
        "learning analytics.",
        "<b>Experimentation and Evaluation:</b> Designing rigorous research studies to "
        "evaluate the platform's impact on learning outcomes, including control group "
        "design, statistical methods, and causal inference approaches.",
        "<b>Responsible AI:</b> Guidance on responsible deployment of AI in educational "
        "contexts, including content accuracy assurance, algorithmic transparency, "
        "bias detection, and learner autonomy preservation.",
        "<b>Content Generation Quality:</b> Research approaches to evaluating and "
        "improving the quality of AI-generated educational content, including factual "
        "accuracy, pedagogical soundness, and examination alignment.",
        "<b>Research Collaboration:</b> Opportunities for collaborative research with "
        "IIT Guwahati's faculty and research groups, potentially leading to publications, "
        "grant opportunities, and academic credibility.",
    ])

    # ── 15. INCUBATION AND ECOSYSTEM SUPPORT ──
    story += section("15. Incubation and Ecosystem Support")
    story += bullets([
        "<b>Mentor Matching:</b> Structured matching with mentors across technology, "
        "product, business, and research domains.",
        "<b>Peer Network:</b> Access to a community of fellow founders and startups at "
        "IIT Guwahati TIC, enabling peer learning, collaboration, and support.",
        "<b>Investor Access:</b> Structured introductions to angel investors, "
        "micro-VCs, and institutional investors relevant to edtech and AI startups.",
        "<b>Industry Connections:</b> Access to industry experts, potential customers, "
        "and strategic partners through IIT Guwahati's network.",
        "<b>Research Community:</b> Engagement with IIT Guwahati's research community, "
        "including potential collaborations with faculty and access to student researchers.",
        "<b>Talent Pipeline:</b> Access to IIT Guwahati students and alumni for "
        "internships, full-time roles, and co-founder-level partnerships.",
        "<b>Legal and Administrative:</b> Support with entity formation, IP management, "
        "compliance, and administrative requirements.",
        "<b>Infrastructure:</b> Co-working space, computing resources, and shared "
        "services that reduce operational overhead.",
        "<b>Programme Structure:</b> Access to TIC's structured incubation curriculum, "
        "including workshops, masterclasses, pitch sessions, and milestone reviews.",
        "<b>Credibility:</b> Association with IIT Guwahati's brand to support customer "
        "trust, investor confidence, and partnership negotiations.",
    ])

    # ── 16. EXPECTED OUTCOMES ──
    story += section("16. Expected Outcomes from Mentorship")
    story.append(p(
        "EduNeuro expects the following concrete outcomes from the incubation programme:"
    ))
    story += bullets([
        "<b>Product-Market Validation:</b> Clear evidence of product-market fit or a "
        "well-reasoned pivot decision within 6–9 months, supported by structured user "
        "research and quantitative engagement metrics.",
        "<b>Technical Maturity:</b> A production-ready platform with validated AI "
        "architecture, content quality assurance, and scalable infrastructure.",
        "<b>Monetisation Validation:</b> A validated pricing strategy and freemium "
        "conversion model with at least initial revenue traction (target: [TO BE FILLED] "
        "paying users within incubation period).",
        "<b>Team Formation:</b> A founding team expanded to include at minimum a "
        "technical co-lead and one dedicated content/resources role.",
        "<b>Fundraising Readiness:</b> A compelling pitch, financial model, and investor "
        "pipeline that enables a successful pre-seed/seed round following or during the "
        "latter phase of incubation.",
        "<b>Research Output:</b> At least one collaborative research output (paper, "
        "conference submission, or technical report) arising from the learner modelling "
        "and AI architecture work.",
        "<b>Community and Brand:</b> A recognised brand within the GATE preparation "
        "community and a growing, engaged user base (target: [TO BE FILLED] total users "
        "by end of incubation).",
        "<b>Expansion Readiness:</b> A documented, validated plan for expanding to JEE "
        "and NEET, with the technical and content architecture prepared for multi-examination "
        "support.",
    ])
    story.append(spacer(4))
    story.append(p(
        "These outcomes represent EduNeuro's best-effort projections based on current "
        "trajectory and will be refined in consultation with TIC mentors throughout "
        "the incubation period."
    ))
    story.append(spacer(30))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GREY, spaceAfter=10))
    story.append(two_col_table([
        (Paragraph("<b>Submitted by:</b>", BODY_LEFT), Paragraph("Sumanta, Founder, EduNeuro", BODY_LEFT)),
        (Paragraph("<b>Date:</b>", BODY_LEFT), Paragraph("September 2026", BODY_LEFT)),
        (Paragraph("<b>Contact:</b>", BODY_LEFT), Paragraph("[TO BE FILLED]", BODY_LEFT)),
    ]))
    story.append(PageBreak())

    return story


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN: Generate all three PDFs
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("Generating EduNeuro Business Documents...")
    print()

    print("[1/3] Generating Business Plan...")
    make_doc(
        "EduNeuro_Business_Plan.pdf",
        "Business Plan — EduNeuro",
        "Comprehensive Business Plan for IIT Guwahati TIC",
        [],
        build_doc1,
        extra_header="Comprehensive"
    )

    print("[2/3] Generating Business Plan for StartUp...")
    make_doc(
        "EduNeuro_Business_Plan_for_StartUp.pdf",
        "Business Plan for Startup — EduNeuro",
        "Startup-Focused Business Plan for IIT Guwahati TIC",
        [],
        build_doc2,
        extra_header="Startup-Focused"
    )

    print("[3/3] Generating Mentorship Form...")
    make_doc(
        "EduNeuro_Mentorship_Form.pdf",
        "Mentorship Requirement Form — EduNeuro",
        "Mentorship Form for IIT Guwahati TIC",
        [],
        build_doc3,
        extra_header="Mentorship"
    )

    print()
    print("All three PDF documents generated successfully.")
    print(f"Output directory: {OUTPUT_DIR}")
