-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view their assigned coach profile" ON public.profiles;

-- Create a fixed policy that doesn't cause recursion
-- This uses a subquery that only accesses the user's own assigned_coach_id directly
CREATE POLICY "Users can view their assigned coach profile" 
ON public.profiles 
FOR SELECT 
USING (
  user_id IN (
    SELECT assigned_coach_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() AND assigned_coach_id IS NOT NULL
  )
);