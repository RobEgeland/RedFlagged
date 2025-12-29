-- Add clerk_user_id column to users table for Clerk integration
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_clerk_user_id_idx ON public.users(clerk_user_id);

-- Update RLS policy to support Clerk authentication
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (
    auth.uid()::text = user_id OR 
    clerk_user_id IS NOT NULL
  );
