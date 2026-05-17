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
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { texts } = await req.json();
    if (!Array.isArray(texts) || texts.length < 2) {
      return new Response(JSON.stringify({ error: "At least 2 texts required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation: cap array size and string length
    if (texts.length > 20) {
      return new Response(JSON.stringify({ error: "Too many texts (max 20)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sanitized = texts.map((t: string) => String(t).slice(0, 500));

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ name: "New Group" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: "You name thematic groups for retrospective feedback. Return ONLY a short group name (2-4 words). No quotes, no explanation.",
          },
          {
            role: "user",
            content: `These retrospective responses are being grouped together. Suggest a short thematic name (2-4 words):\n\n${sanitized.map((t: string, i: number) => `${i + 1}. "${t}"`).join("\n")}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_group_name",
              description: "Set the group name",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Short group name (2-4 words)" },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_group_name" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", aiResponse.status);
      return new Response(JSON.stringify({ name: "New Group" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ name: "New Group" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name } = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ name: name || "New Group" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("name-group error:", e);
    return new Response(JSON.stringify({ name: "New Group" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
