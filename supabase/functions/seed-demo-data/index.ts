import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user with anon client
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Use service role to bypass RLS
    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Idempotency: check if user already has retros
    const { data: existing } = await sb
      .from("retros")
      .select("id")
      .eq("created_by", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ message: "Data already exists", seeded: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create project
    const { data: project } = await sb
      .from("projects")
      .insert({ name: "Retrofly App", description: "Our main product", created_by: userId })
      .select()
      .single();

    // Create team
    const { data: team } = await sb
      .from("teams")
      .insert({ name: "Product Team", created_by: userId })
      .select()
      .single();

    const projectId = project?.id;
    const teamId = team?.id;

    // --- Retro 1: Sprint 42 (open) ---
    const { data: retro1 } = await sb
      .from("retros")
      .insert({
        title: "Sprint 42 Retro",
        description: "End-of-sprint retrospective for sprint 42",
        project_id: projectId,
        team_id: teamId,
        created_by: userId,
        status: "open",
        format: "simple",
        timeline_start: "2026-03-07T00:00:00",
        timeline_end: "2026-03-21T00:00:00",
      })
      .select()
      .single();

    // Questions for retro 1
    const { data: q1s } = await sb
      .from("retro_questions")
      .insert([
        { retro_id: retro1!.id, question_text: "Start", sort_order: 1 },
        { retro_id: retro1!.id, question_text: "Stop", sort_order: 2 },
        { retro_id: retro1!.id, question_text: "Continue", sort_order: 3 },
      ])
      .select();

    const startQ = q1s!.find((q: any) => q.question_text === "Start")!;
    const stopQ = q1s!.find((q: any) => q.question_text === "Stop")!;
    const continueQ = q1s!.find((q: any) => q.question_text === "Continue")!;

    // Responses for retro 1
    const r1Responses = [
      { retro_id: retro1!.id, question_id: startQ.id, user_id: userId, text: "Pair programming sessions for complex features", sentiment: 4 },
      { retro_id: retro1!.id, question_id: startQ.id, user_id: userId, text: "Writing ADRs for architectural decisions", sentiment: 5 },
      { retro_id: retro1!.id, question_id: stopQ.id, user_id: userId, text: "Skipping code review on Friday deploys", sentiment: 2 },
      { retro_id: retro1!.id, question_id: stopQ.id, user_id: userId, text: "Having standup run over 15 minutes", sentiment: 2 },
      { retro_id: retro1!.id, question_id: continueQ.id, user_id: userId, text: "Weekly team demos — they keep everyone aligned", sentiment: 5 },
      { retro_id: retro1!.id, question_id: continueQ.id, user_id: userId, text: "Using feature flags for gradual rollouts", sentiment: 4 },
    ];

    const { data: r1ResponseData } = await sb.from("responses").insert(r1Responses).select();

    // Upvotes on a couple responses
    if (r1ResponseData && r1ResponseData.length >= 2) {
      await sb.from("response_upvotes").insert([
        { response_id: r1ResponseData[0].id, user_id: userId },
        { response_id: r1ResponseData[4].id, user_id: userId },
      ]);
    }

    // Action items for retro 1
    await sb.from("action_items").insert([
      {
        retro_id: retro1!.id,
        description: "Schedule first pair programming session for next sprint",
        created_by: userId,
        owner_id: userId,
        status: "open",
        due_date: "2026-03-28",
      },
      {
        retro_id: retro1!.id,
        description: "Add a hard 15-min timer to standup",
        created_by: userId,
        owner_id: userId,
        status: "open",
        due_date: "2026-03-24",
      },
    ]);

    // Participant
    await sb.from("retro_participants").insert({ retro_id: retro1!.id, user_id: userId });

    // --- Retro 2: Q1 Planning (closed) ---
    const { data: retro2 } = await sb
      .from("retros")
      .insert({
        title: "Q1 Planning Retro",
        description: "Looking back at Q1 goals and execution",
        project_id: projectId,
        team_id: teamId,
        created_by: userId,
        status: "closed",
        format: "simple",
        timeline_start: "2026-01-01T00:00:00",
        timeline_end: "2026-03-31T00:00:00",
      })
      .select()
      .single();

    const { data: q2s } = await sb
      .from("retro_questions")
      .insert([
        { retro_id: retro2!.id, question_text: "Start", sort_order: 1 },
        { retro_id: retro2!.id, question_text: "Stop", sort_order: 2 },
        { retro_id: retro2!.id, question_text: "Continue", sort_order: 3 },
      ])
      .select();

    const startQ2 = q2s!.find((q: any) => q.question_text === "Start")!;
    const stopQ2 = q2s!.find((q: any) => q.question_text === "Stop")!;
    const continueQ2 = q2s!.find((q: any) => q.question_text === "Continue")!;

    await sb.from("responses").insert([
      { retro_id: retro2!.id, question_id: startQ2.id, user_id: userId, text: "Monthly team health checks", sentiment: 4 },
      { retro_id: retro2!.id, question_id: startQ2.id, user_id: userId, text: "Documenting runbooks for on-call", sentiment: 3 },
      { retro_id: retro2!.id, question_id: stopQ2.id, user_id: userId, text: "Scope creep in mid-sprint", sentiment: 1 },
      { retro_id: retro2!.id, question_id: stopQ2.id, user_id: userId, text: "Ignoring flaky tests", sentiment: 2 },
      { retro_id: retro2!.id, question_id: continueQ2.id, user_id: userId, text: "Bi-weekly retrospectives — they drive real change", sentiment: 5 },
      { retro_id: retro2!.id, question_id: continueQ2.id, user_id: userId, text: "Celebrating shipped features in #wins channel", sentiment: 5 },
    ]);

    await sb.from("action_items").insert({
      retro_id: retro2!.id,
      description: "Set up quarterly OKR review cadence",
      created_by: userId,
      owner_id: userId,
      status: "done",
    });

    await sb.from("retro_participants").insert({ retro_id: retro2!.id, user_id: userId });

    // --- Retro 3: Product Launch (detailed, open) ---
    const { data: retro3 } = await sb
      .from("retros")
      .insert({
        title: "Product Launch Retro",
        description: "Deep-dive into how the v2.0 launch went across engineering, design, and marketing",
        project_id: projectId,
        team_id: teamId,
        created_by: userId,
        status: "open",
        format: "detailed",
        timeline_start: "2026-02-01T00:00:00",
        timeline_end: "2026-03-15T00:00:00",
      })
      .select()
      .single();

    const { data: q3s } = await sb
      .from("retro_questions")
      .insert([
        { retro_id: retro3!.id, question_text: "What went well during the launch?", sort_order: 1 },
        { retro_id: retro3!.id, question_text: "What could we have done better?", sort_order: 2 },
        { retro_id: retro3!.id, question_text: "What surprised us?", sort_order: 3 },
        { retro_id: retro3!.id, question_text: "What should we carry forward?", sort_order: 4 },
      ])
      .select();

    const wentWellQ = q3s![0];
    const betterQ = q3s![1];
    const surprisedQ = q3s![2];
    const carryQ = q3s![3];

    const { data: r3Responses } = await sb.from("responses").insert([
      { retro_id: retro3!.id, question_id: wentWellQ.id, user_id: userId, text: "Zero-downtime deployment — the blue-green setup paid off", sentiment: 5 },
      { retro_id: retro3!.id, question_id: wentWellQ.id, user_id: userId, text: "Marketing and engineering were in sync on the launch date for once", sentiment: 4 },
      { retro_id: retro3!.id, question_id: wentWellQ.id, user_id: userId, text: "Customer support had pre-written FAQ ready before launch day", sentiment: 4 },
      { retro_id: retro3!.id, question_id: betterQ.id, user_id: userId, text: "Load testing started too late — we found bottlenecks 2 days before launch", sentiment: 2 },
      { retro_id: retro3!.id, question_id: betterQ.id, user_id: userId, text: "Mobile experience had 3 layout bugs that slipped through QA", sentiment: 2 },
      { retro_id: retro3!.id, question_id: surprisedQ.id, user_id: userId, text: "Traffic was 4x our estimates in the first hour", sentiment: 3 },
      { retro_id: retro3!.id, question_id: surprisedQ.id, user_id: userId, text: "The onboarding flow had a 72% completion rate — way above benchmark", sentiment: 5 },
      { retro_id: retro3!.id, question_id: carryQ.id, user_id: userId, text: "The launch checklist template — reuse it for every release", sentiment: 5 },
      { retro_id: retro3!.id, question_id: carryQ.id, user_id: userId, text: "Cross-team war room channel during launch windows", sentiment: 4 },
    ]).select();

    // Upvotes
    if (r3Responses && r3Responses.length >= 3) {
      await sb.from("response_upvotes").insert([
        { response_id: r3Responses[0].id, user_id: userId },
        { response_id: r3Responses[6].id, user_id: userId },
        { response_id: r3Responses[7].id, user_id: userId },
      ]);
    }

    // Timeline entries
    await sb.from("timeline_entries").insert([
      { retro_id: retro3!.id, user_id: userId, entry_date: "2026-02-10", description: "Feature freeze — all v2.0 code merged" },
      { retro_id: retro3!.id, user_id: userId, entry_date: "2026-02-20", description: "Staging deploy and QA cycle begins" },
      { retro_id: retro3!.id, user_id: userId, entry_date: "2026-03-01", description: "Beta launch to 500 users" },
      { retro_id: retro3!.id, user_id: userId, entry_date: "2026-03-10", description: "Public launch day 🚀" },
      { retro_id: retro3!.id, user_id: userId, entry_date: "2026-03-12", description: "Hotfix for mobile layout bugs shipped" },
    ]);

    // Top 3 entries
    await sb.from("top3_entries").insert([
      { retro_id: retro3!.id, user_id: userId, type: "good", rank: 1, text: "Zero-downtime deployment strategy" },
      { retro_id: retro3!.id, user_id: userId, type: "good", rank: 2, text: "Cross-team alignment on launch date" },
      { retro_id: retro3!.id, user_id: userId, type: "good", rank: 3, text: "72% onboarding completion rate" },
      { retro_id: retro3!.id, user_id: userId, type: "bad", rank: 1, text: "Late load testing" },
      { retro_id: retro3!.id, user_id: userId, type: "bad", rank: 2, text: "Mobile layout bugs in production" },
      { retro_id: retro3!.id, user_id: userId, type: "bad", rank: 3, text: "No rollback plan documented" },
    ]);

    // Action items
    await sb.from("action_items").insert([
      {
        retro_id: retro3!.id,
        description: "Add load testing to the release checklist at least 1 week before launch",
        created_by: userId,
        owner_id: userId,
        status: "open",
        due_date: "2026-04-01",
      },
      {
        retro_id: retro3!.id,
        description: "Create a mobile-specific QA checklist for all future releases",
        created_by: userId,
        owner_id: userId,
        status: "open",
        due_date: "2026-03-28",
      },
    ]);

    await sb.from("retro_participants").insert({ retro_id: retro3!.id, user_id: userId });

    return new Response(
      JSON.stringify({ message: "Demo data seeded", seeded: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Seed error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
