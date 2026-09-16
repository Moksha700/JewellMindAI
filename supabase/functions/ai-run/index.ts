// Supabase Edge Function: ai-run
// Calls Lovable AI Gateway with streaming, validates auth via supabase.auth.getUser(),
// validates request body with Zod, handles rate limits/credits, and persists runs to public.ai_runs.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const aiRunSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(5000),
  capability: z.enum([
    "language_understanding",
    "predictions_recommendations",
    "insights_dashboards",
    "vision_capabilities",
    "automation_logic"
  ]).optional().default("language_understanding"),
  model: z.string().optional().default("google/gemini-2.5-flash"),
  imageUrl: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user via supabase.auth.getUser()
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid user session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Zod-validate the request body
    const rawBody = await req.json();
    const parseResult = aiRunSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request payload",
          details: parseResult.error.flatten(),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { prompt, capability, model, imageUrl } = parseResult.data;

    // 3. System prompt customized for JewelMind AI capabilities
    const systemPrompt = `You are JewelMind AI, the premier Haute Intelligence jewellery advisor.
Your capabilities include:
1. Language Understanding: Parse natural language jewellery descriptions, gemstones, precious metals, and motifs.
2. Predictions & Recommendations: Deliver trend forecasting, gemstone pairings, and personalized metal suggestions.
3. Insights & Dashboards: Analyze luxury market trends, styling appeal, and consumer demand.
4. Vision & Virtual Try-On: Advise on silhouettes, finger/neck/wrist anatomy aesthetics, and lighting reflection.
5. Automation Logic: Structure custom commission parameters, CAD specs, and atelier workflows.

Active Capability: ${capability}
Provide polished, authoritative, gemologically precise responses.`;

    // 4. Call the Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("AI_GATEWAY_KEY");
    const gatewayUrl = "https://ai.lovable.dev/v1/chat/completions";

    const gatewayMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageUrl) {
      gatewayMessages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      });
    } else {
      gatewayMessages.push({ role: "user", content: prompt });
    }

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.5-flash",
        messages: gatewayMessages,
        stream: true,
      }),
    });

    // 5. Handle rate limit (429) and insufficient credits (402)
    if (response.status === 429) {
      return new Response(
        JSON.stringify({
          error: "rate_limit_exceeded",
          message: "Rate limit reached. Please wait a few moments before trying again.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (response.status === 402) {
      return new Response(
        JSON.stringify({
          error: "insufficient_credits",
          message: "AI credits exhausted. Please recharge your workspace credits to continue.",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: "Gateway error", details: errText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Stream back token-by-token and accumulate full response to store in ai_runs
    let accumulatedText = "";
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(encoder.encode(chunk));

            // Extract delta tokens for persistence
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
                try {
                  const json = JSON.parse(line.slice(6));
                  const delta = json.choices?.[0]?.delta?.content || "";
                  accumulatedText += delta;
                } catch {
                  // Ignore non-json SSE lines
                }
              }
            }
          }
        } finally {
          controller.close();

          // 7. Store each run in public.ai_runs table
          if (accumulatedText.trim().length > 0) {
            try {
              await supabase.from("ai_runs").insert({
                user_id: user.id,
                prompt,
                response: accumulatedText,
                model: model || "google/gemini-2.5-flash",
                capability,
              });
            } catch (dbErr) {
              console.error("Failed to persist to ai_runs:", dbErr);
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
