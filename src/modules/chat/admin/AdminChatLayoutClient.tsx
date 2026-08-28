import { type ReactNode } from "react";

interface AdminChatLayoutClientProps {
  children: ReactNode;
}

export default function AdminChatLayoutClient({ children }: AdminChatLayoutClientProps) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {children}
    </div>
  );
}
