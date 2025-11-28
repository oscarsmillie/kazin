-- Add payment tracking to resumes table
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create index for payment queries
CREATE INDEX IF NOT EXISTS idx_resumes_payment_status ON resumes(payment_status);
CREATE INDEX IF NOT EXISTS idx_resumes_payment_reference ON resumes(payment_reference);

-- Update existing resumes to not require payment (for backward compatibility)
UPDATE resumes SET payment_required = false WHERE payment_required IS NULL;
