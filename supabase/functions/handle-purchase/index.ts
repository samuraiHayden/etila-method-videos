import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret so only Zapier (with the right key) can call this
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    const incomingSecret =
      req.headers.get("x-webhook-secret") ||
      new URL(req.url).searchParams.get("secret");

    if (webhookSecret && incomingSecret !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Support multiple field name formats that FanBasis/Zapier might send
    const email: string =
      body.email || body.customer_email || body.Email || "";
    const name: string =
      body.name ||
      body.full_name ||
      body.customer_name ||
      body.first_name ||
      body.Name ||
      "";

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Mark the lead as paid in the CRM (upserts if lead doesn't exist yet)
    const { error: markError } = await supabase.rpc("mark_lead_paid", {
      p_email: email.toLowerCase().trim(),
      p_full_name: name || null,
      p_purchase_type: "low_ticket",
    });

    if (markError) {
      console.error("mark_lead_paid error:", markError.message);
      // Don't hard-fail — still try to send emails
    }

    // 2. Trigger post-purchase email sequence
    const SITE_URL = Deno.env.get("SITE_URL") || "https://etilamethod.com";
    const firstName = name?.split(" ")[0] || "";
    const signupUrl = `${SITE_URL}/signup?email=${encodeURIComponent(email)}&name=${encodeURIComponent(firstName)}&paid=1`;

    const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/schedule-precall-emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        lead_email: email.toLowerCase().trim(),
        sequence_type: "post_purchase",
        checkout_url: signupUrl,
      }),
    });

    const emailResult = await emailRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        email,
        name: name || null,
        crm_updated: !markError,
        emails_scheduled: emailResult?.scheduled ?? 0,
        signup_url: signupUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("handle-purchase error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
