-- Allow users to create their own meal plans
CREATE POLICY "Users can create their own meal plans"
ON public.meal_plans
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own meal plans
CREATE POLICY "Users can update their own meal plans"
ON public.meal_plans
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own meal plans
CREATE POLICY "Users can delete their own meal plans"
ON public.meal_plans
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to create items in their own meal plans
CREATE POLICY "Users can create their own meal plan items"
ON public.meal_plan_items
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM meal_plans mp
  WHERE mp.id = meal_plan_items.meal_plan_id AND mp.user_id = auth.uid()
));

-- Allow users to update items in their own meal plans
CREATE POLICY "Users can update their own meal plan items"
ON public.meal_plan_items
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM meal_plans mp
  WHERE mp.id = meal_plan_items.meal_plan_id AND mp.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM meal_plans mp
  WHERE mp.id = meal_plan_items.meal_plan_id AND mp.user_id = auth.uid()
));

-- Allow users to delete items in their own meal plans
CREATE POLICY "Users can delete their own meal plan items"
ON public.meal_plan_items
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM meal_plans mp
  WHERE mp.id = meal_plan_items.meal_plan_id AND mp.user_id = auth.uid()
));