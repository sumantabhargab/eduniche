const fs = require("fs");
const content = fs.readFileSync("src/lib/predicted-papers/gate-questions.ts", "utf-8");

// Use line-by-line approach to find and remove duplicate subject blocks
const lines = content.split("\n");

// Find all subject block start positions
const blocks = [];
for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(/^\s*"([^"]+)":\s*\[/);
  if (match) {
    blocks.push({ subject: match[1], startLine: i });
  }
}

// Find duplicates (keep first occurrence)
const seen = new Set();
const toRemove = [];
for (let i = blocks.length - 1; i >= 0; i--) {
  if (seen.has(blocks[i].subject)) {
    toRemove.push(blocks[i]);
  } else {
    seen.add(blocks[i].subject);
  }
}

console.log("Blocks found:", blocks.length);
console.log("Unique subjects:", seen.size);
console.log("Duplicates to remove:", toRemove.length);
toRemove.forEach(b => console.log(`  "${b.subject}" starts at line ${b.startLine}`));

// For each duplicate, find the matching `],` and remove the whole block + preceding blank lines
const removeRanges = [];
for (const dup of toRemove) {
  // Find the closing `],` after the start
  let endLine = -1;
  let depth = 0;
  for (let i = dup.startLine; i < lines.length; i++) {
    const line = lines[i];
    // Count brackets
    for (const ch of line) {
      if (ch === '[') depth++;
      if (ch === ']') depth--;
    }
    if (depth === 0 && line.includes('],')) {
      endLine = i;
      break;
    }
  }

  if (endLine !== -1) {
    removeRanges.push({ start: dup.startLine - 1, end: endLine + 1 }); // Include preceding blank line
  }
}

// Sort by start descending so removal doesn't shift positions
removeRanges.sort((a, b) => b.start - a.start);

// Remove from bottom up
let newLines = lines;
for (const range of removeRanges) {
  console.log(`Removing lines ${range.start}-${range.end} (${range.end - range.start + 1} lines)`);
  newLines = newLines.slice(0, range.start).concat(newLines.slice(range.end + 1));
}

const newContent = newLines.join("\n");
fs.writeFileSync("src/lib/predicted-papers/gate-questions.ts", newContent);
console.log(`\nRemoved ${removeRanges.length} duplicate blocks`);
console.log("File size:", newContent.length, "chars");
