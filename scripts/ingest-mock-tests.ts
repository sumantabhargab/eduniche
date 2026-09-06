/**
 * Admin Ingestion Script for Mock Tests
 *
 * This script reads mock test PDFs and metadata from the local filesystem
 * and ingests them into the EduNeuro application via the admin API.
 *
 * Usage:
 *   npx tsx scripts/ingest-mock-tests.ts [branch] [mockNumber]
 *
 * If no arguments provided, ingests all branches and all mocks.
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SITE_URL must point to the running EduNeuro instance
 *   - You must be logged in as admin (session cookie required)
 *   - PDFs must exist at premium_mock_tests/BRANCH/mock_N/
 *
 * The script uses the browser cookie store for authentication.
 * Run it from a browser tab where you're already logged in as admin,
 * or use the Playwright-based version below.
 */

import * as fs from "fs";
import * as path from "path";

interface MockTestMeta {
  branch: string;
  branch_code: string;
  branch_name: string;
  mock_number: number;
  title: string;
  question_count: number;
  maximum_marks: number;
  duration_minutes: number;
  subject_distribution: Array<{ name: string; questions: number; marks: number }>;
  difficulty_distribution: { easy: number; moderate: number; hard: number };
  generation_basis?: string;
  visibility?: string;
  metadata?: Record<string, any>;
}

const MOCK_TESTS_ROOT = path.join(process.cwd(), "premium_mock_tests");

// Branch definitions matching the application
const BRANCHES = [
  { code: "cse", name: "Computer Science & Engineering" },
  { code: "ece", name: "Electronics & Communication Engineering" },
  { code: "ee", name: "Electrical Engineering" },
  { code: "me", name: "Mechanical Engineering" },
  { code: "ce", name: "Civil Engineering" },
  { code: "in", name: "Instrumentation Engineering" },
  { code: "pi", name: "Production & Industrial Engineering" },
  { code: "da", name: "Data Science & AI" },
];

/**
 * Read metadata.json for a mock test
 */
function readMetadata(branchDir: string, mockDir: string): MockTestMeta | null {
  const metaPath = path.join(branchDir, mockDir, "metadata.json");
  if (!fs.existsSync(metaPath)) {
    console.warn(`  ⚠ No metadata.json found at ${metaPath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(metaPath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.warn(`  ⚠ Failed to parse metadata.json: ${e}`);
    return null;
  }
}

/**
 * Find the PDF file for a mock test
 */
function findPdf(branchDir: string, mockDir: string): string | null {
  const mockPath = path.join(branchDir, mockDir);
  if (!fs.existsSync(mockPath)) return null;

  const files = fs.readdirSync(mockPath).filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (files.length === 0) return null;

  // Prefer files starting with "EduNeuro"
  const eduNeuro = files.filter((f) => f.startsWith("EduNeuro"));
  return path.join(mockPath, eduNeuro[0] || files[0]);
}

/**
 * Ingest a single mock test via the admin API
 */
async function ingestMockTest(
  pdfPath: string,
  metadata: MockTestMeta,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const pdfBuffer = fs.readFileSync(pdfPath);

  const formData = new FormData();
  formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), path.basename(pdfPath));
  formData.append("metadata", JSON.stringify(metadata));

  const response = await fetch(`${baseUrl}/api/admin/mock-tests`, {
    method: "POST",
    body: formData,
    // Note: cookies are automatically included by the browser when running as a script
    // For Node.js execution, you'd need to pass credentials
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    return { success: false, error: error.error || response.statusText };
  }

  return { success: true };
}

/**
 * Main ingestion function
 */
async function ingestAll(branchFilter?: string, mockFilter?: number) {
  console.log("\n🔍 Scanning for mock tests...\n");

  if (!fs.existsSync(MOCK_TESTS_ROOT)) {
    console.error(`❌ Mock tests root directory not found: ${MOCK_TESTS_ROOT}`);
    console.error("   Please ensure PDFs are generated before running ingestion.");
    process.exit(1);
  }

  const branches = fs
    .readdirSync(MOCK_TESTS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (branches.length === 0) {
    console.error("❌ No branch directories found in premium_mock_tests/");
    process.exit(1);
  }

  // Filter branches if specified
  const targetBranches = branchFilter
    ? branches.filter((b) => b.toLowerCase() === branchFilter.toLowerCase())
    : branches;

  if (branchFilter && targetBranches.length === 0) {
    console.error(`❌ Branch "${branchFilter}" not found. Available branches: ${branches.join(", ")}`);
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  console.log(`🌐 Target: ${baseUrl}/api/admin/mock-tests`);
  console.log(`📁 Root: ${MOCK_TESTS_ROOT}\n`);

  let totalIngested = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const branch of targetBranches) {
    const branchDir = path.join(MOCK_TESTS_ROOT, branch);

    // Read branch metadata from the first mock's metadata
    const mockDirs = fs
      .readdirSync(branchDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((d) => d.startsWith("mock_"))
      .sort();

    if (mockDirs.length === 0) {
      console.log(`⚠ ${branch}: No mock_* directories found. Skipping.`);
      totalSkipped++;
      continue;
    }

    console.log(`📂 ${branch} (${mockDirs.length} mocks found)`);

    for (const mockDir of mockDirs) {
      const mockNumber = parseInt(mockDir.replace("mock_", ""), 10);

      // Filter mock number if specified
      if (mockFilter && mockNumber !== mockFilter) {
        continue;
      }

      const metadata = readMetadata(branchDir, mockDir);
      const pdfPath = findPdf(branchDir, mockDir);

      if (!metadata) {
        console.log(`  ⚠ ${mockDir}: No valid metadata. Skipping.`);
        totalSkipped++;
        continue;
      }

      if (!pdfPath) {
        console.log(`  ⚠ ${mockDir}: No PDF found. Skipping.`);
        totalSkipped++;
        continue;
      }

      // Inject branch code from directory name if missing
      if (!metadata.branch) {
        metadata.branch = branch.toLowerCase();
      }
      if (!metadata.branch_code) {
        metadata.branch_code = branch.toUpperCase();
      }
      if (!metadata.branch_name) {
        const branchInfo = BRANCHES.find((b) => b.code.toLowerCase() === branch.toLowerCase());
        metadata.branch_name = branchInfo?.name || branch;
      }

      const pdfSize = fs.statSync(pdfPath).size;
      const pdfSizeMB = (pdfSize / (1024 * 1024)).toFixed(1);

      console.log(`  📄 ${mockDir}: ${metadata.title} (${pdfSizeMB} MB)`);

      const result = await ingestMockTest(pdfPath, metadata, baseUrl);

      if (result.success) {
        console.log(`     ✅ Ingested successfully`);
        totalIngested++;
      } else {
        console.log(`     ❌ Failed: ${result.error}`);
        totalFailed++;
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 INGESTION SUMMARY");
  console.log("=".repeat(50));
  console.log(`  Total ingested:  ${totalIngested}`);
  console.log(`  Total skipped:   ${totalSkipped}`);
  console.log(`  Total failed:    ${totalFailed}`);
  console.log("=".repeat(50) + "\n");

  if (totalFailed > 0) {
    console.log("⚠ Some tests failed to ingest. Check the errors above.");
    process.exit(1);
  }
}

// CLI entry point
const args = process.argv.slice(2);
const branchArg = args[0];
const mockArg = args[1] ? parseInt(args[1], 10) : undefined;

if (mockArg && isNaN(mockArg)) {
  console.error("Usage: npx tsx scripts/ingest-mock-tests.ts [branch] [mockNumber]");
  console.error("  branch: cse, ece, ee, me, ce, in, pi, da");
  console.error("  mockNumber: 1, 2, 3 (optional)");
  process.exit(1);
}

ingestAll(branchArg, mockArg).catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
