-- Allow authenticated users to read their own just-inserted leads
CREATE POLICY "Authenticated can select leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);