import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
  })
  const data = await res.json()
  return NextResponse.json(data)
}
