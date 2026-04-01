
CREATE TABLE public.user_nutrition_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  calories integer NULL,
  protein numeric NULL,
  carbs numeric NULL,
  fat numeric NULL,
  notes text NULL,
  assigned_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- One row per user
CREATE UNIQUE INDEX user_nutrition_targets_user_id_idx ON public.user_nutrition_targets (user_id);

ALTER TABLE public.user_nutrition_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage nutrition targets"
  ON public.user_nutrition_targets
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own nutrition targets"
  ON public.user_nutrition_targets
  FOR SELECT
  USING (auth.uid() = user_id);
