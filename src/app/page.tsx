'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import BottomSubscribeForm from './BottomSubscribeForm'

const AVATARS = [
  { seed: 'Felix',   bg: 'b6e3f4' },
  { seed: 'Aneka',   bg: 'ffd5dc' },
  { seed: 'Jasmine', bg: 'c0aede' },
  { seed: 'Ryan',    bg: 'd1d4f9' },
  { seed: 'Sara',    bg: 'ffdfbf' },
  { seed: 'Marcus',  bg: 'c1f4c5' },
]

function VocabWord({ word, definition, defaultOpen = false }: {
  word: string
  definition: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(false)
  // Only pre-open on desktop (pointer: fine = mouse device)
  useState(() => {
    if (defaultOpen && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      setOpen(true)
    }
  })
  return (
    <span
      className="relative inline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(o => !o)}
    >
      <mark className="bg-amber-100 text-amber-900 px-0.5 rounded cursor-help border-b border-dashed border-amber-400">
        {word}
      </mark>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 z-20 shadow-xl pointer-events-none">
          <span className="font-semibold block text-amber-300 mb-0.5">{word}</span>
          {definition}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}

function renderExcerpt(text: string, vocab: { word: string; definition: string }[]) {
  // Split text into segments: normal text and matched vocab words
  const pattern = vocab.map(v => v.word).join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)

  let vocabCount = 0
  return parts.map((part, i) => {
    const match = vocab.find(v => v.word.toLowerCase() === part.toLowerCase())
    if (match) {
      // Pre-open the first vocab hit so the tooltip is visible on load
      const isFirst = vocabCount === 0
      vocabCount++
      return <VocabWord key={i} word={part} definition={match.definition} defaultOpen={isFirst} />
    }
    // Preserve newlines
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <><br /><br /></>}
      </span>
    ))
  })
}

const SOURCES = [
  { name: 'The Economist',       domain: 'economist.com' },
  { name: 'Scientific American', domain: 'scientificamerican.com' },
  { name: 'The Atlantic',        domain: 'theatlantic.com' },
  { name: 'Nature',              domain: 'nature.com' },
  { name: 'Foreign Affairs',     domain: 'foreignaffairs.com' },
  { name: 'Smithsonian',         domain: 'smithsonianmag.com' },
  { name: 'Aeon',                domain: 'aeon.co' },
]

const STEPS = [
  {
    number: '01',
    title: 'We curate',
    body: 'Every morning we pull from 7 ETS-recommended sources, score each article for GRE register, vocabulary density, and argument structure — and pick the single best one.',
  },
  {
    number: '02',
    title: 'You read',
    body: 'A 400-word excerpt lands in your inbox at 8 AM. GRE vocabulary is highlighted in context. The full article is always one click away.',
  },
  {
    number: '03',
    title: 'You practice',
    body: 'Two MCQ questions per article, same types as the real GRE: inference, main idea, author\'s tone. Instant feedback on the web reader.',
  },
]

const USPS = [
  {
    icon: (
      <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12Zm1-7H7V5a1 1 0 1 0-2 0v3a1 1 0 0 0 1 1h3a1 1 0 1 0 0-2Z" />
      </svg>
    ),
    title: 'Context beats flashcards',
    body: 'Seeing "obfuscate" in a real Economist sentence about Fed policy sticks far better than an Anki card. Every word is shown in the sentence it appeared in.',
  },
  {
    icon: (
      <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16">
        <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm2-4a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4Zm1 10a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H5Z" />
      </svg>
    ),
    title: 'All four GRE passage types',
    body: 'The GRE draws from Science, Humanities, Social Science, and Business. We rotate daily so you\'re never over-indexed on one domain come test day.',
  },
  {
    icon: (
      <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16">
        <path d="M14.29 2.614a1 1 0 0 0-1.58-1.228L6.407 9.492l-3.199-3.2a1 1 0 1 0-1.414 1.415l4 4a1 1 0 0 0 1.496-.093l7-9ZM1 14a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H1Z" />
      </svg>
    ),
    title: 'GRE-style question types',
    body: 'Not generic comprehension quizzes. Our questions test inference, main idea, author\'s purpose, and tone — the exact categories ETS uses.',
  },
  {
    icon: (
      <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16">
        <path d="M10.284.33a1 1 0 1 0-.574 1.917 6.049 6.049 0 0 1 2.417 1.395A1 1 0 0 0 13.5 2.188 8.034 8.034 0 0 0 10.284.33ZM6.288 2.248A1 1 0 0 0 5.718.33 8.036 8.036 0 0 0 2.5 2.187a1 1 0 0 0 1.372 1.455 6.036 6.036 0 0 1 2.415-1.395ZM1.42 5.401a1 1 0 0 1 .742 1.204 6.025 6.025 0 0 0 0 2.79 1 1 0 0 1-1.946.462 8.026 8.026 0 0 1 0-3.714A1 1 0 0 1 1.421 5.4Zm13.16 0A1 1 0 1 1 16.526 5.863a6.025 6.025 0 0 1 0 2.79 1 1 0 1 1-1.946-.463 6.026 6.026 0 0 0 0-2.79Z" />
      </svg>
    ),
    title: 'ETS-sourced, not random internet',
    body: 'ETS publishes a recommended reading list. We only pull from those sources — every article already meets the standard ETS uses to build the test itself.',
  },
  {
    icon: (
      <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16">
        <path d="M8 0a1 1 0 0 1 1 1v14a1 1 0 1 1-2 0V1a1 1 0 0 1 1-1Zm6 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 1 1 0 2h-1a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3h1a1 1 0 1 1 0 2h-1ZM1 1a1 1 0 0 0 0 2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 1 0 0 2h1a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3H1Z" />
      </svg>
    ),
    title: 'Difficulty-rated every day',
    body: 'Each article is scored 1–5 for complexity. You always know what you\'re getting into — great for calibrating as your test date approaches.',
  },
  {
    icon: (
      <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16">
        <path d="M9 1a1 1 0 1 0-2 0v6a1 1 0 0 0 2 0V1ZM4.572 3.08a1 1 0 0 0-1.144-1.64A7.987 7.987 0 0 0 0 8a8 8 0 0 0 16 0c0-2.72-1.36-5.117-3.428-6.56a1 1 0 1 0-1.144 1.64A5.987 5.987 0 0 1 14 8 6 6 0 1 1 2 8a5.987 5.987 0 0 1 2.572-4.92Z" />
      </svg>
    ),
    title: '5 minutes a day, compounding',
    body: '365 articles a year is the most underrated GRE verbal strategy. The habit is easy to start — one email, one excerpt, two questions.',
  },
]

const SAMPLE = {
  source: 'Scientific American',
  topic: 'Science',
  difficulty: 4,
  title: 'The Paradox of Antibiotic Resistance',
  excerpt: `The proliferation of antibiotic-resistant bacteria represents one of the most formidable challenges confronting modern medicine. Unlike conventional threats, resistance evolves through a process that the very act of treatment inadvertently accelerates — each antibiotic application exerts selective pressure that favors the survival of resistant strains. This self-defeating dynamic, which epidemiologists term "evolutionary malpractice," has prompted a fundamental reconsideration of how antimicrobial agents should be deployed.

Some researchers advocate for "antibiotic stewardship," a framework predicated on the judicious rationing of existing drugs to forestall the emergence of pan-resistant organisms. Critics contend, however, that stewardship alone is insufficient without concomitant investment in novel drug discovery — a field that pharmaceutical companies have largely abandoned owing to unfavorable economic incentives.`,
  vocab: [
    { word: 'proliferation', definition: 'rapid increase in numbers' },
    { word: 'concomitant', definition: 'naturally accompanying or associated' },
    { word: 'forestall', definition: 'prevent by taking action in advance' },
  ],
  questions: [
    {
      question: 'The author\'s primary purpose in this passage is to',
      options: [
        'A. argue that antibiotic stewardship is the only viable solution',
        'B. describe a self-reinforcing problem and present competing solutions',
        'C. criticize pharmaceutical companies for abandoning research',
        'D. explain how bacteria develop resistance through natural selection',
      ],
      answer: 'B',
    },
    {
      question: '"Evolutionary malpractice" most nearly suggests that',
      options: [
        'A. doctors frequently misdiagnose bacterial infections',
        'B. the use of antibiotics is ethically indefensible',
        'C. treatment itself contributes to the problem it is meant to solve',
        'D. evolution operates according to predictable medical principles',
      ],
      answer: 'C',
    },
  ],
}

function SamplePreview() {
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  function choose(qi: number, opt: string) {
    if (revealed[qi]) return
    setSelected(p => ({ ...p, [qi]: opt }))
  }

  function check(qi: number) {
    if (!selected[qi]) return
    setRevealed(p => ({ ...p, [qi]: true }))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3 flex-wrap rounded-t-2xl">
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">{SAMPLE.topic}</span>
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {'●'.repeat(SAMPLE.difficulty)}{'○'.repeat(5 - SAMPLE.difficulty)} Difficulty
        </span>
        <span className="text-xs text-gray-400 ml-auto">{SAMPLE.source}</span>
      </div>
      <div className="px-6 py-6">
        <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">{SAMPLE.title}</h3>
        {/* Tooltip hint */}
        <p className="text-xs text-gray-400 mb-3 italic">Hover the highlighted words to see definitions</p>
        <p className="text-gray-700 text-sm leading-8 font-serif mb-6 overflow-visible">
          {renderExcerpt(SAMPLE.excerpt, SAMPLE.vocab)}
        </p>
        <div className="mb-6">
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">GRE Vocabulary — hover for definitions</p>
          <div className="grid gap-2">
            {SAMPLE.vocab.map((v, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="font-semibold text-gray-900 w-36 shrink-0">{v.word}</span>
                <span className="text-gray-500">{v.definition}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Comprehension Questions</p>
          <div className="space-y-5">
            {SAMPLE.questions.map((q, qi) => {
              const isRevealed = revealed[qi]
              const userAnswer = selected[qi]
              return (
                <div key={qi}>
                  <p className="text-sm font-medium text-gray-900 mb-2">{qi + 1}. {q.question}</p>
                  <div className="space-y-1.5 mb-2">
                    {q.options.map((opt) => {
                      const label = opt[0]
                      const isSelected = userAnswer === label
                      const isCorrect = label === q.answer
                      let cls = 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      if (isRevealed) {
                        if (isCorrect) cls = 'border-green-400 bg-green-50 text-green-900'
                        else if (isSelected) cls = 'border-red-300 bg-red-50 text-red-800'
                        else cls = 'border-gray-100 bg-gray-50 text-gray-400'
                      } else if (isSelected) {
                        cls = 'border-gray-900 bg-gray-900 text-white'
                      }
                      return (
                        <button key={opt} onClick={() => choose(qi, label)}
                          className={`w-full text-left text-xs px-3 py-2 rounded border transition-colors ${cls}`}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {!isRevealed ? (
                    <button onClick={() => check(qi)} disabled={!userAnswer}
                      className="text-xs underline text-gray-500 disabled:text-gray-300 disabled:no-underline">
                      Check answer
                    </button>
                  ) : (
                    <p className={`text-xs font-medium ${userAnswer === q.answer ? 'text-green-700' : 'text-red-700'}`}>
                      {userAnswer === q.answer ? 'Correct.' : `Incorrect. The answer is ${q.answer}.`}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SubscribeForm() {
  const searchParams = useSearchParams()
  const confirmed = searchParams.get('confirmed')
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

  if (confirmed) return (
    <p className="text-green-700 text-sm font-medium">You&apos;re confirmed. First article arrives tomorrow at 8 AM.</p>
  )
  if (status === 'success') return (
    <p className="text-gray-700 text-sm">Check your inbox to confirm your subscription.</p>
  )

  return (
    <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
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
        className="group relative inline-flex items-center justify-center gap-1 bg-gradient-to-b from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
      >
        Start reading free
        <span className="tracking-normal text-blue-200 transition-transform group-hover:translate-x-0.5">→</span>
      </button>
    </form>
  )
}

export default function Home() {
  return (
    <Suspense>
      <div className="min-h-screen">

        {/* Nav */}
        <nav className="border-b border-gray-100 bg-[#faf9f6]/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <span className="font-serif text-xl font-bold tracking-tight text-gray-900">Greheads</span>
            <a href="#subscribe"
              className="group relative inline-flex items-center gap-1 bg-gradient-to-b from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm">
              Subscribe free
              <span className="tracking-normal text-blue-200 transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-10 text-center">

          {/* Social proof avatars */}
          <div className="mb-6 border-y [border-image:linear-gradient(to_right,transparent,rgb(203_213_225_/_0.8),transparent)_1]">
            <div className="py-3 flex flex-col sm:flex-row items-center justify-center gap-2">
              <div className="-space-x-2 flex">
                {AVATARS.map(({ seed, bg }) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={seed}
                    src={`https://api.dicebear.com/9.x/personas/svg?seed=${seed}&backgroundColor=${bg}`}
                    alt={seed}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full border-2 border-[#faf9f6] bg-gray-100"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Join <span className="font-semibold text-gray-900">readers</span> building their GRE verbal score daily
              </p>
            </div>
          </div>

          {/* Headline with gradient borders */}
          <h1 className="mb-5 border-y text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight
            [border-image:linear-gradient(to_right,transparent,rgb(203_213_225_/_0.8),transparent)_1] py-4 max-w-3xl mx-auto">
            Read like the GRE expects you to.
          </h1>

          <p className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
            One article per day from ETS-recommended sources. GRE vocabulary in context.
            Comprehension questions built in. Free, forever.
          </p>

          <div id="subscribe" className="flex justify-center mb-3">
            <SubscribeForm />
          </div>
          <p className="text-gray-400 text-xs">No spam. Unsubscribe anytime.</p>
        </section>

        {/* Source bar */}
        <section className="border-y border-gray-100 bg-white py-5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs tracking-widest uppercase text-gray-400 mb-4">Articles sourced from</p>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-x-8 gap-y-3">
              {SOURCES.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=32`}
                    alt={s.name}
                    width={18}
                    height={18}
                    className="rounded-sm grayscale opacity-60"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="text-sm font-medium text-gray-500">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">How it works</p>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900">
              Three steps. Five minutes a day.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map(step => (
              <div key={step.number} className="flex sm:block gap-4 items-start">
                <p className="font-serif text-3xl sm:text-5xl font-bold text-gray-100 sm:mb-3 leading-none shrink-0">{step.number}</p>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sample preview */}
        <section className="bg-white border-y border-gray-100 py-10 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">Live preview</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                This is what lands in your inbox.
              </h2>
              <p className="text-gray-500 text-sm">
                Tap the highlighted words for definitions. Try the questions below.
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <SamplePreview />
            </div>
          </div>
        </section>

        {/* USPs — dark section like Cruip features grid */}
        <section className="relative bg-gray-900 py-10 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-xs tracking-widest uppercase text-blue-400 mb-2">Why Greheads</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-100">
                Built specifically for the GRE Verbal section.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-800 border border-gray-800 rounded-xl overflow-hidden">
              {USPS.map(usp => (
                <div key={usp.title} className="bg-gray-900 p-6 md:p-8">
                  <div className="mb-3">{usp.icon}</div>
                  <h3 className="font-semibold text-gray-200 mb-2">{usp.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{usp.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-10 sm:py-16 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Build the habit before test day.
            </h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Start tomorrow morning. One article. Three vocab words. Two questions.
            </p>
            <BottomSubscribeForm />
            <p className="text-gray-400 text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 py-6 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <span className="font-serif font-bold text-gray-900">Greheads</span>
            <p className="text-gray-400 text-xs">Daily GRE reading practice. Free, forever.</p>
          </div>
        </footer>

      </div>
    </Suspense>
  )
}
