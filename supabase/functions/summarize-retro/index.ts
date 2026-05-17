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
    const { retroId } = await req.json();
    if (!retroId) {
      return new Response(JSON.stringify({ error: "retroId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check
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
    const { data: retroAccess } = await userClient
      .from("retros")
      .select("created_by")
      .eq("id", retroId)
      .single();

    if (!retroAccess) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all retro data with service role
    const db = createClient(supabaseUrl, serviceRoleKey);

    const [retroRes, questionsRes, responsesRes, upvotesRes, actionItemsRes, top3Res] =
      await Promise.all([
        db.from("retros").select("*").eq("id", retroId).single(),
        db.from("retro_questions").select("*").eq("retro_id", retroId).order("sort_order"),
        db.from("responses").select("*").eq("retro_id", retroId),
        db.from("response_upvotes").select("*"),
        db.from("action_items").select("*").eq("retro_id", retroId),
        db.from("top3_entries").select("*").eq("retro_id", retroId),
      ]);

    if (retroRes.error || !retroRes.data) {
      return new Response(JSON.stringify({ error: "Retro not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const retro = retroRes.data;
    const questions = questionsRes.data ?? [];
    const responses = responsesRes.data ?? [];
    const upvotes = upvotesRes.data ?? [];
    const actionItems = actionItemsRes.data ?? [];
    const top3 = top3Res.data ?? [];

    // Count upvotes per response
    const upvoteCounts: Record<string, number> = {};
    for (const u of upvotes) {
      upvoteCounts[u.response_id] = (upvoteCounts[u.response_id] || 0) + 1;
    }

    // Build structured data for prompt
    const questionsWithResponses = questions.map((q) => {
      const qResponses = responses
        .filter((r) => r.question_id === q.id)
        .map((r) => ({
          text: r.text,
          upvotes: upvoteCounts[r.id] || 0,
          sentiment: r.sentiment,
        }))
        .sort((a, b) => b.upvotes - a.upvotes);
      return { question: q.question_text, responses: qResponses };
    });

    const prompt = `You are analyzing a retrospective meeting. Provide a comprehensive summary.

RETRO: "${retro.title}"
${retro.description ? `Description: ${retro.description}` : ""}
Format: ${retro.format} | Status: ${retro.status}

QUESTIONS & RESPONSES:
${questionsWithResponses
  .map(
    (q) =>
      `\n## ${q.question}\n${
        q.responses.length === 0
          ? "(No responses)"
          : q.responses
              .map(
                (r) =>
                  `- "${r.text}" [${r.upvotes} upvote${r.upvotes !== 1 ? "s" : ""}${
                    r.sentiment ? `, sentiment: ${r.sentiment}/5` : ""
                  }]`
              )
              .join("\n")
      }`
  )
  .join("\n")}

ACTION ITEMS (${actionItems.length}):
${actionItems.length === 0 ? "(None)" : actionItems.map((a) => `- [${a.status}] ${a.description}`).join("\n")}

TOP 3 ENTRIES (${top3.length}):
${top3.length === 0 ? "(None)" : top3.map((t) => `- [${t.type}] #${t.rank}: ${t.text}`).join("\n")}

Analyze all the data above and produce a structured summary.`;

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
            content:
              "You are a retrospective analysis expert. Analyze team retrospective data and produce actionable insights. Be concise and specific.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "retro_summary",
              description: "Return a structured retrospective summary.",
              parameters: {
                type: "object",
                properties: {
                  overall_sentiment: {
                    type: "string",
                    description: "One-line mood read of the retro",
                  },
                  key_themes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        categories: {
                          type: "array",
                          items: { type: "string" },
                          description: "Which question categories this theme appeared in",
                        },
                      },
                      required: ["title", "description", "categories"],
                      additionalProperties: false,
                    },
                    description: "3-5 recurring themes",
                  },
                  top_highlights: {
                    type: "array",
                    items: { type: "string" },
                    description: "Most upvoted/impactful positive items",
                  },
                  top_concerns: {
                    type: "array",
                    items: { type: "string" },
                    description: "Most upvoted/impactful negative items",
                  },
                  suggested_actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        rationale: { type: "string" },
                      },
                      required: ["action", "rationale"],
                      additionalProperties: false,
                    },
                    description: "3-5 concrete recommendations",
                  },
                  one_line_takeaway: {
                    type: "string",
                    description: "Single sentence summarizing the retro",
                  },
                },
                required: [
                  "overall_sentiment",
                  "key_themes",
                  "top_highlights",
                  "top_concerns",
                  "suggested_actions",
                  "one_line_takeaway",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "retro_summary" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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

    const summary = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-retro error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
