-- ============================================================
-- Migration 011: User Profiles & Plan Configuration
-- ============================================================
-- Creates:
--   1. plan_config   — defines limits per plan (starter, explorer, custom)
--   2. user_profiles — one row per user with role, plan, and usage counters
--   3. Auto-creation trigger on auth.users insert
--   4. RLS policies
-- ============================================================

-- 1. Plan Configuration Table
CREATE TABLE IF NOT EXISTS plan_config (
  plan TEXT PRIMARY KEY,
  max_generations INT NOT NULL,
  max_saves INT NOT NULL,
  has_voice_agent BOOLEAN DEFAULT false,
  has_affiliate BOOLEAN DEFAULT false,
  can_sell_packages BOOLEAN DEFAULT false
);

-- Seed default plans
INSERT INTO plan_config (plan, max_generations, max_saves, has_voice_agent, has_affiliate, can_sell_packages)
VALUES
  ('starter',  5,     1,     false, false, false),
  ('explorer', 50,    10,    true,  false, false),
  ('custom',   99999, 99999, true,  true,  true)
ON CONFLICT (plan) DO NOTHING;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'explorer'
    CHECK (role IN ('explorer', 'influencer', 'agent')),
  plan TEXT NOT NULL DEFAULT 'starter'
    REFERENCES plan_config(plan),
  generations_used INT NOT NULL DEFAULT 0,
  saves_used INT NOT NULL DEFAULT 0,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 3. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_config ENABLE ROW LEVEL SECURITY;

-- plan_config: readable by everyone (it's reference data)
CREATE POLICY "Anyone can read plan_config"
  ON plan_config FOR SELECT
  USING (true);

-- user_profiles: anyone can read any profile (public info)
CREATE POLICY "Anyone can read user profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- user_profiles: only the owner can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_profiles: only the owner can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- user_profiles: only the owner can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Auto-create profile on signup (trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Updated_at auto-update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON user_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
