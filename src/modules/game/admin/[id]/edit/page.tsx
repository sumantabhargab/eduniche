import { requireAdmin } from "@/modules/content-cms/lib/auth";
import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";
import GameQuestionEditor from "@/modules/game/admin/GameQuestionEditor";
import { getGameQuestionById } from "@/modules/game/services/admin-questions";

export const dynamic = "force-dynamic";

export default async function EditGameQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { data: question, error } = await getGameQuestionById(id);

  if (error || !question) {
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
          <p className="text-error">Question not found.</p>
        </div>
      </AdminLayoutClient>
    );
  }

  return (
    <AdminLayoutClient
      admin={{
        user: {
          email: "",
          role: "admin",
        },
      }}
    >
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-serif text-foreground mb-1">Edit Question</h1>
        <p className="text-sm text-muted mb-6">
          Update the question details
        </p>
        <GameQuestionEditor initial={question} />
      </div>
    </AdminLayoutClient>
  );
}
