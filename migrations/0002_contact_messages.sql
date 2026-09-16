-- ==============================================================================
-- Migration: 0002_contact_messages.sql
-- Description: Create contact_messages table, grants, and Row-Level Security.
-- ==============================================================================

-- 1. Create table public.contact_messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  source text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Grants
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

-- 3. Enable Row-Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 4. Row-Level Security Policies

-- Policy 1: Allow INSERT to anon + authenticated (WITH CHECK true)
DROP POLICY IF EXISTS "contact_messages_insert_anon_authenticated" ON public.contact_messages;
CREATE POLICY "contact_messages_insert_anon_authenticated"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Allow SELECT only to admins via has_role(auth.uid(), 'admin')
DROP POLICY IF EXISTS "contact_messages_select_admin_only" ON public.contact_messages;
CREATE POLICY "contact_messages_select_admin_only"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Policy 3: Allow UPDATE only to admins via has_role(auth.uid(), 'admin')
DROP POLICY IF EXISTS "contact_messages_update_admin_only" ON public.contact_messages;
CREATE POLICY "contact_messages_update_admin_only"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Policy 4: Allow DELETE only to admins via has_role(auth.uid(), 'admin')
DROP POLICY IF EXISTS "contact_messages_delete_admin_only" ON public.contact_messages;
CREATE POLICY "contact_messages_delete_admin_only"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
