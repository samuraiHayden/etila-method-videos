
ALTER TABLE public.meal_plan_items 
  ADD COLUMN serving_quantity numeric NULL DEFAULT 1,
  ADD COLUMN serving_unit text NULL DEFAULT 'serving';
