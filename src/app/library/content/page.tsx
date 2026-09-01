/**
 * Library Content page — browse published study resources.
 *
 * Hierarchy: Gate (Free/Premium) → Branch → Subject → Resources
 */

import { LibraryContent } from "@/modules/virtual-library/features/content/LibraryContent";

export const metadata = {
  title: "Library Content — EduNeuro",
  description: "Browse study resources by GATE branch and subject.",
};

export default function LibraryContentPage() {
  return <LibraryContent />;
}
