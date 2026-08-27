/**
 * GATE IN Syllabus Taxonomy — structured hierarchy for analysis and navigation.
 *
 * Organized by the official GATE Instrumentation Engineering syllabus.
 * Each node has: id, name, canonical_name, node_type, parent_id, aliases, description.
 */

import type { SyllabusNode, TaxonomyTree } from "./gate-cse-syllabus";

/**
 * GATE Instrumentation Engineering syllabus structure based on official GATE syllabus.
 * Source: https://practicepaper.in/gate-in/gate-in-syllabus
 * (official GATE IN syllabus: IISc/IIT guidelines)
 *
 * 8 subjects + General Aptitude
 */

export const GATE_IN_SYLLABUS: SyllabusNode[] = [
  // ─── GENERAL APTITUDE ───
  {
    id: "in-ga",
    name: "General Aptitude",
    canonicalName: "General Aptitude",
    nodeType: "unit",
    parentId: null,
    aliases: ["GA", "Aptitude", "Verbal Aptitude", "Quantitative Aptitude"],
    description: "Verbal ability, quantitative aptitude, analytical reasoning",
  },
  {
    id: "in-ga-verbal",
    name: "Verbal Aptitude",
    canonicalName: "Verbal Aptitude",
    nodeType: "topic",
    parentId: "in-ga",
    aliases: ["English", "Verbal", "Reading Comprehension", "RC"],
    description: "English grammar, vocabulary, reading comprehension",
  },
  {
    id: "in-ga-quant",
    name: "Quantitative Aptitude",
    canonicalName: "Quantitative Aptitude",
    nodeType: "topic",
    parentId: "in-ga",
    aliases: ["Quant", "Quantitative", "Numerical Ability", "Maths Aptitude"],
    description: "Numerical computation, data interpretation, percentages, ratios",
  },
  {
    id: "in-ga-reasoning",
    name: "Analytical Reasoning",
    canonicalName: "Analytical Reasoning",
    nodeType: "topic",
    parentId: "in-ga",
    aliases: ["Reasoning", "Analytical", "Logical Reasoning", "Data Interpretation"],
    description: "Logical deduction, data interpretation, spatial reasoning",
  },
  {
    id: "in-ga-spatial",
    name: "Spatial Aptitude",
    canonicalName: "Spatial Aptitude",
    nodeType: "topic",
    parentId: "in-ga",
    aliases: ["Spatial", "Paper Folding", "Patterns"],
    description: "Transformation of shapes, paper folding, patterns in 2D/3D",
  },

  // ─── ENGINEERING MATHEMATICS ───
  {
    id: "in-math",
    name: "Engineering Mathematics",
    canonicalName: "Engineering Mathematics",
    nodeType: "unit",
    parentId: null,
    aliases: ["EM", "Engineering Maths", "Mathematics"],
    description: "Linear algebra, calculus, differential equations, probability",
  },

  // ─── SENSORS & INDUSTRIAL INSTRUMENTATION ───
  {
    id: "in-sensors",
    name: "Sensors & Industrial Instrumentation",
    canonicalName: "Sensors and Industrial Instrumentation",
    nodeType: "unit",
    parentId: null,
    aliases: ["Sensors", "Industrial Instrumentation", "SI", "Transducers"],
    description: "Sensors, transducers, signal conditioning, industrial instruments",
  },

  // ─── MEASUREMENT ───
  {
    id: "in-measurement",
    name: "Measurement",
    canonicalName: "Measurement",
    nodeType: "unit",
    parentId: null,
    aliases: ["Measurements", "Measuring Instruments", "Error Analysis"],
    description: "Error analysis, measuring instruments, bridges, CRO, DVM",
  },

  // ─── ANALOG ELECTRONICS ───
  {
    id: "in-analog",
    name: "Analog Electronics",
    canonicalName: "Analog Electronics",
    nodeType: "unit",
    parentId: null,
    aliases: ["Analog", "AE", "Analog Circuits", "Op-Amp"],
    description: "Diode circuits, BJT/MOSFET amplifiers, op-amp circuits, oscillators",
  },

  // ─── DIGITAL ELECTRONICS ───
  {
    id: "in-digital",
    name: "Digital Electronics",
    canonicalName: "Digital Electronics",
    nodeType: "unit",
    parentId: null,
    aliases: ["Digital", "DE", "Digital Logic", "DLD"],
    description: "Boolean algebra, combinational/sequential circuits, ADC/DAC, microprocessors",
  },

  // ─── CONTROL SYSTEMS ───
  {
    id: "in-control",
    name: "Control Systems",
    canonicalName: "Control Systems",
    nodeType: "unit",
    parentId: null,
    aliases: ["CS", "Control", "Feedback Control"],
    description: "Transfer function, stability, root locus, compensation, state variables",
  },

  // ─── SIGNALS & SYSTEMS ───
  {
    id: "in-signals",
    name: "Signals & Systems",
    canonicalName: "Signals and Systems",
    nodeType: "unit",
    parentId: null,
    aliases: ["Signals", "S&S", "Signal Processing"],
    description: "Fourier, Laplace, z-transform, sampling, LTI systems, DTFT, DFT",
  },
];

/**
 * GATE IN taxonomy tree.
 */
export const GATE_IN_TAXONOMY: TaxonomyTree = {
  paperId: "gate-in",
  nodes: GATE_IN_SYLLABUS,
  roots: ["in-ga", "in-math", "in-sensors", "in-measurement", "in-analog", "in-digital", "in-control", "in-signals"],
};

/**
 * Pre-built maps for the GATE IN syllabus.
 */
export const GATE_IN_NODE_MAP = new Map(
  GATE_IN_SYLLABUS.map((n) => [n.id, n])
);

export function buildInChildrenMap(): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const node of GATE_IN_SYLLABUS) {
    if (node.parentId) {
      const existing = children.get(node.parentId) || [];
      existing.push(node.id);
      children.set(node.parentId, existing);
    }
  }
  return children;
}

export const GATE_IN_CHILDREN_MAP = buildInChildrenMap();
