/**
 * Billboard slot definitions — single source of truth.
 * Used by admin UI, API routes, and anywhere slot IDs are referenced.
 */

export interface SlotDefinition {
  page: string;
  placement: string;
  label: string;
}

export const BILLBOARD_SLOTS: Record<string, SlotDefinition> = {
  landing_main: {
    page: "Landing Page",
    placement: "below-hero",
    label: "Landing Page — Main Billboard",
  },
  dashboard_featured: {
    page: "Dashboard",
    placement: "below-summary",
    label: "Dashboard — Featured Partner",
  },
  learning_secondary: {
    page: "Learning",
    placement: "below-content",
    label: "Learning — Secondary Billboard",
  },
  resources_featured: {
    page: "Resources",
    placement: "below-resources",
    label: "Resources — Featured Partner",
  },
};

export function getSlotLabel(slotId: string): string {
  return BILLBOARD_SLOTS[slotId]?.label ?? slotId;
}
