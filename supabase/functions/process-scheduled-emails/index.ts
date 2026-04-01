const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all pending emails that are due
    const { data: dueEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*, leads!inner(email, full_name)')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .order('send_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!dueEmails || dueEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No emails due' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const email of dueEmails) {
      const leadEmail = (email as any).leads?.email;
      if (!leadEmail) {
        await supabase
          .from('scheduled_emails')
          .update({ status: 'failed', error_message: 'Lead email not found' })
          .eq('id', email.id);
        failed++;
        continue;
      }

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'The Étila Method <noreply@etilamethod.com>',
            to: [leadEmail],
            subject: email.subject,
            html: email.html_body,
          }),
        });

        const result = await res.json();

        if (res.ok) {
          await supabase
            .from('scheduled_emails')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', email.id);
          sent++;
        } else {
          await supabase
            .from('scheduled_emails')
            .update({ status: 'failed', error_message: JSON.stringify(result) })
            .eq('id', email.id);
          failed++;
        }
      } catch (sendErr) {
        await supabase
          .from('scheduled_emails')
          .update({ status: 'failed', error_message: sendErr.message })
          .eq('id', email.id);
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    return new Response(
      JSON.stringify({ success: true, processed: dueEmails.length, sent, failed }),
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
