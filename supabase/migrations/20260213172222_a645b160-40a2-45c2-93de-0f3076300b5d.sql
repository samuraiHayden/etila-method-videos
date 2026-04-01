
-- Drop duplicate restrictive policies that conflict
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit questionnaire responses" ON public.lead_questionnaire_responses;
DROP POLICY IF EXISTS "Anyone can submit a booking request" ON public.booking_requests;

-- Recreate the anonymous insert policies as PERMISSIVE
DROP POLICY IF EXISTS "Allow anonymous lead inserts" ON public.leads;
CREATE POLICY "Allow anonymous lead inserts"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous lead questionnaire inserts" ON public.lead_questionnaire_responses;
CREATE POLICY "Allow anonymous lead questionnaire inserts"
ON public.lead_questionnaire_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous booking request inserts" ON public.booking_requests;
CREATE POLICY "Allow anonymous booking request inserts"
ON public.booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
