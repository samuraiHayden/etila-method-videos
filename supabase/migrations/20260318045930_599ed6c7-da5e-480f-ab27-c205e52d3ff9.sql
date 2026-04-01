
CREATE TABLE public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  consented_tos boolean NOT NULL DEFAULT false,
  consented_liability boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (signup happens before auth)
CREATE POLICY "Allow anonymous consent log inserts"
ON public.consent_logs
FOR INSERT
TO public
WITH CHECK (true);

-- Admins can view all consent logs
CREATE POLICY "Admins can view consent logs"
ON public.consent_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));
