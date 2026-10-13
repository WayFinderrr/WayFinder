export const SOL_USD = 152
export const TODAY = '2026-10-12'

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export function fakeSig() {
  let out = ''
  for (let i = 0; i < 64; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return out
}

export function shortSig(sig: string) {
  return `${sig.slice(0, 4)}…${sig.slice(-4)}`
}

export function solR(n: number) {
  return Math.round(n * 1e6) / 1e6
}

export function money(n: number) {
  return Math.round(n * 100) / 100
}

export function solFmt(n: number) {
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })} SOL`
}

export function usdcFmt(n: number) {
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 0 })} USDC`
}

export function usd(n: number, digits = 2) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function usdWhole(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function usdCompact(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(n)
}

export function pct(n: number, digits = 1) {
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

export function num(n: number) {
  return n.toLocaleString('en-US')
}

export function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function eachDate(a: string, b: string) {
  const start = a < b ? a : b
  const end = a < b ? b : a
  const out: string[] = []
  let cur = start
  while (cur <= end) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function monthLabel(year: number, month: number) {
  return `${MONTHS_LONG[month - 1]} ${year}`
}

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

export function fmtRange(dates: string[]) {
  if (dates.length === 0) return 'No dates'
  const sorted = [...dates].sort()
  if (sorted.length === 1) return fmtDate(sorted[0])
  const a = sorted[0].split('-').map(Number)
  const b = sorted[sorted.length - 1].split('-').map(Number)
  if (a[0] === b[0] && a[1] === b[1]) return `${MONTHS[a[1] - 1]} ${a[2]}–${b[2]}, ${a[0]}`
  if (a[0] === b[0]) return `${MONTHS[a[1] - 1]} ${a[2]} – ${MONTHS[b[1] - 1]} ${b[2]}, ${a[0]}`
  return `${fmtDate(sorted[0])} – ${fmtDate(sorted[sorted.length - 1])}`
}

export function ago(ts: number) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 36) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
