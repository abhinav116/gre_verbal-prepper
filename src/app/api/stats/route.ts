import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET() {
  const [countResult, latestResult] = await Promise.all([
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('articles')
      .select('id, title, topic, difficulty, source, excerpt, reading_time')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return NextResponse.json({
    articleCount: countResult.count ?? 0,
    latestArticle: latestResult.data ?? null,
  })
}
