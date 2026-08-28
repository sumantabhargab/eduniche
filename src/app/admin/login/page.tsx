import { getAdminSession, requireAdmin } from "@/modules/content-cms/lib/auth";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/modules/content-cms/components/admin-login/AdminLoginForm";

export default async function AdminLoginPage() {
  const admin = await getAdminSession();
  if (admin) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-background font-bold text-lg mx-auto mb-4">
            A
          </div>
          <h1 className="text-2xl font-serif text-foreground mb-2">Admin</h1>
          <p className="text-sm text-muted">Sign in to manage content</p>
        </div>
        <div className="bg-background-alt border border-border rounded-xl p-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
