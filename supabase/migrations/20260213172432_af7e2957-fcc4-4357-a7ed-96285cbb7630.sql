
-- Allow anon to read back the lead they just inserted (needed for .select("id") after insert)
CREATE POLICY "Anon can select leads"
ON public.leads
FOR SELECT
TO anon
USING (true);
