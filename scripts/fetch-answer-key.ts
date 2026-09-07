/**
 * GATE Answer Key Fetcher
 *
 * Tries multiple sources to find official answer keys:
 * 1. Official GATE website (organized by institute)
 * 2. GATEOverflow
 * 3. Other educational sources
 */

import https from "https";
import http from "http";
import { URL } from "url";

interface AnswerKey {
  year: number;
  branch: string;
  session: string;
  answers: Record<number, string>; // question_number -> answer
  source: string;
  sourceUrl: string;
  retrievedAt: string;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        fetchUrl(redirectUrl).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// ─── GATEOverflow answer key fetcher ─────────────────────────────────────────

async function fetchGateOverflowAnswerKey(year: number, branch: string): Promise<AnswerKey | null> {
  // GATEOverflow has answer keys in various formats
  const urls = [
    `https://gateoverflow.in/api/gate${year}/${branch.toLowerCase()}`,
    `https://gateoverflow.in/answers/${year}/${branch}`,
    `https://gateoverflow.in/gate${year}/${branch}`,
  ];

  for (const url of urls) {
    try {
      const html = await fetchUrl(url);

      // Try to parse as JSON first
      try {
        const data = JSON.parse(html);
        if (data.answers || data.answerKey) {
          const answers: Record<number, string> = {};
          const answerData = data.answers || data.answerKey;
          for (const [key, val] of Object.entries(answerData)) {
            const num = parseInt(key);
            if (!isNaN(num)) {
              answers[num] = String(val).toUpperCase();
            }
          }
          return {
            year,
            branch,
            session: "1",
            answers,
            source: "gateoverflow",
            sourceUrl: url,
            retrievedAt: new Date().toISOString(),
          };
        }
      } catch {
        // Not JSON, try HTML parsing
        // GATEOverflow often has answers in a table format
        const answerRegex = /Q\.\s*(\d+)\s*[:\-]?\s*([A-D]|NAT)/gi;
        const answers: Record<number, string> = {};
        let m;
        while ((m = answerRegex.exec(html)) !== null) {
          const qNum = parseInt(m[1]);
          if (!isNaN(qNum)) {
            answers[qNum] = m[2].toUpperCase();
          }
        }
        if (Object.keys(answers).length > 5) {
          return {
            year,
            branch,
            session: "1",
            answers,
            source: "gateoverflow",
            sourceUrl: url,
            retrievedAt: new Date().toISOString(),
          };
        }
      }
    } catch {
      // Continue to next URL
    }
  }

  return null;
}

// ─── Official GATE answer key fetcher ────────────────────────────────────────

async function fetchOfficialAnswerKey(year: number, branch: string): Promise<AnswerKey | null> {
  // Official answer keys are hosted on the organizing institute's website
  const organizingInstitutes: Record<number, string> = {
    2025: "gate2026.iitg.ac.in",
    2024: "gate2026.iitg.ac.in",
    2023: "gate2024.iitb.ac.in",
    2022: "gate2023.iitbombay.org",
    2021: "gate2022.iitk.ac.in",
    2020: "gate.iitd.ac.in",
    2019: "gate.iitm.ac.in",
    2018: "gate.iitg.ac.in",
    2017: "gate.iitg.ac.in",
    2016: "gate.iitg.ac.in",
  };

  const host = organizingInstitutes[year];
  if (!host) return null;

  // Try common answer key URL patterns
  const answerUrls = [
    `https://${host}/doc/download/${year}/${branch}AK.pdf`,
    `https://${host}/doc/download/${year}/answer_key/${branch}.pdf`,
    `https://${host}/answerkey/${year}/${branch}`,
  ];

  for (const url of answerUrls) {
    try {
      // Just check if accessible
      const html = await fetchUrl(url);
      if (html.length > 100) {
        // Found something - we'd need OCR/parsing here for PDF
        // For now, store the URL as reference
        return {
          year,
          branch,
          session: "1",
          answers: {},
          source: "official",
          sourceUrl: url,
          retrievedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Continue
    }
  }

  return null;
}

// ─── Answer key aggregator ───────────────────────────────────────────────────

export async function fetchAnswerKey(year: number, branch: string, session: string = "1"): Promise<AnswerKey | null> {
  console.log(`  🔑 Fetching answer key: ${branch} ${year} Session ${session}`);

  // Try GATEOverflow first (community-verified)
  const goKey = await fetchGateOverflowAnswerKey(year, branch);
  if (goKey && Object.keys(goKey.answers).length > 0) {
    console.log(`    ✅ GATEOverflow: ${Object.keys(goKey.answers).length} answers`);
    return goKey;
  }

  // Try official source
  const officialKey = await fetchOfficialAnswerKey(year, branch);
  if (officialKey) {
    console.log(`    ✅ Official: ${officialKey.sourceUrl}`);
    return officialKey;
  }

  console.log(`    ⚠ No answer key found for ${branch} ${year}`);
  return null;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const year = parseInt(process.argv[2]);
const branch = process.argv[3];

if (year && branch) {
  fetchAnswerKey(year, branch).then((key) => {
    if (key) {
      console.log("\nAnswer key:", JSON.stringify(key, null, 2));
    } else {
      console.log("No answer key found");
    }
  });
} else {
  console.log("Usage: tsx fetch-answer-key.ts <year> <branch>");
}
