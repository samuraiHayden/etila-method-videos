import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MALE_PROGRAM_ID = "b0000001-0001-0001-0001-000000000001";
const FEMALE_PROGRAM_ID = "b0000001-0001-0001-0001-000000000002";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id, gender } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine program based on gender (default to male for "other")
    const programId = gender === "female" ? FEMALE_PROGRAM_ID : MALE_PROGRAM_ID;

    // Check if user already has a program assigned
    const { data: existing } = await supabase
      .from("user_programs")
      .select("id")
      .eq("user_id", user_id)
      .eq("status", "active")
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Program already assigned" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign the program
    const { error: programError } = await supabase.from("user_programs").insert({
      user_id,
      program_id: programId,
      start_date: new Date().toISOString().split("T")[0],
      status: "active",
    });

    if (programError) throw programError;

    // Copy program_days to user_program_days
    const { data: programDays, error: daysError } = await supabase
      .from("program_days")
      .select("*")
      .eq("program_id", programId);

    if (daysError) throw daysError;

    if (programDays && programDays.length > 0) {
      const userDays = programDays.map((day: any) => ({
        user_id,
        day_of_week: day.day_of_week,
        workout_id: day.workout_id,
        is_rest_day: day.is_rest_day,
      }));

      const { error: insertError } = await supabase
        .from("user_program_days")
        .insert(userDays);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, program_id: programId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
