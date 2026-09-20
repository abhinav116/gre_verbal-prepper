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
  og_image?: string | null
}

const TOPICS: Topic[] = ['Science', 'Humanities', 'Social Science', 'Business']

const TOPIC_STYLE: Record<Topic, { gradient: string; icon: string; label: string }> = {
  'Science':        { gradient: 'from-blue-500 to-cyan-400',    icon: '🔬', label: 'text-blue-100' },
  'Humanities':     { gradient: 'from-amber-500 to-orange-400', icon: '📖', label: 'text-amber-100' },
  'Social Science': { gradient: 'from-violet-500 to-purple-400',icon: '🌐', label: 'text-violet-100' },
  'Business':       { gradient: 'from-emerald-500 to-teal-400', icon: '📊', label: 'text-emerald-100' },
}

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
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-medium whitespace-nowrap">Topic</label>
          <select
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value as Topic | 'All')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="All">All topics</option>
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-medium whitespace-nowrap">Difficulty</label>
          <select
            value={diffFilter}
            onChange={e => setDiffFilter(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">No articles match these filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(article => {
            const style = TOPIC_STYLE[article.topic] ?? TOPIC_STYLE['Science']
            return (
              <a
                key={article.id}
                href={`/articles/${article.id}`}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
              >
                {/* Thumbnail */}
                {article.og_image ? (
                  <div className="relative h-40 overflow-hidden bg-gray-100">
                    <img
                      src={article.og_image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between">
                      <span className="text-xs font-semibold tracking-widest uppercase text-white/90">{article.topic}</span>
                    </div>
                  </div>
                ) : (
                  <div className={`relative h-20 bg-gradient-to-br ${style.gradient} flex items-center justify-between px-5`}>
                    <span className="text-2xl">{style.icon}</span>
                    <span className={`text-xs font-semibold tracking-widest uppercase ${style.label} opacity-80`}>
                      {article.topic}
                    </span>
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-serif font-bold text-gray-900 text-base leading-snug mb-3 line-clamp-3 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor(article.difficulty)}`}>
                        {difficultyLabel(article.difficulty)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{article.source}</span>
                      <span>·</span>
                      <span>{article.reading_time} min</span>
                    </div>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}

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
