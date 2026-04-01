-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their assigned coach profile" ON public.profiles;

-- Create a security definer function to safely get the assigned coach id
CREATE OR REPLACE FUNCTION public.get_my_assigned_coach_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assigned_coach_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
$$;

-- Create a non-recursive policy using the function
CREATE POLICY "Users can view their assigned coach profile" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = public.get_my_assigned_coach_id()
);