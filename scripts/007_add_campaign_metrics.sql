-- Add metrics columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(start_date, end_date);

-- Update existing campaigns to have default values
UPDATE public.campaigns 
SET views = 0, clicks = 0, conversions = 0 
WHERE views IS NULL OR clicks IS NULL OR conversions IS NULL;
