/**
 * LibraryLayoutClient — client wrapper for /library/* routes.
 *
 * Decides whether to render with LibraryLayout (sidebar)
 * or bare VirtualLibraryProvider (for /library/world).
 */

"use client";

import { VirtualLibraryProvider } from "@/modules/virtual-library";
import { LibraryLayout } from "@/modules/virtual-library/features/layout/LibraryLayout";
import { usePathname } from "next/navigation";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // /library/world is the full-screen interactive experience —
  // render it without the sub-navigation chrome.
  if (pathname === "/library/world") {
    return <VirtualLibraryProvider>{children}</VirtualLibraryProvider>;
  }

  return (
    <VirtualLibraryProvider>
      <LibraryLayout>{children}</LibraryLayout>
    </VirtualLibraryProvider>
  );
}

export { LayoutContent };
