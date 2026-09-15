import { Topic, GREVocab, MCQQuestion } from './types'

export interface ScoredArticle {
  title: string
  source: string
  url: string
  content: string
  published_at: string | null
  topic_hint: string
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
}

const SCORE_PROMPT = (article: ScoredArticle) => `
You are a GRE verbal preparation expert. Score this article for GRE reading practice suitability.

Article:
Title: ${article.title}
Source: ${article.source}
Content: ${article.content.slice(0, 3000)}

Score each dimension from 1-5:
1. reading_complexity: Sentence length, subordinate clauses, abstraction level (5 = very complex, graduate-level)
2. gre_vocab_density: Frequency of GRE-tier vocabulary words (5 = many high-frequency GRE words)
3. argument_structure: Author makes a clear claim and defends it with evidence (5 = strong argumentative structure)
4. gre_register: Reads like a GRE passage — hedging language, contrast markers, no colloquialisms (5 = very GRE-like)
5. topic_clarity: Clearly fits one category: Science, Humanities, Social Science, or Business

Also determine:
- topic: one of "Science", "Humanities", "Social Science", "Business"
- total_score: sum of all 5 dimensions (max 25)

Return ONLY valid JSON, no markdown:
{
  "reading_complexity": number,
  "gre_vocab_density": number,
  "argument_structure": number,
  "gre_register": number,
  "topic_clarity": number,
  "topic": string,
  "total_score": number
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
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  return JSON.parse(clean)
}

async function groqChat(model: string, prompt: string, maxTokens: number): Promise<string> {
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
    const text = await groqChat('llama-3.1-8b-instant', SCORE_PROMPT(article), 300)
    const parsed = parseJSON(text)
    return { score: parsed.total_score, topic: parsed.topic as Topic }
  } catch (err) {
    console.error('scoreArticle failed:', article.title, err)
    return null
  }
}

export async function enrichArticle(article: ScoredArticle, score: number, topic: Topic): Promise<EnrichedArticle | null> {
  try {
    const text = await groqChat('llama-3.3-70b-versatile', ENRICH_PROMPT(article, topic), 1500)
    const parsed = parseJSON(text)

    return {
      title: article.title,
      source: article.source,
      url: article.url,
      excerpt: parsed.excerpt,
      topic: parsed.topic,
      difficulty: parsed.difficulty,
      reading_time: parsed.reading_time,
      gre_vocab: parsed.gre_vocab,
      questions: parsed.questions,
      score,
      published_at: article.published_at,
    }
  } catch {
    return null
  }
}
