import { useState } from 'react'
import { MonthCalendar } from '../calendar'
import { ASSETS } from '../data'
import {
  SOL_USD,
  TODAY,
  addDays,
  fmtRange,
  monthLabel,
  num,
  pct,
  solFmt,
  usd,
  usdWhole,
} from '../format'
import {
  applyBook,
  applyBuyFractions,
  applyBuyListing,
  applyRedeem,
  fractionsLeft,
  freeNights,
  holdingOf,
  nightsLeft,
  reasonBook,
  reasonBuyFractions,
  reasonRedeem,
  shortAddr,
  takenDates,
  YOU,
} from '../logic'
import type { Go } from '../route'
import { useWayfinder } from '../store'
import type { Asset } from '../types'
import { ActivityList, Photo } from '../ui'

export function AssetPage({ id, go }: { id: string; go: Go }) {
  const asset = ASSETS.find((item) => item.id === id)
  if (!asset) {
    return (
      <div className="wrap page">
        <p>This asset is not listed on WayFinder.</p>
        <button type="button" className="btn ghost" onClick={() => go({ page: 'discover' })}>
          Back to assets
        </button>
      </div>
    )
  }
  return <AssetBody key={asset.id} asset={asset} go={go} />
}

function AssetBody({ asset, go }: { asset: Asset; go: Go }) {
  const { state, dispatch, requestTx, setWalletOpen } = useWayfinder()
  const [tab, setTab] = useState<'fractions' | 'nights'>('fractions')
  const [amount, setAmount] = useState(10)
  const [cursor, setCursor] = useState({ y: 2026, m: 10 })
  const [start, setStart] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)

  const holding = holdingOf(state, asset.id)
  const left = fractionsLeft(state, asset.id)
  const nights = nightsLeft(state, asset.id)
  const ownedPct = (holding.fractions / asset.fractionSupply) * 100
  const mine = new Set(holding.stays.flatMap((stay) => stay.dates))
  const unavailable = takenDates(state, asset.id)
  const listings = state.listings.filter((item) => item.assetId === asset.id)
  const activity = state.activity.filter((item) => item.assetId === asset.id).slice(0, 5)
  const fractionReason = reasonBuyFractions(state, asset.id, amount)
  const bookReason = reasonBook(state, asset.id, selected)
  const redeemReason = reasonRedeem(state, asset.id, selected)
  const tokens = freeNights(state, asset.id)

  const shiftMonth = (dir: number) => {
    const date = new Date(Date.UTC(cursor.y, cursor.m - 1 + dir, 1))
    const y = date.getUTCFullYear()
    const m = date.getUTCMonth() + 1
    if (y < 2026 || (y === 2026 && m < 10) || y > 2027 || (y === 2027 && m > 3)) return
    setCursor({ y, m })
  }

  const onPick = (iso: string) => {
    if (!start) {
      setStart(iso)
      setSelected([iso])
      return
    }
    const range: string[] = []
    const from = start < iso ? start : iso
    const to = start < iso ? iso : start
    let cur = from
    while (cur <= to) {
      range.push(cur)
      cur = addDays(cur, 1)
    }
    if (range.some((day) => unavailable.has(day))) {
      setNote('That range crosses an unavailable night.')
      setStart(iso)
      setSelected([iso])
      return
    }
    setNote(null)
    setSelected(range)
    setStart(null)
  }

  const selectNext = () => {
    const count = Math.max(3, asset.minStay)
    let day = addDays(TODAY, 1)
    while (day < '2027-04-01') {
      const range = Array.from({ length: count }, (_, index) => addDays(day, index))
      if (range.every((item) => !unavailable.has(item))) {
        setSelected(range)
        setStart(null)
        setNote(null)
        const [y, m] = range[0].split('-').map(Number)
        setCursor({ y, m })
        return
      }
      day = addDays(day, 1)
    }
  }

  const gate = (run: () => void, blocked: string | null) => {
    if (!state.connected) {
      setWalletOpen(true)
      return
    }
    if (blocked) return
    run()
  }

  return (
    <div className="wrap page">
      <button type="button" className="text-btn" onClick={() => go({ page: 'discover' })}>
        ← All assets
      </button>
      <div className="hero-photo">
        <Photo src={asset.image} alt={asset.name} />
        <div className="scrim" />
        <div className="hero-copy">
          <span className="chip light">{asset.kind}</span>
          <h1>{asset.name}</h1>
          <p>
            {asset.place} · {asset.spv}
          </p>
        </div>
      </div>

      <section className="stat-row">
        <Stat k="Appraisal" v={usdWhole(asset.appraisedUsd)} />
        <Stat k="Fraction" v={solFmt(asset.fractionPriceSol)} />
        <Stat k="Night" v={solFmt(asset.nightPriceSol)} />
        <Stat k="Est. yield" v={pct(asset.yieldPct)} />
        <Stat k="Occupancy" v={pct(asset.occupancyPct, 0)} />
      </section>

      <div className="asset-layout">
        <div className="stack">
          <section className="panel">
            <p className="kicker">Structure</p>
            <h2>Title sits in the SPV. Tokens sit on Solana.</h2>
            <p className="story">{asset.story}</p>
            <div className="struct">
              <article>
                <span>Legal wrapper</span>
                <h3>{asset.spv}</h3>
                <p>
                  {asset.jurisdiction}. The vehicle holds the property interest. Token holders own economic
                  rights in the SPV, not the deed itself.
                </p>
              </article>
              <article>
                <span>Ownership · {asset.fractionSymbol}</span>
                <h3>{num(asset.fractionSupply)} supply</h3>
                <p>
                  Token-2022 fraction. Yield-bearing. Eligible as WayFinder Vault collateral at{' '}
                  {Math.round(asset.maxLtv * 100)}% LTV.
                </p>
              </article>
              <article>
                <span>Usage · {asset.nightSymbol}</span>
                <h3>{num(asset.nightCap)} nights / year</h3>
                <p>
                  Exclusive use of the property. Transferable on the secondary book. Not eligible as
                  collateral. {asset.rules}
                </p>
              </article>
            </div>
            <p className="fine">
              Operator {asset.operator}. Reference SOL price ${SOL_USD}. Minimum stay {asset.minStay}{' '}
              {asset.minStay === 1 ? 'night' : 'nights'}.
            </p>
          </section>

          <section className="panel">
            <div className="section-head tight">
              <h2>On the book</h2>
              <button type="button" className="text-btn" onClick={() => go({ page: 'market' })}>
                All markets
              </button>
            </div>
            {listings.length === 0 ? (
              <p className="hint">No secondary offers on this asset.</p>
            ) : (
              <div className="book">
                {listings.map((listing) => {
                  const symbol = listing.kind === 'fraction' ? asset.fractionSymbol : asset.nightSymbol
                  const total = listing.amount * listing.priceSol
                  const own = listing.seller === YOU
                  return (
                    <div key={listing.id} className="book-row">
                      <div>
                        <span className={listing.kind === 'fraction' ? 'pill fraction' : 'pill night'}>
                          {listing.kind}
                        </span>
                        <strong>
                          {listing.amount} {symbol}
                        </strong>
                        <span>
                          {solFmt(listing.priceSol)} · {shortAddr(listing.seller, state.connected)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn small primary"
                        disabled={own && state.connected}
                        onClick={() =>
                          gate(() => {
                            requestTx({
                              eyebrow: 'Secondary book',
                              title: `Buy ${symbol}`,
                              confirm: 'Approve transaction',
                              rows: [
                                { label: 'Asset', value: asset.name },
                                { label: 'Size', value: `${listing.amount} ${symbol}` },
                                { label: 'Unit price', value: solFmt(listing.priceSol) },
                                { label: 'Total', value: solFmt(total) },
                                { label: 'You pay', value: usd(total * SOL_USD) },
                              ],
                              commit: () => dispatch((current) => applyBuyListing(current, listing.id)),
                            })
                          }, null)
                        }
                      >
                        {own && state.connected ? 'Your order' : `Buy · ${solFmt(total)}`}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Activity</h2>
            <ActivityList items={activity} />
          </section>
        </div>

        <aside className="ticket">
          <div className="tabs" role="tablist">
            <button type="button" className={tab === 'fractions' ? 'on' : ''} onClick={() => setTab('fractions')}>
              Fractions
            </button>
            <button type="button" className={tab === 'nights' ? 'on' : ''} onClick={() => setTab('nights')}>
              Nights
            </button>
          </div>

          {tab === 'fractions' ? (
            <div className="ticket-body">
              <p className="ticket-kicker">Primary issuance · {asset.fractionSymbol}</p>
              <p className="ticket-price">
                {solFmt(asset.fractionPriceSol)} <span>{usd(asset.fractionPriceSol * SOL_USD)}</span>
              </p>
              <dl className="kv-list">
                <div>
                  <dt>You own</dt>
                  <dd>
                    {state.connected ? `${num(holding.fractions)} · ${pct(ownedPct, 2)}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Primary left</dt>
                  <dd>{num(left)}</dd>
                </div>
                <div>
                  <dt>Supply</dt>
                  <dd>{num(asset.fractionSupply)}</dd>
                </div>
              </dl>
              <label className="field">
                <span>Amount</span>
                <div className="stepper">
                  <button type="button" onClick={() => setAmount((value) => Math.max(1, value - 1))} aria-label="Decrease">
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(event) => setAmount(Math.max(0, Math.floor(Number(event.target.value) || 0)))}
                  />
                  <button
                    type="button"
                    onClick={() => setAmount((value) => Math.min(left, value + 1))}
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
              </label>
              <button
                type="button"
                className="btn primary full"
                disabled={state.connected && !!fractionReason}
                onClick={() =>
                  gate(() => {
                    const total = amount * asset.fractionPriceSol
                    requestTx({
                      eyebrow: 'Primary issuance',
                      title: `Buy ${asset.fractionSymbol}`,
                      confirm: 'Approve transaction',
                      rows: [
                        { label: 'Asset', value: asset.name },
                        { label: 'SPV', value: asset.spv },
                        { label: 'Amount', value: `${amount} fractions` },
                        { label: 'Unit price', value: solFmt(asset.fractionPriceSol) },
                        { label: 'Total', value: solFmt(total) },
                        { label: 'Value', value: usd(total * SOL_USD) },
                      ],
                      commit: () => dispatch((current) => applyBuyFractions(current, asset.id, amount)),
                    })
                  }, fractionReason)
                }
              >
                {state.connected ? 'Buy fractions' : 'Connect wallet'}
              </button>
              <p className={fractionReason && state.connected ? 'hint warn' : 'hint'}>
                {state.connected && fractionReason
                  ? fractionReason
                  : `${solFmt(amount * asset.fractionPriceSol)} · ${usd(amount * asset.fractionPriceSol * SOL_USD)}`}
              </p>
              <button type="button" className="btn ghost full" onClick={() => go({ page: 'vault' })}>
                Use as collateral
              </button>
            </div>
          ) : (
            <div className="ticket-body">
              <p className="ticket-kicker">Book exclusive use · {asset.nightSymbol}</p>
              <p className="ticket-price">
                {solFmt(asset.nightPriceSol)} <span>per night</span>
              </p>
              <div className="cal-head">
                <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                  ‹
                </button>
                <strong>{monthLabel(cursor.y, cursor.m)}</strong>
                <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
                  ›
                </button>
              </div>
              <MonthCalendar
                year={cursor.y}
                month={cursor.m}
                today={TODAY}
                selected={selected}
                unavailable={unavailable}
                mine={mine}
                onPick={onPick}
              />
              <div className="legend">
                <span><i className="swatch mine" /> Your stay</span>
                <span><i className="swatch off" /> Unavailable</span>
                <span><i className="swatch sel" /> Selected</span>
              </div>
              {note && <p className="hint warn">{note}</p>}
              <button type="button" className="btn ghost full" onClick={selectNext}>
                Next {Math.max(3, asset.minStay)} open nights
              </button>
              <dl className="kv-list">
                <div>
                  <dt>Selection</dt>
                  <dd>{selected.length ? `${fmtRange(selected)} · ${selected.length}` : 'None'}</dd>
                </div>
                <div>
                  <dt>Inventory</dt>
                  <dd>{nights} nights</dd>
                </div>
                {state.connected && (
                  <div>
                    <dt>Night tokens</dt>
                    <dd>{tokens} free</dd>
                  </div>
                )}
              </dl>
              <button
                type="button"
                className="btn primary full"
                disabled={state.connected && !!bookReason}
                onClick={() =>
                  gate(() => {
                    const total = selected.length * asset.nightPriceSol
                    requestTx({
                      eyebrow: 'Reservation',
                      title: `Book ${asset.name}`,
                      confirm: 'Approve transaction',
                      rows: [
                        { label: 'Stay', value: fmtRange(selected) },
                        { label: 'Nights', value: String(selected.length) },
                        { label: 'Rate', value: solFmt(asset.nightPriceSol) },
                        { label: 'Total', value: solFmt(total) },
                        { label: 'Value', value: usd(total * SOL_USD) },
                        { label: 'Right', value: asset.nightSymbol },
                      ],
                      commit: () => {
                        const error = dispatch((current) => applyBook(current, asset.id, selected))
                        if (!error) {
                          setSelected([])
                          setStart(null)
                        }
                        return error
                      },
                    })
                  }, bookReason)
                }
              >
                {state.connected ? 'Book with SOL' : 'Connect wallet'}
              </button>
              <p className={bookReason && state.connected ? 'hint warn' : 'hint'}>
                {state.connected && bookReason
                  ? bookReason
                  : selected.length
                    ? `${solFmt(selected.length * asset.nightPriceSol)} · ${usd(selected.length * asset.nightPriceSol * SOL_USD)}`
                    : 'Select nights on the calendar.'}
              </p>
              {state.connected && tokens > 0 && (
                <button
                  type="button"
                  className="btn ghost full"
                  disabled={!!redeemReason}
                  onClick={() =>
                    gate(() => {
                      requestTx({
                        eyebrow: 'Redemption',
                        title: `Redeem ${asset.nightSymbol}`,
                        confirm: 'Approve transaction',
                        rows: [
                          { label: 'Stay', value: fmtRange(selected) },
                          { label: 'Tokens burned', value: `${selected.length} ${asset.nightSymbol}` },
                          { label: 'SOL due', value: '0 SOL' },
                        ],
                        commit: () => {
                          const error = dispatch((current) => applyRedeem(current, asset.id, selected))
                          if (!error) {
                            setSelected([])
                            setStart(null)
                          }
                          return error
                        },
                      })
                    }, redeemReason)
                  }
                >
                  Redeem night tokens
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="stat">
      <span>{k}</span>
      <strong>{v}</strong>
    </div>
  )
}
