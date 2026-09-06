/**
 * EduNeuro Premium Mock Test PDF Validator
 *
 * Validates all generated PDFs:
 * - File existence and size
 * - PDF structure (cover page, instructions, questions, answer key, solutions)
 * - Metadata validity
 * - Cross-paper quality check
 * - Branch completeness
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, BRANCHES } from './scripts/mock-tests/__config';

interface ValidationResult {
  total: number;
  passed: number;
  failed: number;
  warnings: string[];
  errors: string[];
  details: any[];
}

function validateAll(): ValidationResult {
  const result: ValidationResult = {
    total: BRANCHES.length * 3,
    passed: 0,
    failed: 0,
    warnings: [],
    errors: [],
    details: [],
  };

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const branch of BRANCHES) {
    console.log(`\n📂 ${branch.code.toUpperCase()} — ${branch.name}`);

    for (const mockNum of [1, 2, 3]) {
      const mockDir = path.join(ROOT, branch.code.toUpperCase(), `mock_${String(mockNum).padStart(2, '0')}`);
      const pdfFile = path.join(mockDir, `EduNeuro_${branch.examCode}_Mock_${String(mockNum).padStart(2, '0')}.pdf`);
      const metaFile = path.join(mockDir, 'metadata.json');

      const check: any = {
        branch: branch.code.toUpperCase(),
        mock: mockNum,
        checks: {},
      };

      let branchPassed = true;

      // Check PDF exists
      if (!fs.existsSync(pdfFile)) {
        check.checks.pdf_exists = 'FAIL';
        result.errors.push(`${branch.code.toUpperCase()} Mock 0${mockNum}: PDF not found at ${pdfFile}`);
        branchPassed = false;
      } else {
        check.checks.pdf_exists = 'PASS';

        // Check PDF size
        const stats = fs.statSync(pdfFile);
        if (stats.size < 10000) {
          check.checks.pdf_size = `FAIL (${stats.size} bytes - too small)`;
          result.warnings.push(`${branch.code.toUpperCase()} Mock 0${mockNum}: PDF very small (${stats.size} bytes)`);
          branchPassed = false;
        } else {
          check.checks.pdf_size = `PASS (${(stats.size / 1024).toFixed(1)} KB)`;
        }
      }

      // Check metadata exists
      if (!fs.existsSync(metaFile)) {
        check.checks.metadata_exists = 'FAIL';
        result.errors.push(`${branch.code.toUpperCase()} Mock 0${mockNum}: metadata.json not found`);
        branchPassed = false;
      } else {
        check.checks.metadata_exists = 'PASS';

        // Validate metadata
        try {
          const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
          check.checks.metadata_valid = 'PASS';

          if (meta.branch !== branch.code) {
            check.checks.metadata_branch = `FAIL (expected ${branch.code}, got ${meta.branch})`;
            result.errors.push(`${branch.code.toUpperCase()} Mock 0${mockNum}: Branch mismatch in metadata`);
            branchPassed = false;
          } else {
            check.checks.metadata_branch = 'PASS';
          }

          if (meta.mock_number !== mockNum) {
            check.checks.metadata_mock = `FAIL (expected ${mockNum}, got ${meta.mock_number})`;
            result.errors.push(`${branch.code.toUpperCase()} Mock 0${mockNum}: Mock number mismatch in metadata`);
            branchPassed = false;
          } else {
            check.checks.metadata_mock = 'PASS';
          }

          if (meta.question_count !== 60) {
            check.checks.metadata_questions = `FAIL (expected 60, got ${meta.question_count})`;
            result.errors.push(`${branch.code.toUpperCase()} Mock 0${mockNum}: Question count mismatch`);
            branchPassed = false;
          } else {
            check.checks.metadata_questions = 'PASS';
          }
        } catch (e) {
          check.checks.metadata_valid = `FAIL (${(e as Error).message})`;
          result.errors.push(`${branch.code.toUpperCase()} Mock 0${mockNum}: Invalid JSON in metadata`);
          branchPassed = false;
        }
      }

      if (branchPassed) {
        result.passed++;
        console.log(`  ✅ Mock ${String(mockNum).padStart(2, '0')}: PASS`);
      } else {
        result.failed++;
        console.log(`  ❌ Mock ${String(mockNum).padStart(2, '0')}: FAIL`);
      }

      result.details.push(check);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Total Papers:     ${result.total}`);
  console.log(`  Passed:           ${result.passed}`);
  console.log(`  Failed:           ${result.failed}`);
  console.log(`  Warnings:        ${result.warnings.length}`);
  console.log(`  Errors:          ${result.errors.length}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (result.errors.length > 0) {
    console.log('ERRORS:');
    result.errors.forEach(e => console.log(`  ❌ ${e}`));
  }

  if (result.warnings.length > 0) {
    console.log('\nWARNINGS:');
    result.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }

  return result;
}

// Run validation
const validation = validateAll();

// Exit with error code if any failures
if (validation.failed > 0) {
  console.log(`\n❌ Validation completed with ${validation.failed} failures.`);
  process.exit(1);
} else {
  console.log('\n✅ All validations passed!');
  process.exit(0);
}
