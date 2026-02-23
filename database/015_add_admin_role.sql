-- Add 'admin' to the role CHECK constraint on user_profiles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('explorer', 'influencer', 'agent', 'admin'));
