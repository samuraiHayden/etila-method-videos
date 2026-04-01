
-- Leads table for capturing name + email from free guide opt-in
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public insert, no read needed from frontend)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a lead (public form)
CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Questionnaire responses linked to a lead
CREATE TABLE public.lead_questionnaire_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  fitness_goal TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  training_frequency TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  coaching_preference TEXT NOT NULL,
  qualification_result TEXT NOT NULL DEFAULT 'course',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_questionnaire_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit questionnaire responses"
  ON public.lead_questionnaire_responses FOR INSERT
  WITH CHECK (true);

-- Booking requests for qualified 1:1 leads
CREATE TABLE public.booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a booking request"
  ON public.booking_requests FOR INSERT
  WITH CHECK (true);

-- Admin read policies
CREATE POLICY "Admins can view leads"
  ON public.leads FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view questionnaire responses"
  ON public.lead_questionnaire_responses FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view booking requests"
  ON public.booking_requests FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update booking requests"
  ON public.booking_requests FOR UPDATE
  USING (public.is_admin(auth.uid()));
