
-- Drop the unique constraint on user_id + day_of_week so multiple workouts per day are allowed
-- First check existing constraint name
ALTER TABLE public.user_program_days DROP CONSTRAINT IF EXISTS user_program_days_user_id_day_of_week_key;

-- Add a unique constraint on user_id + day_of_week + workout_id instead
ALTER TABLE public.user_program_days ADD CONSTRAINT user_program_days_user_day_workout_key UNIQUE(user_id, day_of_week, workout_id);
