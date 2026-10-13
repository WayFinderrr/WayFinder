import { ASSETS } from '../data'
import { pct, solFmt, usdCompact, usdWhole, SOL_USD } from '../format'
import { appraisedTotal, holdingOf } from '../logic'
import type { Go } from '../route'
import { useWayfinder } from '../store'
import { ActivityList, Photo, Spark } from '../ui'
import { useMemo, useState } from 'react'

const STEPS = [
  ['01', 'Wrap', 'A local SPV holds the title or the operating lease.'],
  ['02', 'Issue', 'Ownership fractions and night rights mint on Solana.'],
  ['03', 'Settle', 'Guests book nights. Holders trade both instruments.'],
  ['04', 'Compose', 'Fractions post as collateral and keep the yield.'],
]

export function Discover({ go }: { go: Go }) {
  const { state } = useWayfinder()
  const [country, setCountry] = useState('All')
  const [query, setQuery] = useState('')
  const countries = ['All', ...new Set(ASSETS.map((asset) => asset.country))]
  const assets = ASSETS.filter((asset) => {
    const placeOk = country === 'All' || asset.country === country
    const q = query.trim().toLowerCase()
    const text = `${asset.name} ${asset.place} ${asset.kind} ${asset.spv}`.toLowerCase()
    return placeOk && (!q || text.includes(q))
  })
  const supply = ASSETS.reduce((sum, asset) => sum + asset.fractionSupply, 0)
  const nights = ASSETS.reduce((sum, asset) => sum + asset.nightCap, 0)
  const featured = ASSETS[0]

  const activity = useMemo(() => state.activity.slice(0, 4), [state.activity])

  return (
    <div className="wrap page">
      <section className="hero">
        <div>
          <p className="kicker">Solana · real-world assets</p>
          <h1 className="display">
            Fraction the house.
            <br />
            <em>Book the night.</em>
          </h1>
          <p className="lede">
            WayFinder tokenizes villas, homes, and hospitality assets through a local SPV.
            Ownership fractions carry the yield. Night rights book the stay. Both settle on
            Solana, and fractions can be posted as collateral.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn primary" onClick={() => go({ page: 'asset', id: featured.id })}>
              View Villa Solara
            </button>
            <button type="button" className="btn ghost" onClick={() => go({ page: 'vault' })}>
              Open the vault
            </button>
          </div>
        </div>
        <button type="button" className="feature" onClick={() => go({ page: 'asset', id: featured.id })}>
          <Photo src={featured.image} alt="Villa Solara in Marbella" />
          <div className="feature-copy">
            <span className="chip">Featured · {featured.place}</span>
            <h2>{featured.name}</h2>
            <p>
              {featured.fractionSymbol} · {solFmt(featured.fractionPriceSol)}
              <span> ≈ {usdWhole(featured.fractionPriceSol * SOL_USD)}</span>
            </p>
          </div>
        </button>
      </section>

      <section className="metrics" aria-label="Protocol totals">
        <div>
          <strong>{usdCompact(appraisedTotal())}</strong>
          <span>Appraised in SPVs</span>
        </div>
        <div>
          <strong>{ASSETS.length}</strong>
          <span>Live assets</span>
        </div>
        <div>
          <strong>{supply.toLocaleString('en-US')}</strong>
          <span>Ownership fractions</span>
        </div>
        <div>
          <strong>{nights.toLocaleString('en-US')}</strong>
          <span>Night rights / year</span>
        </div>
      </section>

      <ol className="steps">
        {STEPS.map(([n, title, body]) => (
          <li key={n}>
            <span>{n}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </li>
        ))}
      </ol>

      <div className="section-head">
        <h2>Assets</h2>
        <div className="filters">
          {countries.map((item) => (
            <button
              key={item}
              type="button"
              className={item === country ? 'chip-btn on' : 'chip-btn'}
              onClick={() => setCountry(item)}
            >
              {item}
            </button>
          ))}
          <input
            className="search"
            placeholder="Search place or SPV"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search assets"
          />
        </div>
      </div>

      {assets.length === 0 ? (
        <p className="hint">No assets match that search.</p>
      ) : (
        <div className="grid">
          {assets.map((asset) => {
            const owned = state.connected && holdingOf(state, asset.id).fractions > 0
            return (
              <article key={asset.id} className="asset-card">
                <button type="button" className="card-hit" onClick={() => go({ page: 'asset', id: asset.id })}>
                  <div className="card-media">
                    <Photo src={asset.image} alt="" />
                    <span className="chip">{asset.kind}</span>
                    {owned && <span className="own-chip">Owned</span>}
                  </div>
                  <div className="card-body">
                    <div className="card-top">
                      <h3>{asset.name}</h3>
                      <Spark data={asset.spark} />
                    </div>
                    <p className="place">{asset.place}</p>
                    <p className="blurb">{asset.blurb}</p>
                    <div className="price-row">
                      <div>
                        <span>Fraction</span>
                        <strong>{solFmt(asset.fractionPriceSol)}</strong>
                      </div>
                      <div>
                        <span>Est. yield</span>
                        <strong className="yield">{pct(asset.yieldPct)}</strong>
                      </div>
                      <div>
                        <span>30d</span>
                        <strong className="up">+{pct(asset.changePct)}</strong>
                      </div>
                    </div>
                  </div>
                </button>
              </article>
            )
          })}
        </div>
      )}

      <div className="section-head tight">
        <h2>Latest settlements</h2>
      </div>
      <ActivityList items={activity} />
    </div>
  )
}
