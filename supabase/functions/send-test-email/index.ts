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
    <div style="background:#ffffff;padding:40px 36px 36px;">
      ${body}
    </div>

    <!-- Test badge -->
    <div style="background:#fff3cd;border:1px solid #ffc107;padding:10px 36px;text-align:center;">
      <p style="margin:0;color:#856404;font-size:12px;font-weight:600;">⚠ TEST EMAIL — not sent to real leads</p>
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subject, html_body, to_email } = await req.json();

    if (!subject || !html_body || !to_email) {
      return new Response(
        JSON.stringify({ error: 'Missing subject, html_body, or to_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Replace template vars with test data
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://etilamethod.com';
    const testBody = html_body
      .replaceAll('{{firstName}}', 'Test User')
      .replaceAll('{{bookCallUrl}}', `${SITE_URL}/book-call`)
      .replaceAll('{{checkoutUrl}}', `${SITE_URL}/course-offer`)
      .replaceAll('{{signupUrl}}', `${SITE_URL}/signup`);

    const testSubject = subject
      .replaceAll('{{firstName}}', 'Test User');

    const wrappedHtml = buildEmailHtml(testBody);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'The Étila Method <noreply@etilamethod.com>',
        to: [to_email],
        subject: `[TEST] ${testSubject}`,
        html: wrappedHtml,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to send', details: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
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
