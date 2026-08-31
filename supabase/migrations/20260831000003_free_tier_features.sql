-- =============================================
-- Free tier features: diagnostics, plans, doubt usage
-- =============================================
-- Adds tables for:
-- 1. user_diagnostics — free diagnostic test results
-- 2. user_study_plans + user_study_plan_items — 7-day plans
-- 3. doubt_usage — daily free doubt usage tracking
-- 4. get_doubt_usage_today + increment_doubt_usage RPC functions

-- =============================================
-- user_diagnostics: Free diagnostic test results
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  score INTEGER,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  results JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_diagnostics_user
  ON public.user_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_diagnostics_status
  ON public.user_diagnostics(user_id, status);

ALTER TABLE public.user_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diagnostics"
  ON public.user_diagnostics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagnostics"
  ON public.user_diagnostics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnostics"
  ON public.user_diagnostics FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- user_study_plans: 7-day personalized study plans
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  source_diagnostic_id UUID REFERENCES public.user_diagnostics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_plans_user_status
  ON public.user_study_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_plans_paper
  ON public.user_study_plans(paper_id);

ALTER TABLE public.user_study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans"
  ON public.user_study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plans"
  ON public.user_study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON public.user_study_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- user_study_plan_items: Individual plan tasks
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_study_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.user_study_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'study' CHECK (task_type IN ('study', 'practice', 'review', 'test')),
  estimated_minutes INTEGER DEFAULT 30,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_items_plan_day
  ON public.user_study_plan_items(plan_id, day_number);

ALTER TABLE public.user_study_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plan items for their own plans"
  ON public.user_study_plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_study_plans p
      WHERE p.id = plan_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create plan items for their own plans"
  ON public.user_study_plan_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_study_plans p
      WHERE p.id = plan_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update plan items for their own plans"
  ON public.user_study_plan_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_study_plans p
      WHERE p.id = plan_id AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- doubt_usage: Daily free doubt usage tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.doubt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_doubt_usage_user_date
  ON public.doubt_usage(user_id, usage_date);

ALTER TABLE public.doubt_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own doubt usage"
  ON public.doubt_usage FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- get_doubt_usage_today: Returns today's count
-- =============================================
CREATE OR REPLACE FUNCTION public.get_doubt_usage_today(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT message_count INTO v_count
  FROM public.doubt_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_doubt_usage_today TO authenticated;

-- =============================================
-- increment_doubt_usage: Atomically increments today's count
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_doubt_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.doubt_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    message_count = public.doubt_usage.message_count + 1,
    last_message_at = NOW()
  RETURNING message_count INTO v_count;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_doubt_usage TO authenticated;

-- =============================================
-- Mark complete plan item RPC
-- =============================================
CREATE OR REPLACE FUNCTION public.complete_plan_item(
  p_user_id UUID,
  p_plan_id UUID,
  p_day_number INTEGER DEFAULT NULL,
  p_item_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_owner UUID;
  v_total INTEGER;
  v_completed INTEGER;
  v_plan_completed BOOLEAN := FALSE;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_plan_owner
  FROM public.user_study_plans
  WHERE id = p_plan_id;

  IF v_plan_owner IS NULL OR v_plan_owner <> p_user_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Plan not found');
  END IF;

  -- Mark items complete
  IF p_item_id IS NOT NULL THEN
    UPDATE public.user_study_plan_items
    SET completed = TRUE, completed_at = NOW()
    WHERE id = p_item_id AND plan_id = p_plan_id;
  ELSIF p_day_number IS NOT NULL THEN
    UPDATE public.user_study_plan_items
    SET completed = TRUE, completed_at = NOW()
    WHERE plan_id = p_plan_id AND day_number = p_day_number AND NOT completed;
  END IF;

  -- Check completion
  SELECT COUNT(*) INTO v_total
  FROM public.user_study_plan_items
  WHERE plan_id = p_plan_id;

  SELECT COUNT(*) INTO v_completed
  FROM public.user_study_plan_items
  WHERE plan_id = p_plan_id AND completed;

  IF v_total > 0 AND v_total = v_completed THEN
    UPDATE public.user_study_plans
    SET status = 'completed', completed_at = NOW()
    WHERE id = p_plan_id;
    v_plan_completed := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'planCompleted', v_plan_completed,
    'totalItems', v_total,
    'completedItems', v_completed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_plan_item TO authenticated;