
-- Table for per-user, per-day exercise assignments (exercise-level scheduling)
CREATE TABLE public.user_day_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_day_exercises ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage user day exercises"
  ON public.user_day_exercises
  FOR ALL
  USING (is_admin(auth.uid()));

-- Users can view their own
CREATE POLICY "Users can view their own day exercises"
  ON public.user_day_exercises
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_day_exercises_user_day ON public.user_day_exercises(user_id, day_of_week);
