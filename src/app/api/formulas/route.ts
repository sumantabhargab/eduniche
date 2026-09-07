/**
 * GET /api/formulas
 *
 * Returns formula sheets with optional filters.
 */

import { NextResponse } from "next/server";

const FORMULA_SHEETS = [
  {
    id: "cs-ds-graph",
    branchCode: "CS",
    branchName: "Computer Science & IT",
    title: "Graph Algorithms",
    subject: "Algorithms",
    topic: "Graph Algorithms",
    formulas: [
      "Dijkstra: O((V + E) log V) with priority queue",
      "Bellman-Ford: O(VE) — handles negative edges",
      "Floyd-Warshall: O(V³) — all pairs shortest paths",
      "Prim's MST: O(E log V) with min-heap",
      "Kruskal's MST: O(E log E) with DSU",
      "DFS: O(V + E)",
      "BFS: O(V + E)",
      "Topological Sort: O(V + E)",
    ],
    notes: "Graph algorithms form ~15% of GATE CSE algorithms questions. Master time complexities.",
    isPremium: false,
    difficulty: "medium",
  },
  {
    id: "cs-toc-automata",
    branchCode: "CS",
    branchName: "Computer Science & IT",
    title: "Finite Automata & Regular Languages",
    subject: "Theory of Computation",
    topic: "Automata",
    formulas: [
      "NFA → DFA: Subset construction",
      "DFA minimization: Hopcroft's O(n log n)",
      "Pumping Lemma: L = {aⁿbⁿ | n ≥ 0} is not regular",
      "Closure properties: Union, concat, star, complement",
    ],
    notes: "TOC is high-yield. Regular languages, CFLs, and decidability appear every year.",
    isPremium: false,
    difficulty: "medium",
  },
  {
    id: "cs-os-deadlock",
    branchCode: "CS",
    branchName: "Computer Science & IT",
    title: "Deadlock Handling",
    subject: "Operating Systems",
    topic: "Deadlocks",
    formulas: [
      "Deadlock conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait",
      "Banker's Algorithm: Safe sequence check",
      "Resource Allocation Graph: Claim edge, Assignment edge",
      "Prevention: Break one of four conditions",
      "Avoidance: Banker's algorithm with safety check",
    ],
    notes: "Deadlocks is a favorite GATE topic. Know all four conditions and handling methods.",
    isPremium: false,
    difficulty: "easy",
  },
  {
    id: "cs-dbms-sql",
    branchCode: "CS",
    branchName: "Computer Science & IT",
    title: "SQL & Relational Algebra",
    subject: "Database Management",
    topic: "SQL",
    formulas: [
      "σ (Selection): σ_{age>25}(Employee)",
      "π (Projection): π_{name, salary}(Employee)",
      "ρ (Rename): ρ_{E}(Employee)",
      "⋈ (Join): Employee ⋈_{dept_id=id} Department",
      "∪, ∩, − : Set operations",
      "Aggregate: γ_{dept, avg(salary)}(Employee)",
    ],
    notes: "Relational algebra and SQL are tested every year. Know the operators and their properties.",
    isPremium: true,
    difficulty: "easy",
  },
  {
    id: "ec-signal-fft",
    branchCode: "EC",
    branchName: "Electronics & Communication",
    title: "Signals & Systems — FFT",
    subject: "Signals and Systems",
    topic: "FFT",
    formulas: [
      "DFT: X(k) = Σ x(n) e^(-j2πkn/N)",
      "IDFT: x(n) = (1/N) Σ X(k) e^(j2πkn/N)",
      "FFT (radix-2): O(N log N)",
      "DIT FFT: Decimation in Time",
      "DIF FFT: Decimation in Frequency",
      "Linear vs Circular Convolution",
      "Zero-padding: N+M-1 for linear convolution",
    ],
    notes: "Signals & Systems carries 8-10 marks in GATE EC. Focus on FFT, convolution, and Laplace.",
    isPremium: true,
    difficulty: "hard",
  },
  {
    id: "ee-power-system",
    branchCode: "EE",
    branchName: "Electrical Engineering",
    title: "Power System Analysis",
    subject: "Power Systems",
    topic: "Load Flow",
    formulas: [
      "Per unit: X_pu = X_actual / X_base",
      "Newton-Raphson: Fast convergence, O(n²) per iteration",
      "Gauss-Seidel: Simple but slow convergence",
      "Power Flow: P = VI* cos(δ)",
      "Reactive Power: Q = VI* sin(δ)",
    ],
    notes: "Power systems is the largest section in EE. Master load flow methods.",
    isPremium: true,
    difficulty: "hard",
  },
  {
    id: "cs-math-probability",
    branchCode: "CS",
    branchName: "Computer Science & IT",
    title: "Probability & Statistics",
    subject: "Engineering Mathematics",
    topic: "Probability",
    formulas: [
      "Bayes' Theorem: P(A|B) = P(B|A)P(A) / P(B)",
      "Binomial: P(X=k) = C(n,k) p^k (1-p)^(n-k)",
      "Poisson: P(X=k) = (λ^k e^-λ) / k!",
      "Normal Distribution: N(μ, σ²)",
      "Expected Value: E[X] = Σ x P(x)",
      "Variance: Var(X) = E[X²] - (E[X])²",
    ],
    notes: "Probability carries 5-8 marks in every GATE paper. High ROI topic.",
    isPremium: false,
    difficulty: "medium",
  },
  {
    id: "me-thermodynamics",
    branchCode: "ME",
    branchName: "Mechanical Engineering",
    title: "Thermodynamics — Key Formulas",
    subject: "Thermodynamics",
    topic: "Laws of Thermodynamics",
    formulas: [
      "1st Law: ΔU = Q - W",
      "2nd Law: η = 1 - (T_c/T_h)",
      "Carnot Efficiency: Maximum possible efficiency",
      "Entropy: ΔS = ∫dQ_rev/T",
      "Enthalpy: H = U + PV",
      "Gibbs Free Energy: G = H - TS",
    ],
    notes: "Thermodynamics is the foundation of ME. Know all laws and their applications.",
    isPremium: true,
    difficulty: "hard",
  },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const branch = url.searchParams.get("branch");
    const search = url.searchParams.get("search")?.toLowerCase() || "";
    const isPremiumParam = url.searchParams.get("premium");

    let sheets = FORMULA_SHEETS;

    if (branch) {
      sheets = sheets.filter((s) => s.branchCode === branch.toUpperCase());
    }

    if (search) {
      sheets = sheets.filter(
        (s) =>
          s.title.toLowerCase().includes(search) ||
          s.subject.toLowerCase().includes(search) ||
          s.topic.toLowerCase().includes(search) ||
          s.formulas.some((f) => f.toLowerCase().includes(search))
      );
    }

    if (isPremiumParam === "true") {
      sheets = sheets.filter((s) => s.isPremium);
    }

    return NextResponse.json({ sheets, total: sheets.length });
  } catch (error) {
    console.error("[Formulas] Error:", error);
    return NextResponse.json({ sheets: [], total: 0 });
  }
}
