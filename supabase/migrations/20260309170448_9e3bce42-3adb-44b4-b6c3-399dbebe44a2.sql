
CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete questionnaire responses"
ON public.lead_questionnaire_responses FOR DELETE
USING (is_admin(auth.uid()));
