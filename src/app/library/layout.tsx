/**
 * Route layout for /library/* routes.
 *
 * Wraps all library pages with the VirtualLibraryProvider
 * and the shared LibraryLayout shell.
 */

import { VirtualLibraryProvider } from "@/modules/virtual-library";
import { LibraryLayout } from "@/modules/virtual-library/features/layout/LibraryLayout";

export default function LibraryLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VirtualLibraryProvider>
      <LibraryLayout>{children}</LibraryLayout>
    </VirtualLibraryProvider>
  );
}
