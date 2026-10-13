import { useState } from 'react'
import { ASSETS } from '../data'
import { num, pct, solFmt, usd, usdWhole, usdcFmt } from '../format'
import {
  applyLockBorrow,
  applyRepay,
  borrowPowerUsd,
  fractionUsd,
  freeFractions,
  healthFactor,
  holdingOf,
  loanOf,
  maxBorrow,
  portfolioUsd,
  reasonLockBorrow,
  reasonRepay,
} from '../logic'
import { useWayfinder } from '../store'
import type { Asset } from '../types'

export function VaultPage() {
  const { state, setWalletOpen } = useWayfinder()
  const power = borrowPowerUsd(state)
  const book = portfolioUsd(state)

  return (
    <div className="wrap page">
      <p className="kicker">Composability</p>
      <h1 className="page-title">Fractions, posted as collateral.</h1>
      <p className="lede narrow">
        Lock ownership fractions and borrow USDC. The yield keeps accruing while they sit in the vault.
        Night tokens stay out — they are a right to occupy, not equity in the SPV.
      </p>

      {!state.connected ? (
        <section className="panel connect-panel">
          <h2>A demo wallet is ready.</h2>
          <p>It already holds fractions of Villa Solara, Casa Cenote, and Atelier Alfama.</p>
          <button type="button" className="btn primary" onClick={() => setWalletOpen(true)}>
            Connect wallet
          </button>
        </section>
      ) : (
        <>
          <section className="metrics">
            <div>
              <strong>{usdWhole(power)}</strong>
              <span>Borrowing power</span>
            </div>
            <div>
              <strong>{usdWhole(book.fractions)}</strong>
              <span>Fraction value</span>
            </div>
            <div>
              <strong>{usdcFmt(book.debt)}</strong>
              <span>Open debt</span>
            </div>
            <div>
              <strong>{usdcFmt(state.usdc)}</strong>
              <span>USDC balance</span>
            </div>
          </section>
          <div className="vault-list">
            {ASSETS.map((asset) => {
              const holding = holdingOf(state, asset.id)
              const loan = loanOf(state, asset.id)
              if (holding.fractions < 1 && !loan) return null
              return <VaultCard key={asset.id} asset={asset} />
            })}
          </div>
        </>
      )}
    </div>
  )
}

function VaultCard({ asset }: { asset: Asset }) {
  const { state, dispatch, requestTx } = useWayfinder()
  const holding = holdingOf(state, asset.id)
  const loan = loanOf(state, asset.id)
  const free = freeFractions(state, asset.id)
  const [draft, setDraft] = useState<{ lock: number; borrow: number } | null>(null)
  const [repay, setRepay] = useState<number | null>(null)

  const existingLocked = loan?.locked ?? 0
  const existingDebt = loan?.debtUsdc ?? 0
  const suggested = suggest(free, existingLocked, existingDebt, asset.id)
  const form = draft ?? suggested
  const room = Math.max(0, maxBorrow(existingLocked + form.lock, asset.id) - existingDebt)
  const borrow = Math.min(form.borrow, room)
  const newLocked = existingLocked + form.lock
  const newDebt = existingDebt + borrow
  const health = healthFactor(newLocked, newDebt, asset.id)
  const reason = reasonLockBorrow(state, asset.id, form.lock, borrow)
  const repayValue = Math.min(repay ?? Math.round(existingDebt), Math.round(existingDebt), Math.floor(state.usdc))
  const repayReason = existingDebt > 0 ? reasonRepay(state, asset.id, repayValue) : null
  const price = fractionUsd(asset.id)

  const setLock = (lock: number) => {
    const nextRoom = Math.max(0, maxBorrow(existingLocked + lock, asset.id) - existingDebt)
    setDraft({ lock, borrow: Math.min(borrow, nextRoom) })
  }

  return (
    <article className="panel vault-card">
      <header className="vault-head">
        <div>
          <h2>{asset.name}</h2>
          <p>
            {asset.fractionSymbol} · {solFmt(asset.fractionPriceSol)} · {usd(price)} reference
          </p>
        </div>
        <span className="pill fraction">{Math.round(asset.maxLtv * 100)}% LTV</span>
      </header>
      <dl className="kv-list three">
        <div>
          <dt>Owned</dt>
          <dd>{num(holding.fractions)}</dd>
        </div>
        <div>
          <dt>Locked</dt>
          <dd>{num(existingLocked)}</dd>
        </div>
        <div>
          <dt>Free</dt>
          <dd>{num(free)}</dd>
        </div>
      </dl>

      {existingDebt > 0 && (
        <div className="loan-banner">
          <div>
            <strong>{usdcFmt(existingDebt)} borrowed</strong>
            <span>Health {healthText(healthFactor(existingLocked, existingDebt, asset.id))}</span>
          </div>
          <label className="field">
            <span>Repay {usdcFmt(repayValue)}</span>
            <input
              type="range"
              min={existingDebt > 0 ? 1 : 0}
              max={Math.max(1, Math.round(existingDebt))}
              value={repayValue}
              onChange={(event) => setRepay(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="btn ghost"
            disabled={!!repayReason}
            onClick={() =>
              requestTx({
                eyebrow: 'Vault',
                title: repayValue >= existingDebt - 0.5 ? 'Repay and unlock' : 'Repay USDC',
                confirm: 'Approve transaction',
                rows: [
                  { label: 'Asset', value: asset.name },
                  { label: 'Repay', value: usdcFmt(repayValue) },
                  {
                    label: 'Collateral',
                    value: repayValue >= existingDebt - 0.5 ? `${asset.fractionSymbol} unlocks` : 'Stays locked',
                  },
                ],
                commit: () => dispatch((current) => applyRepay(current, asset.id, repayValue)),
              })
            }
          >
            {repayValue >= existingDebt - 0.5 ? 'Repay and unlock' : 'Repay'}
          </button>
          {repayReason && <p className="hint warn">{repayReason}</p>}
        </div>
      )}

      <div className="split">
        <label className="field">
          <span>Lock {form.lock} fractions</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, free)}
            value={Math.min(form.lock, free)}
            disabled={free < 1}
            onChange={(event) => setLock(Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Borrow {usdcFmt(borrow)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, room)}
            value={borrow}
            disabled={room < 1}
            onChange={(event) => setDraft({ lock: form.lock, borrow: Number(event.target.value) })}
          />
        </label>
      </div>
      <dl className="kv-list three">
        <div>
          <dt>Collateral</dt>
          <dd>{usdWhole(newLocked * price)}</dd>
        </div>
        <div>
          <dt>Debt after</dt>
          <dd>{usdcFmt(newDebt)}</dd>
        </div>
        <div>
          <dt>Health</dt>
          <dd className={healthClass(health)}>{healthText(health)}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="btn primary"
        disabled={!!reason}
        onClick={() =>
          requestTx({
            eyebrow: 'Vault',
            title: borrow > 0 ? 'Lock and borrow' : 'Lock fractions',
            confirm: 'Approve transaction',
            rows: [
              { label: 'Asset', value: asset.name },
              { label: 'Lock', value: `${form.lock} ${asset.fractionSymbol}` },
              { label: 'Borrow', value: borrow > 0 ? usdcFmt(borrow) : '—' },
              { label: 'LTV cap', value: pct(asset.maxLtv * 100, 0) },
              { label: 'Health', value: healthText(health) },
            ],
            commit: () => {
              const error = dispatch((current) => applyLockBorrow(current, asset.id, form.lock, borrow))
              if (!error) setDraft(null)
              return error
            },
          })
        }
      >
        {borrow > 0 ? 'Lock and borrow' : 'Lock fractions'}
      </button>
      <p className={reason ? 'hint warn' : 'hint'}>
        {reason ?? 'Locked fractions keep their share of rental yield. Liquidation threshold 70%.'}
      </p>
    </article>
  )
}

function suggest(free: number, locked: number, debt: number, assetId: string) {
  if (free < 1) {
    const room = Math.max(0, maxBorrow(locked, assetId) - debt)
    return { lock: 0, borrow: Math.floor(room / 50) * 50 }
  }
  const lock = Math.min(free, Math.max(1, Math.round(free * 0.2)))
  const room = Math.max(0, maxBorrow(locked + lock, assetId) - debt)
  const borrow = Math.min(room, Math.round((room * 0.75) / 50) * 50)
  return { lock, borrow }
}

function healthText(value: number) {
  if (!Number.isFinite(value)) return 'No debt'
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function healthClass(value: number) {
  if (!Number.isFinite(value)) return ''
  if (value >= 1.5) return 'up'
  if (value >= 1.2) return 'sand'
  return 'down'
}
