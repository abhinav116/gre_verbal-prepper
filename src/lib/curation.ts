import Anthropic from '@anthropic-ai/sdk'
import { Topic, GREVocab, MCQQuestion } from './types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

export async function scoreArticle(article: ScoredArticle): Promise<{ score: number; topic: Topic } | null> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: SCORE_PROMPT(article) }],
    })

    const text = (message.content[0] as { type: string; text: string }).text
    const parsed = JSON.parse(text)
    return { score: parsed.total_score, topic: parsed.topic as Topic }
  } catch {
    return null
  }
}

export async function enrichArticle(article: ScoredArticle, score: number, topic: Topic): Promise<EnrichedArticle | null> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: ENRICH_PROMPT(article, topic) }],
    })

    const text = (message.content[0] as { type: string; text: string }).text
    const parsed = JSON.parse(text)

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
