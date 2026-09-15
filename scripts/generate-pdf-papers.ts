import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OUT = path.join(process.cwd(), "public", "gate-mock-papers");
const DATA = path.join(process.cwd(), "data", "predicted-papers");

type Question = {
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
};

type Paper = {
  id: string;
  branch: string;
  title: string;
  description: string;
  totalQuestions: number;
  totalMarks: number;
  questions: Question[];
  difficultyDistribution: { easy: number; moderate: number; difficult: number };
  subjectBreakdown: { subject: string; marks: number; questions: number }[];
};

const BRANCH_NAMES: Record<string, string> = {
  CS: "Computer Science & IT",
  EC: "Electronics & Communication",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
  IN: "Instrumentation",
  PI: "Production & Industrial",
  CH: "Chemical Engineering",
  BT: "Biotechnology",
  MT: "Metallurgy",
  XE: "Engineering Sciences",
  XL: "Science (XL)",
  TF: "Textile Engineering",
  PE: "Petroleum Engineering",
  EY: "Ecology & Evolution",
  MA: "Mathematics",
  AR: "Architecture & Planning",
  AG: "Agricultural Engineering",
  GG: "Geology & Geophysics",
  PH: "Physics",
};

const BRANCH_FULL: Record<string, string> = {
  CS: "Computer Science and Information Technology",
  EC: "Electronics and Communication Engineering",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
  IN: "Instrumentation Engineering",
  PI: "Production and Industrial Engineering",
  CH: "Chemical Engineering",
  BT: "Biotechnology",
  MT: "Metallurgical Engineering",
  XE: "Engineering Sciences",
  XL: "Life Sciences",
  TF: "Textile Engineering and Fibre Science",
  PE: "Petroleum Engineering",
  EY: "Ecology and Evolution",
  MA: "Mathematics",
  AR: "Architecture and Planning",
  AG: "Agricultural Engineering",
  GG: "Geology and Geophysics",
  PH: "Physics",
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sectionTitle(doc: PDFDocument, title: string) {
  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica-Bold").fillColor("#1a1a2e").text(title.toUpperCase(), { align: "center" });
  doc.moveDown(0.3);
  const x = doc.page.width / 2;
  doc.moveTo(x - 80, doc.y).lineTo(x + 80, doc.y).strokeColor("#c0392b").lineWidth(1.5).stroke();
  doc.moveDown(0.5);
}

function addInstructions(doc: PDFDocument, paper: Paper, branch: string) {
  doc.moveDown(2);
  sectionTitle(doc, "General Instructions");
  doc.moveDown(0.3);

  const totalQ = paper.totalQuestions;
  const totalMarks = paper.totalMarks;
  const duration = "3 Hours";
  const maxQs = totalQ;
  const maxMarks = totalMarks;

  doc.font("Helvetica").fontSize(9).fillColor("#333");

  const instructions = [
    `1. This question paper contains ${maxQs} questions for a total of ${maxMarks} marks.`,
    `2. Duration of examination: ${duration}.`,
    "3. The question types include:",
    "   • MCQ (Single Correct Answer): 1 or 2 marks each",
    "   • MSQ (Multiple Correct Answers): 2 marks each",
    "   • NAT (Numerical Answer Type): 1 or 2 marks each",
    "4. For MCQ: Only one option is correct. Select the single correct answer.",
    "5. For MSQ: One or more options are correct. Select ALL correct options.",
    "6. For NAT: Enter the numerical answer. No negative marking for NAT questions.",
    `7. Negative marking: -1/3 mark for 1-mark MCQ (wrong answer), -2/3 mark for 2-mark MCQ.`,
    "   No negative marking for MSQ and NAT questions.",
    "8. A virtual calculator is available on the screen. Physical calculators are not permitted.",
    "9. The question paper contains 8 pages including this instructions page.",
    "10. All questions are compulsory.",
    "11. Fill in the required details on the answer sheet before starting.",
    "12. Do not ask for clarifications from the invigilator. Interpret questions as given.",
    "",
    "Unofficial Practice Material — Not affiliated with or endorsed by GATE/IIT.",
    "Prepared by PadhaiShuru (padhaishuru.com) for practice purposes only.",
  ];

  for (const line of instructions) {
    if (line === "") {
      doc.moveDown(0.3);
    } else {
      doc.text(line, { align: "left", lineGap: 3 });
    }
  }
  doc.moveDown(0.5);
}

function addSectionHeader(doc: PDFDocument, title: string) {
  // Check if we need a new page
  if (doc.y > doc.page.height - 120) {
    doc.addPage();
  }
  doc.moveDown(1);
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#c0392b").text(title, { align: "center" });
  doc.moveDown(0.3);
  const x = doc.page.width / 2;
  doc.moveTo(x - 70, doc.y).lineTo(x + 70, doc.y).strokeColor("#c0392b").lineWidth(1).stroke();
  doc.moveDown(0.4);
}

function addQuestion(doc: PDFDocument, q: Question, qNum: number) {
  const startY = doc.y;
  const pageH = doc.page.height;
  const margin = 60;
  const usableW = doc.page.width - margin * 2;

  // Question header
  const typeLabel = q.questionType.replace("MCQ", "-MCQ").replace("MSQ", "-MSQ").replace("NAT", "-NAT");
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#1a1a2e");
  doc.text(`Q${qNum}. [${typeLabel}]  [${q.marks} mark${q.marks > 1 ? "s" : ""}]`, { continued: false });

  doc.font("Helvetica").fontSize(9).fillColor("#222");

  // Question text
  const textLines = doc.text(esc(q.questionText), { width: usableW, lineGap: 2, align: "left" });
  doc.moveDown(0.3);

  // Options
  if (q.options && q.options.length > 0) {
    const optionLabels = ["(A)", "(B)", "(C)", "(D)", "(E)"];
    doc.font("Helvetica").fontSize(9).fillColor("#333");
    for (let i = 0; i < q.options.length; i++) {
      const optText = `${optionLabels[i] || `(${String.fromCharCode(65 + i)})`}  ${esc(q.options[i])}`;
      doc.text(optText, { indent: 20, lineGap: 2 });
    }
  } else {
    doc.font("Helvetica-Oblique").fontSize(9).fillColor("#666");
    doc.text("(Numerical Answer Type — Enter the numerical value)", { indent: 20 });
  }

  // Blank space for answer
  doc.moveDown(0.5);
  const spaceNeeded = q.options && q.options.length > 0 ? 50 : 30;
  if (doc.y + spaceNeeded > pageH - margin) {
    doc.addPage();
  } else {
    doc.moveDown(1.5);
  }

  // Thin separator
  doc.moveTo(margin, doc.y).lineTo(doc.page.width - margin, doc.y).strokeColor("#ddd").lineWidth(0.3).stroke();
  doc.moveDown(0.4);
}

function addAnswerKey(doc: PDFDocument, questions: Question[]) {
  doc.addPage();
  sectionTitle(doc, "ANSWER KEY");

  doc.font("Helvetica").fontSize(9).fillColor("#333");
  const col1 = 50;
  const col2 = 100;
  const col3 = 180;
  const col4 = 260;
  const rowH = 16;

  // Header
  doc.font("Helvetica-Bold");
  doc.text("Q. No.", col1, doc.y);
  doc.text("Type", col2, doc.y);
  doc.text("Answer", col3, doc.y);
  doc.text("Marks", col4, doc.y);
  doc.moveDown(0.2);
  doc.moveTo(col1 - 5, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#333").lineWidth(0.5).stroke();
  doc.moveDown(0.2);

  doc.font("Helvetica");
  for (const q of questions) {
    if (doc.y > doc.page.height - 80) {
      doc.addPage();
    }
    doc.text(String(q.questionNumber), col1, doc.y);
    doc.text(q.questionType, col2, doc.y);
    const ans = q.correctAnswer || "—";
    doc.text(ans, col3, doc.y);
    doc.text(String(q.marks), col4, doc.y);
    doc.moveDown(0.8);
  }
}

function addSolutions(doc: PDFDocument, questions: Question[]) {
  doc.addPage();
  sectionTitle(doc, "DETAILED SOLUTIONS");

  for (const q of questions) {
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1a1a2e");
    doc.text(`Q${q.questionNumber}.`, { continued: false });

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#27ae60");
    doc.text(`Answer: ${q.correctAnswer || "N/A"}`, { continued: false });

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1a1a2e");
    doc.text("Solution:", { continued: false });

    doc.font("Helvetica").fontSize(9).fillColor("#333");
    const explanation = q.explanation || "No explanation available.";
    doc.text(explanation, { width: doc.page.width - 80, lineGap: 2, align: "left" });

    doc.moveDown(0.3);
    doc.font("Helvetica-Oblique").fontSize(8).fillColor("#666");
    doc.text(`Subject: ${q.subject} | Topic: ${q.topic} | Difficulty: ${q.difficulty}`, { align: "left" });

    doc.moveDown(0.4);
    const x = doc.page.width / 2;
    doc.moveTo(x - 60, doc.y).lineTo(x + 60, doc.y).strokeColor("#ddd").lineWidth(0.3).stroke();
    doc.moveDown(0.3);
  }
}

function addBlueprint(doc: PDFDocument, paper: Paper) {
  doc.addPage();
  sectionTitle(doc, "PAPER BLUEPRINT");

  doc.font("Helvetica").fontSize(9).fillColor("#333");

  doc.font("Helvetica-Bold").text("Subject Distribution:", { continued: false });
  doc.font("Helvetica");
  for (const s of paper.subjectBreakdown) {
    doc.text(`  ${s.subject}: ${s.questions} questions, ${s.marks} marks`, { indent: 10 });
  }
  doc.moveDown(0.4);

  doc.font("Helvetica-Bold").text("Difficulty Distribution:", { continued: false });
  doc.font("Helvetica");
  const dd = paper.difficultyDistribution;
  doc.text(`  Easy: ${dd.easy} | Moderate: ${dd.moderate} | Difficult: ${dd.difficult}`, { indent: 10 });
  doc.moveDown(0.4);

  doc.font("Helvetica-Bold").text("Statistics:", { continued: false });
  doc.font("Helvetica");
  doc.text(`  Total Questions: ${paper.totalQuestions}`, { indent: 10 });
  doc.text(`  Total Marks: ${paper.totalMarks}`, { indent: 10 });
  doc.moveDown(0.4);

  doc.font("Helvetica-Oblique").fontSize(8).fillColor("#666");
  doc.text("This blueprint is generated from the actual question distribution in this paper.", { align: "center" });
}

function addCover(doc: PDFDocument, paper: Paper, paperNum: number, branch: string) {
  const branchFull = BRANCH_FULL[branch] || branch;
  const branchName = BRANCH_NAMES[branch] || branch;

  // Top bar
  doc.rect(0, 0, doc.page.width, 8).fill("#c0392b");
  doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill("#c0392b");

  doc.moveDown(4);

  // Title
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#1a1a2e").text("PADHAISHURU", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor("#666").text("GATE Preparation Platform  ·  padhaishuru.com", { align: "center" });
  doc.moveDown(1.5);

  // Main title box
  const boxY = doc.y;
  const boxH = 140;
  doc.rect(50, boxY, doc.page.width - 100, boxH).fill("#f8f9fa");
  doc.rect(50, boxY, doc.page.width - 100, 4).fill("#c0392b");

  doc.moveDown(1);
  doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a1a2e").text("TREND-BASED MOCK PAPER", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#c0392b").text(`GATE ${branchFull}`, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(13).font("Helvetica-Bold").fillColor("#1a1a2e").text(`Mock Paper — 0${paperNum}`, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica").fillColor("#555").text("Full-Length Examination Simulation", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor("#777").text(`Duration: 3 Hours  |  Maximum Marks: ${paper.totalMarks}  |  Questions: ${paper.totalQuestions}`, { align: "center" });

  doc.rect(50, boxY + boxH - 4, doc.page.width - 100, 4).fill("#c0392b");

  doc.moveDown(2.5);

  // Details
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#1a1a2e").text("Examination Details", { align: "center" });
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9).fillColor("#333");

  const details = [
    ["Branch:", branchFull],
    ["Paper:", `Mock 0${paperNum}`],
    ["Total Questions:", String(paper.totalQuestions)],
    ["Total Marks:", String(paper.totalMarks)],
    ["Duration:", "3 Hours"],
    ["Question Types:", "MCQ, MSQ, NAT"],
    ["Negative Marking:", "Yes (MCQ only)"],
    ["Difficulty:", "Mixed"],
  ];

  const col1x = 80;
  const col2x = 200;
  const startY = doc.y;
  for (const [label, value] of details) {
    doc.font("Helvetica-Bold").text(label, col1x, doc.y);
    doc.font("Helvetica").text(value, col2x, doc.y);
    doc.moveDown(0.4);
  }

  doc.moveDown(1.5);

  // Disclaimer
  doc.font("Helvetica-Oblique").fontSize(8).fillColor("#888").text(
    "Unofficial practice material. Not affiliated with or endorsed by GATE/IIT.\nHistorical patterns do not guarantee future examination questions.\nThis is a trend-based practice simulation.",
    { align: "center", lineGap: 2 }
  );

  // Force page break after cover
  doc.addPage();
}

function generatePaperPDF(paper: Paper, paperNum: number, branch: string) {
  const filename = `PadhaiShuru_GATE_${branch}_Trend_Mock_0${paperNum}.pdf`;
  const filepath = path.join(OUT, branch, filename);

  // Ensure directory exists
  fs.mkdirSync(path.join(OUT, branch), { recursive: true });

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `PadhaiShuru GATE ${branch} Trend Mock Paper 0${paperNum}`,
      Author: "PadhaiShuru",
      Subject: `GATE ${BRANCH_FULL[branch]} Mock Paper`,
      Keywords: "GATE, mock, test, " + branch,
    },
  });

  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  // Cover page
  addCover(doc, paper, paperNum, branch);

  // Instructions page
  addInstructions(doc, paper, branch);

  // General Aptitude (first 10 questions)
  const aptQ = paper.questions.filter((q) => q.subject.toLowerCase().includes("aptitude") || q.subject.toLowerCase().includes("general"));
  const techQ = paper.questions.filter((q) => !aptQ.includes(q));

  let currentNum = 1;

  if (aptQ.length > 0) {
    addSectionHeader(doc, "Section A: General Aptitude");
    for (const q of aptQ) {
      addQuestion(doc, q, currentNum);
      currentNum++;
    }
  }

  // Technical section
  const techSectionName = branch === "CS" ? "Computer Science and Information Technology" :
    branch === "EC" ? "Electronics and Communication Engineering" :
    branch === "EE" ? "Electrical Engineering" :
    branch === "ME" ? "Mechanical Engineering" :
    branch === "CE" ? "Civil Engineering" :
    branch === "XE" ? "Engineering Sciences" :
    branch === "XL" ? "Life Sciences" :
    BRANCH_FULL[branch] || branch;

  addSectionHeader(doc, `Section B: ${techSectionName}`);

  // Sort tech questions by subject for better organization
  const subjectOrder: Record<string, number> = {};
  paper.subjectBreakdown.forEach((s, i) => { subjectOrder[s.subject] = i; });

  techQ.sort((a, b) => {
    const sa = subjectOrder[a.subject] ?? 999;
    const sb = subjectOrder[b.subject] ?? 999;
    return sa - sb;
  });

  for (const q of techQ) {
    addQuestion(doc, q, currentNum);
    currentNum++;
  }

  // Answer Key
  addAnswerKey(doc, paper.questions);

  // Solutions
  addSolutions(doc, paper.questions);

  // Paper Blueprint
  addBlueprint(doc, paper);

  doc.end();

  return new Promise<string>((resolve, reject) => {
    stream.on("finish", () => resolve(filepath));
    stream.on("error", reject);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting PDF generation...\n");

  const branches = ["CS", "EC", "EE", "ME", "CE", "IN", "PI", "CH", "BT", "MT", "XE", "XL", "TF", "PE", "EY", "MA", "AR", "AG", "GG", "PH"];

  const results: { branch: string; paper: number; file: string; questions: number; marks: number }[] = [];

  for (const branch of branches) {
    const dataPath = path.join(DATA, `${branch}.json`);
    if (!fs.existsSync(dataPath)) {
      console.log(`SKIP: ${branch} (no data)`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    console.log(`\nGenerating PDFs for ${branch} (${BRANCH_NAMES[branch]})...`);

    for (let i = 0; i < data.papers.length; i++) {
      const paper = data.papers[i] as Paper;
      const paperNum = i + 1;
      try {
        const filepath = await generatePaperPDF(paper, paperNum, branch);
        results.push({
          branch,
          paper: paperNum,
          file: path.basename(filepath),
          questions: paper.totalQuestions,
          marks: paper.totalMarks,
        });
        console.log(`  Mock 0${paperNum}: ${paper.totalQuestions} questions, ${paper.totalMarks} marks -> ${path.basename(filepath)}`);
      } catch (err) {
        console.error(`  ERROR Mock 0${paperNum}:`, err);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("GENERATION COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total branches: ${new Set(results.map(r => r.branch)).size}`);
  console.log(`Total PDFs: ${results.length}`);
  console.log(`Total questions: ${results.reduce((s, r) => s + r.questions, 0)}`);
  console.log(`Total marks: ${results.reduce((s, r) => s + r.marks, 0)}`);
  console.log("\nGenerated files:");
  for (const r of results) {
    console.log(`  ${r.branch}/Mock-0${r.paper}: ${r.questions}Q/${r.marks}M`);
  }
}

main().catch(console.error);
