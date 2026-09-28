import { NextResponse } from 'next/server'

const SEED_WORDS = [
  'truculent', 'loquacious', 'ebullient', 'ostentatious', 'pedantic',
  'equivocate', 'magnanimous', 'sycophant', 'garrulous', 'mendacious',
  'obsequious', 'duplicitous', 'vitriolic', 'perfidious', 'laconic',
  'pugnacious', 'sanguine', 'sagacious', 'recalcitrant', 'voluble',
]

export async function GET(req: Request) {
  const base = new URL(req.url).origin
  const results: Array<{ word: string; status: string }> = []

  for (const word of SEED_WORDS) {
    try {
      const res = await fetch(`${base}/api/generate-vocab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      })
      const data = await res.json()
      results.push({ word, status: data.success ? 'created' : (data.message || data.error || 'unknown') })
    } catch (err) {
      results.push({ word, status: `failed: ${String(err)}` })
    }
  }

  return NextResponse.json({ done: true, results })
}
