-- Allow users to view their assigned coach's profile
CREATE POLICY "Users can view their assigned coach profile"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT p.id FROM profiles p
    INNER JOIN profiles client ON client.assigned_coach_id = p.user_id
    WHERE client.user_id = auth.uid()
  )
);