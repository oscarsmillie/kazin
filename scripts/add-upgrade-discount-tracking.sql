-- Add field to track if user is eligible for the special upgrade discount
-- This is set to true when a free user pays for their first resume download
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS upgrade_discount_eligible BOOLEAN DEFAULT FALSE;

-- Add field to track if the discount has been used
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS upgrade_discount_used BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN users.upgrade_discount_eligible IS 'True if user paid for resume download and can get upgrade discount';
COMMENT ON COLUMN users.upgrade_discount_used IS 'True if user already claimed the upgrade discount';
