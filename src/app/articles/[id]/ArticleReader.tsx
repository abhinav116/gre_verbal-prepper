'use client'

import { useState } from 'react'
import { MCQQuestion } from '@/lib/types'

interface Props {
  questions: MCQQuestion[]
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

export default function ArticleReader({ questions }: Props) {
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  function choose(qIdx: number, option: string) {
    if (revealed[qIdx]) return
    setSelected(prev => ({ ...prev, [qIdx]: option }))
  }

  function check(qIdx: number) {
    if (!selected[qIdx]) return
    setRevealed(prev => ({ ...prev, [qIdx]: true }))
  }

  return (
    <div className="space-y-8">
      {questions.map((q, qIdx) => {
        const isRevealed = revealed[qIdx]
        const userAnswer = selected[qIdx]
        const correct = q.answer

        return (
          <div key={qIdx} className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
            <p className="font-medium text-gray-900 text-base mb-4">
              {qIdx + 1}. {q.question}
            </p>

            <div className="space-y-2 mb-4">
              {OPTIONS.map((opt, i) => {
                const label = opt
                const text = q.options[i]
                const isSelected = userAnswer === label
                const isCorrect = label === correct

                let bg = 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                if (isRevealed) {
                  if (isCorrect) bg = 'bg-green-50 border-green-400 text-green-900'
                  else if (isSelected && !isCorrect) bg = 'bg-red-50 border-red-300 text-red-800'
                  else bg = 'bg-gray-50 border-gray-200 text-gray-400'
                } else if (isSelected) {
                  bg = 'bg-gray-900 border-gray-900 text-white'
                }

                return (
                  <button
                    key={opt}
                    onClick={() => choose(qIdx, label)}
                    className={`w-full text-left px-4 py-2.5 rounded border text-sm transition-colors ${bg}`}
                  >
                    <span className="font-medium mr-2">{label}.</span>
                    {text}
                  </button>
                )
              })}
            </div>

            {!isRevealed ? (
              <button
                onClick={() => check(qIdx)}
                disabled={!userAnswer}
                className="text-sm text-gray-900 underline disabled:text-gray-300 disabled:no-underline"
              >
                Check answer
              </button>
            ) : (
              <p className={`text-sm font-medium ${userAnswer === correct ? 'text-green-700' : 'text-red-700'}`}>
                {userAnswer === correct ? 'Correct.' : `Incorrect. The answer is ${correct}.`}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
