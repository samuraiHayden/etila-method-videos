
CREATE POLICY "Allow anonymous lead inserts"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous lead questionnaire inserts"
ON public.lead_questionnaire_responses
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous booking request inserts"
ON public.booking_requests
FOR INSERT
TO anon
WITH CHECK (true);
