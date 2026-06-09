import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Tracking from '@/components/Tracking'

export const metadata: Metadata = {
  title: '과제.zip | 대학생 과제 공유 플랫폼',
  description: '선배들의 A+ 노하우를 참고하고, 내 과제를 공유해 포인트를 모으세요.',
}

const GA_ID = 'G-E821PV3GQ7'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}</Script>

        {/* Google Sheets 방문자 추적 */}
        <Tracking />

        {children}
      </body>
    </html>
  )
}
