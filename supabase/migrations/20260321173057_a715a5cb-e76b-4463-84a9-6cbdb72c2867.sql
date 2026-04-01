DROP POLICY IF EXISTS "Allow anonymous select for processing" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Allow anonymous update for processing" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Allow anonymous scheduled email inserts" ON public.scheduled_emails;