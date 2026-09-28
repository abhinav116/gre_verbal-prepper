import { supabaseAdmin } from '@/lib/supabase'
import SiteNav from '@/components/SiteNav'
import VocabClient from './VocabClient'
import { VocabWord } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function VocabPage() {
  const { data } = await supabaseAdmin
    .from('vocab_words')
    .select('*')
    .order('difficulty', { ascending: true })

  const words: VocabWord[] = data ?? []

  return (
    <main className="min-h-screen bg-[#faf9f6]">
      <SiteNav />
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Vocab Flashcards</h1>
          <p className="text-gray-500 text-sm">GRE words you&apos;ll actually remember.</p>
        </div>
        {words.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-20">No words yet. Run /api/seed-vocab to populate.</p>
        ) : (
          <VocabClient words={words} />
        )}
      </div>
    </main>
  )
}
