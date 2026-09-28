export type Topic = 'Science' | 'Humanities' | 'Social Science' | 'Business'

export interface GREVocab {
  word: string
  definition: string
  sentence: string
}

export interface MCQQuestion {
  question: string
  options: [string, string, string, string] // A, B, C, D
  answer: 'A' | 'B' | 'C' | 'D'
}

export interface Article {
  id: string
  title: string
  source: string
  url: string
  excerpt: string
  topic: Topic
  difficulty: number
  reading_time: number
  gre_vocab: GREVocab[]
  questions: MCQQuestion[]
  score: number
  published_at: string | null
  sent_at: string | null
  sent: boolean
  created_at: string
}

export interface VocabWord {
  id: string
  word: string
  part_of_speech: string
  definition: string
  phonetic_hook: string | null
  is_negative: boolean
  reference_type: 'celebrity' | 'fictional'
  reference_name: string
  reference_context: string
  example_sentence: string
  difficulty: number
  image_url: string | null
  created_at: string
}

export interface Subscriber {
  id: string
  email: string
  confirmation_token: string
  active: boolean
  subscribed_at: string | null
  created_at: string
}
