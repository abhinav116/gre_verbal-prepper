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
const SCORE_LIMIT = 20   // candidates to score per run
const ENRICH_LIMIT = 5   // top articles to enrich and store per run

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
  // Optional offset param to page through candidates across runs
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  const { data: existingUrls } = await supabaseAdmin.from('articles').select('url')
  const knownUrls = new Set((existingUrls || []).map((r: { url: string }) => r.url))

  const candidates: ScoredArticle[] = []

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.rssUrl)
      for (const item of feed.items.slice(0, 30)) {
        if (!item.link) continue
        if (knownUrls.has(item.link)) continue

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

  // Score a slice of candidates (use offset to page through on repeated runs)
  const slice = candidates.slice(offset, offset + SCORE_LIMIT)
  const scored: Array<{ article: ScoredArticle; score: number; topic: Topic }> = []

  for (const candidate of slice) {
    const result = await scoreArticle(candidate)
    if (!result || result.score < SCORE_THRESHOLD) continue
    scored.push({ article: candidate, score: result.score, topic: result.topic })
  }

  if (scored.length === 0) {
    return NextResponse.json({
      message: 'No articles passed score threshold in this slice',
      candidates_found: candidates.length,
      slice_start: offset,
      slice_end: offset + SCORE_LIMIT,
    })
  }

  // Enrich top N by score
  scored.sort((a, b) => b.score - a.score)
  const toEnrich = scored.slice(0, ENRICH_LIMIT)

  const stored: Array<{ title: string; topic: Topic; score: number }> = []
  const failed: Array<{ title: string; reason: string }> = []

  for (const { article, score, topic } of toEnrich) {
    let enriched
    try {
      enriched = await enrichArticle(article, score, topic)
    } catch (err) {
      failed.push({ title: article.title, reason: String(err) })
      continue
    }
    if (!enriched) { failed.push({ title: article.title, reason: 'enrichArticle returned null' }); continue }

    const { error } = await supabaseAdmin.from('articles').insert(enriched)
    if (error) { failed.push({ title: article.title, reason: error.message }); continue }

    stored.push({ title: enriched.title, topic: enriched.topic, score: enriched.score })
  }

  return NextResponse.json({
    success: true,
    stored: stored.length,
    failed: failed.length,
    articles: stored,
    failures: failed,
    candidates_found: candidates.length,
    next_offset: offset + SCORE_LIMIT,
  })
}
