/**
 * Branch classifier for the AI Doubt Engine.
 *
 * Uses keyword matching to identify which GATE branch a question
 * is about. Falls back to a simple scoring system across branches.
 */

import type { GATESyllabus, SubjectProfile } from "../../../types/index";
import { SYLLABUS } from "../../../config/syllabus";

interface BranchKeywordScore {
  branchId: string;
  score: number;
  matchedKeywords: string[];
}

/** Keyword map: concept → [(branchId, weight)] */
const KEYWORD_MAP: Record<string, Array<[string, number]>> = {
  // CSE
  "turing": [["cse", 3]],
  "automata": [["cse", 3]],
  "pda": [["cse", 3]],
  "context free": [["cse", 3]],
  "regular expression": [["cse", 2]],
  "decidab": [["cse", 3]],
  "halting": [["cse", 3]],
  "np complete": [["cse", 3]],
  "dynamic programming": [["cse", 3]],
  "knapsack": [["cse", 2]],
  "lcs": [["cse", 2]],
  "matrix chain": [["cse", 2]],
  "sorting": [["cse", 2]],
  "graph": [["cse", 2]],
  "tree": [["cse", 1]],
  "linked list": [["cse", 1]],
  "stack": [["cse", 1]],
  "queue": [["cse", 1]],
  "dbms": [["cse", 3]],
  "normalization": [["cse", 3]],
  "sql": [["cse", 2]],
  "transaction": [["cse", 2]],
  "acid": [["cse", 2]],
  "indexing": [["cse", 2]],
  "join": [["cse", 1]],
  "operating system": [["cse", 3]],
  "deadlock": [["cse", 2]],
  "scheduling": [["cse", 2], ["pi", 2]],
  "memory management": [["cse", 2]],
  "virtual memory": [["cse", 2]],
  "page replacement": [["cse", 2]],
  "computer network": [["cse", 3]],
  "tcp": [["cse", 2]],
  "udp": [["cse", 1]],
  "routing": [["cse", 2]],
  "ip address": [["cse", 2]],
  "subnet": [["cse", 2]],
  "osi": [["cse", 1]],
  "dns": [["cse", 1]],
  "digital logic": [["cse", 2]],
  "boolean": [["cse", 1]],
  "kmap": [["cse", 1]],
  "combinational": [["cse", 1]],
  "sequential circuit": [["cse", 1]],
  "flip flop": [["cse", 1]],
  "computer organization": [["cse", 2]],
  "alu": [["cse", 1]],
  "pipeline": [["cse", 2]],
  "cache": [["cse", 2]],
  "software engineering": [["cse", 2]],
  "sdlc": [["cse", 1]],
  "testing": [["cse", 1]],
  "uml": [["cse", 1]],
  "oops": [["cse", 1]],
  "pointer": [["cse", 1]],
  "recursion": [["cse", 1]],
  "array": [["cse", 1]],
  "heap": [["cse", 1]],
  "hash": [["cse", 1]],
  "binary search": [["cse", 1]],
  "greedy": [["cse", 1]],

  // ECE
  "op amp": [["ece", 3]],
  "operational amplifier": [["ece", 3]],
  "bjt": [["ece", 2]],
  "mosfet": [["ece", 2]],
  "pn junction": [["ece", 2]],
  "diode": [["ece", 1]],
  "transistor": [["ece", 2]],
  "feedback": [["ece", 2]],
  "oscillator": [["ece", 1]],
  "signal": [["ece", 2]],
  "fourier": [["ece", 2]],
  "laplace": [["ece", 2]],
  "z transform": [["ece", 2]],
  "sampling": [["ece", 2]],
  "lti": [["ece", 2]],
  "control system": [["ece", 3]],
  "root locus": [["ece", 3]],
  "bode plot": [["ece", 3]],
  "nyquist": [["ece", 2]],
  "state space": [["ece", 2]],
  "compensator": [["ece", 2]],
  "transfer function": [["ece", 2]],
  "network": [["ece", 1]],
  "verilog": [["ece", 1]],
  "hdl": [["ece", 1]],
  "communication": [["ece", 1]],
  "antenna": [["ece", 1]],
  "modulation": [["ece", 1]],
  "em wave": [["ece", 2]],
  "electromagnetics": [["ece", 2]],
  "microwave": [["ece", 1]],

  // EE
  "power system": [["ee", 3]],
  "transformer": [["ee", 3]],
  "alternator": [["ee", 2]],
  "synchronous machine": [["ee", 2]],
  "induction motor": [["ee", 2]],
  "dc machine": [["ee", 2]],
  "transmission line": [["ee", 2]],
  "fault analysis": [["ee", 3]],
  "load flow": [["ee", 2]],
  "circuit breaker": [["ee", 1]],
  "protective relay": [["ee", 1]],
  "power factor": [["ee", 2]],
  "generator": [["ee", 1]],
  "circuit": [["ee", 1]],
  "kirchhoff": [["ee", 1]],
  "thevenin": [["ee", 1]],
  "norton": [["ee", 1]],
  "superposition": [["ee", 1]],
  "maxwell": [["ee", 1]],

  // ME
  "strength of material": [["me", 3]],
  "stress": [["me", 2]],
  "strain": [["me", 2]],
  "bending moment": [["me", 2]],
  "torsion": [["me", 2]],
  "buckling": [["me", 2]],
  "euler": [["me", 1]],
  "theory of machine": [["me", 3]],
  "kinematics": [["me", 2]],
  "dynamics": [["me", 2]],
  "gear": [["me", 1]],
  "cam": [["me", 1]],
  "vibration": [["me", 2]],
  "thermodynamics": [["me", 3]],
  "entropy": [["me", 2]],
  "carnot": [["me", 1]],
  "heat engine": [["me", 1]],
  "refrigeration": [["me", 1]],
  "heat transfer": [["me", 3]],
  "conduction": [["me", 2]],
  "convection": [["me", 2]],
  "radiation": [["me", 1]],
  "manufacturing": [["me", 2]],
  "casting": [["me", 1]],
  "welding": [["me", 1]],
  "machining": [["me", 1]],
  "lathe": [["me", 1]],
  "milling": [["me", 1]],
  "fluid mechanics": [["me", 2]],
  "pump": [["me", 1]],
  "turbine": [["me", 1]],
  "ic engine": [["me", 2]],

  // CE
  "structural": [["ce", 3]],
  "beam": [["ce", 2]],
  "slab": [["ce", 2]],
  "footing": [["ce", 1]],
  "shear": [["ce", 1]],
  "moment": [["ce", 1]],
  "truss": [["ce", 1]],
  "frame": [["ce", 1]],
  "reinforced concrete": [["ce", 3]],
  "steel": [["ce", 1]],
  "geotechnical": [["ce", 3]],
  "soil": [["ce", 2]],
  "foundation": [["ce", 3]],
  "bearing capacity": [["ce", 2]],
  "permeability": [["ce", 2]],
  "consolidation": [["ce", 2]],
  "shear strength": [["ce", 2]],
  "highway": [["ce", 1]],
  "pavement": [["ce", 1]],
  "traffic": [["ce", 1]],
  "hydrology": [["ce", 1]],
  "irrigation": [["ce", 1]],
  "concrete": [["ce", 1]],
  "cement": [["ce", 1]],

  // IN
  "instrumentation": [["in", 3]],
  "measurement": [["in", 2]],
  "transducer": [["in", 3]],
  "error": [["in", 1]],
  "accuracy": [["in", 1]],
  "precision": [["in", 1]],
  "potentiometer": [["in", 2]],
  "bridge": [["in", 1]],
  "strain gauge": [["in", 2]],
  "thermocouple": [["in", 1]],
  "rtd": [["in", 1]],
  "opto coupler": [["in", 1]],
  "cro": [["in", 1]],
  "oscilloscope": [["in", 1]],
  "control": [["in", 1]],
  "pid": [["in", 1]],

  // PI
  "production": [["pi", 3]],
  "inventory": [["pi", 3]],
  "forecasting": [["pi", 2]],
  "linear programming": [["pi", 3]],
  "transportation problem": [["pi", 2]],
  "assignment": [["pi", 1]],
  "simplex": [["pi", 2]],
  "quality control": [["pi", 3]],
  "control chart": [["pi", 2]],
  "acceptance sampling": [["pi", 2]],
  "reliability": [["pi", 2]],
  "mtbf": [["pi", 1]],
  "work study": [["pi", 2]],
  "ergonomics": [["pi", 1]],
  "method study": [["pi", 1]],
  "motion study": [["pi", 1]],
  "aggregate planning": [["pi", 1]],
  "capacity planning": [["pi", 1]],
};

/**
 * Classify a question into a GATE branch using keyword matching.
 * Returns the most likely branch ID and a confidence score.
 */
export function classifyBranch(
  question: string,
): { branchId: string; confidence: "high" | "medium" | "low"; subjectId?: string } {
  const lower = question.toLowerCase();

  // Score each branch
  const scores: BranchKeywordScore[] = SYLLABUS.map((entry) => ({
    branchId: entry.branch.id,
    score: 0,
    matchedKeywords: [],
  }));

  // Check each keyword
  for (const [keyword, branches] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      for (const [branchId, weight] of branches) {
        const entry = scores.find((s) => s.branchId === branchId);
        if (entry) {
          entry.score += weight;
          entry.matchedKeywords.push(keyword);
        }
      }
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const top = scores[0];
  if (!top || top.score === 0) {
    return { branchId: "cse", confidence: "low" };
  }

  // Determine confidence
  const secondScore = scores[1]?.score ?? 0;
  let confidence: "high" | "medium" | "low" = "low";
  if (top.score >= 5 && top.score > secondScore * 2) {
    confidence = "high";
  } else if (top.score >= 3) {
    confidence = "medium";
  }

  // Try to find a matching subject
  const syllabus = SYLLABUS.find((s) => s.branch.id === top.branchId);
  let subjectId: string | undefined;
  if (syllabus && top.matchedKeywords.length > 0) {
    const matchedSubject = syllabus.subjects.find((sub) =>
      top.matchedKeywords.some((kw) => sub.name.toLowerCase().includes(kw)),
    );
    subjectId = matchedSubject?.id;
  }

  return { branchId: top.branchId, confidence, subjectId };
}

/** Get the subject name by ID within a branch. */
export function getSubjectName(branchId: string, subjectId?: string): string | undefined {
  const syllabus = SYLLABUS.find((s) => s.branch.id === branchId);
  if (!syllabus || !subjectId) return undefined;
  const subject = syllabus.subjects.find((s) => s.id === subjectId);
  return subject?.name;
}
