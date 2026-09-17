import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Supabase client initialization (lazy / guarded)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Gemini client initialization (lazy / guarded)
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// Request validation schema
const aiRunRequestSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt cannot be empty').max(5000),
  capability: z
    .enum([
      'language_understanding',
      'predictions_recommendations',
      'insights_dashboards',
      'vision_capabilities',
      'automation_logic',
    ])
    .optional()
    .default('language_understanding'),
  model: z.string().optional().default('google/gemini-2.5-flash'),
  imageUrl: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'JewelMind AI',
    timestamp: new Date().toISOString(),
    gatewayReady: Boolean(process.env.LOVABLE_API_KEY || process.env.GEMINI_API_KEY),
  });
});

// HERO AI HANDLER: /api/ai-run and /functions/v1/ai-run
const handleAiRun = async (req: express.Request, res: express.Response) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Authenticate user: reject unauthenticated calls with 401
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Please sign in.',
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Bearer token is missing or empty.',
      });
    }

    let userId = 'user_authenticated';

    // Verify token with Supabase if configured
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Supabase session validation failed.',
          });
        }
        userId = data.user.id;
      } catch (err) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication check failed.',
        });
      }
    } else {
      // Decode user ID from token payload or auth context
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          userId = payload.user_id || payload.sub || payload.uid || 'auth_user';
        }
      } catch {
        // Default to token reference
        userId = token.slice(0, 32);
      }
    }

    // 2. Zod-validate the request body
    const parseResult = aiRunRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request payload',
        details: parseResult.error.flatten(),
      });
    }

    const { prompt, capability, model, imageUrl } = parseResult.data;

    // 3. System prompt tailored to JewelMind AI Capabilities
    const systemInstruction = `You are JewelMind AI, the haute jewellery intelligence engine.
Capabilities:
- Language understanding: Interpret custom jewelry requests, metal alloys, gemstone clarity, cuts, carats, and settings.
- Predictions / recommendations: Analyze micro-trends, style aesthetics (Art Deco, Minimalist, Royal Heirlooms), and recommend complementary metals & stones.
- Insights & dashboards: Provide strategic analysis of client demographics, trending stones, and luxury demand metrics.
- Vision capabilities: Evaluate silhouettes, ergonomic scale, finger/neck contours, and light reflection.
- Automation logic: Format precise atelier specs, custom commission parameters, and CAD fabrication guidelines.

Active Mode: ${capability}
Tone: Refined, gemologically rigorous, inspiring, and concise.`;

    // 4. Check for Lovable AI Gateway Key
    const lovableApiKey = process.env.LOVABLE_API_KEY || process.env.AI_GATEWAY_KEY;

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let accumulatedResponse = '';

    if (lovableApiKey) {
      // Call Lovable AI Gateway
      const gatewayUrl = 'https://ai.lovable.dev/v1/chat/completions';
      const messages: any[] = [{ role: 'system', content: systemInstruction }];

      if (imageUrl) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        });
      } else {
        messages.push({ role: 'user', content: prompt });
      }

      const gatewayRes = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: model || 'google/gemini-2.5-flash',
          messages,
          stream: true,
        }),
      });

      // Handle 429 & 402 from Gateway
      if (gatewayRes.status === 429) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'rate_limit_exceeded', status: 429, message: 'AI rate limit reached. Please wait a moment before trying again.' })}\n\n`);
        return res.end();
      }

      if (gatewayRes.status === 402) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'insufficient_credits', status: 402, message: 'AI credits exhausted. Please check your workspace balance.' })}\n\n`);
        return res.end();
      }

      if (!gatewayRes.ok) {
        const errText = await gatewayRes.text();
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'gateway_error', status: gatewayRes.status, message: errText })}\n\n`);
        return res.end();
      }

      // Stream gateway response chunk by chunk
      const reader = gatewayRes.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);

          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                const delta = parsed.choices?.[0]?.delta?.content || '';
                accumulatedResponse += delta;
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }
    } else {
      // Primary Google GenAI stream using gemini-3.6-flash
      const ai = getGemini();
      if (!ai) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'configuration_error', message: 'No AI Gateway or Gemini API Key configured in environment.' })}\n\n`);
        return res.end();
      }

      const promptContents = `${systemInstruction}\n\nUser Request: ${prompt}`;
      const streamResult = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: promptContents,
      });

      for await (const chunk of streamResult) {
        const text = chunk.text || '';
        accumulatedResponse += text;
        const sseData = JSON.stringify({
          choices: [
            {
              delta: { content: text },
            },
          ],
        });
        res.write(`data: ${sseData}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    }

    res.end();
  } catch (error: any) {
    console.error('AI Run error:', error);
    if (!res.headersSent) {
      if (error?.status === 429) {
        return res.status(429).json({
          error: 'rate_limit_exceeded',
          message: 'AI rate limit reached. Please wait a moment before trying again.',
        });
      }
      if (error?.status === 402) {
        return res.status(402).json({
          error: 'insufficient_credits',
          message: 'AI credits exhausted. Please recharge your workspace credits to continue.',
        });
      }
      return res.status(500).json({ error: 'Internal Server Error', message: error?.message });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error?.message || 'Stream disrupted' })}\n\n`);
      res.end();
    }
  }
};

app.post('/api/ai-run', handleAiRun);
app.post('/functions/v1/ai-run', handleAiRun);

// Direct PDF Knowledge Base download route
app.get(['/api/download-kb-pdf', '/api/knowledge-base.pdf'], (req, res) => {
  const pdfPath = path.join(process.cwd(), 'public', 'JewelMind_AI_Knowledge_Base.pdf');
  if (fs.existsSync(pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="JewelMind_AI_Knowledge_Base.pdf"');
    return fs.createReadStream(pdfPath).pipe(res);
  }
  res.status(404).json({ error: 'Knowledge Base PDF not found' });
});

// Vite middleware for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const candidatePath = path.join(process.cwd(), 'dist');
    const distPath = fs.existsSync(candidatePath)
      ? candidatePath
      : (typeof __dirname !== 'undefined' ? __dirname : candidatePath);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
