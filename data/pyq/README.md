# PYQ Ingestion Pipeline

## Directory Structure

```
data/pyq/
├── raw/           # Raw downloaded content (PDFs, HTML, JSON)
├── processed/      # Parsed and normalized questions
├── verified/       # Verified questions ready for publishing
└── review_queue/   # Questions flagged for manual review

scripts/pyq/
├── scrapers/       # Source-specific scrapers
├── parsers/        # Format-specific parsers
├── normalizers/     # Content normalizers
└── pipeline/        # End-to-end ingestion pipeline
```

## Modules

### scrapers/
- `official-gate.ts` - Official GATE organizing institute websites
- `gateoverflow.ts` - GATE Overflow question archive
- `mytayyari.ts` - MyTayyari PYQ repository
- `g4gate.ts` - G4GATE question bank

### parsers/
- `pdf-parser.ts` - Extract questions from PDF papers
- `html-parser.ts` - Extract questions from HTML pages
- `json-parser.ts` - Import from JSON datasets

### normalizers/
- `text-normalizer.ts` - Clean and standardize question text
- `math-normalizer.ts` - Normalize mathematical notation
- `option-normalizer.ts` - Standardize option formats

### pipeline/
- `orchestrator.ts` - Main pipeline coordinator
- `deduplicator.ts` - Detect and merge duplicates
- `classifier.ts` - Topic/subject classification
- `verifier.ts` - Answer verification
- `importer.ts` - Database import with progress tracking

## Usage

```typescript
// Ingest all available PYQs for CSE
await pipeline.ingestBranch('CSE');

// Ingest specific year
await pipeline.ingestYear('CSE', 2024);

// Verify and classify pending questions
await pipeline.processQueue();
```
