/**
 * SuggestedQuestions — contextual question chips that appear when the input is empty.
 * Shows branch-specific GATE questions to lower the friction of asking.
 */

"use client";

const BRANCH_QUESTIONS: Record<string, string[]> = {
  cse: [
    "Explain the difference between PDA and Turing Machine",
    "What is the difference between SQL and NoSQL databases?",
    "How does virtual memory work in operating systems?",
    "Explain the concept of normalization in DBMS",
    "What are the different types of scheduling algorithms?",
    "Explain TCP/IP model vs OSI model",
    "What is the difference between BFS and DFS?",
    "How does deadlock prevention work?",
    "Explain the concept of normal forms",
    "What is time complexity of binary search?",
  ],
  ece: [
    "Explain the working of an op-amp",
    "What is the Nyquist stability criterion?",
    "How does modulation work in communication systems?",
    "Explain Laplace transform in signal processing",
    "What is the difference between BJT and MOSFET?",
    "How does a rectifier circuit work?",
    "Explain feedback amplifiers",
    "What is sampling theorem?",
    "How does a PN junction diode work?",
    "Explain root locus method",
  ],
  ee: [
    "Explain Thevenin's theorem",
    "What is the difference between squirrel cage and slip ring induction motor?",
    "How does a transformer work?",
    "Explain power factor correction",
    "What are the different types of faults in power systems?",
    "Explain Kirchhoff's laws",
    "How does a DC generator work?",
    "What is load flow analysis?",
    "Explain synchronous machine operation",
    "How do protective relays work?",
  ],
  me: [
    "Explain the Carnot cycle in thermodynamics",
    "What is the difference between stress and strain?",
    "How does a four-stroke engine work?",
    "Explain the concept of entropy",
    "What is the difference between conduction and convection?",
    "How does gear manufacturing work?",
    "Explain kinematics of machinery",
    "What is the theory of metal cutting?",
    "Explain fluid mechanics basics",
    "How does a refrigeration cycle work?",
  ],
  ce: [
    "Explain the concept of bearing capacity of soil",
    "What is the difference between RCC and steel structures?",
    "How does a cantilever beam work?",
    "Explain the different types of foundations",
    "What is shear strength of soil?",
    "How does highway pavement design work?",
    "Explain hydrology basics",
    "What is the difference between slab and footing?",
    "How does concrete mix design work?",
    "Explain traffic engineering basics",
  ],
  in: [
    "Explain the working of a strain gauge",
    "What is the difference between accuracy and precision?",
    "How does a potentiometer work?",
    "Explain error analysis in measurements",
    "What is a transducer?",
    "How does an RTD work?",
    "Explain the working of an oscilloscope",
    "What is a PID controller?",
    "How does a thermocouple work?",
    "Explain bridge circuits",
  ],
  pi: [
    "Explain the simplex method in linear programming",
    "What is the difference between PERT and CPM?",
    "How does inventory management work?",
    "Explain quality control charts",
    "What is aggregate planning?",
    "How does forecasting work in production?",
    "Explain the transportation problem",
    "What is MTBF and MTTR?",
    "How does capacity planning work?",
    "Explain work study methods",
  ],
};

const FALLBACK_QUESTIONS = [
  "Explain a key concept from your GATE syllabus",
  "How does time complexity analysis work?",
  "Explain the working principle of any GATE topic",
  "What are the important formulas in this subject?",
  "Compare two related concepts in engineering",
];

interface SuggestedQuestionsProps {
  branchId: string;
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ branchId, onSelect, disabled }: SuggestedQuestionsProps) {
  const questions = BRANCH_QUESTIONS[branchId] || FALLBACK_QUESTIONS;
  const shuffled = questions.slice(0, 4);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted font-medium">Try asking:</p>
      <div className="flex flex-wrap gap-2">
        {shuffled.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            disabled={disabled}
            className="text-xs px-3 py-1.5 bg-accent/15 hover:bg-accent/25 border border-border/60 rounded-full
              text-muted hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed
              hover:border-foreground/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
