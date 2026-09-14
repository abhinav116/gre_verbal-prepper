import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { supabaseAdmin } from '@/lib/supabase'
import { RSS_SOURCES, LISTICLE_PATTERNS } from '@/lib/rss-sources'
import { scoreArticle, enrichArticle, ScoredArticle } from '@/lib/curation'
import { Topic } from '@/lib/types'

const parser = new Parser()

const SCORE_THRESHOLD = 8
const MIN_WORDS = 300
const MAX_WORDS = 2500

// Topic rotation: what topic should today be?
const TOPIC_ROTATION: Topic[] = ['Science', 'Humanities', 'Social Science', 'Business', 'Science', 'Humanities', 'Social Science']

async function getLastSentTopics(n: number): Promise<Topic[]> {
  const { data } = await supabaseAdmin
    .from('articles')
    .select('topic')
    .eq('sent', true)
    .order('sent_at', { ascending: false })
    .limit(n)

  return (data || []).map((r: { topic: Topic }) => r.topic)
}

function pickTargetTopic(recentTopics: Topic[]): Topic {
  const dayOfWeek = new Date().getDay() // 0 = Sunday
  const defaultTopic = TOPIC_ROTATION[dayOfWeek]

  // Avoid repeating the same topic as yesterday
  if (recentTopics[0] !== defaultTopic) return defaultTopic

  // Fall back to the least-sent topic in the last 7 days
  const counts: Record<Topic, number> = { Science: 0, Humanities: 0, 'Social Science': 0, Business: 0 }
  recentTopics.forEach(t => { counts[t] = (counts[t] || 0) + 1 })
  return (Object.entries(counts).sort((a, b) => a[1] - b[1])[0][0]) as Topic
}

function isRecent(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const published = new Date(dateStr)
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000) // 48h window
  return published > cutoff
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length
}

export async function GET(_req: NextRequest) {
  // Auth temporarily disabled for pipeline testing — re-enable before go-live

  const recentTopics = await getLastSentTopics(7)
  const targetTopic = pickTargetTopic(recentTopics)

  // Fetch already-known URLs to avoid re-processing
  const { data: existingUrls } = await supabaseAdmin
    .from('articles')
    .select('url')
  const knownUrls = new Set((existingUrls || []).map((r: { url: string }) => r.url))

  const candidates: ScoredArticle[] = []

  // Ingest RSS feeds
  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)
      for (const item of feed.items.slice(0, 15)) {
        if (!item.link || knownUrls.has(item.link)) continue
        if (!isRecent(item.pubDate || item.isoDate)) continue

        const title = item.title || ''
        if (LISTICLE_PATTERNS.some(p => p.test(title))) continue

        const content = item.contentSnippet || item.content || item.summary || ''
        const wc = wordCount(content)
        if (wc < MIN_WORDS || wc > MAX_WORDS) continue

        candidates.push({
          title,
          source: source.name,
          url: item.link,
          content,
          published_at: item.pubDate || item.isoDate || null,
          topic_hint: source.topic_hint,
        })
      }
    } catch {
      // Source unavailable, skip
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({ message: 'No candidates found today' })
  }

  // Score candidates using Haiku (cheap)
  const scored: Array<{ article: ScoredArticle; score: number; topic: Topic }> = []

  for (const candidate of candidates) {
    const result = await scoreArticle(candidate)
    if (!result || result.score < SCORE_THRESHOLD) continue
    scored.push({ article: candidate, score: result.score, topic: result.topic })
  }

  if (scored.length === 0) {
    return NextResponse.json({ message: 'No articles passed score threshold today' })
  }

  // Prefer target topic, fall back to highest score overall
  const preferred = scored.filter(s => s.topic === targetTopic)
  const pool = preferred.length > 0 ? preferred : scored
  pool.sort((a, b) => b.score - a.score)
  const winner = pool[0]

  // Enrich winner using Sonnet (vocab, questions, excerpt)
  const enriched = await enrichArticle(winner.article, winner.score, winner.topic)
  if (!enriched) {
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 })
  }

  // Save to DB
  const { error } = await supabaseAdmin.from('articles').insert(enriched)
  if (error) {
    return NextResponse.json({ error: 'DB insert failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, title: enriched.title, topic: enriched.topic, score: enriched.score })
}
