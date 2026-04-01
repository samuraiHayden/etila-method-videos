
-- Create food_items table for structured ingredient tracking with per-portion macros
CREATE TABLE public.food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL, -- 'protein', 'carb', 'fat'
  default_portion_qty numeric NOT NULL DEFAULT 1,
  default_portion_unit text NOT NULL DEFAULT 'serving',
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage food items" ON public.food_items FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Clients can view food items" ON public.food_items FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed protein sources
INSERT INTO public.food_items (name, category, default_portion_qty, default_portion_unit, calories, protein, carbs, fat) VALUES
('Egg Whites', 'protein', 1, 'cup', 120, 26, 2, 0),
('Whole Eggs', 'protein', 1, 'egg', 70, 6, 0, 5),
('Lean Turkey 93/7', 'protein', 6, 'oz', 280, 42, 0, 12),
('Chicken Breast', 'protein', 6, 'oz', 276, 52, 0, 6),
('Whey Protein', 'protein', 1, 'scoop', 120, 24, 3, 1),
('Non-Fat Greek Yogurt', 'protein', 1, 'cup', 100, 17, 6, 0),
('Extra-Firm Tofu', 'protein', 7, 'oz', 210, 24, 6, 12),
('Shrimp', 'protein', 6, 'oz', 170, 36, 1, 2),
('Smoked Salmon', 'protein', 3, 'oz', 120, 18, 0, 4);

-- Seed carb sources
INSERT INTO public.food_items (name, category, default_portion_qty, default_portion_unit, calories, protein, carbs, fat) VALUES
('Oats (dry)', 'carb', 0.5, 'cup', 150, 5, 27, 3),
('Rice', 'carb', 1, 'cup', 205, 4, 45, 0),
('Sweet Potato', 'carb', 200, 'g', 180, 4, 41, 0),
('Blueberries', 'carb', 0.5, 'cup', 40, 0, 10, 0),
('Banana', 'carb', 1, 'medium', 105, 1, 27, 0),
('Whole Wheat Toast', 'carb', 1, 'slice', 100, 4, 20, 1),
('Maple Syrup', 'carb', 1, 'tbsp', 50, 0, 13, 0),
('Honey', 'carb', 1, 'tbsp', 60, 0, 17, 0);

-- Seed fat sources
INSERT INTO public.food_items (name, category, default_portion_qty, default_portion_unit, calories, protein, carbs, fat) VALUES
('Almond Butter', 'fat', 1, 'tbsp', 95, 3, 3, 8),
('Peanut Butter', 'fat', 1, 'tbsp', 95, 4, 3, 8),
('Olive Oil', 'fat', 1, 'tsp', 40, 0, 0, 4.5),
('Avocado', 'fat', 0.5, 'whole', 120, 1, 6, 10),
('Chia Seeds', 'fat', 1, 'tbsp', 60, 2, 5, 4),
('Light Cream Cheese', 'fat', 1, 'tbsp', 35, 1, 1, 3);
