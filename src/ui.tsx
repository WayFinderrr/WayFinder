import { useState } from 'react'
import { ago, shortSig } from './format'
import type { Activity } from './types'

export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="#1f4e79" />
      <path d="M14 5.2 16.5 13 14 23.2 11.5 13 14 5.2Z" fill="#f6f1e8" />
      <circle cx="14" cy="13.2" r="1.7" fill="#b8432a" />
    </svg>
  )
}

export function Photo({ src, alt }: { src: string; alt: string }) {
  const [hide, setHide] = useState(false)
  if (hide) return <div className="ph ph-empty" />
  return (
    <img
      className="ph"
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHide(true)}
    />
  )
}

export function Spark({ data }: { data: number[] }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const w = 112
  const h = 32
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * w
      const y = h - 3 - ((value - min) / (max - min || 1)) * (h - 8)
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" points={points} />
    </svg>
  )
}

export function ActivityList({ items }: { items: Activity[] }) {
  if (items.length === 0) return <p className="hint">No settlements yet.</p>
  return (
    <div className="feed">
      {items.map((item) => (
        <div key={item.id} className="feed-row">
          <div>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </div>
          <div className="feed-meta">
            <code>{shortSig(item.sig)}</code>
            <span>{ago(item.at)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
