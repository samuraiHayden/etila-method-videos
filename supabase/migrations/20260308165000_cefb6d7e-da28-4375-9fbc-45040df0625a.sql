
-- Add default_ingredients column to meals
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS default_ingredients jsonb;

-- Add missing food items
INSERT INTO public.food_items (name, category, default_portion_qty, default_portion_unit, calories, protein, carbs, fat) VALUES
  ('Black Beans', 'carb', 0.5, 'cup', 110, 7, 20, 0),
  ('Bell Peppers', 'carb', 1, 'cup', 60, 2, 14, 0),
  ('Feta Cheese', 'fat', 15, 'g', 40, 3, 0, 3),
  ('Spinach', 'carb', 1, 'cup', 20, 2, 3, 0),
  ('Cottage Cheese (Low-Fat)', 'protein', 1, 'cup', 180, 28, 6, 5),
  ('Apple', 'carb', 1, 'medium', 95, 0, 25, 0),
  ('Granola', 'carb', 0.25, 'cup', 130, 3, 20, 5),
  ('Whole Wheat Wrap', 'carb', 1, 'large', 210, 8, 35, 6);

-- Helper function to build ingredient JSON
CREATE OR REPLACE FUNCTION _tmp_build_ing(_name text, _qty numeric)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'food_item_id', fi.id,
    'name', fi.name,
    'qty', _qty,
    'unit', fi.default_portion_unit,
    'calories', round(fi.calories * (_qty / fi.default_portion_qty), 1),
    'protein', round(fi.protein * (_qty / fi.default_portion_qty), 1),
    'carbs', round(fi.carbs * (_qty / fi.default_portion_qty), 1),
    'fat', round(fi.fat * (_qty / fi.default_portion_qty), 1)
  )
  FROM food_items fi WHERE fi.name = _name LIMIT 1;
$$;

-- Breakfast Burrito
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whole Wheat Wrap', 1),
  _tmp_build_ing('Egg Whites', 1),
  _tmp_build_ing('Whole Eggs', 2),
  _tmp_build_ing('Black Beans', 0.5)
) WHERE name = 'Breakfast Burrito';

-- Chicken & Rice Breakfast Plate
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Chicken Breast', 6),
  _tmp_build_ing('Rice', 0.75),
  _tmp_build_ing('Bell Peppers', 1)
) WHERE name = 'Chicken & Rice Breakfast Plate';

-- Eggs + Toast (Fat Loss)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whole Eggs', 1),
  _tmp_build_ing('Egg Whites', 0.375),
  _tmp_build_ing('Whole Wheat Toast', 1),
  _tmp_build_ing('Avocado', 0.25)
) WHERE name = 'Eggs + Toast (Fat Loss)';

-- Eggs + Toast (Muscle Gain)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whole Eggs', 2),
  _tmp_build_ing('Egg Whites', 0.25),
  _tmp_build_ing('Whole Wheat Toast', 2),
  _tmp_build_ing('Avocado', 0.5)
) WHERE name = 'Eggs + Toast (Muscle Gain)';

-- Etila's Pancake (Fat Loss)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Egg Whites', 0.63),
  _tmp_build_ing('Oats (dry)', 0.5),
  _tmp_build_ing('Whole Eggs', 1),
  _tmp_build_ing('Feta Cheese', 15)
) WHERE name = 'Etila''s Pancake (Fat Loss)';

-- Etila's Pancake (Muscle Gain)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Egg Whites', 0.63),
  _tmp_build_ing('Oats (dry)', 0.625),
  _tmp_build_ing('Whole Eggs', 1),
  _tmp_build_ing('Feta Cheese', 15),
  _tmp_build_ing('Banana', 1)
) WHERE name = 'Etila''s Pancake (Muscle Gain)';

-- Greek Yogurt & Berry Bowl (Lean)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Non-Fat Greek Yogurt', 1.5),
  _tmp_build_ing('Blueberries', 0.5),
  _tmp_build_ing('Chia Seeds', 1)
) WHERE name = 'Greek Yogurt & Berry Bowl (Lean)';

-- Greek Yogurt Bowl (Fat Loss)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Non-Fat Greek Yogurt', 1),
  _tmp_build_ing('Blueberries', 0.5),
  _tmp_build_ing('Chia Seeds', 1)
) WHERE name = 'Greek Yogurt Bowl (Fat Loss)';

-- Greek Yogurt Bowl (Muscle Gain)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Non-Fat Greek Yogurt', 1),
  _tmp_build_ing('Blueberries', 1),
  _tmp_build_ing('Granola', 0.25),
  _tmp_build_ing('Almond Butter', 1)
) WHERE name = 'Greek Yogurt Bowl (Muscle Gain)';

-- Greek Yogurt Power Bowl
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Non-Fat Greek Yogurt', 1),
  _tmp_build_ing('Whey Protein', 1),
  _tmp_build_ing('Oats (dry)', 0.5),
  _tmp_build_ing('Almond Butter', 1)
) WHERE name = 'Greek Yogurt Power Bowl';

-- High-Calorie Mass Gainer Bowl
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whey Protein', 1),
  _tmp_build_ing('Oats (dry)', 1),
  _tmp_build_ing('Almond Butter', 1),
  _tmp_build_ing('Banana', 1)
) WHERE name = 'High-Calorie Mass Gainer Bowl';

-- High-Protein Egg & Oat Bowl
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Egg Whites', 1),
  _tmp_build_ing('Whole Eggs', 2),
  _tmp_build_ing('Oats (dry)', 0.5),
  _tmp_build_ing('Blueberries', 0.5)
) WHERE name = 'High-Protein Egg & Oat Bowl';

-- Low-Carb Egg & Avocado Plate
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whole Eggs', 3),
  _tmp_build_ing('Avocado', 0.5),
  _tmp_build_ing('Spinach', 1)
) WHERE name = 'Low-Carb Egg & Avocado Plate';

-- Overnight Protein Oats
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Oats (dry)', 0.5),
  _tmp_build_ing('Peanut Butter', 1)
) WHERE name = 'Overnight Protein Oats';

-- Protein Oatmeal Bowl
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whey Protein', 1),
  _tmp_build_ing('Oats (dry)', 0.5),
  _tmp_build_ing('Peanut Butter', 1),
  _tmp_build_ing('Banana', 0.5)
) WHERE name = 'Protein Oatmeal Bowl';

-- Protein Pancake Stack
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whey Protein', 1),
  _tmp_build_ing('Oats (dry)', 0.5),
  _tmp_build_ing('Whole Eggs', 2),
  _tmp_build_ing('Maple Syrup', 1)
) WHERE name = 'Protein Pancake Stack';

-- Protein Pancakes (Fat Loss)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Oats (dry)', 0.25),
  _tmp_build_ing('Egg Whites', 0.5),
  _tmp_build_ing('Blueberries', 0.5)
) WHERE name = 'Protein Pancakes (Fat Loss)';

-- Protein Pancakes (Muscle Gain)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whole Eggs', 2),
  _tmp_build_ing('Egg Whites', 0.25),
  _tmp_build_ing('Oats (dry)', 0.625),
  _tmp_build_ing('Banana', 1)
) WHERE name = 'Protein Pancakes (Muscle Gain)';

-- Protein Smoothie (Fat Loss)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whey Protein', 1),
  _tmp_build_ing('Spinach', 1),
  _tmp_build_ing('Banana', 0.5)
) WHERE name = 'Protein Smoothie (Fat Loss)';

-- Protein Smoothie (Muscle Gain)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whey Protein', 1),
  _tmp_build_ing('Banana', 1),
  _tmp_build_ing('Oats (dry)', 0.5)
) WHERE name = 'Protein Smoothie (Muscle Gain)';

-- Shrimp & Egg Scramble
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Shrimp', 6),
  _tmp_build_ing('Whole Eggs', 2),
  _tmp_build_ing('Spinach', 1)
) WHERE name = 'Shrimp & Egg Scramble';

-- Smoked Salmon & Toast
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Smoked Salmon', 3),
  _tmp_build_ing('Whole Wheat Toast', 2),
  _tmp_build_ing('Light Cream Cheese', 1)
) WHERE name = 'Smoked Salmon & Toast';

-- Tofu & Sweet Potato Scramble
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Extra-Firm Tofu', 7),
  _tmp_build_ing('Sweet Potato', 200),
  _tmp_build_ing('Spinach', 1)
) WHERE name = 'Tofu & Sweet Potato Scramble';

-- Cottage Cheese Snack (Fat Loss)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Cottage Cheese (Low-Fat)', 1),
  _tmp_build_ing('Blueberries', 0.5)
) WHERE name = 'Cottage Cheese Snack (Fat Loss)';

-- Cottage Cheese Snack (Muscle Gain)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Cottage Cheese (Low-Fat)', 1),
  _tmp_build_ing('Blueberries', 0.5)
) WHERE name = 'Cottage Cheese Snack (Muscle Gain)';

-- Greek Yogurt Bowl Snack (Fat Loss)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Non-Fat Greek Yogurt', 1),
  _tmp_build_ing('Blueberries', 0.5)
) WHERE name = 'Greek Yogurt Bowl Snack (Fat Loss)';

-- Greek Yogurt Bowl Snack (Muscle Gain)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Non-Fat Greek Yogurt', 1),
  _tmp_build_ing('Granola', 0.25),
  _tmp_build_ing('Banana', 1)
) WHERE name = 'Greek Yogurt Bowl Snack (Muscle Gain)';

-- Protein Shake (Fat Loss)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whey Protein', 1)
) WHERE name = 'Protein Shake (Fat Loss)';

-- Protein Shake (Muscle Gain)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whey Protein', 1),
  _tmp_build_ing('Banana', 1),
  _tmp_build_ing('Oats (dry)', 0.5)
) WHERE name = 'Protein Shake (Muscle Gain)';

-- Simple Grab-and-Go (Fat Loss)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whole Eggs', 1),
  _tmp_build_ing('Apple', 1)
) WHERE name = 'Simple Grab-and-Go (Fat Loss)';

-- Simple Grab-and-Go (Muscle Gain)
UPDATE meals SET default_ingredients = jsonb_build_array(
  _tmp_build_ing('Whole Eggs', 2),
  _tmp_build_ing('Banana', 1),
  _tmp_build_ing('Peanut Butter', 1)
) WHERE name = 'Simple Grab-and-Go (Muscle Gain)';

-- Drop helper function
DROP FUNCTION _tmp_build_ing;
