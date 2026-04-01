-- Remove public SELECT policies on leads table that expose all lead emails/data
DROP POLICY IF EXISTS "Anon can select leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated can select leads" ON public.leads;