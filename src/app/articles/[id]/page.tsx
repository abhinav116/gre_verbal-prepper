import { notFound } from 'next/navigation'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Article, MCQQuestion } from '@/lib/types'
import ArticleReader from './ArticleReader'
import PassageWithTooltips from './PassageWithTooltips'
import SiteNav from '@/components/SiteNav'

interface Props {
  params: Promise<{ id: string }>
}

function difficultyLabel(n: number): string {
  return ['', 'Introductory', 'Easy', 'Moderate', 'Hard', 'Advanced'][n] || 'Moderate'
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const article = data as Article

  return (
    <main className="min-h-screen bg-[#faf9f6]">
      <SiteNav />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Title + source */}
        <div className="mb-8">
          <div className="flex gap-2 flex-wrap mb-3">
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{article.topic}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{difficultyLabel(article.difficulty)}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{article.reading_time} min read</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 leading-tight mb-2">
            {article.title}
          </h1>
          <p className="text-gray-500 text-sm">
            From {article.source} &bull;{' '}
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-800">
              Read full article
            </a>
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left: Passage */}
          <div className="flex-1 min-w-0">
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Passage</p>
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
              <PassageWithTooltips excerpt={article.excerpt} gre_vocab={article.gre_vocab} />
            </div>
          </div>

          {/* Right: Vocab + Questions (sticky) */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="lg:sticky lg:top-8 space-y-6">

              {/* GRE Vocabulary */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">GRE Vocabulary</p>
                <div className="space-y-5">
                  {article.gre_vocab.map((v, i) => (
                    <div key={i} className="border-l-2 border-amber-300 pl-4">
                      <p className="font-semibold text-gray-900 text-sm">{v.word}</p>
                      <p className="text-gray-600 text-sm mt-0.5">{v.definition}</p>
                      <p className="text-gray-400 text-xs italic mt-1">&ldquo;{v.sentence}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* MCQ Questions */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Comprehension Questions</p>
                <ArticleReader questions={article.questions as MCQQuestion[]} />
              </div>

              {/* Subscribe CTA — shown to users who landed without subscribing */}
              <div className="bg-gray-900 rounded-xl p-6 text-white">
                <p className="font-serif font-bold text-base mb-1">Get this daily.</p>
                <p className="text-gray-400 text-sm mb-4">One GRE-level passage, 3 vocab words, 2 questions — every morning.</p>
                <a
                  href="/"
                  className="block w-full text-center py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Subscribe free
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
