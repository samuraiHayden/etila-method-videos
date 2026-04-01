
-- Fix meal_plans policies to PERMISSIVE
DROP POLICY IF EXISTS "Users can view their meal plans" ON public.meal_plans;
CREATE POLICY "Users can view their meal plans"
ON public.meal_plans FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage meal plans" ON public.meal_plans;
CREATE POLICY "Admins can manage meal plans"
ON public.meal_plans FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix meal_plan_items policies to PERMISSIVE
DROP POLICY IF EXISTS "Users can view their meal plan items" ON public.meal_plan_items;
CREATE POLICY "Users can view their meal plan items"
ON public.meal_plan_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM meal_plans mp
  WHERE mp.id = meal_plan_items.meal_plan_id
  AND mp.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Admins can manage meal plan items" ON public.meal_plan_items;
CREATE POLICY "Admins can manage meal plan items"
ON public.meal_plan_items FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix meals policies to PERMISSIVE
DROP POLICY IF EXISTS "Clients can view meals" ON public.meals;
CREATE POLICY "Clients can view meals"
ON public.meals FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage meals" ON public.meals;
CREATE POLICY "Admins can manage meals"
ON public.meals FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
