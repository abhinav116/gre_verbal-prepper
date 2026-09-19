import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Greheads — Daily GRE Reading Practice'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Top: logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: '#fff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 700,
              color: '#1a1a1a',
            }}
          >
            G
          </div>
          <span style={{ color: '#fff', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Greheads
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: '-1px',
            }}
          >
            Read like the GRE
            <br />
            expects you to.
          </div>
          <div style={{ fontSize: '24px', color: '#888', lineHeight: 1.5 }}>
            One curated article a day — vocab in context,
            <br />
            comprehension questions built in. Free.
          </div>
        </div>

        {/* Bottom: sources tag */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {['Aeon', 'Quanta', 'The Atlantic', 'Smithsonian', 'Nautilus'].map(s => (
            <div
              key={s}
              style={{
                padding: '6px 14px',
                border: '1px solid #333',
                borderRadius: '100px',
                color: '#666',
                fontSize: '14px',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
