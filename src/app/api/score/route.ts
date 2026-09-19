import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import * as cheerio from 'cheerio'
import { supabaseAdmin } from '@/lib/supabase'
import { RSS_SOURCES, LISTICLE_PATTERNS } from '@/lib/rss-sources'
import { scoreArticle, ScoredArticle } from '@/lib/curation'

const parser = new Parser()

const SCORE_THRESHOLD = 9
const MIN_WORDS = 400
const MAX_WORDS = 5000
const SCORE_LIMIT = 5

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
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .menu, .comments').remove()
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

export async function GET(req: NextRequest) {
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  // Get all known URLs (articles + already scored candidates)
  const [{ data: existingArticles }, { data: existingCandidates }] = await Promise.all([
    supabaseAdmin.from('articles').select('url'),
    supabaseAdmin.from('scored_candidates').select('url'),
  ])
  const knownUrls = new Set([
    ...(existingArticles || []).map((r: { url: string }) => r.url),
    ...(existingCandidates || []).map((r: { url: string }) => r.url),
  ])

  const candidates: ScoredArticle[] = []

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.rssUrl)
      for (const item of feed.items.slice(0, 30)) {
        if (!item.link || knownUrls.has(item.link)) continue
        const title = item.title || ''
        if (LISTICLE_PATTERNS.some(p => p.test(title))) continue

        let content = await fetchFullText(item.link)
        if (!content) content = item.contentSnippet || item.content || item.summary || ''

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
      // source unavailable
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({ message: 'No new candidates found' })
  }

  const slice = candidates.slice(offset, offset + SCORE_LIMIT)
  const scoreLog: Array<{ title: string; score: number | null; topic: string | null; saved: boolean }> = []

  for (const candidate of slice) {
    const result = await scoreArticle(candidate)
    if (!result) {
      scoreLog.push({ title: candidate.title, score: null, topic: null, saved: false })
      continue
    }

    if (result.score < SCORE_THRESHOLD) {
      scoreLog.push({ title: candidate.title, score: result.score, topic: result.topic, saved: false })
      continue
    }

    await supabaseAdmin.from('scored_candidates').insert({
      title: candidate.title,
      source: candidate.source,
      url: candidate.url,
      content: candidate.content,
      published_at: candidate.published_at,
      topic_hint: candidate.topic_hint,
      score: result.score,
      topic: result.topic,
    })
    scoreLog.push({ title: candidate.title, score: result.score, topic: result.topic, saved: true })
  }

  return NextResponse.json({
    success: true,
    candidates_found: candidates.length,
    slice_scored: slice.length,
    next_offset: offset + SCORE_LIMIT,
    score_log: scoreLog,
  })
}
