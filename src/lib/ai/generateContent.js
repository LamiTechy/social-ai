import { supabase } from '../supabase/client'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.3-70b-versatile'

const PLATFORM_INSTRUCTIONS = {
  twitter:   'Write a punchy tweet under 280 characters. Hook in the first line. Use 1-2 hashtags.',
  linkedin:  'Write a professional LinkedIn post (150-300 words). Short paragraphs. End with a question or CTA. 3-5 hashtags at the end.',
  instagram: 'Write an engaging Instagram caption with emojis throughout. Clear CTA (DM us, link in bio). 5-8 hashtags at the end.',
}

const TONE_GUIDE = {
  professional:  'Formal, polished, authoritative. No slang.',
  quirky:        'Playful, unexpected angle, light humour. Stand out.',
  direct:        'Short punchy sentences. Lead with the point. No filler.',
  inspirational: 'Uplifting, forward-looking, emotionally resonant.',
  educational:   'Explain one clear concept. Actionable. Simple language.',
}

export async function generateContent({ topic, tone, platforms }) {
  const groqKey = import.meta.env.VITE_GROQ_API_KEY

  // ── If Groq key is available, call Groq directly ──────────
  if (groqKey) {
    const platformSections = platforms
      .map(p => `### ${p.toUpperCase()}\n${PLATFORM_INSTRUCTIONS[p] ?? 'Write an engaging social media post.'}`)
      .join('\n\n')

    const prompt = `You are an expert social media copywriter for small businesses.
Tone: ${TONE_GUIDE[tone] ?? TONE_GUIDE.professional}

Topic/Brief: "${topic}"

Write social media posts for:

${platformSections}

Also suggest one vivid image generation prompt (for DALL-E or Midjourney) to complement these posts.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, no code fences.
{
  "content": {
    ${platforms.map(p => `"${p}": "post text here"`).join(',\n    ')}
  },
  "imagePrompt": "detailed image prompt here"
}`

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        temperature: 0.8,
        max_tokens:  1024,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Groq error ${res.status}`)
    }

    const data = await res.json()
    const raw  = data.choices?.[0]?.message?.content ?? ''

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim()

    try {
      return JSON.parse(cleaned)
    } catch {
      throw new Error('AI returned invalid JSON. Please try again.')
    }
  }

  // ── Fallback: Supabase Edge Function ──────────────────────
  const { data: { session } } = await supabase.auth.getSession()
  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ?? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

  const res = await fetch(`${baseUrl}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ topic, tone, platforms }),
  })

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}))
    throw new Error(error ?? `Server error ${res.status}`)
  }

  return res.json()
}