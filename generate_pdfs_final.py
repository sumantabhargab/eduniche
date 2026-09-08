#!/usr/bin/env python3
"""
Final, submission-ready PDF generation for EduNeuro incubation application.
Three documents:
  1. EduNeuro_Business_Plan_FINAL.pdf
  2. EduNeuro_Business_Plan_for_StartUp_FINAL.pdf
  3. EduNeuro_Mentorship_Form_FINAL.pdf
"""
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.colors import HexColor

OUTPUT_DIR = r"C:\Users\Sumanta Bhargab\eduniche\eduniche"

# ── Colour Palette ──
PRIMARY    = HexColor("#1a3c5e")
SECONDARY  = HexColor("#2c6fad")
ACCENT     = HexColor("#c8a04e")
LIGHT_BG   = HexColor("#f4f6f9")
DARK_TEXT  = HexColor("#1a1a2e")
GREY_TEXT  = HexColor("#555555")
LIGHT_LINE = HexColor("#dde1e7")
WHITE      = HexColor("#ffffff")

PAGE_W, PAGE_H = A4
MARGIN_L = 20 * mm
MARGIN_R = 20 * mm
MARGIN_T = 26 * mm
MARGIN_B = 20 * mm
USABLE_W = PAGE_W - MARGIN_L - MARGIN_R

FONT      = "Helvetica"
FONT_B    = "Helvetica-Bold"
FONT_I    = "Helvetica-Oblique"

# ── Styles ──
_base = getSampleStyleSheet()

def S(name, parent="Normal", **kw):
    d = dict(fontName=FONT, fontSize=10, leading=15,
             textColor=DARK_TEXT, alignment=TA_JUSTIFY,
             spaceAfter=6, spaceBefore=2)
    d.update(kw)
    return ParagraphStyle(name, parent=_base[parent], **d)

H1       = S("H1", fontSize=17, leading=21, fontName=FONT_B, textColor=PRIMARY,
             alignment=TA_LEFT, spaceAfter=8, spaceBefore=14)
H2       = S("H2", fontSize=13, leading=17, fontName=FONT_B, textColor=PRIMARY,
             spaceAfter=6, spaceBefore=12)
H3       = S("H3", fontSize=11, leading=15, fontName=FONT_B, textColor=SECONDARY,
             spaceAfter=4, spaceBefore=8)
BODY     = S("BODY", fontSize=10, leading=15, alignment=TA_JUSTIFY,
             spaceAfter=7, spaceBefore=1)
BODY_L   = S("BODY_L", fontSize=10, leading=15, alignment=TA_LEFT,
             spaceAfter=5)
NOTE     = S("NOTE", fontSize=8.5, leading=13, fontName=FONT_I,
             textColor=GREY_TEXT, alignment=TA_JUSTIFY, spaceAfter=5)
CAPTION  = S("CAPTION", fontSize=8.5, leading=12, fontName=FONT_I,
             textColor=GREY_TEXT, spaceAfter=4)
COV_T    = S("COV_T", fontSize=24, leading=30, fontName=FONT_B,
             textColor=PRIMARY, alignment=TA_CENTER, spaceAfter=10)
COV_S    = S("COV_S", fontSize=14, leading=20, fontName=FONT_B,
             textColor=SECONDARY, alignment=TA_CENTER, spaceAfter=6)
COV_M    = S("COV_M", fontSize=11, leading=17, textColor=GREY_TEXT,
             alignment=TA_CENTER, spaceAfter=5)
BUL      = S("BUL", fontSize=9.5, leading=14, alignment=TA_LEFT,
             leftIndent=12, spaceAfter=4, bulletIndent=2)
BUL2     = S("BUL2", fontSize=9.5, leading=14, alignment=TA_LEFT,
             leftIndent=22, spaceAfter=3, bulletIndent=12)
META     = S("META", fontSize=8.5, leading=13, fontName=FONT_I,
             textColor=GREY_TEXT, spaceAfter=3)
TOC_E    = S("TOC_E", fontSize=10, leading=16, alignment=TA_LEFT, spaceAfter=2)
TOC_H    = S("TOC_H", fontSize=10, leading=16, fontName=FONT_B,
             textColor=SECONDARY, alignment=TA_LEFT, spaceAfter=1)

def p(text, style=BODY): return Paragraph(text, style)
def spacer(h=5): return Spacer(1, h)
def hr(): return HRFlowable(width="100%", thickness=0.5, color=ACCENT, spaceAfter=5, spaceBefore=3)
def sec(t): return [hr(), Paragraph(t, H2)]
def sub(t): return Paragraph(t, H3)
def bul(t, lv=1):
    ch = "\u2022" if lv == 1 else "\u2013"
    st = BUL if lv == 1 else BUL2
    return Paragraph(f"<b>{ch}</b>\u00a0\u00a0{t}", st)

def bul_list(items, lv=1):
    return [bul(i, lv) for i in items]

def _table_style(base_extra=None):
    base = [
        ("FONTNAME",  (0, 0), (-1, -1), FONT),
        ("FONTSIZE",  (0, 0), (-1, -1), 9),
        ("VALIGN",    (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("GRID",      (0, 0), (-1, -1), 0.4, LIGHT_LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]
    if base_extra:
        base.extend(base_extra)
    return TableStyle(base)

def header_row_style(header_row_idx=0):
    return [
        ("BACKGROUND", (header_row_idx, 0), (header_row_idx, -1), PRIMARY),
        ("TEXTCOLOR",  (header_row_idx, 0), (header_row_idx, -1), WHITE),
        ("FONTNAME",   (header_row_idx, 0), (header_row_idx, -1), FONT_B),
        ("FONTSIZE",   (header_row_idx, 0), (header_row_idx, -1), 9),
    ]

def bold_first_col():
    return [("FONTNAME", (0, 1), (0, -1), FONT_B)]

def make_table(data, col_widths, hdr_align="LEFT", data_align=None):
    t = Table(data, colWidths=col_widths, repeatRows=1)
    cmds = list(_table_style().getCommands())
    cmds.extend(header_row_style())
    cmds.extend(bold_first_col())
    if data_align:
        for col_idx, align in data_align.items():
            cmds.append(("ALIGN", (col_idx, 1), (col_idx, -1), align))
    else:
        cmds.append(("ALIGN", (0, 1), (0, -1), hdr_align))
    t.setStyle(TableStyle(cmds))
    return t


# ═══════════════════════════════════════════════════════════════════════════════
#  Header / Footer
# ═══════════════════════════════════════════════════════════════════════════════

def draw_header_footer(c, doc, doc_title):
    c.saveState()
    # Header
    c.setFont(FONT_B, 7.5)
    c.setFillColor(PRIMARY)
    c.drawString(MARGIN_L, PAGE_H - 13 * mm, "EduNeuro \u2014 Confidential Business Document")
    c.setFont(FONT, 7)
    c.setFillColor(GREY_TEXT)
    c.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 13 * mm, doc_title)
    c.setStrokeColor(ACCENT)
    c.setLineWidth(0.4)
    c.line(MARGIN_L, PAGE_H - 14.5 * mm, PAGE_W - MARGIN_R, PAGE_H - 14.5 * mm)
    # Footer
    c.setFont(FONT, 7)
    c.setFillColor(GREY_TEXT)
    c.drawString(MARGIN_L, 11 * mm, "EduNeuro")
    c.drawCentredString(PAGE_W / 2, 11 * mm, f"Page {doc.page}")
    c.drawRightString(PAGE_W - MARGIN_R, 11 * mm, "Confidential")
    c.setStrokeColor(LIGHT_LINE)
    c.setLineWidth(0.4)
    c.line(MARGIN_L, 15 * mm, PAGE_W - MARGIN_R, 15 * mm)
    c.restoreState()


# ═══════════════════════════════════════════════════════════════════════════════
#  Helper
# ═══════════════════════════════════════════════════════════════════════════════

def two_col_toc(left_text, right_text):
    t = Table([[Paragraph(f"<b>{left_text}</b>", BODY_L),
                Paragraph(right_text, BODY_L)]],
              colWidths=[30*mm, None])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return t


# ═══════════════════════════════════════════════════════════════════════════════
#  Cover page helper
# ═══════════════════════════════════════════════════════════════════════════════

def cover_page(title, sub, subtitle_line=""):
    s = []
    s.append(spacer(55))
    s.append(Paragraph(title, COV_T))
    s.append(spacer(4))
    if sub:
        s.append(Paragraph(sub, COV_S))
    s.append(spacer(6))
    s.append(HRFlowable(width="55%", thickness=1.8, color=ACCENT, hAlign="CENTER", spaceAfter=14))
    s.append(Paragraph("EduNeuro", COV_S))
    s.append(spacer(3))
    s.append(Paragraph("AI-Native Study Orchestration and Learning Platform", COV_M))
    if subtitle_line:
        s.append(spacer(4))
        s.append(Paragraph(subtitle_line, COV_M))
    s.append(spacer(28))
    meta = [
        ["Founder:", "Sumanta"],
        ["Entity:", "EduNeuro"],
        ["Stage:", "Open Beta / Pre-Incubation"],
        ["Document Date:", "September 2026"],
        ["Classification:", "Confidential"],
    ]
    ct = Table(meta, colWidths=[65 * mm, None])
    ct.setStyle(TableStyle([
        ("FONTNAME",  (0, 0), (0, -1), FONT_B),
        ("FONTNAME",  (1, 0), (1, -1), FONT),
        ("FONTSIZE",  (0, 0), (-1, -1), 10),
        ("VALIGN",    (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("TOPPADDING",   (0, 0), (-1, -1), 2),
        ("ALIGN",    (0, 0), (0, -1), "RIGHT"),
        ("ALIGN",    (1, 0), (1, -1), "LEFT"),
    ]))
    s.append(KeepTogether([ct]))
    s.append(spacer(22))
    s.append(Paragraph(
        "<i>This document is submitted in connection with EduNeuro's application for "
        "incubation support at IIT Guwahati Technology Incubation Centre. All information "
        "contained herein is confidential and intended solely for evaluating the venture.</i>",
        S("DISCL", fontSize=8, leading=12, textColor=GREY_TEXT, alignment=TA_CENTER, spaceAfter=4)
    ))
    s.append(PageBreak())
    return s


def submission_note():
    return [
        spacer(4),
        Paragraph(
            "<b>Note:</b> Figures marked with (+) come from different measurement periods and "
            "definitions and are presented as early validation signals only. They should "
            "not be combined into a single traction metric. EduNeuro has zero paying users "
            "and has not claimed product-market fit.",
            NOTE
        ),
    ]


# ═══════════════════════════════════════════════════════════════════════════════
#  Shared content blocks
# ═══════════════════════════════════════════════════════════════════════════════

def executive_summary_block():
    return [
        p("EduNeuro is developing an AI-native study orchestration platform designed "
          "to address a systemic gap in education technology: the fragmentation of a "
          "student's learning journey across disconnected tools that do not share a "
          "persistent understanding of the learner."),
        spacer(4),
        p("The platform's core thesis is that the fundamental problem for students is "
          "not a lack of educational content, but the absence of an intelligent system "
          "that continuously models each learner's state \u2014 their goals, knowledge, "
          "gaps, study behaviour, and progress \u2014 and uses this understanding to "
          "recommend the most valuable next learning action."),
        spacer(4),
        p("The initial market wedge is the Graduate Aptitude Test in Engineering (GATE), "
          "chosen as a proving ground where the target audience is large, preparation "
          "behaviours are well-structured, and the stakes create strong motivation to "
          "adopt tools that genuinely improve efficiency."),
        spacer(4),
        p("EduNeuro is currently in an open-beta phase. Early validation signals \u2014 "
          "website engagement, organic content reach, and user sign-ups \u2014 suggest "
          "the core idea resonates with the target audience. The platform has zero paying "
          "users, no external funding has been raised, and product-market fit has not "
          "been claimed. Monetisation is planned through a freemium/subscription model, "
          "with pricing to be validated during the beta phase."),
        spacer(4),
        p("EduNeuro is applying to IIT Guwahati TIC for incubation support to access "
          "mentorship, refine product-market strategy, engage with the research and "
          "startup ecosystem, and prepare for structured fundraising."),
    ]

def problem_block():
    return [
        p("Students preparing for competitive examinations and managing academic learning "
          "routinely operate across five or more disconnected digital tools: video platforms "
          "for concept learning, question banks for practice, study planners, "
          "productivity and focus apps, and general-purpose AI assistants. None of these "
          "tools share information about the student."),
        spacer(4),
        p("The consequence is a set of systemic problems:"),
        *bul_list([
            "The student knows what they studied but cannot confidently determine what "
            "they should study next based on their current mastery level.",
            "Weak areas deserving targeted attention are not automatically surfaced; "
            "the student must identify them manually.",
            "There is no reliable way to know whether study effort is translating into "
            "measurable improvement over time.",
            "The relationship between study behaviour and outcomes is invisible to the "
            "tools being used.",
            "Revision scheduling is typically manual or based on crude heuristics rather "
            "than the student's actual forgetting curve.",
            "The effectiveness of a study plan cannot be evaluated without manual "
            "tracking and analysis that most students do not perform.",
        ]),
        spacer(4),
        p("EduNeuro's thesis is that the problem is not merely a lack of educational "
          "content. It is the absence of an intelligent, longitudinal system that "
          "continuously models the student's learning state and orchestrates the next "
          "best action across the full preparation journey."),
    ]

def vision_block():
    return [
        sub("Vision"),
        p("To build an intelligent learning system that understands an individual learner's "
          "goals, knowledge state, behaviour, constraints, and progress, and continuously "
          "adapts the learning process around them. Over time, EduNeuro aims to become "
          "the foundational student intelligence layer that makes personalised, effective "
          "learning accessible at scale."),
        spacer(4),
        sub("Mission"),
        p("EduNeuro's mission is to create a unified, AI-native study orchestration "
          "platform that replaces the student's fragmented toolchain with a single system "
          "that learns from their behaviour and guides their preparation more effectively. "
          "The platform begins with the GATE examination as its initial validating wedge "
          "and will expand to other competitive examinations and broader learning contexts "
          "as the core technology matures."),
    ]

def differentiation_block():
    return [
        p("EduNeuro's intended differentiation is architectural rather than incremental. "
          "It rests on three pillars:"),
        spacer(4),
        *bul_list([
            "<b>Longitudinal Learner Model:</b> Unlike tools that capture snapshot data, "
            "EduNeuro builds a persistent, evolving model of each learner across dimensions "
            "including goal, syllabus coverage, topic mastery, performance history, study "
            "behaviour, focus quality, schedule adherence, and intervention effectiveness. "
            "This model is the platform's intelligence backbone.",
            "<b>Proactive Orchestration:</b> Rather than waiting for the student to request "
            "an action, the platform actively recommends the next best step based on the "
            "learner model. This shifts the relationship from reactive tool to proactive guide.",
            "<b>Compound Learning Intelligence:</b> The system is designed to become more "
            "useful over time. As it accumulates data about a learner's behaviours and "
            "outcomes, its recommendations become more personalised and accurate. This "
            "flywheel effect is the intended long-term defensibility mechanism.",
        ]),
        spacer(4),
        p("The intended long-term defensibility mechanism is the accumulation of "
          "longitudinal learner-state data. This data moat does not yet exist at "
          "significant scale and is contingent on sustained product adoption."),
    ]


# ═══════════════════════════════════════════════════════════════════════════════
#  DOCUMENT 1
# ═══════════════════════════════════════════════════════════════════════════════

def build_doc1():
    s = []
    s += cover_page("BUSINESS PLAN", "EduNeuro",
                    "Submission to IIT Guwahati Technology Incubation Centre (TIC)")

    # Table of Contents
    s.append(Paragraph("Table of Contents", H1))
    s.append(hr())
    s.append(spacer(6))
    toc = [
        ("1.", "Executive Summary"), ("2.", "Company Overview"),
        ("3.", "Vision and Mission"), ("4.", "Problem Statement"),
        ("5.", "Market Opportunity"), ("6.", "Target Customers"),
        ("7.", "Proposed Solution"), ("8.", "Product Description"),
        ("9.", "Technology and AI Architecture"), ("10.", "Competitive Landscape"),
        ("11.", "Competitive Advantage"), ("12.", "Market Entry Strategy"),
        ("13.", "Business Model"), ("14.", "Marketing and User Acquisition"),
        ("15.", "Current Validation and Traction"), ("16.", "Product Development Roadmap"),
        ("17.", "Operations"), ("18.", "Risk Analysis and Mitigation"),
        ("19.", "Social and Educational Impact"), ("20.", "Financial Strategy"),
        ("21.", "Incubation and Funding Requirements"), ("22.", "Milestones"),
        ("23.", "Conclusion"),
    ]
    for num, ttl in toc:
        s.append(two_col_toc(num, ttl))
    s.append(PageBreak())

    # 1
    s += sec("1. Executive Summary")
    s += executive_summary_block()

    # 2
    s += sec("2. Company Overview")
    s.append(p(
        "<b>Entity:</b> EduNeuro<br/>"
        "<b>Founder:</b> Sumanta<br/>"
        "<b>Founder Background:</b> Student researcher with a focus on Artificial "
        "Intelligence. The founding team currently consists of the founder as the "
        "primary operator. No external team members have been formally onboarded.<br/>"
        "<b>Current Stage:</b> Open Beta / Pre-Incubation"
    ))
    s.append(spacer(4))
    s.append(p("EduNeuro was founded with the objective of applying AI-driven systems "
               "thinking to a genuinely unmet problem in education technology: the "
               "fragmentation of the student's learning journey across disconnected tools, "
               "and the resulting inability of any single system to understand the learner "
               "well enough to provide genuinely personalised guidance."))

    # 3
    s += sec("3. Vision and Mission")
    s += vision_block()

    # 4
    s += sec("4. Problem Statement")
    s += problem_block()

    # 5 — Market Opportunity
    s += sec("5. Market Opportunity")
    s.append(p("The addressable opportunity for EduNeuro spans multiple interconnected "
               "segments of the education technology market in India, each characterised "
               "by large student populations, competitive selection pressure, and growing "
               "willingness to invest in preparation tools. "
               "<b>EduNeuro's initial focus is exclusively on the GATE segment.</b> "
               "The other segments listed below represent longer-term expansion "
               "opportunities contingent on successful validation in the initial wedge."))
    s.append(spacer(6))
    market_data = [
        ["Segment", "Description", "Registrations (India, approx.)"],
        ["GATE", "Graduate Aptitude Test in Engineering\n\u2014 initial wedge", "1M+ annually"],
        ["JEE Main /\nAdvanced", "Undergraduate engineering\nentrance examinations", "1M+ annually"],
        ["NEET", "Medical entrance examination", "2M+ annually"],
        ["UPSC CSE", "Civil Services Examination", "1M+ annually"],
        ["CAT / XAT", "MBA entrance examinations", "300,000+ annually"],
        ["University\nStudents", "Self-directed learners across\ndisciplines", "40M+ in higher ed."],
        ["Co-Curricular /\nExtracurricular", "Music, fitness, skill development,\nand structured self-improvement", "Large addressable\nbut undefined"],
    ]
    s.append(make_table(market_data, [28*mm, 62*mm, 45*mm]))
    s.append(spacer(4))
    s.append(Paragraph(
        "Registration figures are publicly available contextual estimates only. "
        "EduNeuro does not claim to serve any segment beyond GATE at this stage.",
        NOTE
    ))

    # 6
    s += sec("6. Target Customers")
    s.append(p("The primary target customer is the GATE aspirant in India \u2014 typically "
               "a final-year undergraduate or working professional aged 21\u201326 with "
               "1\u20132 years of preparation experience."))
    s.append(spacer(4))
    s.append(p("<b>Profile:</b>"))
    s += bul_list([
        "Demographics: Engineering graduates, predominantly male, aged 21\u201326.",
        "Behaviour: Self-directed learners who supplement coaching with digital tools. "
        "High digital fluency. Increasingly comfortable with AI-augmented platforms.",
        "Pain points: Aware that their current toolchain is fragmented but uncertain "
        "how to optimise it. Frequently struggle with prioritisation, revision, and focus.",
        "Motivation: GATE scores determine admission to premier M.Tech programmes, "
        "PSU recruitment, and research positions, creating strong willingness to adopt "
        "tools that genuinely improve preparation efficiency.",
    ])
    s.append(spacer(4))
    s.append(p("<b>Secondary segments (not currently targeted):</b> JEE, NEET, UPSC, "
               "CAT aspirants, university students, and co-curricular/extracurricular "
               "domains (music, fitness, skill development). These will be evaluated "
               "for entry only after validated product-market fit in GATE."))

    # 7
    s += sec("7. Proposed Solution")
    s.append(p("EduNeuro proposes a unified, AI-native study orchestration platform that "
               "continuously understands the learner and determines the most useful next "
               "action across the full preparation journey."))
    s.append(spacer(4))
    s.append(p("Rather than optimising individual activities (watching videos, solving "
               "questions, planning schedules), EduNeuro's approach treats the student's "
               "entire learning process as a connected system:"))
    s += bul_list([
        "Learning and tutoring support",
        "Study planning and scheduling",
        "Practice and assessment",
        "Adaptive evaluation",
        "Focus and productivity support",
        "Progress tracking and analytics",
        "Personalised recommendations",
    ])
    s.append(spacer(4))
    s.append(p("The system models the learner's state across multiple dimensions \u2014 "
               "goal, syllabus state, topic mastery, performance, study behaviour, focus, "
               "schedule adherence, and intervention effectiveness \u2014 and uses this "
               "model to generate contextually appropriate next actions. "
               "The architecture is designed to become more useful over time as it "
               "accumulates longitudinal learner data, creating a compounding "
               "personalisation effect."))

    # 8
    s += sec("8. Product Description")
    s.append(p("EduNeuro is a web-based platform currently in open beta. The table below "
               "distinguishes between what is available today and what is under development."))
    s.append(spacer(6))
    prod_data = [
        ["Capability Area", "Current Status", "Description"],
        ["AI Learning Support", "In development", "Concept explanation and tutoring assistance for GATE subjects"],
        ["Study Planning", "In development", "Adaptive schedule generation based on exam timeline and learner state"],
        ["Practice Engine", "In development", "Curated question practice with difficulty adaptation"],
        ["Assessment", "In development", "Topic-wise and full-length test simulation with analytics"],
        ["Progress Analytics", "In development", "Longitudinal tracking of mastery, velocity, and behaviour"],
        ["Focus Tools", "Planned", "Session-level focus tracking and distraction management"],
        ["Personalised\nRecommendations", "Planned", "AI-driven next-action suggestions based on learner model"],
        ["Community Features", "Planned", "Peer comparison and study group functionality"],
    ]
    s.append(make_table(prod_data, [38*mm, 32*mm, 85*mm]))
    s.append(spacer(4))
    s.append(Paragraph(
        "Status reflects the open-beta state as of September 2026. "
        "'In development' indicates active build progress. 'Planned' indicates features "
        "scheduled for the incubation period.",
        NOTE
    ))

    # 9
    s += sec("9. Technology and AI Architecture")
    s.append(p("EduNeuro's architecture is built around three foundational principles:"))
    s += bul_list([
        "<b>Learner State Modelling:</b> A persistent, multi-dimensional model of each "
        "learner's knowledge, behaviour, and progress that grows more accurate with use.",
        "<b>Orchestration Engine:</b> A decision system that uses the learner model to "
        "determine the most valuable next action \u2014 whether that is learning a concept, "
        "practising a topic, revising material, or adjusting the study plan.",
        "<b>Longitudinal Data Accumulation:</b> The architecture is designed to improve "
        "as more data about each learner is collected, creating a compounding "
        "personalisation effect.",
    ])
    s.append(spacer(6))
    s.append(p("The platform is built on a modern web technology stack. AI components "
               "leverage large language models for content generation and reasoning, "
               "supplemented by custom algorithms for mastery tracking, spaced-repetition "
               "scheduling, and behavioural analytics. The architecture is being designed "
               "to support reresponsible AI deployment, including content quality assurance "
               "and learner data governance."))
    s.append(spacer(4))
    s.append(p("Key technical considerations being addressed include: scalable AI inference, "
               "real-time learner state updates, evaluation of AI-generated educational "
               "content, privacy-preserving data handling, and the design of evaluation "
               "frameworks to measure learning-outcome improvement attributable to the platform."))

    # 10
    s += sec("10. Competitive Landscape")
    s.append(p("The competitive landscape can be understood across four broad categories. "
               "No single competitor currently addresses the full orchestration thesis "
               "EduNeuro is pursuing."))
    s += bul_list([
        "<b>Traditional Coaching Platforms:</b> Players such as Unacademy, BYJU'S, and "
        "others primarily deliver structured video courses and live classes. Their "
        "strength is content depth and brand recognition. They do not model individual "
        "learner state longitudinally or orchestrate personalised next actions.",
        "<b>Question Banks and Practice Platforms:</b> Tools such as Gradeup and Testbook "
        "focus on practice and assessment. They provide performance analytics but do not "
        "extend into study planning, focus support, or longitudinal learner modelling.",
        "<b>AI Tutors and Chatbots:</b> Emerging AI-powered tools such as Khanmigo and "
        "various ChatGPT-based tutoring wrappers offer conversational learning support. "
        "They are reactive rather than proactive \u2014 they respond to student queries "
        "rather than anticipating the student's needs.",
        "<b>Productivity and Study-Planning Apps:</b> Tools such as Notion, Todoist, "
        "and Forest help students manage time and focus but lack educational intelligence "
        "\u2014 they do not understand what the student is learning or how well.",
    ])
    s.append(spacer(4))
    s.append(p("EduNeuro's intended differentiation lies in the system-level integration "
               "of these capabilities around a longitudinal learner model, rather than "
               "optimising any single activity in isolation."))

    # 11
    s += sec("11. Competitive Advantage")
    s += bul_list([
        "<b>System-Level Architecture:</b> EduNeuro is designed from the ground up as an "
        "integrated system. The learner state model acts as the connective tissue across "
        "all capabilities.",
        "<b>Longitudinal Learner Intelligence:</b> As the platform accumulates data, its "
        "recommendations improve. This flywheel effect is the intended long-term "
        "defensibility mechanism (not yet realised at scale).",
        "<b>Exam-First Focus:</b> Concentrating deeply on GATE before expanding enables "
        "domain-specific learning intelligence that generalist tools cannot replicate.",
        "<b>AI-Native from Inception:</b> Unlike legacy platforms adding AI as an "
        "afterthought, EduNeuro's architecture is built around AI-driven orchestration.",
        "<b>Research-Led Development:</b> The founder's research orientation enables "
        "rigorous experimentation with learning science models and AI techniques.",
    ])

    # 12
    s += sec("12. Market Entry Strategy")
    s.append(p("EduNeuro's market entry follows a wedge-and-expand model:"))
    s.append(spacer(4))
    phases = [
        ["Phase", "Timeline", "Focus"],
        ["Phase 1: GATE Beta", "Current \u2013 Month 6",
         "Establish product-market fit with GATE aspirants through open beta. "
         "Build core syllabus mapping, AI tutoring MVP, and initial learner model."],
        ["Phase 2: Beta Deepening", "Months 6\u201312",
         "Complete learning loop: practice engine, assessment, analytics, focus tools. "
         "Iterate based on user research. Begin freemium infrastructure."],
        ["Phase 3: Monetisation", "Months 10\u201315",
         "Activate paid tier. Validate pricing and conversion. Strengthen retention "
         "and personalisation engine."],
        ["Phase 4: GATE Scale", "Months 15\u201324",
         "Multi-branch GATE support (CS, EC, EE, ME, CE, IN). "
         "Community features. Institutional outreach preparation."],
        ["Phase 5: Expansion Evaluation", "Month 24+",
         "Assess expansion to JEE, NEET, UPSC, CAT, and co-curricular domains "
         "(music, fitness, skill development) based on validated GATE model. "
         "Contingent on incubation outcomes and product-market validation."],
    ]
    s.append(make_table(phases, [30*mm, 30*mm, 95*mm]))
    s.append(spacer(4))
    s.append(Paragraph(
        "Expansion into segments beyond GATE will only proceed after validated "
        "product-market fit in the initial wedge.",
        NOTE
    ))

    # 13
    s += sec("13. Business Model")
    s.append(p("EduNeuro's business model follows a software/platform approach:"))
    s += bul_list([
        "<b>Freemium Tier:</b> A free tier providing core study planning, basic practice, "
        "and limited AI support. This tier drives acquisition and allows students to "
        "experience the platform's value.",
        "<b>Premium Subscription:</b> A paid tier providing full access to advanced AI "
        "tutoring, comprehensive analytics, personalised recommendations, focus tools, "
        "and priority support. Initial monetisation is planned through a freemium/"
        "subscription model, with pricing to be validated during the early beta phase.",
    ])
    s.append(spacer(4))
    s.append(p("<b>Current monetisation status:</b> EduNeuro has zero paying users. "
               "The platform is in open beta and monetisation features have not been "
               "activated."))
    s.append(spacer(4))
    s.append(p("Alternative or supplementary revenue streams \u2014 including "
               "institutional partnerships, B2B offerings, and curated content licensing "
               "\u2014 may be explored in the future but are not part of the current plan."))

    # 14
    s += sec("14. Marketing and User Acquisition")
    s += bul_list([
        "<b>Content Marketing:</b> Publishing educational content \u2014 study strategies, "
        "syllabus analysis, preparation tips \u2014 on platforms where GATE aspirants are "
        "active. Early organic reach of 200,000+ demonstrates the viability of this channel.",
        "<b>Community Engagement:</b> Building trust within GATE preparation communities "
        "through genuine value contribution rather than promotional activity.",
        "<b>Product-Led Virality:</b> Designing for organic sharing \u2014 study plan "
        "exports, performance summaries \u2014 that naturally expose the platform to new users.",
        "<b>Institutional Outreach:</b> In later stages, engaging coaching institutions "
        "and engineering colleges for structured adoption.",
    ])
    s.append(spacer(4))
    s.append(p("Paid advertising is not part of the current strategy and will be evaluated "
               "only after organic channels are validated at scale."))

    # 15 — REWRITTEN traction section
    s += sec("15. Current Validation and Traction")
    s.append(p("EduNeuro is in an early open-beta phase. The following signals represent "
               "early-stage validation from different measurement periods and definitions. "
               "They should be interpreted as directional indicators rather than evidence "
               "of product-market fit. Figures should not be combined into a single "
               "traction metric."))
    s.append(spacer(8))

    s.append(sub("Current Product Validation"))
    s += bul_list([
        "Current DAU: 50+ (recent measurement)",
        "User sign-ups / expressions of interest: 500+",
        "Peak observed daily users: approximately 400 (during an early launch period)",
    ])
    s.append(spacer(6))

    s.append(sub("Website and Content Engagement"))
    s += bul_list([
        "505 website visitors (cumulative, early beta period)",
        "3,093 page views (cumulative, early beta period)",
        "126 platform responses (cumulative, early beta period)",
        "200,000+ organic content reach (social media impressions)",
        "150,000+ organic content views (engagement views)",
        "2.6 lakh+ Instagram content views (organic)",
    ])
    s.append(spacer(6))

    s.append(sub("Period-Specific Observations"))
    s += bul_list([
        "2,565 page views recorded over a specific 6-day observation period, "
        "with approximately 400 daily users during that period.",
        "3,000+ users and 4,000+ website views recorded over a specific 8-day period.",
    ])
    s.append(spacer(6))

    s += submission_note()
    s.append(spacer(4))
    s.append(p("User research has been conducted through surveys administered alongside "
               "content distribution, providing qualitative insights into user needs, "
               "pain points, and feature preferences."))

    # 16
    s += sec("16. Product Development Roadmap")
    roadmap = [
        ["Phase", "Timeline", "Priorities"],
        ["1. Beta Foundation", "Months 1\u20133",
         "Core GATE syllabus mapping, AI tutoring MVP, learner model foundations, "
         "basic study planner"],
        ["2. Beta Expansion", "Months 4\u20136",
         "Practice engine, assessment modules, progress analytics, "
         "user research iteration and retention analysis"],
        ["3. Beta Maturation", "Months 7\u20139",
         "Personalised recommendations, longitudinal learner model, "
         "focus tools, freemium infrastructure"],
        ["4. Launch Readiness", "Months 10\u201312",
         "Full feature suite, paid tier activation, community features, "
         "institutional outreach preparation"],
        ["5. Scale Preparation", "Months 12\u201318",
         "Multi-branch GATE support, infrastructure scaling, "
         "expansion-market evaluation"],
    ]
    s.append(make_table(roadmap, [30*mm, 30*mm, 95*mm]))
    s.append(spacer(4))
    s.append(Paragraph(
        "Timelines are indicative and will be refined during incubation based on "
        "progress, user feedback, and mentor input. Future phases are targets, "
        "not commitments.",
        NOTE
    ))

    # 17
    s += sec("17. Operations")
    s += bul_list([
        "<b>Development:</b> The platform is being developed using modern web technologies "
        "with AI components integrated through API-based and custom model approaches. "
        "Development is ongoing with iterative releases.",
        "<b>Hosting:</b> Cloud-based hosting with auto-scaling planned for growth phases. "
        "Performance and reliability are priority considerations.",
        "<b>Content:</b> GATE syllabus content, question sets, and study materials are "
        "being curated during product development. Content quality assurance processes "
        "are being established.",
        "<b>User Support:</b> Currently handled directly by the founder. Structured "
        "support channels will be established as the user base grows.",
        "<b>Team:</b> The current team consists of the founder as the primary operator. "
        "Planned expansion includes technical capability, content development resources, "
        "and community management \u2014 contingent on incubation progress.",
    ])

    # 18
    s += sec("18. Risk Analysis and Mitigation")
    risks = [
        ["Risk", "Impact", "Likelihood", "Mitigation Approach"],
        ["No product-market fit",
         "High", "Medium",
         "Continuous user research, rapid iteration, beta-user engagement, "
         "mentor-guided pivot readiness"],
        ["AI content quality",
         "High", "Medium",
         "Content validation pipelines, human review, evaluation frameworks"],
        ["Long development cycle",
         "Medium", "Medium",
         "MVP-first approach, phased feature releases, incubation accountability"],
        ["Competitive pressure",
         "Medium", "High",
         "Deep domain focus (GATE), system-level differentiation, community trust"],
        ["User acquisition cost",
         "Medium", "Medium",
         "Content-driven organic growth as primary channel; paid only after organic validation"],
        ["Data privacy concerns",
         "High", "Medium",
         "Privacy-by-design architecture, transparent data policies, compliance-first approach"],
        ["Team scaling",
         "Medium", "High",
         "Incubation network access, structured hiring plan post-admission"],
    ]
    s.append(make_table(risks, [32*mm, 20*mm, 20*mm, 83*mm]))
    s.append(spacer(4))

    # 19
    s += sec("19. Social and Educational Impact")
    s += bul_list([
        "Democratising access to AI-powered personalised learning for students who "
        "cannot afford expensive one-on-one coaching.",
        "Reducing the cognitive load of deciding what to study next \u2014 a meta-cognitive "
        "task that currently consumes significant mental energy without adding to learning.",
        "Making quality preparation support accessible in Tier-2 and Tier-3 cities where "
        "premium coaching infrastructure is limited.",
        "Contributing to educational research through reresponsible deployment and "
        "transparent evaluation of learning outcomes.",
    ])

    # 20
    s += sec("20. Financial Strategy")
    s.append(p("EduNeuro is pre-revenue and pre-funding. Financial management at this "
               "phase focuses on minimising burn while maximising development velocity "
               "and validation proceed."))
    s += bul_list([
        "<b>Current expenditure:</b> Minimal. Primary costs are cloud infrastructure, "
        "AI API usage, and essential development tools.",
        "<b>Revenue:</b> None. No monetisation features are currently active.",
        "<b>External funding:</b> None raised to date.",
        "<b>Post-incubation planning:</b> A detailed financial model will be developed "
        "during incubation with mentor guidance, covering an 18\u201324 month runway, "
        "subscription unit economics, and fundraising milestones.",
        "<b>Projected revenue:</b> Not projected at this stage. Revenue targets will be "
        "established during incubation based on validated pricing and conversion assumptions.",
    ])

    # 21
    s += sec("21. Incubation and Funding Requirements")
    s.append(p("EduNeuro is seeking incubation support from IIT Guwahati TIC to accelerate "
               "development and increase the probability of successful product-market validation."))
    s += bul_list([
        "<b>Incubation duration:</b> 12\u201318 months (preferred)",
        "<b>Physical workspace:</b> Co-working space at IIT Guwahati TIC",
        "<b>Mentorship:</b> Access to mentors in AI/ML, educational technology, product "
        "management, and startup operations (detailed in the accompanying Mentorship Form)",
        "<b>Seed funding:</b> Pre-seed funding, details to be discussed with TIC.",
        "<b>Technical resources:</b> Computing infrastructure, research collaboration "
        "opportunities, and potential student researcher engagement",
        "<b>Network access:</b> Introductions to investors, industry partners, and the "
        "startup ecosystem",
        "<b>Post-incubation fundraising:</b> Planning for a pre-seed/seed round following "
        "incubation, contingent on achieving defined milestones. Details to be developed "
        "during incubation.",
    ])

    # 22
    s += sec("22. Milestones")
    milestones = [
        ["Milestone", "Target Timeline", "Status"],
        ["Open beta launch", "Completed", "Achieved"],
        ["500+ user sign-ups", "Completed", "Achieved"],
        ["50+ DAU", "Completed", "Achieved"],
        ["IIT Guwahati TIC incubation admission", "Q4 2026", "Planned"],
        ["Complete feature beta", "Month 6", "Planned"],
        ["Paid tier activation", "Month 10\u201312", "Planned"],
        ["1,000 paying users", "Month 18", "Planned target"],
        ["Pre-seed fundraising", "Month 12\u201315", "Planned"],
    ]
    s.append(make_table(milestones, [75*mm, 35*mm, 45*mm]))
    s.append(spacer(4))
    s.append(Paragraph(
        "Future milestones are projections based on current trajectory and will be "
        "refined during incubation. Achieving them depends on product-market validation, "
        "team capacity, and incubation support.",
        NOTE
    ))

    # 23
    s += sec("23. Conclusion")
    s.append(p("EduNeuro represents a focused, technically ambitious attempt to address a "
               "genuinely underserved problem: the fragmentation of the student's learning "
               "journey and the absence of any system that understands and guides the "
               "learner as an individual."))
    s.append(spacer(4))
    s.append(p("The venture is at an early but promising stage. The founder brings a "
               "research background in AI and a clear technical vision. Early validation "
               "signals \u2014 including website engagement, content reach, and user sign-ups "
               "\u2014 suggest the core idea resonates with the target audience. Product-market "
               "fit has not been achieved, the platform has zero paying users, and no "
               "external funding has been raised."))
    s.append(spacer(4))
    s.append(p("The GATE market was selected deliberately as the proving ground. It offers "
               "a large, motivated, digitally literate user base with well-defined "
               "preparation needs and clear success metrics."))
    s.append(spacer(4))
    s.append(p("EduNeuro is seeking IIT Guwahati TIC's incubation support to access "
               "mentorship, technical resources, ecosystem connections, and structured "
               "accountability. The combination of the founder's technical orientation, "
               "the institution's educational mission, and TIC's startup support "
               "infrastructure creates a well-matched partnership opportunity."))
    s.append(spacer(8))
    s.append(p("We welcome the opportunity to discuss EduNeuro's development plan in "
               "greater detail."))
    s.append(spacer(30))
    s.append(HRFlowable(width="100%", thickness=0.4, color=LIGHT_LINE, spaceAfter=8))
    s.append(two_col_toc("Submitted by:", "Sumanta, Founder, EduNeuro"))
    s.append(two_col_toc("Date:", "September 2026"))
    return s


# ═══════════════════════════════════════════════════════════════════════════════
#  DOCUMENT 2
# ═══════════════════════════════════════════════════════════════════════════════

def build_doc2():
    s = []
    s += cover_page("BUSINESS PLAN", "FOR STARTUP",
                    "Submission to IIT Guwahati Technology Incubation Centre (TIC)")

    # 1
    s += sec("1. Startup Overview")
    s.append(p("EduNeuro is an early-stage technology startup developing an AI-native "
               "study orchestration and learning platform. The venture was founded by "
               "Sumanta, a student researcher in Artificial Intelligence, with the "
               "objective of applying AI systems thinking to a systemic problem in "
               "education technology: the fragmentation of the student learning journey."))
    s.append(spacer(4))
    s += bul_list([
        "<b>Venture:</b> EduNeuro",
        "<b>Founder:</b> Sumanta",
        "<b>Founder background:</b> Student researcher, Artificial Intelligence",
        "<b>Stage:</b> Open Beta / Pre-Incubation",
        "<b>Target incubator:</b> IIT Guwahati Technology Incubation Centre (TIC)",
        "<b>Initial market:</b> GATE examination preparation (Graduate Aptitude Test in Engineering)",
    ])
    s.append(spacer(4))
    s.append(p("The venture is self-funded at the founder level with no external "
               "investment to date. Development has proceeded through an open beta "
               "phase to validate core assumptions and gather early user feedback."))

    # 2
    s += sec("2. Founder")
    s.append(p("Sumanta is a student researcher working in Artificial Intelligence. "
               "The founding perspective combines:"))
    s += bul_list([
        "Technical depth in AI systems and machine learning, providing the ability to "
        "evaluate and implement AI-driven product architectures.",
        "Direct experience with examination preparation, providing first-hand "
        "understanding of the problem space and target user needs.",
        "Research orientation, enabling rigorous experimentation with learning models, "
        "evaluation frameworks, and AI product design.",
    ])
    s.append(spacer(4))
    s.append(p("The founder is the primary operator at this stage. Plans to strengthen "
               "the team \u2014 including technical co-lead capability, content development "
               "resources, and community management \u2014 are contingent on incubation "
               "admission and progress towards product-market validation."))

    # 3
    s += sec("3. Problem")
    s.append(p("A student preparing for a competitive examination such as GATE typically "
               "uses five or more separate digital tools: video platforms for concept "
               "learning, question banks for practice, a study planner, a productivity/"
               "focus app, and increasingly, an AI chatbot for doubt resolution."))
    s.append(spacer(4))
    s.append(p("These tools are optimised for individual activities, not for the student's "
               "entire learning process. They do not share information. They do not "
               "understand the student as an individual. And they leave the student to "
               "answer the most difficult questions alone:"))
    s += bul_list([
        "What should I study next?",
        "Which of my weak areas need the most attention?",
        "Am I actually improving, or just staying busy?",
        "How does my study behaviour affect my outcomes?",
        "When should I revise what I have already learned?",
        "Is my study plan working, or should I change it?",
    ])
    s.append(spacer(4))
    s.append(p("These are not content problems. They are intelligence problems \u2014 "
               "the student needs a system that understands their complete learning state "
               "and can reason about their next best action."))

    # 4
    s += sec("4. Solution")
    s.append(p("EduNeuro proposes an AI-native study orchestration platform that unifies "
               "the student's fragmented toolchain around a continuous, longitudinal "
               "learner model."))
    s.append(spacer(4))
    s.append(p("The platform is designed from the ground up as an intelligent system that:"))
    s += bul_list([
        "Models the learner across multiple dimensions: knowledge state, topic mastery, "
        "performance history, study behaviour, focus quality, schedule adherence, and "
        "intervention effectiveness.",
        "Uses this model to determine the most valuable next learning action \u2014 "
        "whether that is learning a new concept, practising a weak area, revising "
        "spaced material, or adjusting the study plan.",
        "Improves its recommendations as it accumulates more data about the learner, "
        "creating a compounding personalisation effect.",
        "Connects every platform capability \u2014 learning, practice, planning, "
        "assessment, focus support \u2014 through the learner model, so the student "
        "experiences a coherent rather than fragmented system.",
    ])
    s.append(spacer(4))
    s.append(p("A question bank does not know your study schedule. A study planner does "
               "not know your mastery level. An AI chatbot does not know your forgetting "
               "curve. EduNeuro connects these capabilities through a shared learner "
               "intelligence layer."))

    # 5
    s += sec("5. Innovation")
    s.append(p("EduNeuro's innovation is architectural rather than incremental. It rests "
               "on three pillars:"))
    s += bul_list([
        "<b>Longitudinal Learner Model:</b> A persistent, evolving model of each learner "
        "that serves as the platform's intelligence backbone. This is distinct from "
        "tools that capture only snapshot data.",
        "<b>Proactive Orchestration:</b> Rather than waiting for the student to request "
        "an action, the platform actively recommends the next best step. This shifts the "
        "relationship from reactive tool to proactive guide.",
        "<b>Compound Learning Intelligence:</b> The system is designed to become more "
        "useful over time as it accumulates learner data. This flywheel is the intended "
        "long-term defensibility mechanism.",
    ])
    s.append(spacer(4))
    s.append(p("AI is not an add-on feature. It is the organising principle of the entire "
               "product architecture \u2014 a meaningful distinction from competitors "
               "retrofitting AI onto legacy platform structures."))

    # 6
    s += sec("6. Product")
    s.append(p("EduNeuro is a web-based platform in open beta. The table below "
               "distinguishes between current beta capabilities and planned features."))
    s.append(spacer(6))
    prod2 = [
        ["Capability", "Status", "Description"],
        ["AI Learning Support", "In development", "Concept explanation and tutoring for GATE subjects"],
        ["Study Planning", "In development", "Adaptive schedule generation based on exam timeline and learner state"],
        ["Practice Engine", "In development", "Curated question practice with difficulty adaptation"],
        ["Assessment", "In development", "Topic-wise and full-length test simulation with analytics"],
        ["Progress Analytics", "In development", "Longitudinal tracking of mastery and behaviour"],
        ["Focus Tools", "Planned", "Session-level focus tracking and distraction management"],
        ["Personalised Recommendations", "Planned", "AI-driven next-action suggestions via learner model"],
        ["Community Features", "Planned", "Peer comparison and study group functionality"],
    ]
    s.append(make_table(prod2, [40*mm, 32*mm, 83*mm]))
    s.append(spacer(4))
    s.append(Paragraph(
        "'In development' indicates active build progress. 'Planned' indicates features "
        "scheduled for the incubation period.",
        NOTE
    ))

    # 7
    s += sec("7. Target Market")
    s += bul_list([
        "<b>Primary segment (current):</b> GATE aspirants. Over 1 million candidates "
        "register annually across engineering disciplines. High digital literacy, high "
        "preparation intensity, willingness to invest in outcome-improving tools.",
        "<b>Secondary segments (future):</b> JEE, NEET, UPSC, CAT aspirants, "
        "university students, and co-curricular/extracurricular domains (music, "
        "fitness, skill development). These share the preparation-intensity profile "
        "of GATE aspirants but require domain-specific adaptation.",
    ])
    s.append(spacer(4))
    s.append(p("EduNeuro's architecture is designed to generalise across examinations, "
               "but expansion will only occur after validated product-market fit in GATE."))

    # 8
    s += sec("8. Initial Market Wedge: GATE")
    s.append(p("GATE was selected as the initial market wedge based on the following:"))
    s += bul_list([
        "<b>Large, defined audience:</b> 1M+ annual registrations across multiple "
        "engineering disciplines.",
        "<b>High stakes:</b> GATE scores determine admission to premier M.Tech programmes, "
        "PSU recruitment, and research positions. This creates strong motivation to adopt "
        "genuinely effective tools.",
        "<b>Structured preparation behaviour:</b> GATE preparation follows well-defined "
        "patterns \u2014 syllabus-based learning, topic-wise practice, mock testing, "
        "revision cycles \u2014 making it possible to build effective learner models.",
        "<b>Digital fluency:</b> The target demographic (engineering graduates, "
        "21\u201326 years) is comfortable with digital tools and receptive to "
        "AI-augmented platforms.",
        "<b>Proving ground for generalisation:</b> Validating the orchestration approach "
        "for GATE provides a repeatable template for expanding to JEE, NEET, UPSC, and CAT.",
        "<b>Competitive opening:</b> Existing players serve this market but none has "
        "solved the orchestration thesis.",
    ])
    s.append(spacer(4))
    s.append(p("GATE is a strategically chosen proving ground, not merely a convenient "
               "starting point."))

    # 9
    s += sec("9. Technology")
    s.append(p("EduNeuro's stack is designed for scalability, AI integration, and "
               "reresponsible deployment:"))
    s += bul_list([
        "<b>Frontend:</b> Modern web framework providing responsive, accessible interfaces.",
        "<b>Backend:</b> Scalable service architecture handling user management, learner "
        "state persistence, content delivery, and AI service orchestration.",
        "<b>AI Layer:</b> Large language models for reasoning and content generation, "
        "complemented by custom algorithms for mastery tracking, spaced-repetition "
        "scheduling, and behavioural pattern analysis.",
        "<b>Data Layer:</b> Longitudinal learner data stored with privacy-by-design "
        "principles.",
        "<b>Infrastructure:</b> Cloud-hosted with auto-scaling capabilities.",
    ])
    s.append(spacer(4))
    s.append(p("AI components are being designed with reresponsible deployment in mind: "
               "content quality evaluation, learner data governance, transparency in "
               "recommendation logic, and mechanisms for learners to understand and "
               "influence the system's guidance."))

    # 10
    s += sec("10. Current Stage")
    stage_data = [
        ["Dimension", "Current State"],
        ["Product status", "Open beta \u2014 core features in active development"],
        ["Team size", "1 (founder-led)"],
        ["Revenue", "None \u2014 zero paying users"],
        ["External funding", "None raised to date"],
        ["User base", "500+ sign-ups, 50+ DAU (recent)"],
        ["Product-market fit", "Not claimed \u2014 early validation only"],
        ["Office space", "Founder-operated remotely"],
    ]
    s.append(make_table(stage_data, [40*mm, 115*mm]))
    s.append(spacer(4))
    s.append(p("The venture is self-sustaining at minimal burn. Incubation support would "
               "enable accelerated development, structured mentorship, and fundraising "
               "preparation."))

    # 11
    s += sec("11. Validation and Traction")
    s.append(p("Early-stage validation signals from the open-beta period. These are "
               "directional indicators, not evidence of product-market fit."))
    s.append(spacer(6))
    s.append(sub("Current Product Validation"))
    s += bul_list([
        "500+ user sign-ups / expressions of interest",
        "50+ current DAU (recent measurement)",
        "~400 peak daily users (observed during an early launch period)",
    ])
    s.append(spacer(6))
    s.append(sub("Website and Content Engagement"))
    s += bul_list([
        "505 website visitors (cumulative, early beta period)",
        "3,093 page views (cumulative, early beta period)",
        "126 platform responses (cumulative, early beta period)",
        "200,000+ organic content reach (social media impressions)",
        "150,000+ organic content views (engagement views)",
        "2.6 lakh+ Instagram content views (organic)",
    ])
    s.append(spacer(6))
    s.append(sub("Period-Specific Observations"))
    s += bul_list([
        "2,565 page views over a specific 6-day period, with ~400 daily users",
        "3,000+ users and 4,000+ website views over a specific 8-day period",
    ])
    s.append(spacer(6))
    s += submission_note()
    s.append(spacer(4))
    s.append(p("User research has been conducted through surveys administered alongside "
               "content distribution, providing qualitative insights into user pain points "
               "and feature preferences."))

    # 12
    s += sec("12. Business Model")
    s += bul_list([
        "<b>Freemium Tier (Acquisition):</b> Free access to core study planning, basic "
        "practice, and limited AI support. Allows students to experience the platform "
        "before committing to payment.",
        "<b>Premium Subscription (Revenue):</b> Paid tier providing full access to "
        "advanced AI tutoring, comprehensive analytics, personalised recommendations, "
        "focus tools, and priority support. Initial monetisation is planned through a "
        "freemium/subscription model, with pricing to be validated during the early "
        "beta phase.",
    ])
    s.append(spacer(4))
    s.append(p("<b>Current monetisation status:</b> Zero paying users. Monetisation "
               "features are not yet active. Pricing strategy will be refined during "
               "incubation based on user research and mentor guidance."))
    s.append(spacer(4))
    s.append(p("Future monetisation opportunities \u2014 institutional licensing, B2B "
               "offerings, content partnerships \u2014 may be explored after the primary "
               "subscription model is validated."))

    # 13
    s += sec("13. Competitive Advantage")
    s += bul_list([
        "<b>System-Level Integration:</b> Competitors optimise individual activities. "
        "EduNeuro connects them through a shared learner model.",
        "<b>Longitudinal Intelligence:</b> The platform's value compounds over time as "
        "it accumulates learner data. This is the intended flywheel (not yet realised "
        "at scale).",
        "<b>Exam-First Depth:</b> Deep GATE focus enables domain-specific intelligence "
        "that generalist tools lack.",
        "<b>AI-Native Architecture:</b> Every component is designed around AI-driven "
        "reasoning rather than passive content delivery.",
        "<b>Research-Led Development:</b> The founder's background enables rigorous "
        "experimentation with learning models and AI techniques.",
    ])

    # 14
    s += sec("14. Go-to-Market Strategy")
    s += bul_list([
        "<b>Content-Driven Acquisition:</b> Publishing educational content on platforms "
        "where GATE aspirants are active. Early organic reach of 200,000+ validates "
        "this channel.",
        "<b>Community Trust Building:</b> Authentic engagement within GATE preparation "
        "communities to build trust rather than relying on promotional messaging.",
        "<b>Product-Led Virality:</b> Sharing mechanisms (study plan exports, performance "
        "summaries) that naturally expose the platform to new users.",
        "<b>Freemium Conversion:</b> Free tier as the primary conversion funnel.",
        "<b>Institutional Outreach (Phase 2):</b> Once product-market fit is "
        "demonstrated, engaging coaching institutions and engineering colleges.",
    ])
    s.append(spacer(4))
    s.append(p("Paid advertising is not part of the current strategy and will only be "
               "evaluated after organic channels are validated at scale."))

    # 15
    s += sec("15. Development Roadmap")
    roadmap2 = [
        ["Phase", "Duration", "Focus", "Key Outcomes"],
        ["Beta\nFoundation", "M1\u20133",
         "Core platform, GATE syllabus, AI tutoring MVP",
         "Functional platform, initial learner model, 200+ beta users"],
        ["Beta\nExpansion", "M4\u20136",
         "Practice engine, assessment, analytics",
         "Complete learning loop, retention metrics, user research insights"],
        ["Beta\nMaturation", "M7\u20139",
         "Recommendations, focus tools, longitudinal model",
         "Personalisation engine, freemium infrastructure, retention improvement"],
        ["Launch\nReadiness", "M10\u201312",
         "Full feature suite, paid tier, community",
         "Paid tier activated, 1,000+ total users, monetisation validation"],
        ["Scale\nPreparation", "M12\u201318",
         "Infrastructure scaling, multi-branch support",
         "Multi-GATE-branch support, pre-seed fundraising preparation"],
    ]
    s.append(make_table(roadmap2, [22*mm, 22*mm, 58*mm, 53*mm]))
    s.append(spacer(4))
    s.append(Paragraph(
        "Timelines are indicative. Future phases are targets, not commitments.",
        NOTE
    ))

    # 16
    s += sec("16. Scalability")
    s += bul_list([
        "<b>User scalability:</b> Cloud-native infrastructure with auto-scaling to handle "
        "growing loads without proportional cost increases.",
        "<b>Content scalability:</b> AI-assisted content generation and curation that "
        "can extend across GATE branches and subsequently other syllabi without linear "
        "increases in human content effort.",
        "<b>Examination scalability:</b> The learner model and orchestration engine are "
        "designed as general-purpose components. Expanding to a new examination primarily "
        "requires syllabus mapping and content curation.",
    ])
    s.append(spacer(4))
    s.append(p("The economics of the platform improve with scale. AI infrastructure costs "
               "grow sub-linearly with user volume due to caching and model efficiency. "
               "Content development costs are front-loaded and amortised across users. "
               "Subscription revenue is recurring. Long-term scalability to millions of "
               "users is contingent on successful validation in the initial GATE wedge."))

    # 17
    s += sec("17. Social and Economic Impact")
    s += bul_list([
        "Democratising access to AI-powered personalised learning for students who "
        "cannot afford expensive one-on-one coaching.",
        "Reducing the cognitive load of meta-cognitive decision-making \u2014 deciding "
        "what to study next \u2014 freeing mental energy for actual learning.",
        "Making quality preparation support accessible in Tier-2 and Tier-3 cities.",
        "Contributing to educational research through reresponsible deployment and "
        "transparent evaluation of learning outcomes.",
        "Improved GATE outcomes translate into better postgraduate education and "
        "employment opportunities, contributing to economic mobility.",
    ])

    # 18
    s += sec("18. Incubation Requirements")
    s += bul_list([
        "<b>Physical workspace:</b> Co-working space at IIT Guwahati TIC (12\u201318 months).",
        "<b>Mentorship:</b> Access to mentors in AI/ML, edtech, product management, "
        "and startup operations. Specific areas detailed in the Mentorship Form.",
        "<b>Seed funding:</b> Pre-seed funding, details to be discussed with TIC.",
        "<b>Technical resources:</b> Computing infrastructure, research collaboration, "
        "student researcher engagement.",
        "<b>Ecosystem access:</b> Investor introductions, industry partners, and "
        "startup network access.",
        "<b>Programme structure:</b> TIC's incubation curriculum, workshops, pitch "
        "sessions, and milestone reviews.",
        "<b>Credibility:</b> Association with IIT Guwahati's brand for customer trust "
        "and investor introductions.",
    ])

    # 19
    s += sec("19. Funding Requirements")
    s += bul_list([
        "<b>Incubation funding:</b> Pre-seed funding to cover development, "
        "cloud infrastructure, AI API costs, and essential operations for 12\u201318 months.",
        "<b>Post-incubation pre-seed/seed:</b> Target raise to be determined during "
        "incubation, contingent on achieving milestones. Timing: Month 12\u201315.",
        "<b>Use of funds:</b> Team expansion, marketing acceleration, infrastructure "
        "scaling, and multi-examination expansion preparation.",
        "<b>Target investors:</b> Angel networks, micro-VCs, and edtech-focused funds.",
    ])
    s.append(spacer(4))
    s.append(p("Funding amounts will be refined during incubation with mentor guidance, "
               "based on validated unit economics and detailed financial projections."))

    # 20
    s += sec("20. Key Milestones")
    milestones2 = [
        ["Milestone", "Timeline", "Status"],
        ["Open beta launch", "Completed", "Achieved"],
        ["500+ sign-ups", "Completed", "Achieved"],
        ["50+ DAU", "Completed", "Achieved"],
        ["TIC incubation admission", "Q4 2026", "Planned"],
        ["Complete feature beta", "Month 6", "Planned"],
        ["1,000+ registered users", "Month 9", "Planned target"],
        ["Paid tier activation", "Month 10\u201312", "Planned"],
        ["1,000 paying users", "Month 18", "Planned target"],
        ["Pre-seed fundraise", "Month 12\u201315", "Planned"],
    ]
    s.append(make_table(milestones2, [75*mm, 35*mm, 45*mm]))
    s.append(spacer(4))
    s.append(Paragraph(
        "Future milestones are projections based on current trajectory and will be "
        "refined during incubation.",
        NOTE
    ))

    # 21
    s += sec("21. Risks and Mitigation")
    risks2 = [
        ["Risk", "Mitigation Approach"],
        ["Failure to achieve product-market fit",
         "Continuous user research, rapid iteration, mentor-guided pivot readiness"],
        ["AI-generated content quality",
         "Content validation pipelines, human review, evaluation frameworks"],
        ["Prolonged development timeline",
         "MVP discipline, phased releases, incubation accountability structure"],
        ["Increased competitive pressure",
         "Deep GATE-specific differentiation, system-level architecture, community trust"],
        ["User acquisition cost escalation",
         "Content-driven organic growth; paid acquisition only after organic validation"],
        ["Data privacy concerns",
         "Privacy-by-design architecture, transparent policies, compliance-first approach"],
        ["Founder bandwidth limitations",
         "Team expansion plan, task prioritisation, incubation talent network access"],
    ]
    s.append(make_table(risks2, [45*mm, 110*mm]))

    # 22
    s += sec("22. Future Expansion")
    s.append(p("EduNeuro's long-term vision extends beyond GATE. The platform's "
               "architecture is designed for eventual expansion across multiple "
               "examinations and learning contexts. Each phase is contingent on "
               "successful validation in the preceding phase."))
    s.append(spacer(4))
    phases2 = [
        ["Phase", "Timeline", "Focus"],
        ["GATE Scale", "Months 12\u201324",
         "Multi-branch GATE support, community features, institutional outreach"],
        ["JEE and NEET", "Year 2\u20133",
         "Adapt validated orchestration model for JEE Main/Advanced and NEET. "
         "Adjacent markets with similar preparation-intensity profiles."],
        ["UPSC, CAT, Other Exams", "Year 3\u20134",
         "Expand orchestration technology to UPSC CSE, CAT/XAT, and other "
         "competitive examinations. Each requires examination-specific adaptation."],
        ["Co-Curricular and Extracurricular", "Year 4+",
         "Generalise orchestration approach beyond examinations into co-curricular "
         "learning \u2014 music, fitness, skill development, and other structured "
         "self-improvement domains. Broadest vision for the platform."],
    ]
    s.append(make_table(phases2, [30*mm, 30*mm, 95*mm]))
    s.append(spacer(4))
    s.append(p("EduNeuro will not pursue broad expansion before establishing a solid "
               "foundation in its initial market."))

    s.append(spacer(30))
    s.append(HRFlowable(width="100%", thickness=0.4, color=LIGHT_LINE, spaceAfter=8))
    s.append(two_col_toc("Submitted by:", "Sumanta, Founder, EduNeuro"))
    s.append(two_col_toc("Date:", "September 2026"))
    return s


# ═══════════════════════════════════════════════════════════════════════════════
#  DOCUMENT 3 — Mentorship Form
# ═══════════════════════════════════════════════════════════════════════════════

def build_doc3():
    s = []
    s += cover_page("MENTORSHIP", "REQUIREMENT FORM",
                    "Submission to IIT Guwahati Technology Incubation Centre (TIC)")

    # 1
    s += sec("1. Startup Name")
    s.append(p("<b>EduNeuro</b> \u2014 AI-Native Study Orchestration and Learning Platform"))

    # 2
    s += sec("2. Founder")
    s += bul_list([
        "<b>Name:</b> Sumanta",
        "<b>Background:</b> Student researcher working in Artificial Intelligence",
        "<b>Role:</b> Founder and primary operator",
    ])

    # 3
    s += sec("3. Startup Stage")
    s.append(p("<b>Open Beta / Pre-Incubation.</b> EduNeuro is currently operating in an "
               "open beta phase. The core platform is under active development. Early "
               "user validation signals are encouraging but product-market fit has not "
               "been achieved. The venture has not received external funding, has zero "
               "paying users, and is self-funded at the founder level."))

    # 4
    s += sec("4. Brief Description")
    s.append(p("EduNeuro is developing an AI-native study orchestration platform for "
               "competitive examination preparation. The platform's core thesis is that "
               "students need not more educational content, but an intelligent system "
               "that continuously understands their learning state \u2014 their knowledge, "
               "gaps, behaviour, and progress \u2014 and recommends the most valuable next "
               "learning action. The initial market wedge is GATE preparation in India. "
               "The platform is designed to generalise across examinations and broader "
               "learning contexts once the core orchestration technology is validated."))

    # 5
    s += sec("5. Problem Being Addressed")
    s.append(p("Students preparing for competitive examinations use multiple disconnected "
               "tools for different aspects of preparation. These tools are optimised for "
               "individual activities rather than the student's entire learning process. "
               "The result is that students know what they studied but cannot confidently "
               "answer:"))
    s += bul_list([
        "What should I study next?",
        "Which weak areas need targeted attention?",
        "Am I actually improving?",
        "How does my study behaviour affect outcomes?",
        "When should I revise?",
        "Is my study plan working?",
    ])
    s.append(spacer(4))
    s.append(p("EduNeuro addresses this by building a unified, AI-driven system that "
               "models the learner continuously and orchestrates the complete "
               "preparation journey."))

    # 6
    s += sec("6. Proposed Solution")
    s.append(p("An AI-native study orchestration platform that integrates learning support, "
               "study planning, practice, assessment, focus management, and progress "
               "tracking around a longitudinal learner model. The platform uses AI to "
               "reason about the learner's current state and recommend the next best "
               "action, with the system becoming more personalised and effective over time "
               "as it accumulates learner data."))

    # 7
    s += sec("7. Current Progress")
    s.append(sub("Product Development"))
    s += bul_list([
        "Open beta platform with core capabilities in active development",
        "GATE syllabus mapping in progress across major branches",
        "AI tutoring, study planning, practice engine, and analytics modules under development",
    ])
    s.append(spacer(4))
    s.append(sub("User Validation"))
    s += bul_list([
        "500+ sign-ups / expressions of interest",
        "50+ current DAU (recent measurement)",
        "~400 peak daily users (observed during early launch period)",
        "505 website visitors, 3,093 page views (cumulative, early beta)",
        "200,000+ organic content reach; 150,000+ organic content views",
        "2.6 lakh+ Instagram content views (organic)",
        "User research conducted via surveys",
    ])
    s.append(spacer(4))
    s.append(sub("Operational"))
    s += bul_list([
        "Self-funded at founder level; zero external funding",
        "Zero paying users",
        "Founder-led development with lean operational model",
    ])

    # 8
    s += sec("8. Key Challenges")
    s += bul_list([
        "<b>Product-market fit validation:</b> Moving from early traction signals to "
        "demonstrable product-market fit requires focused user research, rapid iteration, "
        "and structured experimentation.",
        "<b>AI content quality:</b> Ensuring AI-generated educational content is accurate, "
        "pedagogically sound, and examination-aligned requires robust evaluation frameworks.",
        "<b>Learner model design:</b> Designing a multi-dimensional learner state model "
        "that is computationally tractable and genuinely useful requires expertise in "
        "learning science, AI systems, and educational product design.",
        "<b>Retention:</b> Maintaining student engagement over long preparation cycles "
        "(6\u201318 months) requires sustained value delivery and habit-forming design.",
        "<b>Team scaling:</b> The founder-led model is insufficient for scaling. "
        "Recruiting technical, content, and community talent is a priority.",
        "<b>Monetisation:</b> Pricing strategy and freemium conversion mechanics require "
        "careful validation with the target demographic.",
        "<b>Competitive landscape:</b> Established players have significant brand "
        "recognition. EduNeuro must differentiate on system-level value.",
        "<b>Reresponsible AI deployment:</b> AI in educational contexts requires careful "
        "attention to content accuracy, learner data privacy, transparency, and "
        "learning autonomy.",
    ])

    # 9 — Overview
    s += sec("9. Mentorship Areas \u2014 Overview")
    s.append(p("EduNeuro requires structured mentorship across six interconnected areas. "
               "The sections below are ordered by priority. The highest-priority needs "
               "are product-market fit validation, learner modelling / AI architecture, "
               "and monetisation / GTM. Remaining areas are important supporting needs."))

    # 10
    s += sec("10. Technical Mentorship")
    s.append(p("<b>Priority: High</b>"))
    s += bul_list([
        "<b>Scalable AI architecture:</b> Guidance on designing AI services that scale "
        "from hundreds to thousands of users while managing API costs, latency, and "
        "reliability.",
        "<b>Learner modelling systems:</b> Expertise in multi-dimensional learner state "
        "models, including knowledge tracing, mastery estimation, and behavioural "
        "pattern recognition.",
        "<b>Recommendation and personalisation:</b> Building recommendation systems that "
        "determine the optimal next learning action for each individual learner.",
        "<b>AI-generated content evaluation:</b> Frameworks for evaluating accuracy, "
        "pedagogical quality, and examination-relevance of AI-generated educational content.",
        "<b>Evaluation and experimentation:</b> A/B testing and experimentation frameworks "
        "to measure the platform's impact on learning outcomes.",
        "<b>Technical scalability:</b> Infrastructure scaling, database design for "
        "longitudinal learner data, and performance optimisation.",
        "<b>Security and data governance:</b> Privacy-preserving architectures and "
        "compliance with data protection regulations.",
    ])

    # 11
    s += sec("11. Product Mentorship")
    s.append(p("<b>Priority: High</b>"))
    s += bul_list([
        "<b>GATE use case definition:</b> Identifying the strongest, most differentiated "
        "use case within GATE preparation \u2014 the feature or workflow that creates "
        "the most compelling reason for students to adopt the platform.",
        "<b>User experience design:</b> Designing intuitive, engaging workflows for "
        "complex study orchestration. The product must simplify the student's life, "
        "not add another tool to manage.",
        "<b>Retention and engagement:</b> Strategies for maintaining engagement over "
        "long preparation cycles (6\u201318 months). Habit formation, motivation "
        "design, and re-engagement mechanics.",
        "<b>Learning outcome measurement:</b> Defining metrics that credibly measure "
        "the platform's impact on learning effectiveness \u2014 not just engagement, "
        "but actual improvement in test performance and knowledge retention.",
        "<b>Feature prioritisation:</b> Making disciplined decisions about which features "
        "to build first, based on user value and strategic importance.",
        "<b>User research design:</b> Structuring research programmes that generate "
        "actionable insights about student needs and feature preferences.",
    ])

    # 12
    s += sec("12. Business Mentorship")
    s.append(p("<b>Priority: High</b>"))
    s += bul_list([
        "<b>Monetisation validation:</b> Designing and executing experiments to validate "
        "freemium pricing, willingness to pay, price sensitivity, and conversion mechanics.",
        "<b>Customer segmentation:</b> Identifying distinct user segments within the GATE "
        "aspirant population and tailoring product positioning accordingly.",
        "<b>Business model refinement:</b> Evaluating and refining the subscription model "
        "and assessing alternative revenue streams after primary model validation.",
        "<b>Go-to-market strategy:</b> Developing a structured GTM plan building on "
        "the content-driven organic approach.",
        "<b>Institutional partnerships:</b> Guidance on approaching coaching institutions "
        "and student bodies for structured adoption (post product-market fit).",
        "<b>Startup operations:</b> Lean operations, financial management, accounting "
        "practices, and operational infrastructure.",
        "<b>Fundraising readiness:</b> Pitch development, investor targeting, financial "
        "modelling, and term-sheet preparation for pre-seed/seed round.",
        "<b>Legal and compliance:</b> Entity formation, IP strategy, terms of service, "
        "privacy policies, and regulatory compliance.",
    ])

    # 13
    s += sec("13. Market and GTM Mentorship")
    s.append(p("<b>Priority: High</b>"))
    s += bul_list([
        "<b>GATE market understanding:</b> Insights into the GATE preparation ecosystem \u2014 "
        "student demographics, coaching landscape, decision-making factors, unmet needs.",
        "<b>Competitive positioning:</b> Positioning EduNeuro against established players "
        "and emerging AI tools. Identifying messaging that resonates.",
        "<b>Customer acquisition strategy:</b> Scaling the content-driven organic approach, "
        "identifying high-impact content formats and distribution channels.",
        "<b>Community building:</b> Strategies for building a GATE aspirant community "
        "around the platform, creating organic advocacy and retention.",
        "<b>Brand development:</b> Building a credible, trusted brand in edtech, "
        "particularly important for AI use in accuracy-critical contexts.",
    ])

    # 14
    s += sec("14. AI / ML Research Guidance")
    s.append(p("<b>Priority: High</b>")
    )
    s += bul_list([
        "<b>Learning science integration:</b> Integrating evidence-based principles \u2014 "
        "spaced repetition, retrieval practice, interleaving, metacognitive scaffolding "
        "\u2014 into the AI architecture.",
        "<b>Adaptive learning models:</b> State-of-the-art adaptive learning algorithms, "
        "knowledge tracing methods, and their application to examination preparation.",
        "<b>Student modelling:</b> Designing learner state models that capture knowledge, "
        "behaviour, and affective states to drive personalisation.",
        "<b>Educational AI:</b> Guidance on emerging research in AI for education, "
        "including LLM applications, AI tutoring systems, and learning analytics.",
        "<b>Experimentation and evaluation:</b> Research studies to evaluate the platform's "
        "impact on learning outcomes, including control group design and causal inference.",
        "<b>Reresponsible AI:</b> Content accuracy assurance, algorithmic transparency, "
        "bias detection, and learner autonomy preservation.",
        "<b>Research collaboration:</b> Opportunities for collaborative research with "
        "IIT Guwahati faculty, potentially leading to publications and academic credibility.",
    ])

    # 15
    s += sec("15. Incubation and Ecosystem Support")
    s.append(p("<b>Priority: Supporting</b>")
    )
    s += bul_list([
        "<b>Mentor matching:</b> Structured matching across technology, product, business, "
        "and research domains.",
        "<b>Peer network:</b> Community of fellow founders for peer learning and support.",
        "<b>Investor access:</b> Structured introductions to angel investors, micro-VCs, "
        "and edtech/AI-focused funds.",
        "<b>Industry connections:</b> Access to potential customers and strategic partners.",
        "<b>Research community:</b> Engagement with IIT Guwahati research groups and "
        "faculty, potential student researcher engagement.",
        "<b>Talent pipeline:</b> Access to IIT Guwahati students and alumni for "
        "internships and full-time roles.",
        "<b>Legal and administrative:</b> Entity formation, IP management, compliance.",
        "<b>Infrastructure:</b> Co-working space, computing resources, shared services.",
        "<b>Programme structure:</b> Workshops, masterclasses, pitch sessions, milestone reviews.",
        "<b>Credibility:</b> IIT Guwahati brand association for customer trust and "
        "investor confidence.",
    ])

    # 16
    s += sec("16. Expected Outcomes from Mentorship")
    s.append(p("The following outcomes represent EduNeuro's projections and will be "
               "refined in consultation with TIC mentors throughout the incubation period:"))
    s += bul_list([
        "<b>Product-market validation:</b> Clear evidence of product-market fit or a "
        "well-reasoned pivot decision within 6\u20139 months, supported by structured "
        "user research and quantitative engagement metrics.",
        "<b>Technical maturity:</b> Production-ready platform with validated AI "
        "architecture, content quality assurance, and scalable infrastructure.",
        "<b>Monetisation validation:</b> Validated pricing strategy and freemium "
        "conversion model with initial revenue traction.",
        "<b>Team formation:</b> Founding team expanded to include at minimum a technical "
        "co-lead and one dedicated content/resources role.",
        "<b>Fundraising readiness:</b> Compelling pitch, financial model, and investor "
        "pipeline for pre-seed/seed round following or during the latter phase of "
        "incubation.",
        "<b>Research output:</b> At least one collaborative research output (paper, "
        "conference submission, or technical report) from learner modelling work.",
        "<b>Community and brand:</b> Recognised brand within the GATE community and "
        "a growing, engaged user base.",
        "<b>Expansion readiness:</b> Documented plan for JEE/NEET expansion with "
        "technical architecture prepared for multi-examination support.",
    ])

    s.append(spacer(30))
    s.append(HRFlowable(width="100%", thickness=0.4, color=LIGHT_LINE, spaceAfter=8))
    s.append(two_col_toc("Submitted by:", "Sumanta, Founder, EduNeuro"))
    s.append(two_col_toc("Date:", "September 2026"))
    return s


# ═══════════════════════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════════════════════

def build_pdf(filename, title, sub, content_fn):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title=title,
        author="EduNeuro",
        subject="Incubation Application Document",
    )
    def on_page(c, d): draw_header_footer(c, d, sub)
    story = content_fn()
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"  [OK] {filename}")


if __name__ == "__main__":
    print("Generating final submission-ready PDFs...")
    print()
    build_pdf("EduNeuro_Business_Plan_FINAL.pdf",
              "Business Plan \u2014 EduNeuro",
              "Comprehensive Business Plan for IIT Guwahati TIC",
              build_doc1)
    build_pdf("EduNeuro_Business_Plan_for_StartUp_FINAL.pdf",
              "Business Plan for Startup \u2014 EduNeuro",
              "Startup-Focused Business Plan for IIT Guwahati TIC",
              build_doc2)
    build_pdf("EduNeuro_Mentorship_Form_FINAL.pdf",
              "Mentorship Requirement Form \u2014 EduNeuro",
              "Mentorship Form for IIT Guwahati TIC",
              build_doc3)
    print()
    print("All three final PDFs generated.")
