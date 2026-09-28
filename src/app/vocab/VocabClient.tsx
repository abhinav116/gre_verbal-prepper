'use client'

import { useState, useEffect } from 'react'
import { VocabWord } from '@/lib/types'

type WordStatus = 'new' | 'learning' | 'known'
type Progress = Record<string, WordStatus>

const DIFFICULTY_LABEL: Record<number, string> = { 1: 'Common', 2: 'Medium', 3: 'Hard' }
const DIFFICULTY_COLOR: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-red-100 text-red-700',
}

function loadProgress(): Progress {
  try { return JSON.parse(localStorage.getItem('greheads_vocab_progress') || '{}') }
  catch { return {} }
}

function saveProgress(p: Progress) {
  localStorage.setItem('greheads_vocab_progress', JSON.stringify(p))
}

export default function VocabClient({ words }: { words: VocabWord[] }) {
  const [progress, setProgress] = useState<Progress>({})
  const [deckFilter, setDeckFilter] = useState<number | 'all'>('all')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setProgress(loadProgress())
    setLoaded(true)
  }, [])

  const deck = words.filter(w => {
    if (deckFilter !== 'all' && w.difficulty !== deckFilter) return false
    return progress[w.id] !== 'known'
  })

  // If everything is known, show the full filtered deck
  const activeDeck = deck.length > 0 ? deck : words.filter(w => deckFilter === 'all' || w.difficulty === deckFilter)
  const current = activeDeck[index % Math.max(activeDeck.length, 1)]
  const knownCount = words.filter(w => progress[w.id] === 'known').length
  const totalInDeck = words.filter(w => deckFilter === 'all' || w.difficulty === deckFilter).length

  function advance() {
    setFlipped(false)
    setTimeout(() => setIndex(i => (i + 1) % Math.max(activeDeck.length, 1)), 180)
  }

  function markKnown() {
    if (!current) return
    const updated = { ...progress, [current.id]: 'known' as WordStatus }
    setProgress(updated)
    saveProgress(updated)
    advance()
  }

  function markLearning() {
    if (!current) return
    const updated = { ...progress, [current.id]: 'learning' as WordStatus }
    setProgress(updated)
    saveProgress(updated)
    advance()
  }

  function changeFilter(f: number | 'all') {
    setDeckFilter(f)
    setIndex(0)
    setFlipped(false)
  }

  if (!loaded || !current) return null

  return (
    <div>
      {/* Deck tabs */}
      <div className="flex gap-2 mb-6 justify-center">
        {(['all', 1, 2, 3] as const).map(d => (
          <button
            key={d}
            onClick={() => changeFilter(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              deckFilter === d ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d === 'all' ? 'All' : DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{knownCount} known</span>
          <span>{totalInDeck} in deck</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${totalInDeck > 0 ? (knownCount / totalInDeck) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Flip card */}
      <div
        className="cursor-pointer select-none"
        style={{ perspective: '1200px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position: 'relative',
            minHeight: '400px',
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-8 text-center"
          >
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full mb-6 ${DIFFICULTY_COLOR[current.difficulty]}`}>
              {DIFFICULTY_LABEL[current.difficulty]}
            </span>
            <h2 className="font-serif text-5xl font-bold text-gray-900 mb-3">{current.word}</h2>
            <span className="text-gray-400 text-sm">{current.part_of_speech}</span>
            {current.phonetic_hook && (
              <div className="mt-7 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3.5 max-w-xs">
                <p className="text-sm text-amber-800 italic leading-relaxed">&ldquo;{current.phonetic_hook}&rdquo;</p>
              </div>
            )}
            <p className="mt-8 text-xs text-gray-300 tracking-wide">TAP TO REVEAL</p>
          </div>

          {/* Back */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col p-7"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-900">{current.word}</h2>
                <span className="text-gray-400 text-xs">{current.part_of_speech}</span>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${DIFFICULTY_COLOR[current.difficulty]}`}>
                {DIFFICULTY_LABEL[current.difficulty]}
              </span>
            </div>

            <p className="text-gray-900 text-base font-semibold leading-relaxed mb-5">{current.definition}</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span>{current.reference_type === 'fictional' ? '🎬' : '⭐'}</span>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{current.reference_name}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{current.reference_context}</p>
            </div>

            <p className="text-sm text-gray-500 italic leading-relaxed border-l-2 border-gray-200 pl-3">
              &ldquo;{current.example_sentence}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="flex gap-3 mt-5"
        style={{ opacity: flipped ? 1 : 0, pointerEvents: flipped ? 'auto' : 'none', transition: 'opacity 0.2s' }}
      >
        <button
          onClick={e => { e.stopPropagation(); markLearning() }}
          className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ↺ Study again
        </button>
        <button
          onClick={e => { e.stopPropagation(); markKnown() }}
          className="flex-1 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          ✓ Know it
        </button>
      </div>

      {/* Subscribe nudge */}
      <p className="text-center text-xs text-gray-400 mt-6">
        Get a new word every morning.{' '}
        <a href="/#subscribe" className="text-blue-500 hover:underline">Subscribe free →</a>
      </p>
    </div>
  )
}
