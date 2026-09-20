'use client'

import { useState, useEffect } from 'react'

interface ArticleData {
  id: string
  title: string
  topic: string
  difficulty: number
  source: string
  excerpt: string
  reading_time: number
}

const TOPIC_GRADIENT: Record<string, string> = {
  'Science':        'from-blue-500 to-cyan-400',
  'Humanities':     'from-amber-500 to-orange-400',
  'Social Science': 'from-violet-500 to-purple-400',
  'Business':       'from-emerald-500 to-teal-400',
}

function difficultyLabel(n: number) {
  return ['', 'Introductory', 'Easy', 'Moderate', 'Hard', 'Advanced'][n] || 'Moderate'
}

export default function TodaysTeaser({ article }: { article: ArticleData }) {
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    setSubscribed(localStorage.getItem('greheads_sub') === '1')
  }, [])

  const gradient = TOPIC_GRADIENT[article.topic] ?? TOPIC_GRADIENT['Science']

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-2xl mx-auto">
      {/* Coloured top accent */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-6 sm:p-8">
        {/* Meta */}
        <div className="flex gap-2 flex-wrap items-center mb-4">
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{article.topic}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{difficultyLabel(article.difficulty)}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{article.reading_time} min read</span>
          <span className="text-xs text-gray-400 ml-auto">{article.source}</span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 mb-5">{article.title}</h3>

        {/* Excerpt — blurred until subscribed */}
        <div className="relative">
          <p className={`text-gray-600 text-sm leading-relaxed ${!subscribed ? 'select-none pointer-events-none blur-sm' : ''}`}>
            {article.excerpt.slice(0, 480)}…
          </p>

          {!subscribed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-5 text-center shadow-lg border border-gray-100 max-w-xs w-full">
                <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white font-serif font-bold text-sm mx-auto mb-3">G</div>
                <p className="text-sm font-semibold text-gray-900 mb-1">This article is for subscribers</p>
                <p className="text-xs text-gray-500 mb-4">Free. One article every morning.</p>
                <a
                  href="#subscribe"
                  className="inline-flex items-center gap-1 bg-gradient-to-b from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  Subscribe free →
                </a>
              </div>
            </div>
          )}
        </div>

        {subscribed && (
          <a
            href={`/articles/${article.id}`}
            className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Read full article →
          </a>
        )}
      </div>
    </div>
  )
}
