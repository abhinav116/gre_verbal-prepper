import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=invalid`)
  }

  const { error } = await supabaseAdmin
    .from('subscribers')
    .update({ active: true, subscribed_at: new Date().toISOString() })
    .eq('confirmation_token', token)
    .eq('active', false)

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=invalid`)
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?confirmed=true`)
}
