/**
 * Shared types for the AI doubt engine API.
 */

export interface AIRequest {
  question: string;
  conversationId?: string;
  branchId?: string;
  subjectId?: string;
  topic?: string;
}

export interface AIResponse {
  id: string;
  requestId: string;
  answer: string;
  references: string[];
  confidence: "high" | "medium" | "low";
  createdAt: string;
}
