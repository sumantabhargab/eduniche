const fs = require('fs');
const path = require('path');

const DATA_DIR = 'C:/Users/Sumanta Bhargab/eduniche/eduniche/data/predicted-papers';

function readJson(branch) {
  const file = path.join(DATA_DIR, `${branch}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// Normalize text for comparison: lowercase, collapse whitespace, strip punctuation
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

// Jaccard-like similarity: ratio of shared n-grams
function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1.0;
  // check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  // simple ratio
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  let matches = 0;
  for (let i = 0; i < shorter.length - 5; i++) {
    if (longer.includes(shorter.substring(i, i + 6))) matches++;
  }
  if (shorter.length < 6) return 0;
  return matches / (shorter.length - 5);
}

function findDuplicates(questions, threshold = 0.8) {
  const dupes = [];
  const n = questions.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = similarity(questions[i].questionText, questions[j].questionText);
      if (sim >= threshold) {
        dupes.push({
          q1: questions[i],
          q2: questions[j],
          similarity: sim
        });
      }
    }
  }
  return dupes;
}

function findShortQuestions(questions, minLen = 10) {
  return questions.filter(q => !q.questionText || q.questionText.length < minLen);
}

function findMissingAnswers(questions) {
  return questions.filter(q => {
    const a = q.correctAnswer;
    return a === undefined || a === null || a === '' || (typeof a === 'string' && a.trim() === '');
  });
}

function findNullOptions(questions) {
  return questions.filter(q => {
    if (!q.options || !Array.isArray(q.options)) return true;
    return q.options.length === 0 && !q.questionType.endsWith('NAT');
  });
}

function findBadNegativeMarks(questions) {
  return questions.filter(q => {
    if (q.negativeMarks === 0) return false;
    const expectedNeg = q.marks / 3;
    return Math.abs(q.negativeMarks - expectedNeg) > 0.01;
  });
}

function getSubjectDistribution(paper) {
  const dist = {};
  for (const q of paper.questions) {
    dist[q.subject] = (dist[q.subject] || 0) + q.marks;
  }
  return dist;
}

function getDifficultyDistribution(paper) {
  const dist = { easy: 0, moderate: 0, difficult: 0 };
  for (const q of paper.questions) {
    dist[q.difficulty] = (dist[q.difficulty] || 0) + 1;
  }
  return dist;
}

function auditBranch(branch) {
  const data = readJson(branch);
  const papers = data.papers;
  const report = [];
  report.push(`# GATE ${branch} Mock Papers Audit Report\n`);
  report.push(`**Generated:** 2026-09-15\n`);
  report.push(`**Papers:** ${papers.length}\n`);

  // === SECTION 1: Duplicates within each paper ===
  report.push(`\n---\n## 1. Duplicate Questions WITHIN Each Paper\n`);

  let totalWithinDupes = 0;
  for (const paper of papers) {
    const dupes = findDuplicates(paper.questions, 0.75);
    report.push(`\n### ${paper.id} — ${paper.title}\n`);
    report.push(`Questions: ${paper.questions.length}, Marks: ${paper.totalMarks}\n`);

    if (dupes.length === 0) {
      report.push(`No duplicates found within this paper.\n`);
    } else {
      totalWithinDupes += dupes.length;
      report.push(`Found **${dupes.length}** duplicate pair(s):\n`);
      for (const d of dupes) {
        const q1 = d.q1;
        const q2 = d.q2;
        const txt1 = q1.questionText.length > 120 ? q1.questionText.substring(0, 120) + '...' : q1.questionText;
        const txt2 = q2.questionText.length > 120 ? q2.questionText.substring(0, 120) + '...' : q2.questionText;
        report.push(`- **Q${q1.questionNumber}** (${q1.id}) vs **Q${q2.questionNumber}** (${q2.id}) | Similarity: ${(d.similarity * 100).toFixed(0)}%`);
        report.push(`  - Q${q1.questionNumber}: "${txt1}"`);
        report.push(`  - Q${q2.questionNumber}: "${txt2}"`);
        report.push(``);
      }
    }
  }
  report.push(`\n**Total within-paper duplicate pairs across all ${papers.length} papers: ${totalWithinDupes}**\n`);

  // === SECTION 2: Duplicates across papers ===
  report.push(`\n---\n## 2. Duplicate Questions ACROSS Papers\n`);

  const allQuestions = [];
  for (const paper of papers) {
    for (const q of paper.questions) {
      allQuestions.push({ ...q, paperId: paper.id, paperTitle: paper.title });
    }
  }

  const crossDupes = findDuplicates(allQuestions, 0.75);
  // Group by paper pairs
  const paperPairMap = {};
  for (const d of crossDupes) {
    const key = [d.q1.paperId, d.q2.paperId].sort().join(' vs ');
    if (!paperPairMap[key]) paperPairMap[key] = [];
    paperPairMap[key].push(d);
  }

  let totalCrossDupes = 0;
  for (const [key, dupes] of Object.entries(paperPairMap)) {
    totalCrossDupes += dupes.length;
    report.push(`\n### ${key}\n`);
    for (const d of dupes) {
      const q1 = d.q1;
      const q2 = d.q2;
      const txt1 = q1.questionText.length > 120 ? q1.questionText.substring(0, 120) + '...' : q1.questionText;
      const txt2 = q2.questionText.length > 120 ? q2.questionText.substring(0, 120) + '...' : q2.questionText;
      report.push(`- **Q${q1.questionNumber}** (${q1.id}, in ${q1.paperId}) vs **Q${q2.questionNumber}** (${q2.id}, in ${q2.paperId}) | Similarity: ${(d.similarity * 100).toFixed(0)}%`);
      report.push(`  - "${txt1}"`);
      report.push(`  - "${txt2}"`);
      report.push(``);
    }
  }

  if (totalCrossDupes === 0) {
    report.push(`No cross-paper duplicates found.\n`);
  } else {
    report.push(`\n**Total cross-paper duplicate pairs: ${totalCrossDupes}**\n`);
  }

  // === SECTION 3: Data Quality Issues ===
  report.push(`\n---\n## 3. Data Quality Issues\n`);

  // Short questions
  report.push(`\n### Questions with < 10 characters\n`);
  let shortCount = 0;
  for (const paper of papers) {
    const short = findShortQuestions(paper.questions);
    if (short.length > 0) {
      shortCount += short.length;
      report.push(`\n**${paper.id}:**`);
      for (const q of short) {
        const txt = q.questionText.length > 120 ? q.questionText.substring(0, 120) + '...' : q.questionText;
        report.push(`- Q${q.questionNumber} (${q.id}): "${txt}"`);
      }
    }
  }
  if (shortCount === 0) report.push(`None found.\n`);
  report.push(`\nTotal: ${shortCount}\n`);

  // Missing answers
  report.push(`\n### Questions with missing/null answers\n`);
  let missingAnsCount = 0;
  for (const paper of papers) {
    const missing = findMissingAnswers(paper.questions);
    if (missing.length > 0) {
      missingAnsCount += missing.length;
      report.push(`\n**${paper.id}:**`);
      for (const q of missing) {
        const txt = q.questionText.length > 120 ? q.questionText.substring(0, 120) + '...' : q.questionText;
        report.push(`- Q${q.questionNumber} (${q.id}): "${txt}" — Answer: "${q.correctAnswer}"`);
      }
    }
  }
  if (missingAnsCount === 0) report.push(`None found.\n`);
  report.push(`\nTotal: ${missingAnsCount}\n`);

  // Null options on non-NAT questions
  report.push(`\n### Non-NAT questions with null/empty options\n`);
  let nullOptCount = 0;
  for (const paper of papers) {
    const nullOpt = findNullOptions(paper.questions);
    if (nullOpt.length > 0) {
      nullOptCount += nullOpt.length;
      report.push(`\n**${paper.id}:**`);
      for (const q of nullOpt) {
        const txt = q.questionText.length > 120 ? q.questionText.substring(0, 120) + '...' : q.questionText;
        report.push(`- Q${q.questionNumber} (${q.id}, type: ${q.questionType}): "${txt}"`);
      }
    }
  }
  if (nullOptCount === 0) report.push(`None found.\n`);
  report.push(`\nTotal: ${nullOptCount}\n`);

  // Bad negative marks
  report.push(`\n### Questions with suspicious negative marks\n`);
  let badNegCount = 0;
  for (const paper of papers) {
    const bad = findBadNegativeMarks(paper.questions);
    if (bad.length > 0) {
      badNegCount += bad.length;
      report.push(`\n**${paper.id}:**`);
      for (const q of bad) {
        const txt = q.questionText.length > 120 ? q.questionText.substring(0, 120) + '...' : q.questionText;
        report.push(`- Q${q.questionNumber} (${q.id}): marks=${q.marks}, negativeMarks=${q.negativeMarks} — "${txt}"`);
      }
    }
  }
  if (badNegCount === 0) report.push(`None found.\n`);
  report.push(`\nTotal: ${badNegCount}\n`);

  // === SECTION 4: Subject Distribution ===
  report.push(`\n---\n## 4. Subject Distribution vs Expected Weightage\n`);

  const expectedWeightage = {
    CS: {
      "General Aptitude": 15,
      "Engineering Mathematics": 13,
      "Programming and Data Structures": 12,
      "Algorithms": 10,
      "Operating Systems": 10,
      "Computer Networks": 9,
      "DBMS": 8,
      "Digital Logic": 7,
      "Computer Organization and Architecture": 7,
      "Theory of Computation": 6,
      "Compiler Design": 2,
      "Software Engineering": 1,
    },
    EC: {
      "General Aptitude": 15,
      "Engineering Mathematics": 13,
      "Network, Signals & Systems": 12,
      "Electronic Devices": 11,
      "Analog Circuits": 9,
      "Digital Circuits": 8,
      "Control Systems": 8,
      "Communication Systems": 8,
      "Electromagnetics": 7,
      "Analog & Digital Electronics": 5,
      "Electrical & Electronic Measurements": 4,
    },
    EE: {
      "General Aptitude": 15,
      "Engineering Mathematics": 12,
      "Electrical Machines": 14,
      "Power Systems": 12,
      "Control Systems": 9,
      "Power Electronics": 10,
      "Network Theory": 10,
      "Analog Electronics": 7,
      "Digital Electronics": 6,
      "Signals and Systems": 5,
      "EMFT": 5,
      "Measurements and Instrumentation": 5,
    }
  };

  const expected = expectedWeightage[branch] || {};
  report.push(`\n| Paper | Subject | Expected Marks | Actual Marks | Diff |`);
  report.push(`|-------|---------|---------------|--------------|------|`);

  for (const paper of papers) {
    const actual = getSubjectDistribution(paper);
    report.push(`\n**${paper.id}:**`);
    const allSubjects = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const subj of [...allSubjects].sort((a, b) => (expected[b] || 0) - (expected[a] || 0))) {
      const exp = expected[subj] || 0;
      const act = actual[subj] || 0;
      const diff = act - exp;
      const flag = Math.abs(diff) > 5 ? ' ⚠️' : '';
      report.push(`| ${paper.id} | ${subj} | ${exp} | ${act} | ${diff > 0 ? '+' : ''}${diff}${flag} |`);
    }
  }

  // === SECTION 5: Difficulty Distribution ===
  report.push(`\n\n---\n## 5. Difficulty Distribution\n`);

  report.push(`\n| Paper | Easy | Easy% | Moderate | Mod% | Difficult | Diff% | Target (31/54/15) |`);
  report.push(`|-------|------|-------|----------|------|-----------|-------|-------------------|`);

  for (const paper of papers) {
    const diff = getDifficultyDistribution(paper);
    const total = paper.totalQuestions;
    const easyPct = ((diff.easy / total) * 100).toFixed(1);
    const modPct = ((diff.moderate / total) * 100).toFixed(1);
    const diffPct = ((diff.difficult / total) * 100).toFixed(1);
    report.push(`| ${paper.id} | ${diff.easy} | ${easyPct}% | ${diff.moderate} | ${modPct}% | ${diff.difficult} | ${diffPct}% | 31% / 54% / 15% |`);
  }

  // === SECTION 6: Summary ===
  report.push(`\n\n---\n## 6. Summary\n`);

  let totalQ = 0;
  let totalDupesWithin = 0;
  let totalDupesCross = 0;
  let totalMissingAns = 0;
  let totalShortQ = 0;
  let totalNullOpt = 0;
  let totalBadNeg = 0;

  for (const paper of papers) {
    totalQ += paper.questions.length;
    const dupes = findDuplicates(paper.questions, 0.75);
    totalDupesWithin += dupes.length;
    totalMissingAns += findMissingAnswers(paper.questions).length;
    totalShortQ += findShortQuestions(paper.questions).length;
    totalNullOpt += findNullOptions(paper.questions).length;
    totalBadNeg += findBadNegativeMarks(paper.questions).length;
  }
  totalDupesCross = totalCrossDupes;

  report.push(`\n| Metric | Count |`);
  report.push(`|--------|-------|`);
  report.push(`| Total questions across all papers | ${totalQ} |`);
  report.push(`| Within-paper duplicate pairs | ${totalDupesWithin} |`);
  report.push(`| Cross-paper duplicate pairs | ${totalDupesCross} |`);
  report.push(`| Questions with missing answers | ${totalMissingAns} |`);
  report.push(`| Questions with < 10 chars | ${totalShortQ} |`);
  report.push(`| Non-NAT questions with null options | ${totalNullOpt} |`);
  report.push(`| Questions with wrong negative marks | ${totalBadNeg} |`);
  report.push(``);

  const severity = totalDupesWithin + totalDupesCross > 0 ? 'HIGH' : 'MEDIUM';
  report.push(`\n**Severity: ${severity}** — ${totalDupesWithin} within-paper and ${totalDupesCross} cross-paper duplicate pairs found. ` +
    `These need to be replaced with unique questions before publishing.`);

  report.push(`\n---\n*Audit completed by automated script on 2026-09-15*\n`);

  return report.join('\n');
}

// Run audits
const branches = ['CS', 'EC', 'EE'];
for (const branch of branches) {
  const report = auditBranch(branch);
  const outputFile = path.join(DATA_DIR, `audit-${branch}.md`);
  fs.writeFileSync(outputFile, report, 'utf-8');
  console.log(`Written: ${outputFile}`);
}

console.log('All audits complete.');
