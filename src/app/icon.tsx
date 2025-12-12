import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const size = {
  width: 32,
  height: 32,
}
 
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle */}
          <circle cx="16" cy="16" r="13" fill="none" stroke="#0A7EA4" strokeWidth="2" />
          {/* Stylized 'S' path */}
          <path
            d="M22 11c0-2.2-2.4-3.6-6-3.6s-6 1.4-6 3.4c0 2.2 2.8 3 6 3.8s6 1.6 6 3.8c0 2.4-2.6 4.2-6 4.2s-6-1.6-6-3.8"
            fill="none"
            stroke="#0A7EA4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
