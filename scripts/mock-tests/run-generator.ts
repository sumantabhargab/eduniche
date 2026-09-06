/**
 * EduNeuro Premium Mock Test Generator — Main Runner
 *
 * Generates 3 full-scale mock papers for each of the 20 GATE branches.
 * Output: premium_mock_tests/BRANCH/mock_NN/EduNeuro_BRANCH_Mock_NN.pdf + metadata.json
 *
 * Usage:
 *   npx tsx scripts/mock-tests/run-generator.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { BRANCHES, ROOT } from './__config';
import { generateAllBranches } from './generators';

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  EduNeuro Premium Mock Test Generator');
  console.log('═══════════════════════════════════════════════════════\n');

  await generateAllBranches();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
