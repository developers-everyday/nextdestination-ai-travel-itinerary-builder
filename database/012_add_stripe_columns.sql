-- ============================================================
-- Migration 012: Add Stripe columns
-- ============================================================
-- Adds:
--   1. stripe_price_id to plan_config (links plan to Stripe Price)
--   2. stripe_customer_id to user_profiles (links user to Stripe Customer)
-- ============================================================

-- 1. Add stripe_price_id to plan_config
ALTER TABLE plan_config ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- You'll update these after creating products in Stripe Dashboard:
-- UPDATE plan_config SET stripe_price_id = 'price_xxx' WHERE plan = 'explorer';
-- UPDATE plan_config SET stripe_price_id = 'price_yyy' WHERE plan = 'custom';

-- 2. Add stripe_customer_id to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Index for fast Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON user_profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
