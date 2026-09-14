/**
 * Generate predicted papers — one-shot script.
 *
 * Reads PYQ data and markdown analysis, then writes predicted papers
 * JSON files to data/predicted-papers/.
 */

import { writePredictedPapers } from "../src/lib/predicted-papers/generator";

writePredictedPapers();
