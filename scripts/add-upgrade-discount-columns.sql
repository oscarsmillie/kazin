-- Add upgrade discount tracking columns to users table
-- Run this script to enable the discount upgrade feature

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS upgrade_discount_eligible BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS upgrade_discount_used BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_upgrade_discount 
ON public.users(upgrade_discount_eligible, upgrade_discount_used);

-- Grant service role access
GRANT ALL ON public.users TO service_role;
