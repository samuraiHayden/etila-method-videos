
-- Add status and notes columns to leads table for CRM functionality
ALTER TABLE public.leads ADD COLUMN status text NOT NULL DEFAULT 'new';
ALTER TABLE public.leads ADD COLUMN notes text;
ALTER TABLE public.leads ADD COLUMN last_contacted_at timestamp with time zone;

-- Allow admins to update leads (for status changes, notes, etc.)
CREATE POLICY "Admins can update leads"
ON public.leads
FOR UPDATE
TO public
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
