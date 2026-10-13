import { useMemo, useState } from 'react'
import { ASSETS, getAsset } from '../data'
import { SOL_USD, solFmt, usd } from '../format'
import { applyBuyListing, applyCancel, shortAddr, YOU } from '../logic'
import { useWayfinder } from '../store'
import type { Instrument } from '../types'

export function MarketPage() {
  const { state, dispatch, requestTx, setWalletOpen } = useWayfinder()
  const [kind, setKind] = useState<'all' | Instrument>('all')
  const [assetId, setAssetId] = useState('all')

  const rows = useMemo(() => {
    const order = new Map(ASSETS.map((asset, index) => [asset.id, index]))
    return [...state.listings]
      .filter((listing) => (kind === 'all' ? true : listing.kind === kind))
      .filter((listing) => (assetId === 'all' ? true : listing.assetId === assetId))
      .sort((a, b) => (order.get(a.assetId) ?? 0) - (order.get(b.assetId) ?? 0) || a.kind.localeCompare(b.kind))
  }, [state.listings, kind, assetId])

  return (
    <div className="wrap page">
      <p className="kicker">Secondary book</p>
      <h1 className="page-title">Trade fractions and nights.</h1>
      <p className="lede narrow">
        Holders list ownership fractions or unused night tokens. Fills settle in SOL. Night tokens
        can be redeemed later for dates; fractions stay yield-bearing.
      </p>
      <div className="filters">
        {(['all', 'fraction', 'night'] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={kind === item ? 'chip-btn on' : 'chip-btn'}
            onClick={() => setKind(item)}
          >
            {item === 'all' ? 'All' : item === 'fraction' ? 'Fractions' : 'Nights'}
          </button>
        ))}
        <select value={assetId} onChange={(event) => setAssetId(event.target.value)} aria-label="Filter by asset">
          <option value="all">All assets</option>
          {ASSETS.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name}
            </option>
          ))}
        </select>
      </div>
      <p className="hint">{rows.length} open {rows.length === 1 ? 'order' : 'orders'}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Instrument</th>
              <th>Size</th>
              <th>Unit price</th>
              <th>Total</th>
              <th>Seller</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((listing) => {
              const asset = getAsset(listing.assetId)
              const symbol = listing.kind === 'fraction' ? asset.fractionSymbol : asset.nightSymbol
              const total = listing.amount * listing.priceSol
              const mine = listing.seller === YOU
              return (
                <tr key={listing.id}>
                  <td>
                    <strong>{asset.name}</strong>
                    <span>{asset.place}</span>
                  </td>
                  <td>
                    <span className={listing.kind === 'fraction' ? 'pill fraction' : 'pill night'}>{symbol}</span>
                  </td>
                  <td>{listing.amount}</td>
                  <td>{solFmt(listing.priceSol)}</td>
                  <td>
                    {solFmt(total)}
                    <span>{usd(total * SOL_USD)}</span>
                  </td>
                  <td>{shortAddr(listing.seller, state.connected)}</td>
                  <td>
                    {mine ? (
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() =>
                          requestTx({
                            eyebrow: 'Secondary book',
                            title: 'Cancel order',
                            confirm: 'Approve transaction',
                            rows: [
                              { label: 'Asset', value: asset.name },
                              { label: 'Size', value: `${listing.amount} ${symbol}` },
                              { label: 'Returns to', value: 'Your wallet' },
                            ],
                            commit: () => dispatch((current) => applyCancel(current, listing.id)),
                          })
                        }
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn small primary"
                        onClick={() => {
                          if (!state.connected) {
                            setWalletOpen(true)
                            return
                          }
                          requestTx({
                            eyebrow: 'Secondary book',
                            title: `Buy ${symbol}`,
                            confirm: 'Approve transaction',
                            rows: [
                              { label: 'Asset', value: asset.name },
                              { label: 'Size', value: `${listing.amount} ${symbol}` },
                              { label: 'Unit price', value: solFmt(listing.priceSol) },
                              { label: 'Total', value: solFmt(total) },
                              { label: 'Value', value: usd(total * SOL_USD) },
                            ],
                            commit: () => dispatch((current) => applyBuyListing(current, listing.id)),
                          })
                        }}
                      >
                        Buy
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="hint">Nothing on the book for that filter.</p>}
      </div>
    </div>
  )
}
