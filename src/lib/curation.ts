import { Topic, GREVocab, MCQQuestion } from './types'

export interface ScoredArticle {
  title: string
  source: string
  url: string
  content: string
  published_at: string | null
  topic_hint: string
  og_image?: string | null
}

export interface EnrichedArticle {
  title: string
  source: string
  url: string
  excerpt: string
  topic: Topic
  difficulty: number
  reading_time: number
  gre_vocab: GREVocab[]
  questions: MCQQuestion[]
  score: number
  published_at: string | null
  og_image?: string | null
}

const SCORE_PROMPT = (article: ScoredArticle) => `
You are a GRE verbal preparation expert. Score this article for GRE reading practice suitability.

Article:
Title: ${article.title}
Source: ${article.source}
Topic hint: ${article.topic_hint}
Content: ${article.content.slice(0, 3000)}

Score each dimension from 1-5 (integers only):
1. linguistic_difficulty: Complex sentences, subordinate clauses, GRE-tier vocabulary (5 = graduate-level prose)
2. gre_fit: Formal register, hedging language, argumentative structure, no colloquialisms (5 = reads like a GRE passage)
3. topic_suitability: Substantive, non-listicle, intellectually serious content (5 = excellent GRE material)

Also determine:
- topic: one of "Science", "Humanities", "Social Science", "Business"

Return ONLY valid JSON, no markdown:
{
  "linguistic_difficulty": number,
  "gre_fit": number,
  "topic_suitability": number,
  "topic": string
}
`

const ENRICH_PROMPT = (article: ScoredArticle, topic: Topic) => `
You are a GRE verbal preparation expert. Enrich this article for a GRE reading newsletter.

Article:
Title: ${article.title}
Source: ${article.source}
Content: ${article.content.slice(0, 5000)}

Tasks:
1. Select the best 350-450 word excerpt from the article that:
   - Contains the densest argument
   - Has the most GRE-relevant vocabulary
   - Has a clear beginning and end (not mid-thought)

2. Extract exactly 3 GRE-tier vocabulary words from the excerpt with:
   - word: the word as it appears
   - definition: clear, concise definition
   - sentence: the exact sentence from the excerpt where the word appears

3. Write 2 multiple-choice comprehension questions based on the excerpt. Each question must:
   - Have 4 options labeled A, B, C, D
   - Test: main idea, inference, author's tone, or structure (GRE question types)
   - Have one clearly correct answer

4. Estimate difficulty (1-5) and reading time in minutes for the excerpt.

Return ONLY valid JSON, no markdown:
{
  "excerpt": string,
  "topic": "${topic}",
  "difficulty": number,
  "reading_time": number,
  "gre_vocab": [
    {"word": string, "definition": string, "sentence": string}
  ],
  "questions": [
    {
      "question": string,
      "options": [string, string, string, string],
      "answer": "A" | "B" | "C" | "D"
    }
  ]
}
`

function parseJSON(text: string) {
  // Strip reasoning tags (chain-of-thought models)
  let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  // Strip markdown code fences
  clean = clean.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  // Extract first JSON object if there's surrounding text
  const match = clean.match(/\{[\s\S]*\}/)
  if (match) clean = match[0]

  // First try direct parse
  try {
    return JSON.parse(clean)
  } catch {
    // Replace unescaped newlines inside JSON string values
    const fixed = clean
      .replace(/:\s*"([\s\S]*?)(?<!\\)"/g, (_, val) => {
        const escaped = val
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t')
        return `: "${escaped}"`
      })
    return JSON.parse(fixed)
  }
}

async function groqChat(model: string, prompt: string, maxTokens: number, jsonMode = false): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}

export async function scoreArticle(article: ScoredArticle): Promise<{ score: number; topic: Topic } | null> {
  try {
    const text = await groqChat('groq/compound-mini', SCORE_PROMPT(article), 300, true)
    const parsed = parseJSON(text)
    const score = (parsed.linguistic_difficulty || 0) + (parsed.gre_fit || 0) + (parsed.topic_suitability || 0)
    return { score, topic: parsed.topic as Topic }
  } catch (err) {
    console.error('scoreArticle failed:', article.title, err)
    return null
  }
}

export async function enrichArticle(article: ScoredArticle, score: number, topic: Topic): Promise<EnrichedArticle | null> {
  const text = await groqChat('openai/gpt-oss-120b', ENRICH_PROMPT(article, topic), 3000, true)
  const parsed = parseJSON(text)

  return {
    title: article.title,
    source: article.source,
    url: article.url,
    excerpt: parsed.excerpt,
    topic: parsed.topic,
    difficulty: Math.round(parsed.difficulty),
    reading_time: Math.round(parsed.reading_time),
    gre_vocab: parsed.gre_vocab,
    questions: parsed.questions,
    score,
    published_at: article.published_at,
    og_image: article.og_image ?? null,
  }
}
