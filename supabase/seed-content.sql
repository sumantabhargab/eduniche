-- Seed content: GATE folder hierarchy for all branches.
-- Run after the content_cms migration.
-- Requires an admin user to exist (run bootstrap-admin.sql first).

-- ─── Root: GATE ──────────────────────────────────────────────────────────────

INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'GATE', NULL, NULL, NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- ─── CSE branch ──────────────────────────────────────────────────────────────

INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'CSE', '00000000-0000-0000-0000-000000000001', 'cse', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- CSE subjects
INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Engineering Mathematics', '00000000-0000-0000-0000-000000000002', 'cse', 'engmath', NULL, 0),
  ('00000000-0000-0000-0000-000000000011', 'Digital Logic',            '00000000-0000-0000-0000-000000000002', 'cse', 'dld',    NULL, 1),
  ('00000000-0000-0000-0000-000000000012', 'Computer Organization',   '00000000-0000-0000-0000-000000000002', 'cse', 'co',     NULL, 2),
  ('00000000-0000-0000-0000-000000000013', 'Programming and DS',      '00000000-0000-0000-0000-000000000002', 'cse', 'pds',    NULL, 3),
  ('00000000-0000-0000-0000-000000000014', 'Algorithms',              '00000000-0000-0000-0000-000000000002', 'cse', 'algo',   NULL, 4),
  ('00000000-0000-0000-0000-000000000015', 'Theory of Computation',   '00000000-0000-0000-0000-000000000002', 'cse', 'toc',    NULL, 5),
  ('00000000-0000-0000-0000-000000000016', 'Compiler Design',         '00000000-0000-0000-0000-000000000002', 'cse', 'cd',     NULL, 6),
  ('00000000-0000-0000-0000-000000000017', 'Operating Systems',       '00000000-0000-0000-0000-000000000002', 'cse', 'os',     NULL, 7),
  ('00000000-0000-0000-0000-000000000018', 'DBMS',                    '00000000-0000-0000-0000-000000000002', 'cse', 'dbms',   NULL, 8),
  ('00000000-0000-0000-0000-000000000019', 'Computer Networks',       '00000000-0000-0000-0000-000000000002', 'cse', 'cn',     NULL, 9)
ON CONFLICT (id) DO NOTHING;

-- CSE resource categories (under each subject, example: EngMath)
INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000020', 'Notes',    '00000000-0000-0000-0000-000000000010', 'cse', 'engmath', 'notes',    0),
  ('00000000-0000-0000-0000-000000000021', 'PYQs',     '00000000-0000-0000-0000-000000000010', 'cse', 'engmath', 'pyqs',     1),
  ('00000000-0000-0000-0000-000000000022', 'Books',    '00000000-0000-0000-0000-000000000010', 'cse', 'engmath', 'books',    2),
  ('00000000-0000-0000-0000-000000000023', 'Practice', '00000000-0000-0000-0000-000000000010', 'cse', 'engmath', 'practice', 3)
ON CONFLICT (id) DO NOTHING;

-- ─── ECE branch ──────────────────────────────────────────────────────────────

INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'ECE', '00000000-0000-0000-0000-000000000001', 'ece', NULL, NULL, 1),
  ('00000000-0000-0000-0000-000000000030', 'Network Theory',    '00000000-0000-0000-0000-000000000003', 'ece', 'network',     NULL, 0),
  ('00000000-0000-0000-0000-000000000031', 'Control Systems',   '00000000-0000-0000-0000-000000000003', 'ece', 'control',     NULL, 1),
  ('00000000-0000-0000-0000-000000000032', 'Digital Electronics', '00000000-0000-0000-0000-000000000003', 'ece', 'de', NULL, 2),
  ('00000000-0000-0000-0000-000000000033', 'Signals & Systems', '00000000-0000-0000-0000-000000000003', 'ece', 'signals',     NULL, 3),
  ('00000000-0000-0000-0000-000000000034', 'Analog Circuits',   '00000000-0000-0000-0000-000000000003', 'ece', 'analog',      NULL, 4),
  ('00000000-0000-0000-0000-000000000035', 'Communications',    '00000000-0000-0000-0000-000000000003', 'ece', 'comm',        NULL, 5),
  ('00000000-0000-0000-0000-000000000036', 'EMFT',              '00000000-0000-0000-0000-000000000003', 'ece', 'emft',        NULL, 6)
ON CONFLICT (id) DO NOTHING;

-- ─── EE branch ───────────────────────────────────────────────────────────────

INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000004', 'EE', '00000000-0000-0000-0000-000000000001', 'ee', NULL, NULL, 2),
  ('00000000-0000-0000-0000-000000000040', 'Electric Machines', '00000000-0000-0000-0000-000000000004', 'ee', 'machines',    NULL, 0),
  ('00000000-0000-0000-0000-000000000041', 'Power Systems',     '00000000-0000-0000-0000-000000000004', 'ee', 'power',       NULL, 1),
  ('00000000-0000-0000-0000-000000000042', 'Power Electronics', '00000000-0000-0000-0000-000000000004', 'ee', 'pe',          NULL, 2),
  ('00000000-0000-0000-0000-000000000043', 'Control Systems',   '00000000-0000-0000-0000-000000000004', 'ee', 'control',     NULL, 3),
  ('00000000-0000-0000-0000-000000000044', 'Electrical Measurements', '00000000-0000-0000-0000-000000000004', 'ee', 'measure', NULL, 4),
  ('00000000-0000-0000-0000-000000000045', 'Circuit Theory',    '00000000-0000-0000-0000-000000000004', 'ee', 'circuit',     NULL, 5)
ON CONFLICT (id) DO NOTHING;

-- ─── ME branch ───────────────────────────────────────────────────────────────

INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000005', 'ME', '00000000-0000-0000-0000-000000000001', 'me', NULL, NULL, 3),
  ('00000000-0000-0000-0000-000000000050', 'Engineering Mechanics',   '00000000-0000-0000-0000-000000000005', 'me', 'mech',        NULL, 0),
  ('00000000-0000-0000-0000-000000000051', 'Strength of Materials',   '00000000-0000-0000-0000-000000000005', 'me', 'som',         NULL, 1),
  ('00000000-0000-0000-0000-000000000052', 'Theory of Machines',      '00000000-0000-0000-0000-000000000005', 'me', 'tom',         NULL, 2),
  ('00000000-0000-0000-0000-000000000053', 'Thermodynamics',          '00000000-0000-0000-0000-000000000005', 'me', 'thermo',      NULL, 3),
  ('00000000-0000-0000-0000-000000000054', 'Fluid Mechanics',         '00000000-0000-0000-0000-000000000005', 'me', 'fluid',       NULL, 4),
  ('00000000-0000-0000-0000-000000000055', 'Manufacturing',           '00000000-0000-0000-0000-000000000005', 'me', 'mfg',         NULL, 5),
  ('00000000-0000-0000-0000-000000000056', 'Heat Transfer',           '00000000-0000-0000-0000-000000000005', 'me', 'ht',          NULL, 6),
  ('00000000-0000-0000-0000-000000000057', 'Industrial Engineering',  '00000000-0000-0000-0000-000000000005', 'me', 'ie',          NULL, 7)
ON CONFLICT (id) DO NOTHING;

-- ─── CE branch ───────────────────────────────────────────────────────────────

INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000006', 'CE', '00000000-0000-0000-0000-000000000001', 'ce', NULL, NULL, 4),
  ('00000000-0000-0000-0000-000000000060', 'Structural Analysis',        '00000000-0000-0000-0000-000000000006', 'ce', 'sa',        NULL, 0),
  ('00000000-0000-0000-0000-000000000061', 'Structural Engineering',     '00000000-0000-0000-0000-000000000006', 'ce', 'se',        NULL, 1),
  ('00000000-0000-0000-0000-000000000062', 'Geotechnical Engineering',   '00000000-0000-0000-0000-000000000006', 'ce', 'geo',       NULL, 2),
  ('00000000-0000-0000-0000-000000000063', 'Environmental Engineering',  '00000000-0000-0000-0000-000000000006', 'ce', 'env',       NULL, 3),
  ('00000000-0000-0000-0000-000000000064', 'Transportation Engineering', '00000000-0000-0000-0000-000000000006', 'ce', 'transport', NULL, 4),
  ('00000000-0000-0000-0000-000000000065', 'Surveying',                  '00000000-0000-0000-0000-000000000006', 'ce', 'survey',    NULL, 5),
  ('00000000-0000-0000-0000-000000000066', 'Hydrology & Irrigation',     '00000000-0000-0000-0000-000000000006', 'ce', 'water',     NULL, 6),
  ('00000000-0000-0000-0000-000000000067', 'RCC & Steel',                '00000000-0000-0000-0000-000000000006', 'ce', 'rcc',       NULL, 7)
ON CONFLICT (id) DO NOTHING;

-- ─── IN branch ───────────────────────────────────────────────────────────────

INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000007', 'IN', '00000000-0000-0000-0000-000000000001', 'in', NULL, NULL, 5),
  ('00000000-0000-0000-0000-000000000070', 'Process Control',         '00000000-0000-0000-0000-000000000007', 'in', 'process',   NULL, 0),
  ('00000000-0000-0000-0000-000000000071', 'Sensors & Instrumentation', '00000000-0000-0000-0000-000000000007', 'in', 'sensor', NULL, 1),
  ('00000000-0000-0000-0000-000000000072', 'Analog & Digital Electronics', '00000000-0000-0000-0000-000000000007', 'in', 'electronics', NULL, 2),
  ('00000000-0000-0000-0000-000000000073', 'Signal Processing',      '00000000-0000-0000-0000-000000000007', 'in', 'signal',    NULL, 3),
  ('00000000-0000-0000-0000-000000000074', 'Analytical Instruments', '00000000-0000-0000-0000-000000000007', 'in', 'analytical', NULL, 4),
  ('00000000-0000-0000-0000-000000000075', 'Biomedical Instrumentation', '00000000-0000-0000-0000-000000000007', 'in', 'biomedical', NULL, 5)
ON CONFLICT (id) DO NOTHING;

-- ─── PI branch ───────────────────────────────────────────────────────────────

INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000008', 'PI', '00000000-0000-0000-0000-000000000001', 'pi', NULL, NULL, 6),
  ('00000000-0000-0000-0000-000000000080', 'Industrial Engineering',  '00000000-0000-0000-0000-000000000008', 'pi', 'ie',       NULL, 0),
  ('00000000-0000-0000-0000-000000000081', 'Operations Research',     '00000000-0000-0000-0000-000000000008', 'pi', 'or',       NULL, 1),
  ('00000000-0000-0000-0000-000000000082', 'Production Planning',     '00000000-0000-0000-0000-000000000008', 'pi', 'ppc',      NULL, 2),
  ('00000000-0000-0000-0000-000000000083', 'Quality Control',         '00000000-0000-0000-0000-000000000008', 'pi', 'qc',       NULL, 3),
  ('00000000-0000-0000-0000-000000000084', 'Work Study & Ergonomics', '00000000-0000-0000-0000-000000000008', 'pi', 'workstudy',NULL, 4)
ON CONFLICT (id) DO NOTHING;

-- ─── DA branch ───────────────────────────────────────────────────────────────

INSERT INTO content_folders (id, name, parent_id, branch, subject, resource_type, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000009', 'DA', '00000000-0000-0000-0000-000000000001', 'da', NULL, NULL, 7),
  ('00000000-0000-0000-0000-000000000090', 'Probability & Statistics', '00000000-0000-0000-0000-000000000009', 'da', 'probstat', NULL, 0),
  ('00000000-0000-0000-0000-000000000091', 'Linear Algebra',           '00000000-0000-0000-0000-000000000009', 'da', 'linalg',   NULL, 1),
  ('00000000-0000-0000-0000-000000000092', 'Machine Learning',         '00000000-0000-0000-0000-000000000009', 'da', 'ml',       NULL, 2),
  ('00000000-0000-0000-0000-000000000093', 'Deep Learning',            '00000000-0000-0000-0000-000000000009', 'da', 'dl',       NULL, 3),
  ('00000000-0000-0000-0000-000000000094', 'Database Management',      '00000000-0000-0000-0000-000000000009', 'da', 'dbms',     NULL, 4),
  ('00000000-0000-0000-0000-000000000095', 'Data Engineering',         '00000000-0000-0000-0000-000000000009', 'da', 'de',       NULL, 5),
  ('00000000-0000-0000-0000-000000000096', 'Optimization',             '00000000-0000-0000-0000-000000000009', 'da', 'optimize', NULL, 6),
  ('00000000-0000-0000-0000-000000000097', 'AI Fundamentals',          '00000000-0000-0000-0000-000000000009', 'da', 'aifund',   NULL, 7)
ON CONFLICT (id) DO NOTHING;
