// supabase/functions/generate/index.ts
// Deploy with: supabase functions deploy generate
// Set secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import Anthropic from 'npm:@anthropic-ai/sdk@0.24.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Platform instructions ───────────────────────────────────
const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  twitter:
    'Write a punchy tweet under 280 characters. Hook in the first line. Use 1-2 relevant hashtags. No thread format.',
  linkedin:
    'Write a professional LinkedIn post (150-300 words). Use short paragraphs and line breaks. End with a question or CTA. Use 3-5 hashtags at the end.',
  instagram:
    'Write an engaging Instagram caption. Use emojis naturally throughout. End with a clear CTA (DM, link in bio, tag a friend). Use 5-8 relevant hashtags at the end.',
}

const TONE_GUIDE: Record<string, string> = {
  professional:  'Formal, polished, authoritative. No slang. Build credibility.',
  quirky:        'Playful, take an unexpected angle, light self-aware humour. Stand out.',
  direct:        'Short punchy sentences. Lead with the point. No filler words.',
  inspirational: 'Uplifting, forward-looking, emotionally resonant. Make people feel something.',
  educational:   'Explain one clear concept. Teach something actionable. Use simple language.',
}

// ─── Handler ─────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth check ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Parse body ──
    const { topic, tone, platforms } = await req.json() as {
      topic: string
      tone: string
      platforms: string[]
    }

    if (!topic || !tone || !platforms?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields: topic, tone, platforms' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Build prompt ──
    const platformSections = platforms
      .map((p: string) => `### ${p.toUpperCase()}\n${PLATFORM_INSTRUCTIONS[p] ?? 'Write an engaging social media post.'}`)
      .join('\n\n')

    const toneGuide = TONE_GUIDE[tone] ?? TONE_GUIDE.professional

    const systemPrompt = `You are an expert social media copywriter specialising in small business content.
You write compelling, authentic posts that drive engagement and build brand identity.
Always match the requested tone precisely.`

    const userPrompt = `Tone: ${toneGuide}

Topic/Brief: "${topic}"

Write social media posts for the following platforms:

${platformSections}

Also suggest one vivid image generation prompt (for DALL-E or Midjourney) that would visually complement these posts. Make it specific, descriptive, and usable directly.

CRITICAL: Respond ONLY with valid JSON. No markdown fences, no preamble, no explanation.
Use exactly this structure:
{
  "content": {
    ${platforms.map((p: string) => `"${p}": "post content here"`).join(',\n    ')}
  },
  "imagePrompt": "detailed image generation prompt here"
}`

    // ── Call Anthropic ──
    const client = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = message.content
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim()
    const parsed  = JSON.parse(cleaned)

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
