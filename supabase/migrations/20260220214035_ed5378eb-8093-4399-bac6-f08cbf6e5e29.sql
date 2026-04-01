
-- Table for per-user exercise overrides (coaches can customize sets/reps/notes per user per workout_exercise)
CREATE TABLE public.user_exercise_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  sets INTEGER,
  reps TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workout_exercise_id)
);

ALTER TABLE public.user_exercise_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user exercise overrides"
  ON public.user_exercise_overrides
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own overrides"
  ON public.user_exercise_overrides
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_exercise_overrides_updated_at
  BEFORE UPDATE ON public.user_exercise_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
