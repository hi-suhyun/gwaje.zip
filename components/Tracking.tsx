'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function getCookie(name: string): string | undefined {
  const value = '; ' + document.cookie
  const parts = value.split('; ' + name + '=')
  if (parts.length === 2) return parts.pop()?.split(';').shift()
}

function setCookie(name: string, value: string, days: number) {
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`
}

function getUV(): string {
  const existing = getCookie('uv')
  if (existing) return existing
  const hash = Math.random().toString(36).substring(2, 8).toUpperCase()
  setCookie('uv', hash, 180)
  return hash
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function timestamp() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function TrackingInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_GAS_ENDPOINT
    if (!endpoint) return

    const utm = searchParams.get('utm')
    const device = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      ? 'mobile'
      : 'desktop'

    async function track() {
      let ip = 'unknown'
      try {
        const res = await fetch('/api/ip')
        const json = await res.json()
        ip = json.ip
      } catch {}

      const data = JSON.stringify({
        id: getUV(),
        landingUrl: window.location.href,
        ip,
        referer: document.referrer,
        time_stamp: timestamp(),
        utm: utm ?? '',
        device,
      })

      fetch(`${endpoint}?action=insert&table=visitors&data=${encodeURIComponent(data)}`, {
        mode: 'no-cors',
      }).catch(() => {})
    }

    track()
  }, [pathname, searchParams])

  return null
}

// useSearchParams는 Suspense boundary 안에서만 사용 가능
export default function Tracking() {
  return (
    <Suspense fallback={null}>
      <TrackingInner />
    </Suspense>
  )
}
