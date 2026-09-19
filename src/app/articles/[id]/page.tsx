import { notFound } from 'next/navigation'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Article, MCQQuestion } from '@/lib/types'
import ArticleReader from './ArticleReader'

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

  // Highlight GRE vocab words in excerpt
  let highlightedExcerpt = article.excerpt
  article.gre_vocab.forEach(v => {
    const regex = new RegExp(`\\b(${v.word})\\b`, 'gi')
    highlightedExcerpt = highlightedExcerpt.replace(
      regex,
      `<mark class="bg-amber-100 text-amber-900 px-0.5 rounded cursor-help" title="${v.definition}">$1</mark>`
    )
  })

  return (
    <main className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="font-serif font-bold text-gray-900 text-lg tracking-tight">Greheads</a>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{article.topic}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{difficultyLabel(article.difficulty)}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{article.reading_time} min read</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Title + source */}
        <div className="mb-8">
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
            <div
              className="bg-white border border-gray-100 rounded-xl p-8 text-gray-800 text-base leading-8 font-serif shadow-sm"
              dangerouslySetInnerHTML={{ __html: highlightedExcerpt.replace(/\n/g, '<br><br>') }}
            />
          </div>

          {/* Right: Vocab + Questions (sticky) */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="lg:sticky lg:top-8 space-y-8">

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

            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
