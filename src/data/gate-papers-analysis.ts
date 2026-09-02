/**
 * GATE PYQ Analysis — Unified Data Barrel
 *
 * This file re-exports complete marks-analysis data for ALL GATE branches.
 * Each branch covers papers from 2007–2026 (20 sessions).
 *
 * Usage:
 *   import { GATE_CSE_SUMMARY, CSE_RAW_DATA, CSE_YEARLY_TOTALS } from '@/data/gate-papers-analysis';
 */

// ── EE ───────────────────────────────────────────────────────────────────────
export { EE_AVAILABLE_YEARS, EE_RAW_DATA, EE_YEARLY_TOTALS, GATE_EE_SUMMARY, EE_DIFFICULTY_DISTRIBUTION } from './gate-ee-analysis';

// ── CSE (legacy) ─────────────────────────────────────────────────────────────
export { ALL_AVAILABLE_YEARS, TOC_YEARLY_MARKS, TOC_TOTAL_MARKS_BY_YEAR, TOC_RAW_DATA, GATE_CSE_SUMMARY, DIFFICULTY_DISTRIBUTION as CSE_DIFFICULTY_DISTRIBUTION } from './gate-cse-analysis';

// ── CSE ───────────────────────────────────────────────────────────────────────
export { CS_AVAILABLE_YEARS, CS_RAW_DATA, CS_YEARLY_TOTALS, GATE_CS_SUMMARY, CS_DIFFICULTY_DISTRIBUTION } from './gate-cs-analysis';

// ── ME ───────────────────────────────────────────────────────────────────────
export { ME_AVAILABLE_YEARS, ME_RAW_DATA, ME_YEARLY_TOTALS, GATE_ME_SUMMARY, ME_DIFFICULTY_DISTRIBUTION } from './gate-me-analysis';

// ── CE ───────────────────────────────────────────────────────────────────────
export { CE_AVAILABLE_YEARS, CE_RAW_DATA, CE_YEARLY_TOTALS, GATE_CE_SUMMARY, CE_DIFFICULTY_DISTRIBUTION } from './gate-ce-analysis';

// ── ECE ──────────────────────────────────────────────────────────────────────
export { ECE_AVAILABLE_YEARS, ECE_RAW_DATA, ECE_YEARLY_TOTALS, GATE_ECE_SUMMARY, ECE_DIFFICULTY_DISTRIBUTION } from './gate-ece-analysis';

// ── IN ───────────────────────────────────────────────────────────────────────
export { IN_AVAILABLE_YEARS, IN_RAW_DATA, IN_YEARLY_TOTALS, GATE_IN_SUMMARY, IN_DIFFICULTY_DISTRIBUTION } from './gate-in-analysis';

// ── CH ───────────────────────────────────────────────────────────────────────
export { CH_AVAILABLE_YEARS, CH_RAW_DATA, CH_YEARLY_TOTALS, GATE_CH_SUMMARY, CH_DIFFICULTY_DISTRIBUTION } from './gate-ch-analysis';

// ── BT ───────────────────────────────────────────────────────────────────────
export { BT_AVAILABLE_YEARS, BT_RAW_DATA, BT_YEARLY_TOTALS, GATE_BT_SUMMARY, BT_DIFFICULTY_DISTRIBUTION } from './gate-bt-analysis';

// ── MT ───────────────────────────────────────────────────────────────────────
export { MT_AVAILABLE_YEARS, MT_RAW_DATA, MT_YEARLY_TOTALS, GATE_MT_SUMMARY, MT_DIFFICULTY_DISTRIBUTION } from './gate-mt-analysis';

// ── PI ───────────────────────────────────────────────────────────────────────
export { PI_AVAILABLE_YEARS, PI_RAW_DATA, PI_YEARLY_TOTALS, GATE_PI_SUMMARY, PI_DIFFICULTY_DISTRIBUTION } from './gate-pi-analysis';

// ── XE ───────────────────────────────────────────────────────────────────────
export { XE_AVAILABLE_YEARS, XE_RAW_DATA, XE_YEARLY_TOTALS, GATE_XE_SUMMARY, XE_SECTIONS, XE_DIFFICULTY_DISTRIBUTION } from './gate-xe-analysis';

// ── XL ───────────────────────────────────────────────────────────────────────
export { XL_AVAILABLE_YEARS, XL_RAW_DATA, XL_YEARLY_TOTALS, GATE_XL_SUMMARY, XL_SECTIONS, XL_DIFFICULTY_DISTRIBUTION } from './gate-xl-analysis';

// ── TF ───────────────────────────────────────────────────────────────────────
export { TF_AVAILABLE_YEARS, TF_RAW_DATA, TF_YEARLY_TOTALS, GATE_TF_SUMMARY, TF_DIFFICULTY_DISTRIBUTION } from './gate-tf-analysis';

// ── PE ───────────────────────────────────────────────────────────────────────
export { PE_AVAILABLE_YEARS, PE_RAW_DATA, PE_YEARLY_TOTALS, GATE_PE_SUMMARY, PE_DIFFICULTY_DISTRIBUTION } from './gate-pe-analysis';

// ── EY ───────────────────────────────────────────────────────────────────────
export { EY_AVAILABLE_YEARS, EY_RAW_DATA, EY_YEARLY_TOTALS, GATE_EY_SUMMARY, EY_DIFFICULTY_DISTRIBUTION } from './gate-ey-analysis';

// ── MA ───────────────────────────────────────────────────────────────────────
export { MA_AVAILABLE_YEARS, MA_RAW_DATA, MA_YEARLY_TOTALS, GATE_MA_SUMMARY, MA_DIFFICULTY_DISTRIBUTION } from './gate-ma-analysis';

// ── AR ───────────────────────────────────────────────────────────────────────
export { AR_AVAILABLE_YEARS, AR_RAW_DATA, AR_YEARLY_TOTALS, GATE_AR_SUMMARY, AR_DIFFICULTY_DISTRIBUTION } from './gate-ar-analysis';

// ── AG ───────────────────────────────────────────────────────────────────────
export { AG_AVAILABLE_YEARS, AG_RAW_DATA, AG_YEARLY_TOTALS, GATE_AG_SUMMARY, AG_DIFFICULTY_DISTRIBUTION } from './gate-ag-analysis';

// ── GG ───────────────────────────────────────────────────────────────────────
export { GG_AVAILABLE_YEARS, GG_RAW_DATA, GG_YEARLY_TOTALS, GATE_GG_SUMMARY, GG_DIFFICULTY_DISTRIBUTION } from './gate-gg-analysis';

// ── PH ───────────────────────────────────────────────────────────────────────
export { PH_AVAILABLE_YEARS, PH_RAW_DATA, PH_YEARLY_TOTALS, GATE_PH_SUMMARY, PH_DIFFICULTY_DISTRIBUTION } from './gate-ph-analysis';
