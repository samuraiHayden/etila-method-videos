-- Returns true if an email has a paid lead record (bought the program)
CREATE OR REPLACE FUNCTION public.check_email_purchased(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM leads
    WHERE email = lower(trim(p_email))
    AND status IN ('bought_low_ticket', 'bought_high_ticket', 'client', 'active_client')
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_email_purchased(TEXT) TO anon, authenticated;
