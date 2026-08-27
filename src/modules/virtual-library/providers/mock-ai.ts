/**
 * Mock AI Provider — returns structured but static responses.
 *
 * Provides topic-aware responses based on keyword matching.
 */

import type { AIProvider } from "../types/adapters";
import type { DoubtRequest, DoubtResponse } from "../types/index";

const TOPIC_RESPONSES: Record<string, { answer: string; references: string[] }> = {
  turing: {
    answer: `## Turing Machine Overview

A **Turing Machine (TM)** is a mathematical model of computation that consists of:

1. **A finite set of states** (Q)
2. **An infinite tape** divided into cells, each holding a symbol
3. **A head** that reads/writes one cell at a time
4. **A transition function** δ: Q × Γ → Q × Γ × {L, R}

### Key Properties:
- TMs can simulate any algorithm (Church-Turing thesis)
- Deterministic TMs (DTM) have at most one transition per state/symbol
- Non-deterministic TMs (NTM) can have multiple transitions

### GATE Focus Areas:
- Construction of TM for language acceptance
- Decidability and undecidability
- Halting problem

> **Tip:** Practice constructing TMs for regular languages and understand why the Halting Problem is undecidable.`,

    references: [
      "GATE CSE 2023 — TOC, Q.45",
      "GATE CSE 2022 — TOC, Q.38",
      "Theory of Computation — Ullman",
    ],
  },

  dynamic: {
    answer: `## Dynamic Programming

**Dynamic Programming (DP)** solves problems by breaking them into overlapping subproblems:

### Key Characteristics:
1. **Optimal Substructure** — optimal solution contains optimal solutions to subproblems
2. **Overlapping Subproblems** — same subproblems are solved multiple times

### Common GATE DP Problems:
| Problem | Approach |
|---------|----------|
| 0/1 Knapsack | DP table |
| LCS | 2D DP |
| Matrix Chain Multiplication | Parenthesization DP |
| Longest Increasing Subsequence | DP with binary search |
| Coin Change | Min coins DP |

### Bottom-up vs Top-down:
- **Bottom-up**: Iterative table filling (preferred for GATE)
- **Top-down**: Recursion + memoization

> **Practice:** Focus on identifying DP characteristics and choosing the right state definition.`,

    references: [
      "GATE CSE 2024 — DAA, Q.52",
      "GATE CSE 2023 — DAA, Q.41",
      "Introduction to Algorithms — Cormen",
    ],
  },

  dbms: {
    answer: `## DBMS — Key GATE Topics

### Normalization (Most Common):
- **1NF**: Atomic values, no repeating groups
- **2NF**: No partial dependency on candidate key
- **3NF**: No transitive dependency
- **BCNF**: Every FD X → Y, X is a superkey

### SQL Queries:
- Focus on JOIN types (INNER, LEFT, RIGHT, FULL)
- GROUP BY with HAVING
- Subqueries and correlated subqueries

### Transactions & Concurrency:
- ACID properties
- Serializability and conflict serializability
- Locking protocols (2PL)
- Timestamp ordering

> **High-yield area:** Normalization has appeared in almost every GATE CSE paper.`,

    references: [
      "GATE CSE 2023 — DBMS, Q.29",
      "GATE CSE 2022 — DBMS, Q.35",
      "Database Systems — Navathe",
    ],
  },

  default: {
    answer: `Great question! Let me help you understand this topic.

### Key Points:
1. Start with the fundamental definitions and concepts
2. Build intuition with small worked examples
3. Practice previous GATE questions on this topic
4. Focus on the most frequently tested aspects

### Study Strategy:
- Review the relevant section in your standard textbook
- Solve at least 20 PYQs on this topic
- Create a one-page summary sheet for quick revision

> Remember: GATE tests conceptual understanding, not rote memorization.`,

    references: [
      "GATE Previous Year Questions",
      "Standard GATE Reference Material",
    ],
  },
};

function classifyTopic(question: string): string {
  const lower = question.toLowerCase();
  if (/\b(turing|automata|pda|regular|context.free|decidab|halting|pda|npda)\b/.test(lower)) return "turing";
  if (/\b(dynamic.programming|knapsack|lcs|matrix.chain|optimal|subsequence|dp\b)/.test(lower)) return "dynamic";
  if (/\b(dbms|normalization|sql|transaction|acid|concurrency|joins|rdbms)\b/.test(lower)) return "dbms";
  return "default";
}

export class MockAIProvider implements AIProvider {
  readonly available = true;

  async askDoubt(request: DoubtRequest): Promise<DoubtResponse> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

    const topic = classifyTopic(request.question);
    const response = TOPIC_RESPONSES[topic] ?? TOPIC_RESPONSES.default;

    return {
      id: `ai-resp-${Date.now()}`,
      requestId: request.id,
      answer: response.answer,
      references: response.references,
      confidence: Math.random() > 0.3 ? "high" : "medium",
      createdAt: new Date().toISOString(),
    };
  }
}

/** Singleton mock instance. */
export const mockAIProvider = new MockAIProvider();
