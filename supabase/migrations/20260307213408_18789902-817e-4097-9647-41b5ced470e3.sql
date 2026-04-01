
-- Fix meal_plans: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins can manage meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can manage their meal plans" ON public.meal_plans;

CREATE POLICY "Admins can manage meal plans" ON public.meal_plans FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view their meal plans" ON public.meal_plans FOR SELECT USING (auth.uid() = user_id);

-- Fix meal_plan_items: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins can manage meal plan items" ON public.meal_plan_items;
DROP POLICY IF EXISTS "Users can manage their meal plan items" ON public.meal_plan_items;

CREATE POLICY "Admins can manage meal plan items" ON public.meal_plan_items FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view their meal plan items" ON public.meal_plan_items FOR SELECT USING (EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meal_plan_items.meal_plan_id AND mp.user_id = auth.uid()));

-- Fix meals table too
DROP POLICY IF EXISTS "Admins can manage meals" ON public.meals;
DROP POLICY IF EXISTS "Clients can view meals" ON public.meals;

CREATE POLICY "Admins can manage meals" ON public.meals FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Clients can view meals" ON public.meals FOR SELECT USING (auth.uid() IS NOT NULL);
