import { requireAdmin } from "@/modules/content-cms/lib/auth";
import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";
import GameQuestionEditor from "@/modules/game/admin/GameQuestionEditor";

export const dynamic = "force-dynamic";

export default async function NewGameQuestionPage() {
  await requireAdmin();

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
        <h1 className="text-2xl font-serif text-foreground mb-1">New Question</h1>
        <p className="text-sm text-muted mb-6">
          Add a new question to the GATE Arcade game
        </p>
        <GameQuestionEditor />
      </div>
    </AdminLayoutClient>
  );
}
