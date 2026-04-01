import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get meals without images
    const { data: meals, error } = await supabase
      .from("meals")
      .select("id, name, category")
      .is("image_url", null)
      .order("name")
      .limit(2); // Process 2 at a time to avoid timeouts

    if (error) throw error;
    if (!meals || meals.length === 0) {
      return new Response(JSON.stringify({ message: "All meals already have images", remaining: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; name: string; success: boolean }[] = [];

    for (const meal of meals) {
      try {
        // Generate image using AI
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: `Generate a beautiful, appetizing overhead food photography shot of "${meal.name}". The dish should be plated on a clean white or marble surface with natural lighting. Style: professional food magazine photography, warm tones, shallow depth of field. No text or watermarks.`,
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        const aiData = await aiRes.json();
        const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageBase64) {
          console.error(`No image generated for ${meal.name}`);
          results.push({ id: meal.id, name: meal.name, success: false });
          continue;
        }

        // Extract base64 data
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        // Upload to storage
        const fileName = `${meal.id}.png`;
        const { error: uploadError } = await supabase.storage
          .from("meal-images")
          .upload(fileName, imageBytes, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${meal.name}:`, uploadError);
          results.push({ id: meal.id, name: meal.name, success: false });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("meal-images").getPublicUrl(fileName);

        // Update meal record
        const { error: updateError } = await supabase
          .from("meals")
          .update({ image_url: urlData.publicUrl })
          .eq("id", meal.id);

        if (updateError) {
          console.error(`Update error for ${meal.name}:`, updateError);
          results.push({ id: meal.id, name: meal.name, success: false });
          continue;
        }

        results.push({ id: meal.id, name: meal.name, success: true });
        console.log(`Generated image for: ${meal.name}`);
      } catch (mealError) {
        console.error(`Error processing ${meal.name}:`, mealError);
        results.push({ id: meal.id, name: meal.name, success: false });
      }
    }

    // Check remaining
    const { count } = await supabase
      .from("meals")
      .select("id", { count: "exact", head: true })
      .is("image_url", null);

    return new Response(
      JSON.stringify({ results, remaining: count ?? 0 }),
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
