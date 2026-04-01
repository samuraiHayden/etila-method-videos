
-- Fix RESTRICTIVE RLS policies to PERMISSIVE for all dashboard-related tables
-- The issue: RESTRICTIVE means ALL policies must pass. Clients fail admin policies.

-- user_programs
DROP POLICY IF EXISTS "Admins can manage user programs" ON public.user_programs;
DROP POLICY IF EXISTS "Users can view their own program" ON public.user_programs;
CREATE POLICY "Admins can manage user programs" ON public.user_programs FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view their own program" ON public.user_programs FOR SELECT USING (auth.uid() = user_id);

-- user_program_days
DROP POLICY IF EXISTS "Admins can manage user program days" ON public.user_program_days;
DROP POLICY IF EXISTS "Users can view their own program days" ON public.user_program_days;
CREATE POLICY "Admins can manage user program days" ON public.user_program_days FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view their own program days" ON public.user_program_days FOR SELECT USING (auth.uid() = user_id);

-- user_day_exercises
DROP POLICY IF EXISTS "Admins can manage user day exercises" ON public.user_day_exercises;
DROP POLICY IF EXISTS "Users can view their own day exercises" ON public.user_day_exercises;
CREATE POLICY "Admins can manage user day exercises" ON public.user_day_exercises FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can view their own day exercises" ON public.user_day_exercises FOR SELECT USING (auth.uid() = user_id);

-- workout_logs
DROP POLICY IF EXISTS "Admins can view all workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can manage their own workout logs" ON public.workout_logs;
CREATE POLICY "Admins can view all workout logs" ON public.workout_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can manage their own workout logs" ON public.workout_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- workouts
DROP POLICY IF EXISTS "Admins can manage workouts" ON public.workouts;
DROP POLICY IF EXISTS "Clients can view workouts" ON public.workouts;
CREATE POLICY "Admins can manage workouts" ON public.workouts FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Clients can view workouts" ON public.workouts FOR SELECT USING (auth.uid() IS NOT NULL);

-- workout_exercises
DROP POLICY IF EXISTS "Admins can manage workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Clients can view workout exercises" ON public.workout_exercises;
CREATE POLICY "Admins can manage workout exercises" ON public.workout_exercises FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Clients can view workout exercises" ON public.workout_exercises FOR SELECT USING (auth.uid() IS NOT NULL);

-- program_templates
DROP POLICY IF EXISTS "Admins can manage programs" ON public.program_templates;
DROP POLICY IF EXISTS "Clients can view programs" ON public.program_templates;
CREATE POLICY "Admins can manage programs" ON public.program_templates FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Clients can view programs" ON public.program_templates FOR SELECT USING (auth.uid() IS NOT NULL);

-- program_days
DROP POLICY IF EXISTS "Admins can manage program days" ON public.program_days;
DROP POLICY IF EXISTS "Clients can view program days" ON public.program_days;
CREATE POLICY "Admins can manage program days" ON public.program_days FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Clients can view program days" ON public.program_days FOR SELECT USING (auth.uid() IS NOT NULL);

-- meal_plans
DROP POLICY IF EXISTS "Admins can manage meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can manage their meal plans" ON public.meal_plans;
CREATE POLICY "Admins can manage meal plans" ON public.meal_plans FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can manage their meal plans" ON public.meal_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- meal_plan_items
DROP POLICY IF EXISTS "Admins can manage meal plan items" ON public.meal_plan_items;
DROP POLICY IF EXISTS "Users can manage their meal plan items" ON public.meal_plan_items;
CREATE POLICY "Admins can manage meal plan items" ON public.meal_plan_items FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can manage their meal plan items" ON public.meal_plan_items FOR ALL USING (EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meal_plan_items.meal_plan_id AND mp.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meal_plan_items.meal_plan_id AND mp.user_id = auth.uid()));

-- meals
DROP POLICY IF EXISTS "Admins can manage meals" ON public.meals;
DROP POLICY IF EXISTS "Clients can view meals" ON public.meals;
CREATE POLICY "Admins can manage meals" ON public.meals FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Clients can view meals" ON public.meals FOR SELECT USING (auth.uid() IS NOT NULL);

-- exercises
DROP POLICY IF EXISTS "Admins can manage exercises" ON public.exercises;
DROP POLICY IF EXISTS "Clients can view exercises" ON public.exercises;
CREATE POLICY "Admins can manage exercises" ON public.exercises FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Clients can view exercises" ON public.exercises FOR SELECT USING (auth.uid() IS NOT NULL);

-- profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their assigned coach profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their assigned coach profile" ON public.profiles FOR SELECT USING (user_id = get_my_assigned_coach_id());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- message_threads
DROP POLICY IF EXISTS "Admins can view all threads" ON public.message_threads;
DROP POLICY IF EXISTS "Clients can create threads" ON public.message_threads;
DROP POLICY IF EXISTS "Clients can view their threads" ON public.message_threads;
CREATE POLICY "Admins can view all threads" ON public.message_threads FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Clients can create threads" ON public.message_threads FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can view their threads" ON public.message_threads FOR SELECT USING (auth.uid() = client_id);

-- messages
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Thread participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Thread participants can view messages" ON public.messages;
CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Thread participants can send messages" ON public.messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM message_threads mt WHERE mt.id = messages.thread_id AND (mt.client_id = auth.uid() OR mt.coach_id = auth.uid())));
CREATE POLICY "Thread participants can view messages" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM message_threads mt WHERE mt.id = messages.thread_id AND (mt.client_id = auth.uid() OR mt.coach_id = auth.uid())));
