const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function buildEmailHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>The Étila Method</title>
  <style>
    body { margin:0; padding:0; background:#f0ede8; -webkit-font-smoothing:antialiased; }
    a { color:#8f2435; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .cta-btn { display:inline-block; background:#8f2435; color:#ffffff !important; font-size:15px; font-weight:600; padding:14px 32px; border-radius:6px; text-decoration:none !important; letter-spacing:0.3px; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:36px 16px 48px;">

    <!-- Header -->
    <div style="background:#0f0f0f;border-radius:10px 10px 0 0;padding:26px 36px 22px;">
      <span style="display:block;color:rgba(255,255,255,0.45);font-size:10px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;margin-bottom:6px;">The</span>
      <span style="display:block;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:3px;text-transform:uppercase;line-height:1;">ÉTILA METHOD</span>
    </div>

    <!-- Accent bar -->
    <div style="height:3px;background:linear-gradient(90deg,#6b1a27 0%,#8f2435 40%,#b83050 70%,#8f2435 100%);"></div>

    <!-- Body -->
    <div style="background:#ffffff;padding:40px 36px 36px;border-radius:0 0 0 0;">
      ${body}
    </div>

    <!-- Footer -->
    <div style="background:#0f0f0f;border-radius:0 0 10px 10px;padding:22px 36px;text-align:center;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">ÉTILA FITNESS</p>
      <p style="margin:0;color:rgba(255,255,255,0.2);font-size:11px;line-height:1.6;">© 2026 The Étila Method. All rights reserved.</p>
    </div>

  </div>
</body>
</html>`;
}

function replaceVariables(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { lead_email, sequence_type, checkout_url } = await req.json();

    if (!lead_email || !sequence_type) {
      return new Response(
        JSON.stringify({ error: 'Missing lead_email or sequence_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if workflow is active
    const { data: workflow, error: wfError } = await supabase
      .from('email_workflows')
      .select('id, is_active')
      .eq('sequence_type', sequence_type)
      .single();

    if (wfError || !workflow) {
      return new Response(
        JSON.stringify({ error: `Workflow not found for sequence_type: ${sequence_type}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!workflow.is_active) {
      return new Response(
        JSON.stringify({ success: true, scheduled: 0, message: 'Workflow is paused' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active steps from DB
    const { data: dbSteps, error: stepsError } = await supabase
      .from('email_workflow_steps')
      .select('*')
      .eq('workflow_id', workflow.id)
      .eq('is_active', true)
      .order('email_number');

    if (stepsError || !dbSteps || dbSteps.length === 0) {
      return new Response(
        JSON.stringify({ success: true, scheduled: 0, message: 'No active email steps' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lead info
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, full_name, email')
      .eq('email', lead_email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found', details: leadError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstName = lead.full_name?.split(' ')[0] || 'there';

    // Build template variables
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://etilamethod.com';
    const bookCallUrl = `${SITE_URL}/book-call?name=${encodeURIComponent(firstName)}&email=${encodeURIComponent(lead.email)}`;
    const signupUrl = `${SITE_URL}/signup?email=${encodeURIComponent(lead.email)}&name=${encodeURIComponent(firstName)}&paid=1`;
    const templateVars: Record<string, string> = {
      firstName,
      bookCallUrl: checkout_url || bookCallUrl,
      checkoutUrl: checkout_url || `${SITE_URL}/course-offer`,
      signupUrl,
    };

    // Cancel any existing pending emails for this lead + sequence type
    await supabase
      .from('scheduled_emails')
      .update({ status: 'cancelled' })
      .eq('lead_id', lead.id)
      .eq('sequence_type', sequence_type)
      .eq('status', 'pending');

    // Build emails from DB steps with variable replacement
    const now = new Date();
    const emails = dbSteps.map(step => ({
      email_number: step.email_number,
      delay_hours: step.delay_hours,
      subject: replaceVariables(step.subject, templateVars),
      html_body: buildEmailHtml(replaceVariables(step.html_body, templateVars)),
    }));

    // Insert scheduled emails
    const rows = emails.map(e => ({
      lead_id: lead.id,
      sequence_type,
      email_number: e.email_number,
      subject: e.subject,
      html_body: e.html_body,
      send_at: new Date(now.getTime() + e.delay_hours * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    }));

    const { error: insertError } = await supabase
      .from('scheduled_emails')
      .insert(rows);

    if (insertError) {
      throw insertError;
    }

    // Send the first email immediately if delay is 0
    const immediateEmail = emails.find(e => e.delay_hours === 0);
    if (immediateEmail) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'The Étila Method <noreply@etilamethod.com>',
            to: [lead.email],
            subject: immediateEmail.subject,
            html: immediateEmail.html_body,
          }),
        });

        const sendResult = await res.json();

        await supabase
          .from('scheduled_emails')
          .update({
            status: res.ok ? 'sent' : 'failed',
            sent_at: res.ok ? new Date().toISOString() : null,
            error_message: res.ok ? null : JSON.stringify(sendResult),
          })
          .eq('lead_id', lead.id)
          .eq('sequence_type', sequence_type)
          .eq('email_number', immediateEmail.email_number)
          .eq('status', 'pending');
      }
    }

    return new Response(
      JSON.stringify({ success: true, scheduled: rows.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
