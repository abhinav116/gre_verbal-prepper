import { notFound } from 'next/navigation'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Article, MCQQuestion } from '@/lib/types'
import ArticleReader from './ArticleReader'

interface Props {
  params: Promise<{ id: string }>
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
      `<mark class="bg-yellow-100 text-yellow-900 px-0.5 rounded cursor-help" title="${v.definition}">$1</mark>`
    )
  })

  return (
    <main className="min-h-screen bg-[#faf9f6] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-xs tracking-widest uppercase text-gray-400 hover:text-gray-700 transition-colors mb-8 inline-block">
          GRE Verbal Prepper
        </a>

        <div className="flex gap-3 flex-wrap mb-4">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{article.topic}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {'★'.repeat(article.difficulty)}{'☆'.repeat(5 - article.difficulty)} Difficulty
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{article.reading_time} min read</span>
        </div>

        <h1 className="text-3xl font-serif font-bold text-gray-900 leading-tight mb-2">
          {article.title}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          From {article.source} &bull;{' '}
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-800">
            Read full article
          </a>
        </p>

        {/* Excerpt with vocab highlighted */}
        <div
          className="bg-white border border-gray-100 rounded-lg p-6 text-gray-800 text-base leading-8 font-serif mb-10 shadow-sm"
          dangerouslySetInnerHTML={{ __html: highlightedExcerpt.replace(/\n/g, '<br>') }}
        />

        {/* GRE Vocabulary */}
        <section className="mb-10">
          <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-4">GRE Vocabulary</h2>
          <div className="space-y-4">
            {article.gre_vocab.map((v, i) => (
              <div key={i} className="border-l-2 border-gray-200 pl-4">
                <p className="font-semibold text-gray-900 text-base">{v.word}</p>
                <p className="text-gray-600 text-sm mt-0.5">{v.definition}</p>
                <p className="text-gray-400 text-sm italic mt-1">&ldquo;{v.sentence}&rdquo;</p>
              </div>
            ))}
          </div>
        </section>

        {/* MCQ Questions - client component for interactivity */}
        <section>
          <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-4">Comprehension Questions</h2>
          <ArticleReader questions={article.questions as MCQQuestion[]} />
        </section>
      </div>
    </main>
  )
}
