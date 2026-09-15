// Expand FALLBACK_BANKS with parametric variants
// Run: npx tsx scripts/expand-fallback-banks.ts

const fs = require("fs");
const path = require("path");

const generatorPath = path.join(__dirname, "..", "src", "lib", "predicted-papers", "generator.ts");
let content = fs.readFileSync(generatorPath, "utf-8");

function expandBank(text: string, variations: number): string[] {
  const results: string[] = [text];
  const numMatch = text.match(/(\d+(\.\d+)?)/);

  if (!numMatch) return results;

  const original = numMatch[1];
  const numVal = parseFloat(original);

  for (let i = 1; i <= variations; i++) {
    const newVal = ((numVal + i * 7) % 100 + 1).toFixed(original.includes(".") ? 1 : 0);
    results.push(text.replace(original, newVal));
  }

  return results;
}

// Find FALLBACK_BANKS and expand each template
const bankMatch = content.match(/const FALLBACK_BANKS:\s*Record<string.*?>\s*=\s*\{([\s\S]*?)\n\};\s*\n\nconst BRANCH_ALIAS/);

if (!bankMatch) {
  console.error("Could not find FALLBACK_BANKS");
  process.exit(1);
}

const bankBody = bankMatch[1];
const expandedEntries: string[] = [];

// Parse each branch entry
const branchRegex = /(\w+):\s*\[([\s\S]*?)\](?=\s*,\s*\w+:\s*\[|\s*,\s*\}$)/g;
let branchMatch;

while ((branchMatch = branchRegex.exec(bankBody)) !== null) {
  const branchName = branchMatch[1];
  const templatesText = branchMatch[2];

  // Find all template objects
  const templateRegex = /\{\s*subject:\s*"([^"]+)"[^}]*text:\s*"([^"]+)"[^}]*\}/g;
  const templates: { subject: string; text: string; rest: string }[] = [];
  let tmplMatch;

  while ((tmplMatch = templateRegex.exec(templatesText)) !== null) {
    templates.push({
      subject: tmplMatch[1],
      text: tmplMatch[2],
      rest: tmplMatch[0].replace(tmplMatch[2], "PLACEHOLDER"),
    });
  }

  console.log(`${branchName}: ${templates.length} base templates`);

  // Generate expanded templates
  const expanded = templates.flatMap(t => {
    const variants = expandBank(t.text, 4); // 5 variants each
    return variants.map(v => t.rest.replace("PLACEHOLDER", v));
  });

  console.log(`${branchName}: ${expanded.length} total templates after expansion`);

  expandedEntries.push(`  ${branchName}: [\n    ${expanded.join(",\n    ")}\n  ]`);
}

// Build new FALLBACK_BANKS
const newBanks = `const FALLBACK_BANKS: Record<string, { subject: string; topic: string; difficulty: string; marks: number; text: string; options: string[]; answer: string; explanation: string }[]> = {\n${expandedEntries.join(",\n")}\n};`;

// Replace old FALLBACK_BANKS
content = content.replace(
  /const FALLBACK_BANKS:[\s\S]*?;\s*\n\nconst BRANCH_ALIAS/,
  newBanks + "\n\nconst BRANCH_ALIAS"
);

fs.writeFileSync(generatorPath, content, "utf-8");
console.log("\n✅ FALLBACK_BANKS expanded successfully");
