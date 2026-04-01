
-- Email workflow sequences table
CREATE TABLE public.email_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sequence_type text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Individual emails within a workflow
CREATE TABLE public.email_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.email_workflows(id) ON DELETE CASCADE,
  email_number integer NOT NULL,
  delay_hours numeric NOT NULL DEFAULT 0,
  subject text NOT NULL,
  html_body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, email_number)
);

-- RLS
ALTER TABLE public.email_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email workflows" ON public.email_workflows FOR ALL TO public USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can manage email workflow steps" ON public.email_workflow_steps FOR ALL TO public USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Updated at triggers
CREATE TRIGGER update_email_workflows_updated_at BEFORE UPDATE ON public.email_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_workflow_steps_updated_at BEFORE UPDATE ON public.email_workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
