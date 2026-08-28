/**
 * ConversationList — renders the list of conversation items.
 */

import { type Conversation } from "../../types/chat";
import { ConversationItem } from "./ConversationItem";
import { formatRelativeTime, truncate } from "../../utils/format";

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, onSelect }: ConversationListProps) {
  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          onClick={() => onSelect(conv.id)}
        />
      ))}
    </div>
  );
}
