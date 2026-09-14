import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // Upsert subscriber (handles re-subscribes)
  const { data, error } = await supabaseAdmin
    .from('subscribers')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: false })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }

  const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/confirm?token=${data.confirmation_token}`

  await resend.emails.send({
    from: 'GRE Verbal Prepper <hello@yourverifieddomain.com>',
    to: email,
    subject: 'Confirm your subscription',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="font-size: 22px; margin-bottom: 16px;">One click to confirm</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          You signed up for GRE Verbal Prepper — a daily article curated from sources like
          The Economist, Scientific American, and The Atlantic, with GRE vocabulary and
          comprehension questions built in.
        </p>
        <a href="${confirmUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 15px; border-radius: 4px;">
          Confirm subscription
        </a>
        <p style="margin-top: 32px; font-size: 13px; color: #888;">
          If you didn't sign up, ignore this email.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ success: true })
}
