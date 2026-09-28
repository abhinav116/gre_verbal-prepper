import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VOCAB_PROMPT = (word: string) => `
You are a GRE vocabulary coach creating flashcards for Telugu students from Andhra Pradesh and Telangana preparing for GRE. Your audience is age 20-25, engineering grads, deeply familiar with Tollywood, AP/Telangana politics, and cricket. English is their second language — vocabulary is genuinely hard for them.

Celebrity pool for POSITIVE words: Tollywood (Allu Arjun, Mahesh Babu, Jr NTR, Prabhas, Ram Charan, Chiranjeevi, Samantha), Politics (Jagan, KCR, Chandrababu, Pawan Kalyan), Cricket (Dhoni, Virat Kohli, Rohit Sharma).

For NEGATIVE words: NEVER use real celebrities. Use fictional characters from well-known Telugu films only: Magadheera, Baahubali, Pokiri, Arya, Temper, Khaleja, Vikramarkudu, Srimanthudu, RRR, Pushpa.

Generate a vocabulary flashcard for the word: "${word}"

Return ONLY valid JSON:
{
  "part_of_speech": "adj." | "n." | "v." | "adv.",
  "definition": "clear, concise 1-sentence definition",
  "is_negative": true or false,
  "phonetic_hook": "Telugu sound-based memory trick, or null if forced",
  "reference_type": "celebrity" or "fictional",
  "reference_name": "celebrity name or film title",
  "reference_context": "1-2 vivid sentences of the specific moment or trait",
  "example_sentence": "punchy sentence using the word with the celebrity or character, WhatsApp tone",
  "difficulty": 1 (common GRE) | 2 (medium) | 3 (hard/rare)
}
`

async function claudeChat(prompt: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })
  return msg.content[0].type === 'text' ? msg.content[0].text : ''
}

export async function POST(req: NextRequest) {
  try {
    const { word } = await req.json()
    if (!word) return NextResponse.json({ error: 'word required' }, { status: 400 })

    const normalised = word.toLowerCase().trim()

    // Skip if already exists
    const { data: existing } = await supabaseAdmin
      .from('vocab_words')
      .select('id')
      .eq('word', normalised)
      .single()

    if (existing) {
      return NextResponse.json({ message: 'already exists', word: normalised })
    }

    const text = await claudeChat(VOCAB_PROMPT(normalised))
    if (!text) return NextResponse.json({ error: 'empty LLM response' }, { status: 500 })

    const parsed = JSON.parse(text)

    const { error } = await supabaseAdmin.from('vocab_words').insert({
      word: normalised,
      part_of_speech: parsed.part_of_speech,
      definition: parsed.definition,
      is_negative: parsed.is_negative,
      phonetic_hook: parsed.phonetic_hook ?? null,
      reference_type: parsed.reference_type,
      reference_name: parsed.reference_name,
      reference_context: parsed.reference_context,
      example_sentence: parsed.example_sentence,
      difficulty: parsed.difficulty,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, word: normalised })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
