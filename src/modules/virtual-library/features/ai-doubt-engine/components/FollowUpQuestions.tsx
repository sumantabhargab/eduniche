/**
 * FollowUpQuestions — smart follow-up prompts shown after each AI answer.
 * These guide the user deeper into the topic, making the experience conversational.
 */

"use client";

const FOLLOW_UPS: Record<string, string[]> = {
  cse: [
    "Can you give a solved GATE example on this?",
    "What are common mistakes students make here?",
    "What's the time complexity of this approach?",
    "Can you compare this with another algorithm?",
    "Has this concept appeared in recent GATE papers?",
  ],
  ece: [
    "Can you draw and explain the circuit diagram?",
    "What's the transfer function for this?",
    "Can you give a numerical example?",
    "What assumptions are made in this analysis?",
    "How does this relate to control systems?",
  ],
  ee: [
    "Can you solve a numerical example on this?",
    "What are the practical applications?",
    "What are the assumptions in this theorem?",
    "Can you compare this with another method?",
    "What safety considerations apply here?",
  ],
  me: [
    "Can you solve a numerical example on this?",
    "What are the real-world applications?",
    "What assumptions are made in this analysis?",
    "How does this relate to manufacturing processes?",
    "What are the efficiency considerations?",
  ],
  ce: [
    "Can you solve a numerical example on this?",
    "What design codes apply here?",
    "What are the safety factors to consider?",
    "How does this relate to structural analysis?",
    "What materials are best suited for this?",
  ],
  in: [
    "Can you give a practical example?",
    "What's the measurement range?",
    "What are common sources of error?",
    "How does calibration work?",
    "What are industrial applications?",
  ],
  pi: [
    "Can you give a solved example?",
    "What are the constraints to consider?",
    "How is this applied in real manufacturing?",
    "What software tools are used for this?",
    "What are cost implications?",
  ],
};

const GENERIC_FOLLOW_UPS = [
  "Can you give a GATE-level solved example?",
  "What are common mistakes to avoid?",
  "Can you simplify this explanation?",
  "What's the exam weightage for this topic?",
  "Can you give a quick summary?",
];

interface FollowUpQuestionsProps {
  branchId: string;
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function FollowUpQuestions({ branchId, onSelect, disabled }: FollowUpQuestionsProps) {
  const pool = FOLLOW_UPS[branchId] || GENERIC_FOLLOW_UPS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted font-medium">Keep exploring:</p>
      <div className="flex flex-wrap gap-2">
        {shuffled.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            disabled={disabled}
            className="text-xs px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 border border-border/40 rounded-full
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
