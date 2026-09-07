-- Add branch_code to pyq_subjects for easier querying
ALTER TABLE pyq_subjects ADD COLUMN IF NOT EXISTS branch_code TEXT;

-- Populate from pyq_branches
UPDATE pyq_subjects ps
SET branch_code = pb.branch_code
FROM pyq_branches pb
WHERE ps.branch_id = pb.id AND ps.branch_code IS NULL;

-- Add index for query performance
CREATE INDEX IF NOT EXISTS idx_pyq_subjects_branch_code ON pyq_subjects(branch_code);

-- Also add branch_code to pyq_topics
ALTER TABLE pyq_topics ADD COLUMN IF NOT EXISTS branch_code TEXT;

UPDATE pyq_topics pt
SET branch_code = pb.branch_code
FROM pyq_branches pb
WHERE pt.branch_id = pb.id AND pt.branch_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_pyq_topics_branch_code ON pyq_topics(branch_code);

-- Verify the changes
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('pyq_subjects', 'pyq_topics')
  AND column_name LIKE '%branch%'
ORDER BY table_name, column_name;
