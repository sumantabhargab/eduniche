-- ============================================
-- CONTENT CMS RESET & FIXES
-- ============================================
-- 1. Fix recursive folder deletion (was non-recursive)
-- 2. Add get_folder_breadcrumbs RPC (referenced but missing)
-- 3. Add premium flag to folders for server-side access control
-- 4. Add RLS policies for non-admin read access
-- 5. Seed exact Free/Premium/GATE/[8 branches] hierarchy

-- ─── 1. Fix recursive folder deletion ────────────────────────────────────────

CREATE OR REPLACE FUNCTION delete_folder_cascade(p_folder_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_resources INTEGER := 0;
BEGIN
  -- Delete all resources in descendant folders
  WITH RECURSIVE descendants AS (
    SELECT id FROM content_folders WHERE parent_id = p_folder_id
    UNION ALL
    SELECT c.id FROM content_folders c
    JOIN descendants d ON c.parent_id = d.id
  )
  DELETE FROM content_resources
  WHERE folder_id IN (SELECT id FROM descendants);

  -- Delete resources in the root folder itself
  DELETE FROM content_resources WHERE folder_id = p_folder_id;

  -- Delete all descendant folders
  WITH RECURSIVE descendants AS (
    SELECT id FROM content_folders WHERE parent_id = p_folder_id
    UNION ALL
    SELECT c.id FROM content_folders c
    JOIN descendants d ON c.parent_id = d.id
  )
  DELETE FROM content_folders WHERE id IN (SELECT id FROM descendants);

  RETURN 1;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION delete_folder_cascade(UUID) TO service_role;

-- ─── 2. Add get_folder_breadcrumbs RPC ───────────────────────────────────────

DROP FUNCTION IF EXISTS get_folder_breadcrumbs(UUID);

CREATE OR REPLACE FUNCTION get_folder_breadcrumbs(start_folder_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  parent_id UUID
) AS $$
DECLARE
  v_current_id UUID := start_folder_id;
  v_row RECORD;
BEGIN
  WHILE v_current_id IS NOT NULL LOOP
    SELECT id, name, parent_id INTO v_row
    FROM content_folders
    WHERE id = v_current_id;

    IF NOT FOUND THEN
      EXIT;
    END IF;

    id := v_row.id;
    name := v_row.name;
    parent_id := v_row.parent_id;
    RETURN NEXT;

    v_current_id := v_row.parent_id;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_folder_breadcrumbs(UUID) TO anon, authenticated, service_role;

-- ─── 3. Add premium flag to folders ──────────────────────────────────────────

ALTER TABLE content_folders
  ADD COLUMN IF NOT EXISTS premium BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_content_folders_premium ON content_folders(premium);

-- ─── 4. Add RLS policies for non-admin folder read access ────────────────────

-- Allow everyone (anon + authenticated) to read non-premium folders
DROP POLICY IF EXISTS "Public read free folders" ON content_folders;
CREATE POLICY "Public read free folders"
  ON content_folders FOR SELECT
  USING (premium = false);

-- ─── 5. Seed the Free/Premium/GATE/[8 branches] hierarchy ────────────────────

-- Only seed if the root folders don't already exist (idempotent)
DO $$
DECLARE
  v_free_root UUID;
  v_free_gate UUID;
  v_premium_root UUID;
  v_premium_gate UUID;

  -- Free branches
  v_f_cse UUID; v_f_ece UUID; v_f_ee UUID; v_f_me UUID;
  v_f_ce UUID;  v_f_in UUID;  v_f_pi UUID;  v_f_da UUID;

  -- Premium branches
  v_p_cse UUID; v_p_ece UUID; v_p_ee UUID; v_p_me UUID;
  v_p_ce UUID;  v_p_in UUID;  v_p_pi UUID;  v_p_da UUID;

  -- Premium sub-folders
  v_p_cse_pp UUID;  v_p_cse_pyq UUID;
  v_p_ece_pp UUID;  v_p_ece_pyq UUID;
  v_p_ee_pp UUID;   v_p_ee_pyq UUID;
  v_p_me_pp UUID;   v_p_me_pyq UUID;
  v_p_ce_pp UUID;   v_p_ce_pyq UUID;
  v_p_in_pp UUID;   v_p_in_pyq UUID;
  v_p_pi_pp UUID;   v_p_pi_pyq UUID;
  v_p_da_pp UUID;   v_p_da_pyq UUID;
BEGIN
  -- Only seed if no Free/Premium roots exist
  IF EXISTS (SELECT 1 FROM content_folders WHERE name IN ('Free', 'Premium') AND parent_id IS NULL) THEN
    RETURN;
  END IF;

  -- Clean any orphaned old seed data
  DELETE FROM content_resources WHERE folder_id IN (
    SELECT id FROM content_folders WHERE
      name IN ('Free', 'Premium', 'GATE', 'CSE', 'ECE', 'EE', 'ME', 'CE', 'IN', 'PI', 'DA')
  );
  DELETE FROM content_folders WHERE
    name IN ('Free', 'Premium', 'GATE', 'CSE', 'ECE', 'EE', 'ME', 'CE', 'IN', 'PI', 'DA',
             'Predicted Papers', 'PYQ Analysis');

  -- ── Free tier root ────────────────────────────────────────────────────────
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Free', NULL, false, NULL, NULL, NULL, 0)
  RETURNING id INTO v_free_root;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('GATE', v_free_root, false, NULL, NULL, NULL, 0)
  RETURNING id INTO v_free_gate;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('CSE', v_free_gate, false, 'cse', NULL, NULL, 0) RETURNING id INTO v_f_cse;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('ECE', v_free_gate, false, 'ece', NULL, NULL, 1) RETURNING id INTO v_f_ece;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('EE',  v_free_gate, false, 'ee',  NULL, NULL, 2) RETURNING id INTO v_f_ee;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('ME',  v_free_gate, false, 'me',  NULL, NULL, 3) RETURNING id INTO v_f_me;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('CE',  v_free_gate, false, 'ce',  NULL, NULL, 4) RETURNING id INTO v_f_ce;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('IN',  v_free_gate, false, 'in',  NULL, NULL, 5) RETURNING id INTO v_f_in;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PI',  v_free_gate, false, 'pi',  NULL, NULL, 6) RETURNING id INTO v_f_pi;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('DA',  v_free_gate, false, 'da',  NULL, NULL, 7) RETURNING id INTO v_f_da;

  -- ── Premium tier root ─────────────────────────────────────────────────────
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Premium', NULL, true, NULL, NULL, NULL, 0)
  RETURNING id INTO v_premium_root;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('GATE', v_premium_root, true, NULL, NULL, NULL, 0)
  RETURNING id INTO v_premium_gate;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('CSE', v_premium_gate, true, 'cse', NULL, NULL, 0) RETURNING id INTO v_p_cse;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('ECE', v_premium_gate, true, 'ece', NULL, NULL, 1) RETURNING id INTO v_p_ece;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('EE',  v_premium_gate, true, 'ee',  NULL, NULL, 2) RETURNING id INTO v_p_ee;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('ME',  v_premium_gate, true, 'me',  NULL, NULL, 3) RETURNING id INTO v_p_me;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('CE',  v_premium_gate, true, 'ce',  NULL, NULL, 4) RETURNING id INTO v_p_ce;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('IN',  v_premium_gate, true, 'in',  NULL, NULL, 5) RETURNING id INTO v_p_in;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PI',  v_premium_gate, true, 'pi',  NULL, NULL, 6) RETURNING id INTO v_p_pi;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('DA',  v_premium_gate, true, 'da',  NULL, NULL, 7) RETURNING id INTO v_p_da;

  -- ── Premium sub-folders ───────────────────────────────────────────────────
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Predicted Papers', v_p_cse, true, 'cse', NULL, 'predicted', 0) RETURNING id INTO v_p_cse_pp;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PYQ Analysis',    v_p_cse, true, 'cse', NULL, 'pyqs',     1) RETURNING id INTO v_p_cse_pyq;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Predicted Papers', v_p_ece, true, 'ece', NULL, 'predicted', 0) RETURNING id INTO v_p_ece_pp;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PYQ Analysis',    v_p_ece, true, 'ece', NULL, 'pyqs',     1) RETURNING id INTO v_p_ece_pyq;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Predicted Papers', v_p_ee, true, 'ee', NULL, 'predicted', 0) RETURNING id INTO v_p_ee_pp;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PYQ Analysis',    v_p_ee, true, 'ee', NULL, 'pyqs',     1) RETURNING id INTO v_p_ee_pyq;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Predicted Papers', v_p_me, true, 'me', NULL, 'predicted', 0) RETURNING id INTO v_p_me_pp;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PYQ Analysis',    v_p_me, true, 'me', NULL, 'pyqs',     1) RETURNING id INTO v_p_me_pyq;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Predicted Papers', v_p_ce, true, 'ce', NULL, 'predicted', 0) RETURNING id INTO v_p_ce_pp;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PYQ Analysis',    v_p_ce, true, 'ce', NULL, 'pyqs',     1) RETURNING id INTO v_p_ce_pyq;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Predicted Papers', v_p_in, true, 'in', NULL, 'predicted', 0) RETURNING id INTO v_p_in_pp;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PYQ Analysis',    v_p_in, true, 'in', NULL, 'pyqs',     1) RETURNING id INTO v_p_in_pyq;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Predicted Papers', v_p_pi, true, 'pi', NULL, 'predicted', 0) RETURNING id INTO v_p_pi_pp;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PYQ Analysis',    v_p_pi, true, 'pi', NULL, 'pyqs',     1) RETURNING id INTO v_p_pi_pyq;

  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('Predicted Papers', v_p_da, true, 'da', NULL, 'predicted', 0) RETURNING id INTO v_p_da_pp;
  INSERT INTO content_folders (name, parent_id, premium, branch, subject, resource_type, sort_order)
  VALUES ('PYQ Analysis',    v_p_da, true, 'da', NULL, 'pyqs',     1) RETURNING id INTO v_p_da_pyq;
END;
$$;
