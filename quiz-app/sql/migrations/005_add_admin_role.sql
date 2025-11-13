-- Migration 005: Add admin role to users
-- This enables admin users to manage subjects

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create admin user with username 'admin' and password 'admin'
-- Password hash for 'admin' using bcrypt (10 rounds)
-- In production, this should be changed immediately!
INSERT INTO users (name, password_hash, is_admin) 
VALUES (
  'admin', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- bcrypt hash of 'admin'
  true
)
ON CONFLICT (name) DO UPDATE SET is_admin = true;

-- Add index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
