import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { Article } from '@/lib/types'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function difficultyLabel(n: number): string {
  return ['', 'Introductory', 'Easy', 'Moderate', 'Hard', 'Advanced'][n] || 'Moderate'
}

function buildEmailHtml(article: Article, baseUrl: string): string {
  const vocabHtml = article.gre_vocab
    .map(
      v => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 140px; vertical-align: top;">${v.word}</td>
        <td style="padding: 8px 0 8px 16px; border-bottom: 1px solid #eee; color: #444; vertical-align: top;">${v.definition}</td>
      </tr>`
    )
    .join('')

  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
      <p style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #888; margin-bottom: 8px;">
        GRE Verbal Prepper &bull; Daily Reading
      </p>

      <h1 style="font-size: 24px; line-height: 1.3; margin: 0 0 8px;">${article.title}</h1>

      <p style="font-size: 13px; color: #888; margin: 0 0 24px;">
        ${article.source} &bull; ${article.topic} &bull; ${difficultyLabel(article.difficulty)} &bull; ${article.reading_time} min read
      </p>

      <div style="background: #f9f8f5; border-left: 3px solid #1a1a1a; padding: 20px 24px; margin-bottom: 28px; font-size: 15px; line-height: 1.8; color: #222;">
        ${article.excerpt.replace(/\n/g, '<br>')}
      </div>

      <h3 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">GRE Vocabulary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 14px;">
        ${vocabHtml}
      </table>

      <a href="${baseUrl}/articles/${article.id}" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 14px; border-radius: 4px; margin-bottom: 32px;">
        Answer comprehension questions
      </a>

      <p style="font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px;">
        You're receiving this because you subscribed at ${baseUrl}.<br>
        <a href="${baseUrl}/unsubscribe" style="color: #aaa;">Unsubscribe</a>
      </p>
    </div>
  `
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get today's unsent article (most recently ingested, not yet sent)
  const { data: article, error: articleError } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('sent', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (articleError || !article) {
    return NextResponse.json({ error: 'No article to send today' }, { status: 404 })
  }

  // Get all active subscribers
  const { data: subscribers, error: subError } = await supabaseAdmin
    .from('subscribers')
    .select('email')
    .eq('active', true)

  if (subError || !subscribers || subscribers.length === 0) {
    return NextResponse.json({ message: 'No active subscribers' })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
  const html = buildEmailHtml(article as Article, baseUrl)

  // Send in batches of 50 (Resend batch limit)
  const emails = subscribers.map((s: { email: string }) => ({
    from: 'GRE Verbal Prepper <hello@yourverifieddomain.com>',
    to: s.email,
    subject: `Today's GRE Reading: ${article.title}`,
    html,
  }))

  const batchSize = 50
  for (let i = 0; i < emails.length; i += batchSize) {
    await getResend().batch.send(emails.slice(i, i + batchSize))
  }

  // Mark article as sent
  await supabaseAdmin
    .from('articles')
    .update({ sent: true, sent_at: new Date().toISOString() })
    .eq('id', article.id)

  return NextResponse.json({ success: true, sent_to: subscribers.length, article: article.title })
}
