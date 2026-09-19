'use client'

import { useState, useEffect } from 'react'

export default function BottomSubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    setSubscribed(localStorage.getItem('greheads_sub') === '1')
  }, [])

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

  if (subscribed || status === 'success') {
    return (
      <div className="text-center">
        <p className="text-gray-900 text-sm font-medium">You&apos;re subscribed.</p>
        <p className="text-gray-500 text-sm mt-0.5 mb-4">Check your inbox every morning.</p>
        <a
          href="/articles"
          className="inline-flex items-center gap-1 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Browse the archive →
        </a>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2 justify-center">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="flex-1 max-w-xs border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-800"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {status === 'loading' ? 'Subscribing...' : 'Start reading free'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-600 text-xs mt-2 text-center">Something went wrong. Try again or email us directly.</p>
      )}
    </div>
  )
}
