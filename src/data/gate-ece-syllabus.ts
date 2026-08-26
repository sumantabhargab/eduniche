/**
 * GATE ECE Syllabus Taxonomy — structured hierarchy for analysis and navigation.
 *
 * Organized by the official GATE ECE syllabus structure (8 sections + General Aptitude).
 * Each node has: id, name, canonical_name, node_type, parent_id, aliases, description.
 */

import type { SyllabusNode, TaxonomyTree } from "./gate-cse-syllabus";

/**
 * GATE ECE syllabus structure based on official GATE syllabus.
 * Source: https://practicepaper.in/gate-ec/gate-ec-syllabus
 */
export const GATE_ECE_SYLLABUS: SyllabusNode[] = [
  // ─── GENERAL APTITUDE ───
  {
    id: "ga",
    name: "General Aptitude",
    canonicalName: "General Aptitude",
    nodeType: "unit",
    parentId: null,
    aliases: ["GA", "Aptitude", "Verbal Aptitude", "Quantitative Aptitude"],
    description: "Verbal ability, quantitative aptitude, analytical reasoning",
  },
  {
    id: "ga-verbal",
    name: "Verbal Aptitude",
    canonicalName: "Verbal Aptitude",
    nodeType: "topic",
    parentId: "ga",
    aliases: ["English", "Verbal", "Reading Comprehension", "RC"],
    description: "English grammar, vocabulary, reading comprehension",
  },
  {
    id: "ga-quant",
    name: "Quantitative Aptitude",
    canonicalName: "Quantitative Aptitude",
    nodeType: "topic",
    parentId: "ga",
    aliases: ["Quant", "Quantitative", "Numerical Ability", "Maths Aptitude"],
    description: "Numerical computation, data interpretation, percentages, ratios",
  },
  {
    id: "ga-reasoning",
    name: "Analytical Reasoning",
    canonicalName: "Analytical Reasoning",
    nodeType: "topic",
    parentId: "ga",
    aliases: ["Reasoning", "Analytical", "Logical Reasoning", "Data Interpretation"],
    description: "Logical deduction, data interpretation, spatial reasoning",
  },
  {
    id: "ga-spatial",
    name: "Spatial Aptitude",
    canonicalName: "Spatial Aptitude",
    nodeType: "topic",
    parentId: "ga",
    aliases: ["Spatial", "Paper Folding", "Patterns"],
    description: "Transformation of shapes, paper folding, patterns in 2D/3D",
  },

  // ─── ENGINEERING MATHEMATICS ───
  {
    id: "em",
    name: "Engineering Mathematics",
    canonicalName: "Engineering Mathematics",
    nodeType: "unit",
    parentId: null,
    aliases: ["EM", "Engineering Maths", "Mathematics"],
    description: "Linear algebra, calculus, differential equations, probability",
  },
  {
    id: "em-linear-algebra",
    name: "Linear Algebra",
    canonicalName: "Linear Algebra",
    nodeType: "topic",
    parentId: "em",
    aliases: ["LA", "Matrices", "Matrix", "Eigenvalues", "Eigenvectors"],
    description: "Vector space, matrix algebra, eigenvalues, eigenvectors, rank",
  },
  {
    id: "em-calculus",
    name: "Calculus",
    canonicalName: "Calculus",
    nodeType: "topic",
    parentId: "em",
    aliases: ["Limits", "Derivatives", "Integration", "Maxima Minima"],
    description: "Mean value theorems, integral calculus, partial derivatives, Taylor series",
  },
  {
    id: "em-diff-eq",
    name: "Differential Equations",
    canonicalName: "Differential Equations",
    nodeType: "topic",
    parentId: "em",
    aliases: ["ODE", "PDE", "Differential Equations"],
    description: "First-order, higher-order linear, Cauchy's/Euler equations, PDE",
  },
  {
    id: "em-complex",
    name: "Complex Analysis",
    canonicalName: "Complex Analysis",
    nodeType: "topic",
    parentId: "em",
    aliases: ["Complex", "Analytic Functions", "Residue Theorem"],
    description: "Analytic functions, Cauchy's theorem, residue theorem, Laurent series",
  },
  {
    id: "em-probability",
    name: "Probability and Statistics",
    canonicalName: "Probability and Statistics",
    nodeType: "topic",
    parentId: "em",
    aliases: ["Probability", "Statistics", "Random Variables", "Distributions"],
    description: "Mean, median, mode, probability distributions, joint/conditional probability",
  },

  // ─── NETWORKS, SIGNALS AND SYSTEMS ───
  {
    id: "ece-nss",
    name: "Networks, Signals and Systems",
    canonicalName: "Networks, Signals and Systems",
    nodeType: "unit",
    parentId: null,
    aliases: ["NSS", "Networks & Signals"],
    description: "Circuit analysis, signals, LTI systems, 2-port networks",
  },
  {
    id: "ece-nt",
    name: "Network Theory",
    canonicalName: "Network Theory",
    nodeType: "topic",
    parentId: "ece-nss",
    aliases: ["Networks", "Circuit Theory", "Network Analysis"],
    description: "Node/mesh analysis, theorems, 2-port networks, transient/steady state",
  },
  {
    id: "ece-ss",
    name: "Signals and Systems",
    canonicalName: "Signals and Systems",
    nodeType: "topic",
    parentId: "ece-nss",
    aliases: ["Signals", "S&S"],
    description: "Fourier, Laplace, z-transform, sampling, LTI systems, DTFT, DFT",
  },

  // ─── ELECTRONIC DEVICES ───
  {
    id: "ece-ed",
    name: "Electronic Devices",
    canonicalName: "Electronic Devices",
    nodeType: "unit",
    parentId: null,
    aliases: ["Devices", "ED", "Semiconductor Devices"],
    description: "PN junction, BJT, MOSFET, energy bands, carrier transport",
  },

  // ─── ANALOG CIRCUITS ───
  {
    id: "ece-ac",
    name: "Analog Circuits",
    canonicalName: "Analog Circuits",
    nodeType: "unit",
    parentId: null,
    aliases: ["Analog", "AC", "Analog Electronics"],
    description: "Diode circuits, BJT/MOSFET amplifiers, op-amp circuits",
  },

  // ─── DIGITAL CIRCUITS ───
  {
    id: "ece-de",
    name: "Digital Electronics",
    canonicalName: "Digital Electronics",
    nodeType: "unit",
    parentId: null,
    aliases: ["Digital", "DC", "Digital Logic", "DLD"],
    description: "Boolean algebra, combinational/sequential circuits, ADC/DAC, memories",
  },

  // ─── CONTROL SYSTEMS ───
  {
    id: "ece-cs",
    name: "Control Systems",
    canonicalName: "Control Systems",
    nodeType: "unit",
    parentId: null,
    aliases: ["CS", "Control"],
    description: "Transfer function, stability, root locus, compensation, state variables",
  },

  // ─── COMMUNICATIONS ───
  {
    id: "ece-comm",
    name: "Communication Systems",
    canonicalName: "Communication Systems",
    nodeType: "unit",
    parentId: null,
    aliases: ["Communications", "COMM", "Analog & Digital Communication"],
    description: "Random processes, AM/FM, PCM, digital modulation, information theory",
  },

  // ─── ELECTROMAGNETICS ───
  {
    id: "ece-em",
    name: "Electromagnetics",
    canonicalName: "Electromagnetics",
    nodeType: "unit",
    parentId: null,
    aliases: ["EM", "Electromagnetic"],
    description: "Maxwell's equations, wave propagation, transmission lines, antennas",
  },
];

/**
 * GATE ECE taxonomy tree.
 */
export const GATE_ECE_TAXONOMY: TaxonomyTree = {
  paperId: "gate-ece",
  nodes: GATE_ECE_SYLLABUS,
  roots: ["ga", "em", "ece-nss", "ece-ed", "ece-ac", "ece-de", "ece-cs", "ece-comm", "ece-em"],
};

/**
 * Pre-built maps for the GATE ECE syllabus.
 */
export const GATE_ECE_NODE_MAP = new Map(
  GATE_ECE_SYLLABUS.map((n) => [n.id, n])
);

export function buildEceChildrenMap(): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const node of GATE_ECE_SYLLABUS) {
    if (node.parentId) {
      const existing = children.get(node.parentId) || [];
      existing.push(node.id);
      children.set(node.parentId, existing);
    }
  }
  return children;
}

export const GATE_ECE_CHILDREN_MAP = buildEceChildrenMap();
