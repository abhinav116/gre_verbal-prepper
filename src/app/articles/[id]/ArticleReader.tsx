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
  const [copied, setCopied] = useState(false)

  const totalAnswered = Object.keys(revealed).length
  const allDone = totalAnswered === questions.length
  const correctCount = questions.filter((q, i) => revealed[i] && selected[i] === q.answer).length

  function choose(qIdx: number, option: string) {
    if (revealed[qIdx]) return
    setSelected(prev => ({ ...prev, [qIdx]: option }))
  }

  function check(qIdx: number) {
    if (!selected[qIdx]) return
    setRevealed(prev => ({ ...prev, [qIdx]: true }))
  }

  async function share() {
    const text = `I scored ${correctCount}/${questions.length} on today's GRE reading passage on Greheads. Try it: ${window.location.href}`
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {questions.map((q, qIdx) => {
        const isRevealed = revealed[qIdx]
        const userAnswer = selected[qIdx]
        const correct = q.answer

        return (
          <div key={qIdx}>
            {/* Progress indicator */}
            <p className="text-xs text-gray-400 mb-2">Question {qIdx + 1} of {questions.length}</p>

            <p className="font-medium text-gray-900 text-sm mb-3 leading-relaxed">
              {q.question}
            </p>

            <div className="space-y-2 mb-3">
              {OPTIONS.map((opt, i) => {
                const text = q.options[i]
                const isSelected = userAnswer === opt
                const isCorrect = opt === correct

                let style = 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer'
                if (isRevealed) {
                  if (isCorrect) style = 'bg-green-50 border-green-400 text-green-900 cursor-default'
                  else if (isSelected) style = 'bg-red-50 border-red-300 text-red-800 cursor-default'
                  else style = 'bg-gray-50 border-gray-200 text-gray-400 cursor-default'
                } else if (isSelected) {
                  style = 'bg-gray-900 border-gray-900 text-white cursor-pointer'
                }

                return (
                  <button
                    key={opt}
                    onClick={() => choose(qIdx, opt)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${style}`}
                  >
                    <span className="font-semibold mr-2">{opt}.</span>
                    {text}
                  </button>
                )
              })}
            </div>

            {!isRevealed ? (
              <button
                onClick={() => check(qIdx)}
                disabled={!userAnswer}
                className="text-xs text-gray-900 underline disabled:text-gray-300 disabled:no-underline"
              >
                Check answer
              </button>
            ) : (
              <p className={`text-xs font-medium ${userAnswer === correct ? 'text-green-700' : 'text-red-700'}`}>
                {userAnswer === correct ? 'Correct.' : `Incorrect. The answer is ${correct}.`}
              </p>
            )}
          </div>
        )
      })}

      {/* Score summary + completion state */}
      {allDone && (
        <div className="border-t border-gray-100 pt-5 mt-2">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            You scored {correctCount}/{questions.length}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {correctCount === questions.length
              ? 'Perfect. Come back tomorrow for the next passage.'
              : correctCount === 0
              ? 'Tough one. Re-read the passage and try again tomorrow.'
              : 'Good effort. Review the highlighted vocab and revisit.'}
          </p>

          <button
            onClick={share}
            className="w-full py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? 'Link copied!' : `Share my score (${correctCount}/${questions.length})`}
          </button>
        </div>
      )}
    </div>
  )
}
