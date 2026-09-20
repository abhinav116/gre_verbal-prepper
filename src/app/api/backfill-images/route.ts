import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { supabaseAdmin } from '@/lib/supabase'

async function scrapeOgImage(url: string): Promise<string | null> {
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
    return (
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="og:image"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content') ||
      null
    )
  } catch {
    return null
  }
}

// GET /api/backfill-images?limit=20&offset=0
export async function GET(req: NextRequest) {
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 50)
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  const { data: articles, error } = await supabaseAdmin
    .from('articles')
    .select('id, url, title')
    .is('og_image', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!articles || articles.length === 0) {
    return NextResponse.json({ message: 'No articles missing images', done: true })
  }

  const log: Array<{ title: string; found: boolean }> = []

  for (const article of articles) {
    const ogImage = await scrapeOgImage(article.url)
    if (ogImage) {
      await supabaseAdmin
        .from('articles')
        .update({ og_image: ogImage })
        .eq('id', article.id)
    }
    log.push({ title: article.title, found: !!ogImage })
  }

  const found = log.filter(l => l.found).length

  return NextResponse.json({
    success: true,
    processed: articles.length,
    found,
    next_offset: offset + limit,
    done: articles.length < limit,
    log,
  })
}
