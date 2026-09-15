import fs from "fs";
import path from "path";

// Clean up temporary scripts
const scriptsDir = path.join(process.cwd(), "scripts");
const tempFiles = [
  "diagnose-gate-questions.ts",
  "fix-gate-questions.ts",
  "check-json.ts",
  "diagnose-file.ts"
];

for (const file of tempFiles) {
  const filePath = path.join(scriptsDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted: ${file}`);
  }
}

console.log("Cleanup complete!");
