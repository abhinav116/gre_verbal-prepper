import { supabaseAdmin } from '@/lib/supabase'
import SiteNav from '@/components/SiteNav'
import ArticlesClient from './ArticlesClient'

export const revalidate = 3600 // re-fetch at most once per hour

export default async function ArticlesPage() {
  const { data } = await supabaseAdmin
    .from('articles')
    .select('id, title, source, topic, difficulty, reading_time, created_at, og_image')
    .order('created_at', { ascending: false })

  const articles = data ?? []

  return (
    <main className="min-h-screen bg-[#faf9f6]">
      <SiteNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">Article Archive</h1>
          <p className="text-gray-500 text-sm">Every GRE-level passage we&apos;ve published, with vocab and questions.</p>
        </div>
        <ArticlesClient articles={articles} />
      </div>
    </main>
  )
}
