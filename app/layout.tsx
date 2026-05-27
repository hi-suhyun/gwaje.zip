import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '과제.zip | 대학생 과제 공유 플랫폼',
  description: '선배들의 A+ 노하우를 참고하고, 내 과제를 공유해 포인트를 모으세요.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
