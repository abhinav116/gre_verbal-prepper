'use client'

import { useState } from 'react'
import { GREVocab } from '@/lib/types'

interface Props {
  excerpt: string
  gre_vocab: GREVocab[]
}

export default function PassageWithTooltips({ excerpt, gre_vocab }: Props) {
  const [activeWord, setActiveWord] = useState<string | null>(null)

  const wordMap = new Map(gre_vocab.map(v => [v.word.toLowerCase(), v]))
  const escaped = gre_vocab.map(v => v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = escaped.length > 0 ? new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi') : null

  const paragraphs = excerpt.split(/\n\n+/).filter(Boolean)

  function renderParagraph(text: string, pIdx: number) {
    if (!pattern) return <p key={pIdx} className="mb-5 last:mb-0">{text}</p>

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    pattern.lastIndex = 0
    let match

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      const word = match[0]
      const key = word.toLowerCase()
      const vocab = wordMap.get(key)
      const isActive = activeWord === key

      parts.push(
        <span key={`${pIdx}-${match.index}`} className="relative inline">
          <mark
            className="bg-amber-100 text-amber-900 px-0.5 rounded cursor-help no-underline"
            onMouseEnter={() => setActiveWord(key)}
            onMouseLeave={() => setActiveWord(null)}
          >
            {word}
          </mark>
          {isActive && vocab && (
            <span className="absolute bottom-full left-0 mb-2 z-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 w-60 shadow-xl pointer-events-none">
              <span className="font-semibold block mb-1">{vocab.word}</span>
              <span className="text-gray-300 leading-relaxed">{vocab.definition}</span>
              <span className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
            </span>
          )}
        </span>
      )
      lastIndex = match.index + word.length
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return <p key={pIdx} className="mb-5 last:mb-0">{parts}</p>
  }

  return (
    <div className="text-gray-800 text-base leading-8 font-serif">
      {paragraphs.map((p, i) => renderParagraph(p, i))}
    </div>
  )
}
