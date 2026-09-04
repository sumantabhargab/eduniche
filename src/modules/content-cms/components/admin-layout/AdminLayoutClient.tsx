"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

interface AdminLayoutClientProps {
  admin: {
    user: {
      email: string;
      role: string;
    };
  };
  children: React.ReactNode;
}

function AdminInner({ admin, children }: AdminLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (signingOut) {
      router.push("/admin/login");
    }
  }, [signingOut, router]);

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(path);
  };

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/content/auth/logout", { method: "POST" });
    } catch {
      // proceed anyway
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-background transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-background font-bold text-sm">
            {collapsed ? "A" : "E"}
          </div>
          {!collapsed && (
            <span className="font-serif text-foreground text-sm">
              {collapsed ? "" : "EduNeuro Admin"}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 space-y-0.5">
          {/* Brand Ads */}
          <a
            href="/admin/billboard"
            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              pathname?.startsWith("/admin/billboard")
                ? "bg-accent-subtle text-accent"
                : "text-muted hover:text-foreground hover:bg-background-alt"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75 19.5 15.75 19.5 7.5V3.375a2.25 2.25 0 0 0-2.25-2.25H7.5A2.25 2.25 0 0 0 5.25 3.375v4.125m14.25 0h4.125m-4.125 0v4.125M7.5 7.5v9.75m0 0h9.75m-9.75 0V21m0 0H3.375a2.25 2.25 0 0 1-2.25-2.25V5.625m0 0h17.25" />
            </svg>
            {!collapsed && <span>Brand Ads</span>}
          </a>

          <a
            href="/admin/announcements"
            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              isActive("/admin/announcements")
                ? "bg-accent-subtle text-accent"
                : "text-muted hover:text-foreground hover:bg-background-alt"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {!collapsed && <span>Announcements</span>}
          </a>
          <a
            href="/admin/users"
            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              isActive("/admin/users")
                ? "bg-accent-subtle text-accent"
                : "text-muted hover:text-foreground hover:bg-background-alt"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-3.725-3.316c-.333.076-.67.15-1.01.221-2.597.454-5.465.59-7.854.59s-5.257-.136-7.854-.59a15.663 15.663 0 01-1.01-.221 4.125 4.125 0 00-3.725 3.316 9.337 9.337 0 004.121.952m5.375 0a9 9 0 10-5.375 0m5.375 0v-3.75" />
            </svg>
            {!collapsed && <span>Users</span>}
          </a>
          <a
            href="/admin"
            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              isActive("/admin")
                ? "bg-accent-subtle text-accent"
                : "text-muted hover:text-foreground hover:bg-background-alt"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
            {!collapsed && <span>Files</span>}
          </a>
          <a
            href="/admin/game/questions"
            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              isActive("/admin/game")
                ? "bg-accent-subtle text-accent"
                : "text-muted hover:text-foreground hover:bg-background-alt"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992h4.992m-4.992 0h4.013m12.993 0h4.012m-12.993 0v4.992m0-4.992h4.992m0 0v4.992m0-4.992h4.992m0 0v4.992" />
            </svg>
            {!collapsed && <span>Game Questions</span>}
          </a>
          <a
            href="/"
            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              isActive("/")
                ? "bg-accent-subtle text-accent"
                : "text-muted hover:text-foreground hover:bg-background-alt"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            {!collapsed && <span>Back to site</span>}
          </a>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3 space-y-2">
          {!collapsed && (
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted truncate">{admin.user.email}</p>
              <p className="text-xs text-muted capitalize">{admin.user.role}</p>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="flex items-center justify-center w-full px-2 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
              title={collapsed ? "Expand" : "Collapse"}
            >
              <svg className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <ThemeToggle />
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-lg hover:bg-background-alt"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export default function AdminLayoutClient({ admin, children }: AdminLayoutClientProps) {
  return (
    <ThemeProvider>
      <AdminInner admin={admin} children={children} />
    </ThemeProvider>
  );
}
