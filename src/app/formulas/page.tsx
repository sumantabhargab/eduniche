/**
 * Formula Sheets & Notes — /formulas
 *
 * Branch-wise formula sheets and quick reference notes for GATE preparation.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  FileText,
  Lock,
  Search,
  ChevronRight,
  Sparkles,
  Calculator,
  BookOpen,
  Zap,
} from "@/components/pyq/PYQIcons";

type FormulaSheet = {
  id: string;
  branchCode: string;
  branchName: string;
  title: string;
  subject: string;
  topic: string;
  formulas: string[];
  notes?: string;
  isPremium: boolean;
  difficulty: string;
};

const BRANCH_DATA: Record<string, { name: string; icon: string }> = {
  CS: { name: "Computer Science & IT", icon: "💻" },
  EC: { name: "Electronics & Communication", icon: "📡" },
  EE: { name: "Electrical Engineering", icon: "⚡" },
  ME: { name: "Mechanical Engineering", icon: "⚙️" },
  CE: { name: "Civil Engineering", icon: "🏗️" },
  IN: { name: "Instrumentation", icon: "🔬" },
};

export default function FormulaSheetsPage() {
  const router = useRouter();
  const { isPremium, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [sheets, setSheets] = useState<FormulaSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<FormulaSheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Load formula sheets from API
    fetch("/api/formulas")
      .then((r) => r.json())
      .then((data) => {
        if (data.sheets) setSheets(data.sheets);
        setLoading(false);
      })
      .catch(() => {
        // Generate sample data for demo
        const sampleSheets: FormulaSheet[] = [
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
        ];
        setSheets(sampleSheets);
        setLoading(false);
      });
  }, [mounted]);

  const branches = Array.from(new Set(sheets.map((s) => s.branchCode)));

  const filtered = sheets.filter((s) => {
    if (selectedBranch !== "all" && s.branchCode !== selectedBranch) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.topic.toLowerCase().includes(q) ||
        s.formulas.some((f) => f.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-medium tracking-wider uppercase">
              <Calculator className="w-4 h-4" />
              Formula Sheets
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-6"
          >
            Quick Reference.<br />
            <span className="text-accent">Every Formula.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto mb-10 text-sm md:text-base"
          >
            Essential formulas, equations, and quick-reference notes organized by branch and topic.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto relative mb-8"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search formulas: Dijkstra, DFT, Laplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-sm md:text-base focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </motion.div>
        </div>
      </section>

      {/* Branch filter */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBranch("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedBranch === "all"
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              All
            </button>
            {branches.map((branch) => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedBranch === branch
                    ? "bg-foreground text-background"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Formula sheets grid */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                  <div className="h-5 bg-foreground/5 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-foreground/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Calculator className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted">No formula sheets found for this selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((sheet, index) => (
                <motion.div
                  key={sheet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card border border-border rounded-2xl p-6 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs text-muted font-mono">{sheet.branchCode} · {sheet.subject}</span>
                    {sheet.isPremium && (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm mb-1">{sheet.title}</h3>
                  <p className="text-xs text-muted mb-4">{sheet.topic}</p>

                  {/* Formula preview */}
                  <div className="space-y-1.5 mb-4">
                    {sheet.formulas.slice(0, 3).map((f, i) => (
                      <div key={i} className="text-xs text-muted bg-foreground/5 rounded-lg px-3 py-2 font-mono truncate">
                        {f}
                      </div>
                    ))}
                    {sheet.formulas.length > 3 && (
                      <p className="text-xs text-muted">+{sheet.formulas.length - 3} more formulas</p>
                    )}
                  </div>

                  {sheet.isPremium && !isPremium ? (
                    <button
                      onClick={() => router.push("/pricing")}
                      className="w-full py-2.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-xs font-medium hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Unlock
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedSheet(sheet)}
                      className="w-full py-2.5 bg-foreground text-background rounded-xl text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                    >
                      View Formulas
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {selectedSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedSheet(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background border border-border rounded-3xl p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl">{selectedSheet.title}</h2>
                <p className="text-sm text-muted">{selectedSheet.branchName} · {selectedSheet.subject}</p>
              </div>
              <button onClick={() => setSelectedSheet(null)} className="p-2 text-muted hover:text-foreground">
                ✕
              </button>
            </div>

            {selectedSheet.notes && (
              <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl mb-6">
                <p className="text-sm text-muted">{selectedSheet.notes}</p>
              </div>
            )}

            <div className="space-y-3">
              {selectedSheet.formulas.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 bg-card border border-border rounded-xl font-mono text-sm"
                >
                  {f}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </main>
  );
}
