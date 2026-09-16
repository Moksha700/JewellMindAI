-- ==============================================================================
-- Migration: JewelMind AI - Core Cloud Database Schema
-- Description: Sets up public schema tables, custom ENUMs, SECURITY DEFINER functions,
--              Row-Level Security (RLS) policies, and permission grants.
-- ==============================================================================

-- 0. Ensure PostgreSQL Extensions & Mock auth schema for standalone execution
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create roles if they do not already exist (compatibility across Cloud SQL, Supabase, Neon)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
END $$;

-- 1. Custom Role Enumeration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- 2. Security Definer Role Checker
-- CRITICAL: Never check roles on the profiles table. Roles are strictly queried from user_roles.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Grant execution of has_role to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;


-- ==============================================================================
-- TABLE 1: profiles
-- User profile metadata.
-- Rules: Never check roles on this table.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT clock_timestamp() NOT NULL,
  updated_at timestamptz DEFAULT clock_timestamp() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles owner select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Profiles owner insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles owner update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles owner delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());


-- ==============================================================================
-- TABLE 2: user_roles
-- Strict Role-Based Access Control (RBAC).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User roles owner select"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "User roles owner insert"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User roles owner update"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User roles owner delete"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ==============================================================================
-- TABLE 3: style_quiz
-- Interactive AI Style Quiz inputs, aesthetics, and results.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.style_quiz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'draft' NOT NULL,
  created_at timestamptz DEFAULT clock_timestamp() NOT NULL,
  updated_at timestamptz DEFAULT clock_timestamp() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.style_quiz TO authenticated;
GRANT ALL ON public.style_quiz TO service_role;

ALTER TABLE public.style_quiz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Style quiz owner select"
  ON public.style_quiz
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Style quiz owner insert"
  ON public.style_quiz
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Style quiz owner update"
  ON public.style_quiz
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Style quiz owner delete"
  ON public.style_quiz
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ==============================================================================
-- TABLE 4: occasion_filters (Supporting Feature: Occasion Filters)
-- Event & celebration styling filters (Weddings, Galas, Cocktail, Everyday).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.occasion_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  occasion_name text NOT NULL,
  dress_code text,
  budget_min numeric(12, 2),
  budget_max numeric(12, 2),
  metal_preferences text[] DEFAULT ARRAY[]::text[],
  gemstone_preferences text[] DEFAULT ARRAY[]::text[],
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT clock_timestamp() NOT NULL,
  updated_at timestamptz DEFAULT clock_timestamp() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.occasion_filters TO authenticated;
GRANT ALL ON public.occasion_filters TO service_role;

ALTER TABLE public.occasion_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Occasion filters owner select"
  ON public.occasion_filters
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Occasion filters owner insert"
  ON public.occasion_filters
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Occasion filters owner update"
  ON public.occasion_filters
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Occasion filters owner delete"
  ON public.occasion_filters
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ==============================================================================
-- TABLE 5: virtual_try_on (Supporting Feature: Virtual Try-On)
-- AR / AI jewellery overlay sessions, neck/ear/finger detection and renderings.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.virtual_try_on (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  category text NOT NULL,
  try_on_type text NOT NULL, -- 'neck' | 'finger' | 'ear' | 'wrist'
  source_image_url text,
  rendered_image_url text,
  calibration_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'completed' NOT NULL,
  created_at timestamptz DEFAULT clock_timestamp() NOT NULL,
  updated_at timestamptz DEFAULT clock_timestamp() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_try_on TO authenticated;
GRANT ALL ON public.virtual_try_on TO service_role;

ALTER TABLE public.virtual_try_on ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Virtual try-on owner select"
  ON public.virtual_try_on
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Virtual try-on owner insert"
  ON public.virtual_try_on
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Virtual try-on owner update"
  ON public.virtual_try_on
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Virtual try-on owner delete"
  ON public.virtual_try_on
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ==============================================================================
-- TABLE 6: recommendation_engine (Supporting Feature: Recommendation Engine)
-- AI-curated jewellery pairings, stylistic match scores, and gemological rationale.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recommendation_engine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  jewellery_item_id text,
  category text NOT NULL,
  match_score numeric(5, 2),
  ai_reasoning text,
  attributes jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT clock_timestamp() NOT NULL,
  updated_at timestamptz DEFAULT clock_timestamp() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_engine TO authenticated;
GRANT ALL ON public.recommendation_engine TO service_role;

ALTER TABLE public.recommendation_engine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recommendation engine owner select"
  ON public.recommendation_engine
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Recommendation engine owner insert"
  ON public.recommendation_engine
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Recommendation engine owner update"
  ON public.recommendation_engine
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Recommendation engine owner delete"
  ON public.recommendation_engine
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ==============================================================================
-- TABLE 7: saved_favorites (Supporting Feature: Saved Favorites)
-- Curated personal vault of liked items, custom notes, and wishlists.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saved_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id text NOT NULL,
  item_title text NOT NULL,
  category text NOT NULL,
  metal_type text,
  gemstone text,
  price_estimate numeric(12, 2),
  image_url text,
  notes text,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT clock_timestamp() NOT NULL,
  updated_at timestamptz DEFAULT clock_timestamp() NOT NULL,
  CONSTRAINT uq_saved_favorites_user_item UNIQUE (user_id, item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_favorites TO authenticated;
GRANT ALL ON public.saved_favorites TO service_role;

ALTER TABLE public.saved_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saved favorites owner select"
  ON public.saved_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Saved favorites owner insert"
  ON public.saved_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Saved favorites owner update"
  ON public.saved_favorites
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Saved favorites owner delete"
  ON public.saved_favorites
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_style_quiz_user_id ON public.style_quiz(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_occasion_filters_user_id ON public.occasion_filters(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_virtual_try_on_user_id ON public.virtual_try_on(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_engine_user_id ON public.recommendation_engine(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_favorites_user_id ON public.saved_favorites(user_id, created_at DESC);
