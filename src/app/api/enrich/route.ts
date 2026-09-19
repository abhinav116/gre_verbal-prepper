import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enrichArticle, ScoredArticle } from '@/lib/curation'
import { Topic } from '@/lib/types'

export async function GET() {
  // Pick highest-scoring pending candidate
  const { data: candidate, error } = await supabaseAdmin
    .from('scored_candidates')
    .select('*')
    .eq('status', 'pending')
    .order('score', { ascending: false })
    .limit(1)
    .single()

  if (error || !candidate) {
    return NextResponse.json({ message: 'No pending candidates to enrich' })
  }

  const article: ScoredArticle = {
    title: candidate.title,
    source: candidate.source,
    url: candidate.url,
    content: candidate.content,
    published_at: candidate.published_at,
    topic_hint: candidate.topic_hint,
  }

  let enriched
  try {
    enriched = await enrichArticle(article, candidate.score, candidate.topic as Topic)
  } catch (err) {
    await supabaseAdmin
      .from('scored_candidates')
      .update({ status: 'failed' })
      .eq('id', candidate.id)
    return NextResponse.json({ error: 'Enrichment failed', detail: String(err) }, { status: 500 })
  }

  if (!enriched) {
    await supabaseAdmin
      .from('scored_candidates')
      .update({ status: 'failed' })
      .eq('id', candidate.id)
    return NextResponse.json({ error: 'Enrichment returned null' }, { status: 500 })
  }

  const { error: insertError } = await supabaseAdmin.from('articles').insert(enriched)
  if (insertError) {
    return NextResponse.json({ error: 'DB insert failed', detail: insertError.message }, { status: 500 })
  }

  await supabaseAdmin
    .from('scored_candidates')
    .update({ status: 'enriched' })
    .eq('id', candidate.id)

  return NextResponse.json({
    success: true,
    title: enriched.title,
    topic: enriched.topic,
    score: enriched.score,
  })
}
