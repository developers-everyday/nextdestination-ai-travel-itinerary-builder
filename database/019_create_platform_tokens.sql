-- 019: Create platform_tokens table for OAuth token storage
-- Stores OAuth access/refresh tokens for external platforms (Pinterest, Instagram, Twitter, etc.)
-- One row per platform — reusable for any future OAuth integrations.

CREATE TABLE IF NOT EXISTS platform_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  account_name TEXT,
  connected_by UUID REFERENCES auth.users(id),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only service-role should read/write tokens (never expose via anon key)
ALTER TABLE platform_tokens ENABLE ROW LEVEL SECURITY;
