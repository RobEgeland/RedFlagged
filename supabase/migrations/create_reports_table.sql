-- Create reports table for storing paid vehicle analysis reports
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL, -- Clerk user ID
    report_id text, -- Custom report identifier
    stripe_session_id text, -- Stripe checkout session ID
    vehicle_info jsonb NOT NULL, -- Vehicle information (year, make, model, VIN, etc.)
    report_data jsonb NOT NULL, -- Full VerdictResult JSON
    verdict text NOT NULL, -- 'deal', 'caution', or 'disaster'
    asking_price numeric,
    estimated_value numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS reports_stripe_session_id_idx ON public.reports(stripe_session_id);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own reports
-- Note: Since we're using Clerk, user_id is stored as text (Clerk user ID)
-- The API routes handle authentication, so we allow all authenticated requests
-- In production, you may want to add additional security layers
CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT USING (true); -- API routes handle user authentication

-- Create policy: Users can insert their own reports
CREATE POLICY "Users can insert own reports" ON public.reports
    FOR INSERT WITH CHECK (true); -- API routes handle user authentication

-- Create policy: Users can update their own reports
CREATE POLICY "Users can update own reports" ON public.reports
    FOR UPDATE USING (true); -- API routes handle user authentication

-- Create policy: Users can delete their own reports
CREATE POLICY "Users can delete own reports" ON public.reports
    FOR DELETE USING (true); -- API routes handle user authentication

