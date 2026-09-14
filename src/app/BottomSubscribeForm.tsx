'use client'

import { useState } from 'react'

export default function BottomSubscribeForm() {
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

  if (status === 'success') {
    return <p className="text-white text-sm">Check your inbox for a confirmation email.</p>
  }

  return (
    <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2 justify-center">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="flex-1 max-w-xs border border-gray-700 rounded-lg px-4 py-3 text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-white text-gray-900 px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {status === 'loading' ? 'Subscribing...' : 'Start reading free'}
      </button>
    </form>
  )
}
