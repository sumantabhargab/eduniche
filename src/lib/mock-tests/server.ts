/**
 * Server-side utilities for the Mock Tests Premium Library.
 *
 * All database operations go through this module.
 * Premium access checks are enforced at the API layer.
 */

import { createServerClient } from "@/lib/supabase/server";

export interface MockTest {
  id: string;
  branch: string;
  branch_code: string;
  branch_name: string;
  mock_number: number;
  title: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  original_filename: string;
  question_count: number;
  maximum_marks: number;
  duration_minutes: number;
  subject_distribution: Array<{
    name: string;
    questions: number;
    marks: number;
  }>;
  difficulty_distribution: {
    easy: number;
    moderate: number;
    hard: number;
  };
  generation_basis: string;
  access_tier: string;
  visibility: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MockTestListItem {
  id: string;
  branch: string;
  branch_code: string;
  branch_name: string;
  mock_number: number;
  title: string;
  question_count: number;
  maximum_marks: number;
  duration_minutes: number;
  subject_distribution: Array<{
    name: string;
    questions: number;
    marks: number;
  }>;
  difficulty_distribution: {
    easy: number;
    moderate: number;
    hard: number;
  };
}

/**
 * List all mock tests for a branch, or all if no branch specified.
 * Returns only published tests.
 */
export async function listMockTests(
  branch?: string
): Promise<{ tests: MockTestListItem[]; error?: string }> {
  const supabase = await createServerClient();
  if (!supabase) {
    return { tests: [], error: "Server not configured." };
  }

  let query = supabase
    .from("mock_tests")
    .select("id, branch, branch_code, branch_name, mock_number, title, question_count, maximum_marks, duration_minutes, subject_distribution, difficulty_distribution")
    .eq("visibility", "published")
    .order("branch", { ascending: true })
    .order("mock_number", { ascending: true });

  if (branch) {
    query = query.eq("branch", branch);
  }

  const { data, error } = await query;

  if (error) {
    return { tests: [], error: error.message };
  }

  return { tests: data as MockTestListItem[] };
}

/**
 * Get a single mock test by ID.
 * Optionally check premium access.
 */
export async function getMockTest(
  id: string,
  checkPremium = true
): Promise<{ test: MockTest | null; error?: string; requiresPremium?: boolean }> {
  const supabase = await createServerClient();
  if (!supabase) {
    return { test: null, error: "Server not configured." };
  }

  const { data, error } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("id", id)
    .eq("visibility", "published")
    .maybeSingle();

  if (error || !data) {
    return { test: null, error: "Mock test not found." };
  }

  const test = data as MockTest;

  // Check premium access
  if (checkPremium && test.access_tier === "premium") {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return { test: null, requiresPremium: true };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", session.user.id)
      .maybeSingle();

    const plan = (profile as any)?.plan;
    const hasPremiumPlan = plan === "monthly_premium" || plan === "weekly_premium";

    if (!hasPremiumPlan) {
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("status, expires_at")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!sub) {
        return { test: null, requiresPremium: true };
      }
    }
  }

  return { test };
}

/**
 * Get mock tests grouped by branch for listing pages.
 */
export async function getMockTestsByBranch(): Promise<
  { branch: string; branchCode: string; branchName: string; tests: MockTestListItem[] }[]
> {
  const { tests } = await listMockTests();

  const grouped = new Map<string, { branch: string; branchCode: string; branchName: string; tests: MockTestListItem[] }>();

  for (const test of tests) {
    const key = test.branch;
    if (!grouped.has(key)) {
      grouped.set(key, {
        branch: test.branch,
        branchCode: test.branch_code,
        branchName: test.branch_name,
        tests: [],
      });
    }
    grouped.get(key)!.tests.push(test);
  }

  return Array.from(grouped.values());
}
