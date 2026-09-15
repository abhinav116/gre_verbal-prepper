import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import * as cheerio from 'cheerio'
import { supabaseAdmin } from '@/lib/supabase'
import { RSS_SOURCES, LISTICLE_PATTERNS } from '@/lib/rss-sources'
import { scoreArticle, enrichArticle, ScoredArticle } from '@/lib/curation'
import { Topic } from '@/lib/types'

const parser = new Parser()

const SCORE_THRESHOLD = 12
const MIN_WORDS = 400
const MAX_WORDS = 5000

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
  const dayOfWeek = new Date().getDay()
  const defaultTopic = TOPIC_ROTATION[dayOfWeek]
  if (recentTopics[0] !== defaultTopic) return defaultTopic
  const counts: Record<Topic, number> = { Science: 0, Humanities: 0, 'Social Science': 0, Business: 0 }
  recentTopics.forEach(t => { counts[t] = (counts[t] || 0) + 1 })
  return (Object.entries(counts).sort((a, b) => a[1] - b[1])[0][0]) as Topic
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length
}

async function fetchFullText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const $ = cheerio.load(html)

    // Remove noise elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .menu, .comments').remove()

    // Extract paragraphs with substantial content
    const paragraphs: string[] = []
    $('p').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 60) paragraphs.push(text)
    })

    const content = paragraphs.join('\n\n')
    return content.length > 200 ? content : null
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest) {
  const recentTopics = await getLastSentTopics(7)
  const targetTopic = pickTargetTopic(recentTopics)

  const { data: existingUrls } = await supabaseAdmin
    .from('articles')
    .select('url')
  const knownUrls = new Set((existingUrls || []).map((r: { url: string }) => r.url))

  const candidates: ScoredArticle[] = []
  const debug: Record<string, number> = {}

  for (const source of RSS_SOURCES) {
    let fetched = 0, skippedKnown = 0, skippedListicle = 0, skippedLength = 0, added = 0
    try {
      const feed = await parser.parseURL(source.rssUrl)
      fetched = feed.items.length

      for (const item of feed.items.slice(0, 20)) {
        if (!item.link) continue
        if (knownUrls.has(item.link)) { skippedKnown++; continue }

        const title = item.title || ''
        if (LISTICLE_PATTERNS.some(p => p.test(title))) { skippedListicle++; continue }

        // Try full article scrape first, fall back to RSS content
        let content = await fetchFullText(item.link)
        if (!content) {
          content = item.contentSnippet || item.content || item.summary || ''
        }

        const wc = wordCount(content)
        if (wc < MIN_WORDS || wc > MAX_WORDS) { skippedLength++; continue }

        candidates.push({
          title,
          source: source.name,
          url: item.link,
          content,
          published_at: item.pubDate || item.isoDate || null,
          topic_hint: source.topic_hint,
        })
        added++
      }
    } catch {
      // source unavailable
    }
    debug[source.name] = { fetched, skippedKnown, skippedListicle, skippedLength, added } as unknown as number
  }

  if (candidates.length === 0) {
    return NextResponse.json({ message: 'No candidates found', debug })
  }

  // Score with Claude Haiku
  const scored: Array<{ article: ScoredArticle; score: number; topic: Topic }> = []
  for (const candidate of candidates) {
    const result = await scoreArticle(candidate)
    if (!result || result.score < SCORE_THRESHOLD) continue
    scored.push({ article: candidate, score: result.score, topic: result.topic })
  }

  if (scored.length === 0) {
    return NextResponse.json({
      message: 'No articles passed score threshold',
      candidates_found: candidates.length,
      threshold: SCORE_THRESHOLD,
      debug,
    })
  }

  // Pick best article matching target topic
  const preferred = scored.filter(s => s.topic === targetTopic)
  const pool = preferred.length > 0 ? preferred : scored
  pool.sort((a, b) => b.score - a.score)
  const winner = pool[0]

  // Enrich with Claude Sonnet
  const enriched = await enrichArticle(winner.article, winner.score, winner.topic)
  if (!enriched) {
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 })
  }

  const { error } = await supabaseAdmin.from('articles').insert(enriched)
  if (error) {
    return NextResponse.json({ error: 'DB insert failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    title: enriched.title,
    source: enriched.source,
    topic: enriched.topic,
    score: enriched.score,
    candidates_found: candidates.length,
    candidates_scored: scored.length,
  })
}
