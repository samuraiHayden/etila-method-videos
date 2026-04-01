-- Drop the recursive policies on user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

-- Replace with non-recursive policies
-- Users can always view their own role (simple, no function call)
-- Admins viewing all roles: use a direct subquery instead of is_admin() to avoid recursion
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'coach', 'content_admin')
        AND ur.user_id = auth.uid()
    )
  );

-- Super admins can manage roles: direct subquery, no recursive function
CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'super_admin'
    )
  );