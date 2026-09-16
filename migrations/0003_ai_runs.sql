-- ==============================================================================
-- Migration: 0003_ai_runs.sql
-- Description: Create ai_runs table, grants, and Row-Level Security scoped to owner.
-- ==============================================================================

-- 1. Create table public.ai_runs
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  response text NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  capability text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_runs TO authenticated;
GRANT ALL ON public.ai_runs TO service_role;

-- 3. Enable Row-Level Security
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

-- 4. Row-Level Security Policies scoped strictly to owner (user_id = auth.uid())

DROP POLICY IF EXISTS "ai_runs_select_owner" ON public.ai_runs;
CREATE POLICY "ai_runs_select_owner"
  ON public.ai_runs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_runs_insert_owner" ON public.ai_runs;
CREATE POLICY "ai_runs_insert_owner"
  ON public.ai_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_runs_update_owner" ON public.ai_runs;
CREATE POLICY "ai_runs_update_owner"
  ON public.ai_runs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_runs_delete_owner" ON public.ai_runs;
CREATE POLICY "ai_runs_delete_owner"
  ON public.ai_runs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Index for fast user history lookup
CREATE INDEX IF NOT EXISTS idx_ai_runs_user_created ON public.ai_runs(user_id, created_at DESC);
