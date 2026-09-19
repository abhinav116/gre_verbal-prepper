'use client'

import { useEffect, useState } from 'react'
import { Topic } from '@/lib/types'

interface ArticleCard {
  id: string
  title: string
  source: string
  topic: Topic
  difficulty: number
  reading_time: number
  created_at: string
}

const TOPICS: Topic[] = ['Science', 'Humanities', 'Social Science', 'Business']
const DIFFICULTIES = [
  { value: 0, label: 'All' },
  { value: 1, label: 'Introductory' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Hard' },
  { value: 5, label: 'Advanced' },
]

function difficultyLabel(n: number): string {
  return ['', 'Introductory', 'Easy', 'Moderate', 'Hard', 'Advanced'][n] || 'Moderate'
}

function difficultyColor(n: number): string {
  return ['', 'text-green-700 bg-green-50', 'text-green-700 bg-green-50', 'text-amber-700 bg-amber-50', 'text-orange-700 bg-orange-50', 'text-red-700 bg-red-50'][n] || 'text-gray-600 bg-gray-100'
}

function SubscribeWall() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      localStorage.setItem('greheads_sub', '1')
      setStatus('success')
    } else {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">You&apos;re in.</h2>
          <p className="text-gray-500 text-sm mb-6">First edition coming soon. The full archive is unlocked below.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Browse articles →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-serif font-bold text-lg">G</div>
        <h2 className="font-serif text-3xl font-bold text-gray-900 mb-3">
          The archive is for subscribers.
        </h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Subscribe free to unlock every article — one GRE-level passage, 3 vocab words, and 2 questions, every morning.
        </p>
        <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-800 bg-white"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-gradient-to-b from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {status === 'loading' ? 'Subscribing...' : 'Unlock archive →'}
          </button>
        </form>
        {status === 'error' && (
          <p className="text-red-600 text-xs mt-2">Something went wrong. Try again.</p>
        )}
        <p className="text-gray-400 text-xs mt-3">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  )
}

function ArticleGrid({ articles }: { articles: ArticleCard[] }) {
  const [topicFilter, setTopicFilter] = useState<Topic | 'All'>('All')
  const [diffFilter, setDiffFilter] = useState(0)

  const filtered = articles.filter(a => {
    if (topicFilter !== 'All' && a.topic !== topicFilter) return false
    if (diffFilter !== 0 && a.difficulty !== diffFilter) return false
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex gap-1.5 flex-wrap">
          {(['All', ...TOPICS] as const).map(t => (
            <button
              key={t}
              onClick={() => setTopicFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                topicFilter === t
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {DIFFICULTIES.map(d => (
            <button
              key={d.value}
              onClick={() => setDiffFilter(d.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                diffFilter === d.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">No articles match these filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(article => (
            <a
              key={article.id}
              href={`/articles/${article.id}`}
              className="group bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{article.topic}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(article.difficulty)}`}>
                  {difficultyLabel(article.difficulty)}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{article.reading_time} min</span>
              </div>
              <h3 className="font-serif font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-3">
                {article.title}
              </h3>
              <p className="text-xs text-gray-400">{article.source}</p>
            </a>
          ))}
        </div>
      )}

      <p className="text-gray-400 text-xs text-center mt-8">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function ArticlesClient({ articles }: { articles: ArticleCard[] }) {
  const [subscribed, setSubscribed] = useState<boolean | null>(null)

  useEffect(() => {
    setSubscribed(localStorage.getItem('greheads_sub') === '1')
  }, [])

  // Avoid flash: render nothing until we've checked localStorage
  if (subscribed === null) return null

  if (!subscribed) return <SubscribeWall />

  return <ArticleGrid articles={articles} />
}
