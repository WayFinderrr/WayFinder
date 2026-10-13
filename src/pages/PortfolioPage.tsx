import { useState } from 'react'
import { ASSETS } from '../data'
import { fmtRange, num, pct, solFmt, usd, usdWhole, SOL_USD } from '../format'
import {
  applyList,
  borrowPowerUsd,
  freeFractions,
  freeNights,
  holdingOf,
  loanOf,
  monthlyYieldUsd,
  portfolioUsd,
  reasonList,
  YOU,
} from '../logic'
import { useWayfinder } from '../store'
import type { Asset, Instrument } from '../types'
import { Photo } from '../ui'

export function PortfolioPage() {
  const { state, setWalletOpen } = useWayfinder()
  const book = portfolioUsd(state)
  const yieldUsd = monthlyYieldUsd(state)
  const power = borrowPowerUsd(state)
  const stays = state.holdings
    .flatMap((holding) => holding.stays.map((stay) => ({ ...stay, assetId: holding.assetId })))
    .sort((a, b) => a.dates[0].localeCompare(b.dates[0]))
  const orders = state.listings.filter((listing) => listing.seller === YOU)

  if (!state.connected) {
    return (
      <div className="wrap page">
        <p className="kicker">Portfolio</p>
        <h1 className="page-title">Your fractions, nights, and debt.</h1>
        <section className="panel connect-panel">
          <h2>Connect to load the demo book.</h2>
          <p>Positions, a November stay at Villa Solara, and unused night tokens are already in the wallet.</p>
          <button type="button" className="btn primary" onClick={() => setWalletOpen(true)}>
            Connect wallet
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="wrap page">
      <p className="kicker">Portfolio</p>
      <h1 className="page-title">What this wallet holds.</h1>
      <section className="metrics">
        <div>
          <strong>{usdWhole(book.net)}</strong>
          <span>Net assets</span>
        </div>
        <div>
          <strong>{usd(yieldUsd)}</strong>
          <span>Est. monthly yield</span>
        </div>
        <div>
          <strong>{usdWhole(power)}</strong>
          <span>Borrowing power</span>
        </div>
        <div>
          <strong>{solFmt(state.sol)}</strong>
          <span>{usdWhole(state.sol * SOL_USD)} liquid</span>
        </div>
      </section>

      <div className="holding-list">
        {ASSETS.map((asset) => {
          const holding = holdingOf(state, asset.id)
          if (holding.fractions < 1 && holding.nightTokens < 1 && holding.stays.length < 1) return null
          return <HoldingCard key={asset.id} asset={asset} />
        })}
      </div>

      <div className="section-head tight">
        <h2>Stays</h2>
      </div>
      {stays.length === 0 ? (
        <p className="hint">No reservations yet.</p>
      ) : (
        <div className="stay-list">
          {stays.map((stay) => {
            const asset = ASSETS.find((item) => item.id === stay.assetId)!
            return (
              <article key={stay.id} className="stay">
                <Photo src={asset.image} alt="" />
                <div>
                  <h3>{asset.name}</h3>
                  <p>
                    {fmtRange(stay.dates)} · {stay.dates.length} {stay.dates.length === 1 ? 'night' : 'nights'}
                  </p>
                  <span className="pill night">{stay.source === 'sol' ? 'Paid in SOL' : 'Redeemed'}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="section-head tight">
        <h2>Open orders</h2>
      </div>
      {orders.length === 0 ? (
        <p className="hint">No open orders. List a fraction from a holding above.</p>
      ) : (
        <div className="book">
          {orders.map((listing) => {
            const asset = ASSETS.find((item) => item.id === listing.assetId)!
            const symbol = listing.kind === 'fraction' ? asset.fractionSymbol : asset.nightSymbol
            return (
              <div key={listing.id} className="book-row">
                <div>
                  <strong>
                    {listing.amount} {symbol}
                  </strong>
                  <span>
                    {asset.name} · {solFmt(listing.priceSol)} each
                  </span>
                </div>
                <span className="hint">Live on the book</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HoldingCard({ asset }: { asset: Asset }) {
  const { state, dispatch, requestTx } = useWayfinder()
  const holding = holdingOf(state, asset.id)
  const loan = loanOf(state, asset.id)
  const freeF = freeFractions(state, asset.id)
  const freeN = freeNights(state, asset.id)
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<Instrument>(freeF > 0 ? 'fraction' : 'night')
  const [amount, setAmount] = useState(5)
  const [price, setPrice] = useState(asset.fractionPriceSol)
  const symbol = kind === 'fraction' ? asset.fractionSymbol : asset.nightSymbol
  const ref = kind === 'fraction' ? asset.fractionPriceSol : asset.nightPriceSol
  const reason = reasonList(state, asset.id, kind, amount, price)
  const ownPct = (holding.fractions / asset.fractionSupply) * 100

  return (
    <article className="panel holding">
      <div className="holding-top">
        <div>
          <p className="kicker">{asset.place}</p>
          <h2>{asset.name}</h2>
        </div>
        <button type="button" className="btn small ghost" onClick={() => setOpen((value) => !value)}>
          {open ? 'Close' : 'List'}
        </button>
      </div>
      <dl className="kv-list three">
        <div>
          <dt>{asset.fractionSymbol}</dt>
          <dd>
            {num(holding.fractions)}
            <span>{pct(ownPct, 2)} of SPV</span>
          </dd>
        </div>
        <div>
          <dt>{asset.nightSymbol}</dt>
          <dd>{num(holding.nightTokens)}</dd>
        </div>
        <div>
          <dt>Locked</dt>
          <dd>{num(loan?.locked ?? 0)}</dd>
        </div>
      </dl>
      <p className="fine">
        {`Free to list: ${freeF} ${freeF === 1 ? 'fraction' : 'fractions'} · ${freeN} ${freeN === 1 ? 'night token' : 'night tokens'}. Value ${usd(holding.fractions * asset.fractionPriceSol * SOL_USD + holding.nightTokens * asset.nightPriceSol * SOL_USD)}.`}
      </p>
      {open && (
        <div className="list-box">
          <div className="split">
            <label className="field">
              <span>Instrument</span>
              <select
                value={kind}
                onChange={(event) => {
                  const next = event.target.value as Instrument
                  setKind(next)
                  setPrice(next === 'fraction' ? asset.fractionPriceSol : asset.nightPriceSol)
                }}
              >
                <option value="fraction" disabled={freeF < 1}>
                  Fractions ({freeF} free)
                </option>
                <option value="night" disabled={freeN < 1}>
                  Nights ({freeN} free)
                </option>
              </select>
            </label>
            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(event) => setAmount(Math.max(0, Math.floor(Number(event.target.value) || 0)))}
              />
            </label>
            <label className="field">
              <span>Price (SOL)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(event) => setPrice(Number(event.target.value))}
              />
            </label>
          </div>
          <button
            type="button"
            className="btn primary"
            disabled={!!reason}
            onClick={() =>
              requestTx({
                eyebrow: 'Secondary book',
                title: `List ${symbol}`,
                confirm: 'Approve transaction',
                rows: [
                  { label: 'Asset', value: asset.name },
                  { label: 'Size', value: `${amount} ${symbol}` },
                  { label: 'Unit price', value: solFmt(price) },
                  { label: 'Reference', value: solFmt(ref) },
                ],
                commit: () => dispatch((current) => applyList(current, asset.id, kind, amount, price)),
              })
            }
          >
            List order
          </button>
          <p className={reason ? 'hint warn' : 'hint'}>
            {reason ?? `${amount} × ${solFmt(price)} · tokens stay yours until a fill.`}
          </p>
        </div>
      )}
    </article>
  )
}
