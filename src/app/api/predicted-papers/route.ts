/**
 * GET /api/predicted-papers
 * Lists all branches with predicted papers metadata (no auth required).
 */

import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const PAPERS_DIR = join(process.cwd(), "data", "predicted-papers");
const BRANCH_META: Record<string, { name: string; icon: string }> = {
  CS: { name: "Computer Science & Engineering", icon: "💻" },
  EE: { name: "Electrical Engineering", icon: "⚡" },
  CE: { name: "Civil Engineering", icon: "🏗️" },
  ME: { name: "Mechanical Engineering", icon: "⚙️" },
  XE: { name: "Engineering Sciences", icon: "🔬" },
  XL: { name: "Life Sciences", icon: "🧬" },
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branches: Record<string, { branch: string; name: string; icon: string; paperCount: number }> = {};

    for (const [code, meta] of Object.entries(BRANCH_META)) {
      const path = join(PAPERS_DIR, `${code}.json`);
      if (!existsSync(path)) continue;

      const raw = readFileSync(path, "utf-8");
      const data = JSON.parse(raw);
      branches[code] = {
        branch: code,
        name: meta.name,
        icon: meta.icon,
        paperCount: data.papers?.length || 0,
      };
    }

    return NextResponse.json({ branches: Object.values(branches) });
  } catch {
    return NextResponse.json({ branches: [] });
  }
}
