import { getAdminSession } from "@/modules/content-cms/lib/auth";
import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";

export default async function NotFound() {
  const admin = await getAdminSession();

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-foreground mb-2">404</h1>
          <p className="text-muted">Page not found</p>
          <a
            href="/admin/login"
            className="inline-block mt-4 text-accent hover:underline text-sm"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminLayoutClient admin={admin}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-foreground mb-2">404</h1>
          <p className="text-muted">Folder not found</p>
          <a
            href="/admin"
            className="inline-block mt-4 text-accent hover:underline text-sm"
          >
            Go to root
          </a>
        </div>
      </div>
    </AdminLayoutClient>
  );
}
