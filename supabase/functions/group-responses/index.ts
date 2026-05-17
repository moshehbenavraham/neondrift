import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { retroId, questionId } = await req.json();
    if (!retroId || !questionId) {
      return new Response(JSON.stringify({ error: "retroId and questionId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";

    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user has access to this retro (creator or participant)
    const { data: retro } = await userClient
      .from("retros")
      .select("created_by")
      .eq("id", retroId)
      .single();

    if (!retro) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, serviceRoleKey);

    // Fetch ungrouped responses for this question
    const { data: responses, error: fetchErr } = await db
      .from("responses")
      .select("id, text")
      .eq("retro_id", retroId)
      .eq("question_id", questionId)
      .is("group_id", null);

    if (fetchErr) throw fetchErr;

    if (!responses || responses.length < 2) {
      return new Response(JSON.stringify({ groups: [], message: "Not enough ungrouped responses to cluster" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI to cluster
    const prompt = `You have ${responses.length} retrospective responses. Group them by common theme/topic.

RESPONSES:
${responses.map((r, i) => `${i + 1}. [ID: ${r.id}] "${r.text}"`).join("\n")}

Cluster these into groups. Each response should be in at most one group. Only group responses that clearly share a theme. If a response doesn't fit any group, leave it ungrouped. Suggest short, descriptive group names (2-4 words).`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          {
            role: "system",
            content: "You are an expert at finding thematic patterns in retrospective feedback. Be precise and only group items that truly share a theme.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "cluster_responses",
              description: "Return groups of response IDs clustered by theme.",
              parameters: {
                type: "object",
                properties: {
                  groups: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Short group name (2-4 words)" },
                        response_ids: {
                          type: "array",
                          items: { type: "string" },
                          description: "UUIDs of responses in this group",
                        },
                      },
                      required: ["name", "response_ids"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["groups"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "cluster_responses" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI provider error:", status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI returned unexpected format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { groups: aiGroups } = JSON.parse(toolCall.function.arguments);

    // Valid response IDs set
    const validIds = new Set(responses.map((r) => r.id));
    const createdGroups = [];

    for (const g of aiGroups) {
      const validResponseIds = g.response_ids.filter((id: string) => validIds.has(id));
      if (validResponseIds.length < 2) continue;

      // Create group
      const { data: group, error: insertErr } = await db
        .from("response_groups")
        .insert({ retro_id: retroId, question_id: questionId, name: g.name })
        .select("*")
        .single();

      if (insertErr || !group) {
        console.error("Failed to create group:", insertErr);
        continue;
      }

      // Update responses
      const { error: updateErr } = await db
        .from("responses")
        .update({ group_id: group.id })
        .in("id", validResponseIds);

      if (updateErr) {
        console.error("Failed to assign responses:", updateErr);
      }

      createdGroups.push({ ...group, response_ids: validResponseIds });
    }

    return new Response(JSON.stringify({ groups: createdGroups }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("group-responses error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
