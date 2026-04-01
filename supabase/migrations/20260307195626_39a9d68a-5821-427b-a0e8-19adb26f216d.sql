-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE
-- This is critical: with only RESTRICTIVE policies, all access is denied by default.

-- ============ user_roles ============
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'content_admin'::app_role));

CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- ============ user_day_exercises ============
DROP POLICY IF EXISTS "Admins can manage user day exercises" ON public.user_day_exercises;
DROP POLICY IF EXISTS "Users can view their own day exercises" ON public.user_day_exercises;

CREATE POLICY "Admins can manage user day exercises" ON public.user_day_exercises
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own day exercises" ON public.user_day_exercises
  FOR SELECT USING (auth.uid() = user_id);

-- ============ profiles ============
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their assigned coach profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their assigned coach profile" ON public.profiles
  FOR SELECT USING (user_id = get_my_assigned_coach_id());

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- ============ exercises ============
DROP POLICY IF EXISTS "Admins can manage exercises" ON public.exercises;
DROP POLICY IF EXISTS "Clients can view exercises" ON public.exercises;

CREATE POLICY "Admins can manage exercises" ON public.exercises
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view exercises" ON public.exercises
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============ workouts ============
DROP POLICY IF EXISTS "Admins can manage workouts" ON public.workouts;
DROP POLICY IF EXISTS "Clients can view workouts" ON public.workouts;

CREATE POLICY "Admins can manage workouts" ON public.workouts
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view workouts" ON public.workouts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============ workout_exercises ============
DROP POLICY IF EXISTS "Admins can manage workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Clients can view workout exercises" ON public.workout_exercises;

CREATE POLICY "Admins can manage workout exercises" ON public.workout_exercises
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view workout exercises" ON public.workout_exercises
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============ program_templates ============
DROP POLICY IF EXISTS "Admins can manage programs" ON public.program_templates;
DROP POLICY IF EXISTS "Clients can view programs" ON public.program_templates;

CREATE POLICY "Admins can manage programs" ON public.program_templates
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view programs" ON public.program_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============ program_days ============
DROP POLICY IF EXISTS "Admins can manage program days" ON public.program_days;
DROP POLICY IF EXISTS "Clients can view program days" ON public.program_days;

CREATE POLICY "Admins can manage program days" ON public.program_days
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view program days" ON public.program_days
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============ user_programs ============
DROP POLICY IF EXISTS "Admins can manage user programs" ON public.user_programs;
DROP POLICY IF EXISTS "Users can view their own program" ON public.user_programs;

CREATE POLICY "Admins can manage user programs" ON public.user_programs
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own program" ON public.user_programs
  FOR SELECT USING (auth.uid() = user_id);

-- ============ user_program_days ============
DROP POLICY IF EXISTS "Admins can manage user program days" ON public.user_program_days;
DROP POLICY IF EXISTS "Users can view their own program days" ON public.user_program_days;

CREATE POLICY "Admins can manage user program days" ON public.user_program_days
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own program days" ON public.user_program_days
  FOR SELECT USING (auth.uid() = user_id);

-- ============ user_exercise_overrides ============
DROP POLICY IF EXISTS "Admins can manage user exercise overrides" ON public.user_exercise_overrides;
DROP POLICY IF EXISTS "Users can view their own overrides" ON public.user_exercise_overrides;

CREATE POLICY "Admins can manage user exercise overrides" ON public.user_exercise_overrides
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own overrides" ON public.user_exercise_overrides
  FOR SELECT USING (auth.uid() = user_id);

-- ============ courses ============
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Clients can view published courses" ON public.courses;

CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view published courses" ON public.courses
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);

-- ============ course_modules ============
DROP POLICY IF EXISTS "Admins can manage modules" ON public.course_modules;
DROP POLICY IF EXISTS "Clients can view modules" ON public.course_modules;

CREATE POLICY "Admins can manage modules" ON public.course_modules
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view modules" ON public.course_modules
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============ lessons ============
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Clients can view lessons" ON public.lessons;

CREATE POLICY "Admins can manage lessons" ON public.lessons
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view lessons" ON public.lessons
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============ lesson_completions ============
DROP POLICY IF EXISTS "Admins can view all completions" ON public.lesson_completions;
DROP POLICY IF EXISTS "Users can manage their own completions" ON public.lesson_completions;

CREATE POLICY "Admins can view all completions" ON public.lesson_completions
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own completions" ON public.lesson_completions
  FOR ALL USING (auth.uid() = user_id);

-- ============ meals ============
DROP POLICY IF EXISTS "Admins can manage meals" ON public.meals;
DROP POLICY IF EXISTS "Clients can view meals" ON public.meals;

CREATE POLICY "Admins can manage meals" ON public.meals
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view meals" ON public.meals
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============ meal_plans ============
DROP POLICY IF EXISTS "Admins can manage meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can manage their meal plans" ON public.meal_plans;

CREATE POLICY "Admins can manage meal plans" ON public.meal_plans
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their meal plans" ON public.meal_plans
  FOR ALL USING (auth.uid() = user_id);

-- ============ meal_plan_items ============
DROP POLICY IF EXISTS "Admins can manage meal plan items" ON public.meal_plan_items;
DROP POLICY IF EXISTS "Users can manage their meal plan items" ON public.meal_plan_items;

CREATE POLICY "Admins can manage meal plan items" ON public.meal_plan_items
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their meal plan items" ON public.meal_plan_items
  FOR ALL USING (EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meal_plan_items.meal_plan_id AND mp.user_id = auth.uid()));

-- ============ user_favorite_meals ============
DROP POLICY IF EXISTS "Users can manage their favorites" ON public.user_favorite_meals;

CREATE POLICY "Users can manage their favorites" ON public.user_favorite_meals
  FOR ALL USING (auth.uid() = user_id);

-- ============ measurement_logs ============
DROP POLICY IF EXISTS "Admins can view all measurements" ON public.measurement_logs;
DROP POLICY IF EXISTS "Users can manage their own measurements" ON public.measurement_logs;

CREATE POLICY "Admins can view all measurements" ON public.measurement_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own measurements" ON public.measurement_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============ workout_logs ============
DROP POLICY IF EXISTS "Admins can view all workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can manage their own workout logs" ON public.workout_logs;

CREATE POLICY "Admins can view all workout logs" ON public.workout_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own workout logs" ON public.workout_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============ set_logs ============
DROP POLICY IF EXISTS "Admins can view all set logs" ON public.set_logs;
DROP POLICY IF EXISTS "Users can manage their own set logs" ON public.set_logs;

CREATE POLICY "Admins can view all set logs" ON public.set_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own set logs" ON public.set_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM workout_logs wl WHERE wl.id = set_logs.workout_log_id AND wl.user_id = auth.uid()));

-- ============ progress_photos ============
DROP POLICY IF EXISTS "Admins can view all photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Users can manage their own photos" ON public.progress_photos;

CREATE POLICY "Admins can view all photos" ON public.progress_photos
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own photos" ON public.progress_photos
  FOR ALL USING (auth.uid() = user_id);

-- ============ announcements ============
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Users can view active announcements" ON public.announcements;

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active announcements" ON public.announcements
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- ============ message_threads ============
DROP POLICY IF EXISTS "Admins can view all threads" ON public.message_threads;
DROP POLICY IF EXISTS "Clients can create threads" ON public.message_threads;
DROP POLICY IF EXISTS "Clients can view their threads" ON public.message_threads;

CREATE POLICY "Admins can view all threads" ON public.message_threads
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can create threads" ON public.message_threads
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can view their threads" ON public.message_threads
  FOR SELECT USING (auth.uid() = client_id);

-- ============ messages ============
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Thread participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Thread participants can view messages" ON public.messages;

CREATE POLICY "Admins can manage all messages" ON public.messages
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Thread participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM message_threads mt WHERE mt.id = messages.thread_id AND (mt.client_id = auth.uid() OR mt.coach_id = auth.uid())));

CREATE POLICY "Thread participants can view messages" ON public.messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM message_threads mt WHERE mt.id = messages.thread_id AND (mt.client_id = auth.uid() OR mt.coach_id = auth.uid())));

-- ============ checkin_templates ============
DROP POLICY IF EXISTS "Admins can manage checkin templates" ON public.checkin_templates;

CREATE POLICY "Admins can manage checkin templates" ON public.checkin_templates
  FOR ALL USING (is_admin(auth.uid()));

-- ============ checkin_responses ============
DROP POLICY IF EXISTS "Admins can view all checkin responses" ON public.checkin_responses;
DROP POLICY IF EXISTS "Users can manage their checkin responses" ON public.checkin_responses;

CREATE POLICY "Admins can view all checkin responses" ON public.checkin_responses
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their checkin responses" ON public.checkin_responses
  FOR ALL USING (auth.uid() = user_id);

-- ============ leads ============
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Allow anonymous lead inserts" ON public.leads;
DROP POLICY IF EXISTS "Anon can select leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated can select leads" ON public.leads;

CREATE POLICY "Admins can view leads" ON public.leads
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Allow anonymous lead inserts" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can select leads" ON public.leads
  FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated can select leads" ON public.leads
  FOR SELECT TO authenticated USING (true);

-- ============ lead_questionnaire_responses ============
DROP POLICY IF EXISTS "Admins can view questionnaire responses" ON public.lead_questionnaire_responses;
DROP POLICY IF EXISTS "Allow anonymous lead questionnaire inserts" ON public.lead_questionnaire_responses;

CREATE POLICY "Admins can view questionnaire responses" ON public.lead_questionnaire_responses
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Allow anonymous lead questionnaire inserts" ON public.lead_questionnaire_responses
  FOR INSERT WITH CHECK (true);

-- ============ booking_requests ============
DROP POLICY IF EXISTS "Admins can update booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Admins can view booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Allow anonymous booking request inserts" ON public.booking_requests;

CREATE POLICY "Admins can update booking requests" ON public.booking_requests
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view booking requests" ON public.booking_requests
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Allow anonymous booking request inserts" ON public.booking_requests
  FOR INSERT WITH CHECK (true);