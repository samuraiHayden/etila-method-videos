
-- Scheduled emails table for drip sequences
CREATE TABLE public.scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  sequence_type text NOT NULL DEFAULT 'pre_call', -- 'pre_call' or 'dq_abandon'
  email_number integer NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  send_at timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient polling
CREATE INDEX idx_scheduled_emails_pending ON public.scheduled_emails (send_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage
CREATE POLICY "Admins can manage scheduled emails"
  ON public.scheduled_emails
  FOR ALL
  TO public
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Allow edge functions (anon) to insert
CREATE POLICY "Allow anonymous scheduled email inserts"
  ON public.scheduled_emails
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anon to select/update for processing
CREATE POLICY "Allow anonymous select for processing"
  ON public.scheduled_emails
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update for processing"
  ON public.scheduled_emails
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Enable pg_cron for periodic email processing
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
