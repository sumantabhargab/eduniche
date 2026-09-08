# PadhaiShuru — Content Pipeline Documentation

## Question Bank (PYQ)

Questions are entered via:
1. Manual admin entry through `/admin/content`
2. Bulk import scripts (`scripts/ingest-gate-papers.ts`)

### Question Quality Requirements

- `quality_tier`: A (verified, ready), B (minor issues), C (needs review)
- `answer_verified`: must be true before question is public
- `explanation`: required for all questions
- `topic_tags`: at least one topic ID

### Content Review Flow

1. Content created with `quality_tier = 'C'` by default
2. Admin reviews via `/api/pyq/admin/review-queue`
3. Admin promotes to `quality_tier = 'A'` or `'B'`
4. Only A/B + verified questions are visible to public

## Formulas

Formulas are managed via admin CMS.
- `is_premium` flag controls access tier
- `subject_id` links to subject hierarchy
- `latex_content` stores rendered formula

## RAG Content

`content_resources` table stores content for AI retrieval.
- `access_tier`: 'free' or 'premium'
- `content_type`: text, pdf, markdown
- `embedding` (planned, pgvector)
