ALTER TABLE public.email_workflows
ADD COLUMN trigger_event text NOT NULL DEFAULT 'manual',
ADD COLUMN trigger_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN cancel_conditions jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.email_workflows.trigger_event IS 'Event that triggers this sequence: call_booked, lead_created, no_action_timeout, page_visit_no_conversion, lead_status_changed, manual';
COMMENT ON COLUMN public.email_workflows.trigger_conditions IS 'JSON conditions: {lead_status, qualification_result, timeout_hours, page_slug}';
COMMENT ON COLUMN public.email_workflows.cancel_conditions IS 'JSON conditions to auto-cancel: {on_call_booked, on_status_change_to, on_purchase}';