-- =============================================
-- PROFITABLE FITNESS APP - COMPREHENSIVE SCHEMA
-- =============================================

-- =============================================
-- 1. EXERCISE LIBRARY
-- =============================================
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  video_url TEXT,
  written_cues TEXT,
  coaching_tips TEXT,
  muscle_groups TEXT[],
  equipment TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage exercises"
  ON public.exercises FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view exercises"
  ON public.exercises FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- 2. WORKOUT TEMPLATES
-- =============================================
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workouts"
  ON public.workouts FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Workout exercises junction with sets/reps
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  rpe INTEGER,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workout exercises"
  ON public.workout_exercises FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view workout exercises"
  ON public.workout_exercises FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- 3. PROGRAM TEMPLATES (Weekly Structure)
-- =============================================
CREATE TABLE public.program_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 12,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage programs"
  ON public.program_templates FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view programs"
  ON public.program_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Program days (Mon-Sun workout assignments)
CREATE TABLE public.program_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.program_templates(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  is_rest_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, day_of_week)
);

ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage program days"
  ON public.program_days FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view program days"
  ON public.program_days FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- 4. USER PROGRAM ASSIGNMENTS
-- =============================================
CREATE TABLE public.user_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.program_templates(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.user_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user programs"
  ON public.user_programs FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own program"
  ON public.user_programs FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 5. WORKOUT LOGS (User workout completion)
-- =============================================
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workout_id, workout_date)
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all workout logs"
  ON public.workout_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own workout logs"
  ON public.workout_logs FOR ALL
  USING (auth.uid() = user_id);

-- Set logs (individual set entries)
CREATE TABLE public.set_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight DECIMAL(10, 2),
  reps INTEGER,
  rpe INTEGER,
  notes TEXT,
  is_pr BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all set logs"
  ON public.set_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own set logs"
  ON public.set_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = set_logs.workout_log_id
    AND wl.user_id = auth.uid()
  ));

-- =============================================
-- 6. MEASUREMENTS & PROGRESS TRACKING
-- =============================================
CREATE TABLE public.measurement_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(10, 2),
  body_fat_percentage DECIMAL(5, 2),
  chest DECIMAL(10, 2),
  waist DECIMAL(10, 2),
  hips DECIMAL(10, 2),
  left_arm DECIMAL(10, 2),
  right_arm DECIMAL(10, 2),
  left_thigh DECIMAL(10, 2),
  right_thigh DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.measurement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all measurements"
  ON public.measurement_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own measurements"
  ON public.measurement_logs FOR ALL
  USING (auth.uid() = user_id);

-- Progress photos
CREATE TABLE public.progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('front', 'side', 'back', 'other')),
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all photos"
  ON public.progress_photos FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own photos"
  ON public.progress_photos FOR ALL
  USING (auth.uid() = user_id);

-- =============================================
-- 7. COURSES & LESSONS
-- =============================================
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('nutrition', 'mental', 'fitness')),
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  drip_enabled BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view published courses"
  ON public.courses FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_published = true);

-- Course modules
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  drip_week INTEGER, -- Which week this unlocks (null = immediately)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage modules"
  ON public.course_modules FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view modules"
  ON public.course_modules FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Lessons
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'text', 'pdf')),
  content TEXT, -- Video URL, text content, or PDF URL
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_start_here BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lessons"
  ON public.lessons FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view lessons"
  ON public.lessons FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Lesson completion tracking
CREATE TABLE public.lesson_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all completions"
  ON public.lesson_completions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own completions"
  ON public.lesson_completions FOR ALL
  USING (auth.uid() = user_id);

-- =============================================
-- 8. MEALS & NUTRITION
-- =============================================
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack')),
  ingredients TEXT[],
  instructions TEXT,
  prep_time_minutes INTEGER,
  calories INTEGER,
  protein DECIMAL(10, 2),
  carbs DECIMAL(10, 2),
  fat DECIMAL(10, 2),
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage meals"
  ON public.meals FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view meals"
  ON public.meals FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- User favorite meals
CREATE TABLE public.user_favorite_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, meal_id)
);

ALTER TABLE public.user_favorite_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their favorites"
  ON public.user_favorite_meals FOR ALL
  USING (auth.uid() = user_id);

-- Weekly meal plans
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage meal plans"
  ON public.meal_plans FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their meal plans"
  ON public.meal_plans FOR ALL
  USING (auth.uid() = user_id);

-- Meal plan items
CREATE TABLE public.meal_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage meal plan items"
  ON public.meal_plan_items FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their meal plan items"
  ON public.meal_plan_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.meal_plans mp
    WHERE mp.id = meal_plan_items.meal_plan_id
    AND mp.user_id = auth.uid()
  ));

-- =============================================
-- 9. MESSAGING SYSTEM
-- =============================================
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all threads"
  ON public.message_threads FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view their threads"
  ON public.message_threads FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can create threads"
  ON public.message_threads FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all messages"
  ON public.messages FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Thread participants can view messages"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.message_threads mt
    WHERE mt.id = messages.thread_id
    AND (mt.client_id = auth.uid() OR mt.coach_id = auth.uid())
  ));

CREATE POLICY "Thread participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.message_threads mt
    WHERE mt.id = messages.thread_id
    AND (mt.client_id = auth.uid() OR mt.coach_id = auth.uid())
  ));

-- =============================================
-- 10. ANNOUNCEMENTS & CHECK-INS
-- =============================================
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active announcements"
  ON public.announcements FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Weekly check-in templates
CREATE TABLE public.checkin_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checkin_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checkin templates"
  ON public.checkin_templates FOR ALL
  USING (is_admin(auth.uid()));

-- User check-in responses
CREATE TABLE public.checkin_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.checkin_templates(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checkin_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all checkin responses"
  ON public.checkin_responses FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their checkin responses"
  ON public.checkin_responses FOR ALL
  USING (auth.uid() = user_id);

-- =============================================
-- 11. ADD STARTING WEIGHT TO PROFILES
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS starting_weight TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_coach_id UUID REFERENCES auth.users(id);

-- =============================================
-- 12. UPDATE TRIGGERS
-- =============================================
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_templates_updated_at
  BEFORE UPDATE ON public.program_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_programs_updated_at
  BEFORE UPDATE ON public.user_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 13. STORAGE BUCKET FOR PROGRESS PHOTOS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage
CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all photos in bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-photos' AND is_admin(auth.uid()));

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);