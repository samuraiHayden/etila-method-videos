
-- Per-user workout day assignments (overrides program_days or fully custom)
CREATE TABLE public.user_program_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  is_rest_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.user_program_days ENABLE ROW LEVEL SECURITY;

-- Admins/coaches can manage all user schedules
CREATE POLICY "Admins can manage user program days"
  ON public.user_program_days
  FOR ALL
  USING (is_admin(auth.uid()));

-- Users can view their own schedule
CREATE POLICY "Users can view their own program days"
  ON public.user_program_days
  FOR SELECT
  USING (auth.uid() = user_id);
