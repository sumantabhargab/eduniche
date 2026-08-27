/**
 * AIService — routes doubt requests through the AI provider.
 *
 * Maps raw doubt requests to structured responses and emits events.
 */

import type { AIProvider } from "../types/adapters";
import type { DoubtRequest, DoubtResponse } from "../types/index";
import { libraryEventEmitter, emitLibraryEvent } from "./event-emitter";

export class AIService {
  constructor(private provider: AIProvider) {}

  /** Submit a doubt and get a structured response. */
  async askDoubt(request: DoubtRequest): Promise<DoubtResponse> {
    const response = await this.provider.askDoubt(request);

    emitLibraryEvent(
      "ai_doubt_asked",
      {
        participantId: request.participantId,
        roomId: request.roomId,
        branchId: request.branchId,
        subjectId: request.subjectId,
        topic: request.topic,
      },
      { questionLength: request.question.length },
    );

    emitLibraryEvent(
      "ai_doubt_answered",
      {
        participantId: request.participantId,
        branchId: request.branchId,
        subjectId: request.subjectId,
        topic: request.topic,
      },
      {
        confidence: response.confidence,
        referenceCount: response.references.length,
        answerLength: response.answer.length,
      },
    );

    return response;
  }

  /** Check whether the AI engine is available. */
  get available(): boolean {
    return this.provider.available;
  }
}
