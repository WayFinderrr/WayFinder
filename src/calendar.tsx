import { cx, pad } from './format'

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function MonthCalendar({
  year,
  month,
  today,
  selected,
  unavailable,
  mine,
  onPick,
}: {
  year: number
  month: number
  today: string
  selected: string[]
  unavailable: Set<string>
  mine: Set<string>
  onPick: (iso: string) => void
}) {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: Array<{ iso?: string; day?: number }> = []
  for (let i = 0; i < firstDow; i++) cells.push({})
  for (let day = 1; day <= count; day++) {
    cells.push({ day, iso: `${year}-${pad(month)}-${pad(day)}` })
  }
  const selectedSet = new Set(selected)

  return (
    <div className="cal" role="grid" aria-label="Stay calendar">
      {DOW.map((label) => (
        <div key={label} className="dow">
          {label}
        </div>
      ))}
      {cells.map((cell, index) => {
        if (!cell.iso || !cell.day) return <div key={`empty-${index}`} />
        const past = cell.iso < today
        const isMine = mine.has(cell.iso)
        const blocked = unavailable.has(cell.iso)
        return (
          <button
            key={cell.iso}
            type="button"
            disabled={past || blocked}
            className={cx(
              'day',
              past && 'is-past',
              blocked && !isMine && 'is-off',
              isMine && 'is-mine',
              selectedSet.has(cell.iso) && 'is-sel',
            )}
            onClick={() => onPick(cell.iso!)}
          >
            {cell.day}
          </button>
        )
      })}
    </div>
  )
}
