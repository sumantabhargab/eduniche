import { requireAdmin } from "@/modules/content-cms/lib/auth";
import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";
import GameQuestionListClient from "./GameQuestionListClient";

export const dynamic = "force-dynamic";

export default async function GameQuestionsAdminPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  await requireAdmin();

  const branchFilter = typeof searchParams?.branch === "string" ? searchParams.branch : "";
  const statusFilter = typeof searchParams?.status === "string" ? searchParams.status : "";
  const search = typeof searchParams?.search === "string" ? searchParams.search : "";

  return (
    <AdminLayoutClient
      admin={{
        user: {
          email: "",
          role: "admin",
        },
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-serif text-foreground">Game Questions</h1>
            <p className="text-sm text-muted mt-1">
              Manage questions for the GATE Arcade game
            </p>
          </div>
          <a
            href="/admin/game/questions/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-accent rounded-lg hover:bg-accent-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Question
          </a>
        </div>
        <GameQuestionListClient
          initialFilters={{
            branch: branchFilter,
            status: statusFilter,
            search,
          }}
        />
      </div>
    </AdminLayoutClient>
  );
}
