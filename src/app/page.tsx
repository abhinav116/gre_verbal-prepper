'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function HomeContent() {
  const searchParams = useSearchParams()
  const confirmed = searchParams.get('confirmed')
  const error = searchParams.get('error')

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

    setStatus(res.ok ? 'success' : 'error')
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">
          GRE Verbal Prepper
        </p>

        <h1 className="text-4xl font-serif font-bold text-gray-900 leading-tight mb-4">
          Read like the GRE expects you to.
        </h1>

        <p className="text-gray-600 text-lg leading-relaxed mb-2">
          One article per day, curated from sources the ETS recommends — The Economist,
          Scientific American, The Atlantic, and more.
        </p>

        <p className="text-gray-500 text-base leading-relaxed mb-8">
          Each article comes with GRE vocabulary in context and two
          comprehension questions. Free, forever.
        </p>

        {confirmed && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded mb-6">
            You&apos;re confirmed. Your first article arrives tomorrow at 8 AM.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded mb-6">
            Something went wrong. Try again or contact us.
          </div>
        )}

        {status === 'success' ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 text-sm px-4 py-3 rounded">
            Check your inbox for a confirmation email.
          </div>
        ) : (
          <form onSubmit={subscribe} className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 border border-gray-300 rounded px-4 py-3 text-sm focus:outline-none focus:border-gray-800 bg-white"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-gray-900 text-white px-5 py-3 rounded text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}

        <p className="text-gray-400 text-xs mt-4">
          No spam. One email per day. Unsubscribe anytime.
        </p>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
