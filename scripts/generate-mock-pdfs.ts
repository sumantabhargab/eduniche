/**
 * Trend-Based Mock Paper PDF Generator
 *
 * Reads data/predicted-papers/*.json and generates professional exam PDFs
 * for all 20 branches using pdfkit.
 *
 * Usage:
 *   npx tsx scripts/generate-mock-pdfs.ts
 *   node --loader ts-node/esm scripts/generate-mock-pdfs.ts
 *
 * Output:
 *   public/predicted-papers/pdf/
 *     PadhaiShuru_GATE_{BRANCH}_Trend_Mock_01.pdf
 *     PadhaiShuru_GATE_{BRANCH}_Solutions_01.pdf
 *     Collection_Index.pdf
 *   gate-trend-mocks/{BRANCH}/
 *     (mirror copies)
 */

import PDFDocument from "pdfkit";
import { readFileSync, existsSync, mkdirSync, writeFileSync, copyFileSync, createWriteStream, readdirSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Constants ───────────────────────────────────────────────────────────────

const PAPERS_DIR = join(__dirname, "..", "data", "predicted-papers");
const PUBLIC_PDF_DIR = join(__dirname, "..", "public", "predicted-papers", "pdf");
const GATE_MOCKS_DIR = join(__dirname, "..", "gate-trend-mocks");

const TOTAL_QUESTIONS = 65;
const TOTAL_MARKS = 100;
const EXAM_DURATION = "3 Hours";

const BRANCH_FULL_NAMES: Record<string, string> = {
  CS: "Computer Science & Engineering",
  EC: "Electronics & Communication Engineering",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
  IN: "Instrumentation Engineering",
  PI: "Production & Industrial Engineering",
  CH: "Chemical Engineering",
  BT: "Biotechnology",
  MT: "Metallurgical Engineering",
  TF: "Textile Engineering & Fibre Science",
  PE: "Petroleum Engineering",
  EY: "Ecology & Evolution",
  MA: "Mathematics",
  AR: "Architecture & Planning",
  AG: "Agricultural Engineering",
  GG: "Geology & Geophysics",
  PH: "Engineering Physics",
  XE: "Engineering Sciences",
  XL: "Life Sciences",
};

// ─── Types (inline since we can't import from src/) ─────────────────────────

interface PredictedQuestion {
  id: string;
  questionNumber: number;
  subject: string;
  topic: string;
  questionType: string;
  marks: number;
  negativeMarks: number;
  difficulty: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  source: string;
}

interface PredictedPaper {
  id: string;
  branch: string;
  title: string;
  description: string;
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: { easy: number; moderate: number; difficult: number };
  subjectBreakdown: { subject: string; marks: number; questions: number }[];
  predictionRationale: string;
  questions: PredictedQuestion[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function drawWrappedText(
  doc: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: {
    fontSize?: number;
    lineHeight?: number;
    bold?: boolean;
    color?: string;
  } = {}
): number {
  const {
    fontSize = 10,
    lineHeight = 1.4,
    bold = false,
    color = "#000000",
  } = options;

  doc.font(bold ? "Helvetica-Bold" : "Helvetica");
  doc.fontSize(fontSize);
  doc.fillColor(color);

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.widthOfString(testLine, { fontSize });
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  lines.forEach((line, i) => {
    doc.text(line, x, y + i * fontSize * lineHeight, {
      width: maxWidth,
      continued: false,
    });
  });

  return y + lines.length * fontSize * lineHeight;
}

function drawOptionText(
  doc: any,
  label: string,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number = 9
): number {
  doc.font("Helvetica");
  doc.fontSize(fontSize);
  doc.fillColor("#000000");

  const labelWidth = doc.widthOfString(`${label}  `, { fontSize });
  const textMaxWidth = maxWidth - labelWidth;

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.widthOfString(testLine, { fontSize });
    if (testWidth > textMaxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  lines.forEach((line, i) => {
    if (i === 0) {
      doc.text(`${label}  ${line}`, x, y, { width: maxWidth });
    } else {
      doc.text(`   ${line}`, x, y + i * fontSize * 1.3, { width: maxWidth });
    }
  });

  return y + lines.length * fontSize * 1.3;
}

// ─── Page Renderers ──────────────────────────────────────────────────────────

function drawCoverPage(doc: any, branch: string, paperNumber: number, paper: PredictedPaper): void {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;

  doc.fillColor("#1a1a2e");
  doc.rect(0, 0, pageWidth, 8).fill();

  doc.font("Helvetica-Bold");
  doc.fontSize(28);
  doc.fillColor("#1a1a2e");
  doc.text("PADHAISHURU", centerX, 60, { align: "center" });

  doc.font("Helvetica");
  doc.fontSize(12);
  doc.fillColor("#555555");
  doc.text("GATE Preparation Platform", centerX, 95, { align: "center" });

  doc.strokeColor("#cccccc");
  doc.lineWidth(1);
  doc.moveTo(80, 120);
  doc.lineTo(pageWidth - 80, 120);
  doc.stroke();

  doc.font("Helvetica-Bold");
  doc.fontSize(20);
  doc.fillColor("#1a1a2e");
  doc.text(`GATE ${branch}`, centerX, 145, { align: "center" });

  doc.font("Helvetica");
  doc.fontSize(13);
  doc.fillColor("#444444");
  doc.text(BRANCH_FULL_NAMES[branch] || branch, centerX, 172, { align: "center" });

  const boxY = 210;
  doc.fillColor("#f8f9fa");
  doc.rect(60, boxY, pageWidth - 120, 80).fill();
  doc.strokeColor("#1a1a2e");
  doc.lineWidth(2);
  doc.rect(60, boxY, pageWidth - 120, 80).stroke();

  doc.font("Helvetica-Bold");
  doc.fontSize(16);
  doc.fillColor("#1a1a2e");
  doc.text("TREND-BASED MOCK PAPER", centerX, boxY + 20, { align: "center" });

  doc.font("Helvetica-Bold");
  doc.fontSize(24);
  doc.fillColor("#c9302c");
  doc.text(`— ${String(paperNumber).padStart(2, "0")} —`, centerX, boxY + 48, { align: "center" });

  const detailsY = 320;
  const details = [
    { label: "Duration", value: EXAM_DURATION },
    { label: "Total Questions", value: String(TOTAL_QUESTIONS) },
    { label: "Maximum Marks", value: String(TOTAL_MARKS) },
    { label: "Sections", value: `${paper.subjectBreakdown.length} subjects` },
  ];

  details.forEach((d, i) => {
    const y = detailsY + i * 28;
    doc.font("Helvetica-Bold");
    doc.fontSize(11);
    doc.fillColor("#1a1a2e");
    doc.text(d.label, 100, y);
    doc.font("Helvetica");
    doc.text(d.value, 250, y);
  });

  const diffY = detailsY + details.length * 28 + 20;
  doc.font("Helvetica-Bold");
  doc.fontSize(11);
  doc.fillColor("#1a1a2e");
  doc.text("Difficulty Distribution", 100, diffY);

  const diffData = [
    { label: "Easy", count: paper.difficultyDistribution.easy, color: "#28a745" },
    { label: "Moderate", count: paper.difficultyDistribution.moderate, color: "#ffc107" },
    { label: "Difficult", count: paper.difficultyDistribution.difficult, color: "#dc3545" },
  ];

  diffData.forEach((d, i) => {
    const y = diffY + 22 + i * 18;
    doc.font("Helvetica");
    doc.fontSize(10);
    doc.fillColor(d.color);
    doc.text(`${d.label}: ${d.count} questions (${Math.round(d.count / TOTAL_QUESTIONS * 100)}%)`, 120, y);
  });

  doc.font("Helvetica-Oblique");
  doc.fontSize(9);
  doc.fillColor("#888888");
  const disclaimerY = pageHeight - 80;
  doc.text("Unofficial practice material. Not affiliated with or endorsed by GATE/IIT.", centerX, disclaimerY, { align: "center" });
  doc.text("These mock papers are constructed using analysis of historical GATE PYQ patterns.", centerX, disclaimerY + 14, { align: "center" });
  doc.text("Historical patterns do not guarantee future examination questions.", centerX, disclaimerY + 28, { align: "center" });

  doc.fillColor("#1a1a2e");
  doc.rect(0, pageHeight - 8, pageWidth, 8).fill();

  doc.font("Helvetica");
  doc.fontSize(9);
  doc.fillColor("#888888");
  doc.text("Page 1", centerX, pageHeight - 25, { align: "center" });
}

function drawInstructionsPage(doc: any, branch: string): void {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;
  const margin = 70;
  const contentWidth = pageWidth - margin * 2;

  doc.fillColor("#1a1a2e");
  doc.rect(0, 0, pageWidth, 8).fill();

  doc.font("Helvetica-Bold");
  doc.fontSize(18);
  doc.fillColor("#1a1a2e");
  doc.text("GENERAL INSTRUCTIONS", centerX, 40, { align: "center" });

  doc.font("Helvetica");
  doc.fontSize(12);
  doc.fillColor("#444444");
  doc.text(`GATE ${branch} — Trend-Based Mock Paper`, centerX, 65, { align: "center" });

  doc.strokeColor("#cccccc");
  doc.lineWidth(1);
  doc.moveTo(margin, 90);
  doc.lineTo(pageWidth - margin, 90);
  doc.stroke();

  const instructions = [
    { title: "1. Examination Pattern", body: "The paper contains 65 questions carrying a total of 100 marks. The duration of the examination is 3 hours." },
    { title: "2. Question Types", body: "Questions are of three types:\n\n(a) Multiple Choice Questions (MCQ): One correct answer out of four options.\n(b) Multiple Select Questions (MSQ): One or more correct answers out of four options. Each correct answer carries full marks. There is no negative marking.\n(c) Numerical Answer Type (NAT): A real number answer to be entered. No options are provided." },
    { title: "3. Marking Scheme", body: "• 1-mark questions: +1 for correct, -0.33 for incorrect (MCQ only)\n• 2-mark questions: +2 for correct, -0.66 for incorrect (MCQ only)\n• 3-mark questions: +3 for correct, -0.66 for incorrect (MCQ only)\n• NAT questions carry no negative marking.\n• MSQ questions carry no negative marking." },
    { title: "4. How to Answer", body: "• For MCQ: Select exactly one option.\n• For MSQ: Select one or more options. Partial credit is NOT awarded.\n• For NAT: Enter the numerical answer in the provided space. Round off as specified." },
    { title: "5. Rough Work", body: "All rough work should be done only in the space provided in this question paper. Do not use additional sheets." },
    { title: "6. Calculator", body: "An on-screen virtual calculator is available for use during the examination. Physical calculators are NOT permitted." },
    { title: "7. Important Notes", body: "• Do not open the seal of the Question Booklet until you are instructed to do so.\n• The Question Booklet contains multiple pages. Verify the page count.\n• Immediately report any discrepancy in the Question Booklet to the invigilator." },
  ];

  let y = 105;
  instructions.forEach((inst) => {
    doc.font("Helvetica-Bold");
    doc.fontSize(11);
    doc.fillColor("#1a1a2e");
    doc.text(inst.title, margin, y);
    y += 18;

    doc.font("Helvetica");
    doc.fontSize(10);
    doc.fillColor("#333333");

    const lines = inst.body.split("\n");
    lines.forEach((line) => {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 40;
      }
      const textY = drawWrappedText(doc, line, margin + 10, y, contentWidth - 20, {
        fontSize: 10,
        lineHeight: 1.35,
      });
      y = textY + 4;
    });

    y += 12;

    if (y < pageHeight - 40) {
      doc.strokeColor("#eeeeee");
      doc.lineWidth(0.5);
      doc.moveTo(margin, y);
      doc.lineTo(pageWidth - margin, y);
      doc.stroke();
      y += 12;
    }
  });

  doc.fillColor("#1a1a2e");
  doc.rect(0, pageHeight - 8, pageWidth, 8).fill();

  doc.font("Helvetica");
  doc.fontSize(9);
  doc.fillColor("#888888");
  doc.text("Page 2", centerX, pageHeight - 25, { align: "center" });
}

function drawQuestionPaper(doc: any, branch: string, paper: PredictedPaper): void {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 55;
  const contentWidth = pageWidth - margin * 2;

  doc.fillColor("#1a1a2e");
  doc.rect(0, 0, pageWidth, 6).fill();

  doc.font("Helvetica-Bold");
  doc.fontSize(11);
  doc.fillColor("#1a1a2e");
  doc.text(`GATE ${branch} — Trend-Based Mock Paper`, margin, 15);

  doc.font("Helvetica");
  doc.fontSize(10);
  doc.fillColor("#666666");
  doc.text(`${EXAM_DURATION} | ${TOTAL_QUESTIONS} Questions | ${TOTAL_MARKS} Marks`, pageWidth - margin - 180, 15);

  doc.strokeColor("#cccccc");
  doc.lineWidth(0.5);
  doc.moveTo(margin, 32);
  doc.lineTo(pageWidth - margin, 32);
  doc.stroke();

  let pageNum = 3;
  let y = 45;

  for (let i = 0; i < paper.questions.length; i++) {
    const q = paper.questions[i];
    const estimatedHeight = q.questionType.endsWith("NAT") ? 60 : 90;

    if (y + estimatedHeight > pageHeight - 40) {
      doc.font("Helvetica");
      doc.fontSize(8);
      doc.fillColor("#888888");
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 20, { align: "center" });

      doc.addPage();
      pageNum++;
      y = 30;

      doc.fillColor("#1a1a2e");
      doc.rect(0, 0, pageWidth, 6).fill();

      doc.font("Helvetica-Bold");
      doc.fontSize(10);
      doc.fillColor("#1a1a2e");
      doc.text(`GATE ${branch} — Trend-Based Mock Paper`, margin, 15);

      doc.font("Helvetica");
      doc.fontSize(9);
      doc.fillColor("#666666");
      doc.text(`${EXAM_DURATION} | ${TOTAL_QUESTIONS} Questions | ${TOTAL_MARKS} Marks`, pageWidth - margin - 180, 15);

      doc.strokeColor("#cccccc");
      doc.lineWidth(0.5);
      doc.moveTo(margin, 32);
      doc.lineTo(pageWidth - margin, 32);
      doc.stroke();
    }

    const qStartY = y;
    doc.font("Helvetica-Bold");
    doc.fontSize(10);
    doc.fillColor("#1a1a2e");
    doc.text(`Q${q.questionNumber}.`, margin, y);

    doc.font("Helvetica");
    doc.fontSize(8);
    doc.fillColor("#666666");
    const negLabel = q.negativeMarks > 0 ? `[-${q.negativeMarks}]` : "[no -ve]";
    doc.text(`${q.marks}M ${negLabel}`, pageWidth - margin - 80, y);
    y += 14;

    doc.font("Helvetica-Oblique");
    doc.fontSize(8);
    doc.fillColor("#888888");
    doc.text(`[${q.subject}]`, margin + 15, y);
    y += 12;

    const textMaxWidth = contentWidth - 15;
    y = drawWrappedText(doc, q.questionText, margin + 15, y, textMaxWidth, {
      fontSize: 10,
      lineHeight: 1.4,
    });
    y += 6;

    if (!q.questionType.endsWith("NAT") && q.options && q.options.length > 0) {
      const optionLabels = ["(A)", "(B)", "(C)", "(D)"];
      q.options.forEach((opt, optIdx) => {
        const optY = drawOptionText(
          doc,
          optionLabels[optIdx] || `(${String.fromCharCode(65 + optIdx)})`,
          opt,
          margin + 30,
          y,
          textMaxWidth - 15,
          9
        );
        y = optY + 4;
      });
    } else if (q.questionType.endsWith("NAT")) {
      doc.strokeColor("#cccccc");
      doc.lineWidth(0.5);
      doc.moveTo(margin + 30, y + 3);
      doc.lineTo(margin + 200, y + 3);
      doc.stroke();
      doc.font("Helvetica-Oblique");
      doc.fontSize(8);
      doc.fillColor("#aaaaaa");
      doc.text("Enter your answer here", margin + 30, y + 5);
      y += 20;
    }

    y += 8;
    doc.strokeColor("#eeeeee");
    doc.lineWidth(0.3);
    doc.moveTo(margin, y);
    doc.lineTo(pageWidth - margin, y);
    doc.stroke();
    y += 10;
  }

  doc.font("Helvetica");
  doc.fontSize(8);
  doc.fillColor("#888888");
  doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 20, { align: "center" });
}

function drawAnswerKey(doc: any, branch: string, paper: PredictedPaper): void {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;

  doc.fillColor("#1a1a2e");
  doc.rect(0, 0, pageWidth, 8).fill();

  doc.font("Helvetica-Bold");
  doc.fontSize(20);
  doc.fillColor("#1a1a2e");
  doc.text("ANSWER KEY", centerX, 60, { align: "center" });

  doc.font("Helvetica");
  doc.fontSize(12);
  doc.fillColor("#555555");
  doc.text(`GATE ${branch} — ${paper.title}`, centerX, 90, { align: "center" });

  doc.strokeColor("#cccccc");
  doc.lineWidth(1);
  doc.moveTo(80, 115);
  doc.lineTo(pageWidth - 80, 115);
  doc.stroke();

  const margin = 70;
  const contentWidth = pageWidth - margin * 2;

  const headerY = 140;
  doc.fillColor("#f0f0f0");
  doc.rect(margin, headerY, contentWidth, 24).fill();
  doc.strokeColor("#cccccc");
  doc.rect(margin, headerY, contentWidth, 24).stroke();

  doc.font("Helvetica-Bold");
  doc.fontSize(10);
  doc.fillColor("#1a1a2e");
  doc.text("Q.No.", margin + 8, headerY + 7);
  doc.text("Type", margin + 68, headerY + 7);
  doc.text("Answer", margin + 150, headerY + 7);
  doc.text("Marks", margin + 250, headerY + 7);

  let y = headerY + 28;
  paper.questions.forEach((q, i) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 30;
    }

    if (i % 2 === 0) {
      doc.fillColor("#f8f8f8");
      doc.rect(margin, y - 4, contentWidth, 18).fill();
    }

    doc.font("Helvetica");
    doc.fontSize(9);
    doc.fillColor("#333333");
    doc.text(String(q.questionNumber), margin + 8, y);
    doc.text(q.questionType, margin + 68, y);
    doc.text(q.correctAnswer || "—", margin + 150, y);
    doc.text(String(q.marks), margin + 250, y);

    y += 18;

    doc.strokeColor("#eeeeee");
    doc.lineWidth(0.3);
    doc.moveTo(margin, y - 4);
    doc.lineTo(pageWidth - margin, y - 4);
    doc.stroke();
  });

  doc.fillColor("#1a1a2e");
  doc.rect(0, pageHeight - 8, pageWidth, 8).fill();

  doc.font("Helvetica");
  doc.fontSize(8);
  doc.fillColor("#888888");
  doc.text("Page 1", centerX, pageHeight - 20, { align: "center" });
}

function drawSolutions(doc: any, branch: string, paper: PredictedPaper): void {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;
  const margin = 55;
  const contentWidth = pageWidth - margin * 2;

  doc.fillColor("#1a1a2e");
  doc.rect(0, 0, pageWidth, 6).fill();

  doc.font("Helvetica-Bold");
  doc.fontSize(14);
  doc.fillColor("#1a1a2e");
  doc.text("DETAILED SOLUTIONS", centerX, 20, { align: "center" });

  doc.font("Helvetica");
  doc.fontSize(10);
  doc.fillColor("#555555");
  doc.text(`GATE ${branch} — ${paper.title}`, centerX, 40, { align: "center" });

  doc.strokeColor("#cccccc");
  doc.lineWidth(0.5);
  doc.moveTo(margin, 58);
  doc.lineTo(pageWidth - margin, 58);
  doc.stroke();

  let y = 70;
  let pageNum = 1;

  for (let i = 0; i < paper.questions.length; i++) {
    const q = paper.questions[i];
    const explanationLines = q.explanation ? q.explanation.split("\n").length : 1;
    const estimatedHeight = 60 + explanationLines * 14;

    if (y + estimatedHeight > pageHeight - 35) {
      doc.font("Helvetica");
      doc.fontSize(8);
      doc.fillColor("#888888");
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 15, { align: "center" });

      doc.addPage();
      pageNum++;
      y = 25;

      doc.fillColor("#1a1a2e");
      doc.rect(0, 0, pageWidth, 6).fill();
    }

    doc.fillColor("#f0f4ff");
    doc.rect(margin, y, contentWidth, 30).fill();
    doc.strokeColor("#1a1a2e");
    doc.lineWidth(1);
    doc.rect(margin, y, contentWidth, 30).stroke();

    doc.font("Helvetica-Bold");
    doc.fontSize(10);
    doc.fillColor("#1a1a2e");
    doc.text(`Q${q.questionNumber}.`, margin + 8, y + 8);

    doc.font("Helvetica");
    doc.fontSize(9);
    doc.fillColor("#666666");
    doc.text(`${q.subject} | ${q.marks} marks | ${q.questionType}`, margin + 50, y + 8);

    doc.font("Helvetica-Oblique");
    doc.fontSize(9);
    doc.fillColor("#333333");
    const shortText = q.questionText.length > 120
      ? q.questionText.substring(0, 120) + "..."
      : q.questionText;
    doc.text(shortText, margin + 8, y + 18, { width: contentWidth - 16 });

    y += 38;

    doc.font("Helvetica-Bold");
    doc.fontSize(10);
    doc.fillColor("#c9302c");
    doc.text(`Answer: ${q.correctAnswer || "See explanation"}`, margin + 8, y);
    y += 16;

    if (q.explanation) {
      doc.font("Helvetica");
      doc.fontSize(9);
      doc.fillColor("#333333");
      const explLines = q.explanation.split("\n");
      explLines.forEach((line) => {
        y = drawWrappedText(doc, line, margin + 8, y, contentWidth - 20, {
          fontSize: 9,
          lineHeight: 1.35,
        });
      });
    }

    if (q.source) {
      doc.font("Helvetica-Oblique");
      doc.fontSize(8);
      doc.fillColor("#888888");
      y = drawWrappedText(doc, `Source: ${q.source}`, margin + 8, y, contentWidth - 20, {
        fontSize: 8,
        lineHeight: 1.3,
      });
    }

    y += 15;

    doc.strokeColor("#eeeeee");
    doc.lineWidth(0.3);
    doc.moveTo(margin, y - 5);
    doc.lineTo(pageWidth - margin, y - 5);
    doc.stroke();
  }

  doc.font("Helvetica");
  doc.fontSize(8);
  doc.fillColor("#888888");
  doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 15, { align: "center" });
}

// ─── PDF Generation Functions ────────────────────────────────────────────────

function generatePaperPdf(
  branch: string,
  paperNumber: number,
  paper: PredictedPaper,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `GATE ${branch} Trend-Based Mock Paper ${paperNumber}`,
        Author: "PadhaiShuru",
        Subject: `GATE ${branch} Mock Paper`,
        Keywords: `GATE, ${branch}, mock paper, practice`,
        Creator: "PadhaiShuru Trend-Based Mock Paper Generator",
      },
    });

    const stream = doc.pipe(createWriteStream(outputPath));
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    drawCoverPage(doc, branch, paperNumber, paper);
    doc.addPage();
    drawInstructionsPage(doc, branch);
    doc.addPage();
    drawQuestionPaper(doc, branch, paper);

    doc.end();
  });
}

function generateSolutionsPdf(
  branch: string,
  paperNumber: number,
  paper: PredictedPaper,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `GATE ${branch} Solutions — Mock Paper ${paperNumber}`,
        Author: "PadhaiShuru",
        Subject: `GATE ${branch} Solutions`,
        Keywords: `GATE, ${branch}, solutions, answer key`,
        Creator: "PadhaiShuru Trend-Based Mock Paper Generator",
      },
    });

    const stream = doc.pipe(createWriteStream(outputPath));
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    drawAnswerKey(doc, branch, paper);
    doc.addPage();
    drawSolutions(doc, branch, paper);

    doc.end();
  });
}

function generateCollectionIndex(branches: { code: string; name: string; paperCount: number }[]): void {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: "PadhaiShuru GATE Trend-Based Mock Papers — Collection Index",
      Author: "PadhaiShuru",
      Subject: "GATE Mock Papers Collection",
      Keywords: "GATE, mock papers, collection, practice",
      Creator: "PadhaiShuru Trend-Based Mock Paper Generator",
    },
  });

  const outputPath = join(PUBLIC_PDF_DIR, "Collection_Index.pdf");
  const stream = doc.pipe(createWriteStream(outputPath));

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;
  const margin = 70;
  const contentWidth = pageWidth - margin * 2;

  doc.fillColor("#1a1a2e");
  doc.rect(0, 0, pageWidth, 8).fill();

  doc.font("Helvetica-Bold");
  doc.fontSize(24);
  doc.fillColor("#1a1a2e");
  doc.text("PADHAISHURU", centerX, 60, { align: "center" });

  doc.font("Helvetica");
  doc.fontSize(12);
  doc.fillColor("#555555");
  doc.text("GATE Preparation Platform", centerX, 90, { align: "center" });

  doc.strokeColor("#cccccc");
  doc.lineWidth(1);
  doc.moveTo(80, 115);
  doc.lineTo(pageWidth - 80, 115);
  doc.stroke();

  doc.font("Helvetica-Bold");
  doc.fontSize(18);
  doc.fillColor("#1a1a2e");
  doc.text("Trend-Based Mock Papers", centerX, 140, { align: "center" });

  doc.font("Helvetica-Bold");
  doc.fontSize(16);
  doc.fillColor("#c9302c");
  doc.text("Collection Index", centerX, 168, { align: "center" });

  doc.font("Helvetica");
  doc.fontSize(11);
  doc.fillColor("#444444");
  doc.text("20 Branches | 4 Papers Each | 65 Questions Per Paper", centerX, 200, { align: "center" });

  const methY = 240;
  doc.font("Helvetica-Bold");
  doc.fontSize(11);
  doc.fillColor("#1a1a2e");
  doc.text("Methodology", margin, methY);

  doc.font("Helvetica");
  doc.fontSize(10);
  doc.fillColor("#333333");
  const methText = "These mock papers were constructed using analysis of historical GATE PYQ patterns, including topic distribution, question types, recurring concepts, difficulty characteristics, and recent trends. Each paper is statistically calibrated to reflect the actual GATE examination pattern.";
  let y = drawWrappedText(doc, methText, margin, methY + 20, contentWidth, { fontSize: 10, lineHeight: 1.4 });

  const disclaimerY = y + 20;
  doc.font("Helvetica-Oblique");
  doc.fontSize(9);
  doc.fillColor("#888888");
  doc.text("Historical patterns do not guarantee future examination questions.", centerX, disclaimerY, { align: "center" });
  doc.text("This is a trend-based practice simulation, not a prediction of actual GATE questions.", centerX, disclaimerY + 14, { align: "center" });

  let listY = disclaimerY + 50;
  doc.font("Helvetica-Bold");
  doc.fontSize(14);
  doc.fillColor("#1a1a2e");
  doc.text("Available Branches", margin, listY);
  listY += 22;

  doc.font("Helvetica");
  doc.fontSize(10);
  doc.fillColor("#333333");

  branches.forEach((b) => {
    if (listY > pageHeight - 40) {
      doc.addPage();
      listY = 40;
    }
    doc.font("Helvetica-Bold");
    doc.fillColor("#1a1a2e");
    doc.text(`${b.code}`, margin, listY);
    doc.font("Helvetica");
    doc.fillColor("#555555");
    doc.text(`${b.name}`, margin + 35, listY);
    doc.text(`4 papers`, pageWidth - margin - 50, listY);
    listY += 18;
  });

  doc.fillColor("#1a1a2e");
  doc.rect(0, pageHeight - 8, pageWidth, 8).fill();

  doc.font("Helvetica");
  doc.fontSize(8);
  doc.fillColor("#888888");
  doc.text("Page 1", centerX, pageHeight - 20, { align: "center" });

  stream.on("finish", () => {
    console.log(`Generated collection index -> ${outputPath}`);
  });
  doc.end();
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  ensureDir(PUBLIC_PDF_DIR);
  ensureDir(GATE_MOCKS_DIR);

  const files = readdirSync(PAPERS_DIR).filter((f: string) => f.endsWith(".json") && f !== "all.json");

  console.log(`Generating PDFs for ${files.length} branches...\n`);

  const branchList: { code: string; name: string; paperCount: number }[] = [];

  for (const file of files) {
    const branch = file.replace(".json", "");
    const raw = readFileSync(join(PAPERS_DIR, file), "utf-8");
    const data = JSON.parse(raw) as { branch: string; papers: PredictedPaper[] };

    console.log(`Processing ${branch} (${data.papers.length} papers)...`);

    for (let i = 0; i < data.papers.length; i++) {
      const paper = data.papers[i];
      const paperNum = i + 1;

      const paperPdfName = `PadhaiShuru_GATE_${branch}_Trend_Mock_${String(paperNum).padStart(2, "0")}.pdf`;
      const paperPdfPath = join(PUBLIC_PDF_DIR, paperPdfName);
      const paperPdfPathGate = join(GATE_MOCKS_DIR, branch, paperPdfName);

      await generatePaperPdf(branch, paperNum, paper, paperPdfPath);
      ensureDir(dirname(paperPdfPathGate));
      copyFileSync(paperPdfPath, paperPdfPathGate);

      console.log(`  Paper ${paperNum}: ${paperPdfName} (${paper.totalQuestions}Q, ${paper.totalMarks}M)`);

      const solPdfName = `PadhaiShuru_GATE_${branch}_Solutions_${String(paperNum).padStart(2, "0")}.pdf`;
      const solPdfPath = join(PUBLIC_PDF_DIR, solPdfName);
      const solPdfPathGate = join(GATE_MOCKS_DIR, branch, solPdfName);

      await generateSolutionsPdf(branch, paperNum, paper, solPdfPath);
      ensureDir(dirname(solPdfPathGate));
      copyFileSync(solPdfPath, solPdfPathGate);

      console.log(`  Solutions ${paperNum}: ${solPdfName}`);
    }

    branchList.push({
      code: branch,
      name: BRANCH_FULL_NAMES[branch] || branch,
      paperCount: data.papers.length,
    });
  }

  console.log("\nGenerating collection index...");
  generateCollectionIndex(branchList);

  console.log("\n=== PDF Generation Complete ===");
  console.log(`Total branches: ${branchList.length}`);
  console.log(`Total papers: ${branchList.reduce((s, b) => s + b.paperCount, 0)}`);
  console.log(`Output: ${PUBLIC_PDF_DIR}`);
  console.log(`Backup: ${GATE_MOCKS_DIR}`);
}

main().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
