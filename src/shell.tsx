import { useEffect, useRef, useState } from 'react'
import { AssetPage } from './pages/AssetPage'
import { Discover } from './pages/Discover'
import { MarketPage } from './pages/MarketPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { VaultPage } from './pages/VaultPage'
import { ASSETS } from './data'
import { shortSig, solFmt, usdcFmt } from './format'
import { YOU } from './logic'
import type { Route } from './route'
import { useWayfinder } from './store'
import { Mark } from './ui'

const NAV: Array<{ page: 'discover' | 'market' | 'vault' | 'portfolio'; label: string }> = [
  { page: 'discover', label: 'Discover' },
  { page: 'market', label: 'Market' },
  { page: 'vault', label: 'Vault' },
  { page: 'portfolio', label: 'Portfolio' },
]

export function Shell() {
  const { state, disconnect, setResetOpen, setWalletOpen, notify } = useWayfinder()
  const [route, setRoute] = useState<Route>({ page: 'discover' })
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setMenu(false)
    if (route.page === 'asset') {
      const asset = ASSETS.find((item) => item.id === route.id)
      document.title = asset ? `${asset.name} · WayFinder` : 'WayFinder'
      return
    }
    const titles = {
      discover: 'WayFinder',
      market: 'Market · WayFinder',
      vault: 'Vault · WayFinder',
      portfolio: 'Portfolio · WayFinder',
    }
    document.title = titles[route.page]
  }, [route])

  const go = (next: Route) => setRoute(next)
  const addr = `${YOU.slice(0, 4)}…${YOU.slice(-4)}`

  return (
    <>
      <header className={menu ? 'topbar menu-open' : 'topbar'}>
        <div className="topbar-inner">
          <button type="button" className="brand" onClick={() => go({ page: 'discover' })}>
            <Mark />
            <span className="brand-name">WayFinder</span>
            <span className="demo-pill">Demo</span>
          </button>
          <nav className="nav" aria-label="Primary">
            {NAV.map((item) => (
              <button
                key={item.page}
                type="button"
                className={route.page === item.page ? 'nav-btn on' : 'nav-btn'}
                aria-current={route.page === item.page ? 'page' : undefined}
                onClick={() => go({ page: item.page })}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="net">
            <i /> Solana
          </div>
          <div className="wallet-wrap">
            {state.connected ? (
              <button type="button" className="wallet-btn" onClick={() => setMenu((open) => !open)}>
                <span className="bal">{solFmt(state.sol)}</span>
                <span className="addr">{addr}</span>
              </button>
            ) : (
              <button type="button" className="btn primary" onClick={() => setWalletOpen(true)}>
                Connect wallet
              </button>
            )}
            {menu && (
              <div className="wallet-menu" role="menu">
                  <p className="fine">Demo wallet</p>
                  <strong className="addr-full">{YOU}</strong>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      void navigator.clipboard?.writeText(YOU)
                      notify('Address copied')
                    }}
                  >
                    Copy address
                  </button>
                  <dl className="kv-list">
                    <div>
                      <dt>SOL</dt>
                      <dd>{solFmt(state.sol)}</dd>
                    </div>
                    <div>
                      <dt>USDC</dt>
                      <dd>{usdcFmt(state.usdc)}</dd>
                    </div>
                  </dl>
                  <p className="fine">USD values use a $152 SOL reference.</p>
                  <button
                    type="button"
                    className="btn ghost full"
                    onClick={() => {
                      setMenu(false)
                      setResetOpen(true)
                    }}
                  >
                    Reset demo
                  </button>
                  <button
                    type="button"
                    className="btn full"
                    onClick={() => {
                      setMenu(false)
                      disconnect()
                    }}
                  >
                    Disconnect
                  </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main>
        {route.page === 'discover' && <Discover go={go} />}
        {route.page === 'asset' && <AssetPage id={route.id} go={go} />}
        {route.page === 'market' && <MarketPage />}
        {route.page === 'vault' && <VaultPage />}
        {route.page === 'portfolio' && <PortfolioPage />}
      </main>
      <footer className="foot">
        <div className="wrap">
          <span>WayFinder</span>
          <span>Tokenized stays · SPV legal wrapper · Solana settlement</span>
        </div>
      </footer>
      {menu && <button type="button" className="scrim-btn" aria-label="Close menu" onClick={() => setMenu(false)} />}
      <WalletModal />
      <TxModal />
      <ResetModal />
      <Toaster />
    </>
  )
}

function WalletModal() {
  const { walletOpen, setWalletOpen, connect, linking } = useWayfinder()
  if (!walletOpen) return null
  return (
    <div className="overlay" onMouseDown={() => !linking && setWalletOpen(false)}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="kicker">Wallet</p>
        <h3 id="wallet-title">Connect Phantom</h3>
        <p className="story">
          WayFinder settles on Solana. This preview connects a built-in wallet so you can buy fractions,
          book nights, and post collateral without leaving the browser.
        </p>
        <button type="button" className="btn phantom full" onClick={connect} disabled={linking}>
          <i className="phantom-dot" />
          {linking ? 'Connecting…' : 'Phantom'}
        </button>
        <p className="fine">Simulated connection. Balances are preloaded for the demo.</p>
        <button type="button" className="btn ghost full" onClick={() => setWalletOpen(false)} disabled={linking}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function TxModal() {
  const { tx, closeTx, state } = useWayfinder()
  const [step, setStep] = useState<'review' | 'sign' | 'chain' | 'done' | 'error'>('review')
  const [error, setError] = useState<string | null>(null)
  const run = useRef(false)

  useEffect(() => {
    setStep('review')
    setError(null)
    run.current = false
  }, [tx?.id])

  useEffect(() => {
    document.body.style.overflow = tx ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [tx])

  useEffect(() => {
    if (!tx) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (step === 'sign' || step === 'chain') return
      closeTx()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tx, step, closeTx])

  if (!tx) return null
  const latest = state.activity[0]
  const phase = step === 'review' ? 0 : step === 'sign' ? 1 : 2

  const confirm = async () => {
    if (run.current) return
    const current = tx
    run.current = true
    setStep('sign')
    await wait(780)
    setStep('chain')
    await wait(980)
    const err = current.commit()
    if (err) {
      setError(err)
      setStep('error')
    } else {
      setStep('done')
    }
    run.current = false
  }

  return (
    <div className="overlay">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="tx-title">
        <div className="phases" aria-hidden="true">
          {['Review', 'Sign', 'Settle'].map((label, index) => (
            <span key={label} className={index <= phase ? 'on' : ''}>
              {label}
            </span>
          ))}
        </div>
        {step === 'done' ? (
          <div className="success">
            <div className="check" aria-hidden="true">
              ✓
            </div>
            <h3 id="tx-title">Confirmed</h3>
            <p>{tx.title}</p>
            <p className="fine">{latest?.detail}</p>
            <code className="sig">{latest ? shortSig(latest.sig) : ''}</code>
            <p className="fine">
              {solFmt(state.sol)} · {usdcFmt(state.usdc)}
            </p>
            <button type="button" className="btn primary full" onClick={closeTx}>
              Done
            </button>
          </div>
        ) : step === 'error' ? (
          <>
            <h3 id="tx-title">Transaction failed</h3>
            <p className="hint warn">{error}</p>
            <button type="button" className="btn ghost full" onClick={closeTx}>
              Close
            </button>
          </>
        ) : step === 'sign' || step === 'chain' ? (
          <div className="pending">
            <div className="spinner" />
            <h3 id="tx-title">{step === 'sign' ? 'Waiting for wallet approval' : 'Confirming on Solana'}</h3>
            <p className="fine">{tx.title}</p>
          </div>
        ) : (
          <>
            <p className="kicker">{tx.eyebrow}</p>
            <h3 id="tx-title">{tx.title}</h3>
            <dl className="kv-list review">
              {tx.rows.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              <div>
                <dt>Network fee</dt>
                <dd>&lt; 0.00001 SOL</dd>
              </div>
            </dl>
            <p className="fine">Signed locally for this demo. Nothing is broadcast to Solana.</p>
            <button type="button" className="btn primary full" onClick={() => void confirm()}>
              {tx.confirm}
            </button>
            <button type="button" className="btn ghost full" onClick={closeTx}>
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ResetModal() {
  const { resetOpen, setResetOpen, reset } = useWayfinder()
  if (!resetOpen) return null
  return (
    <div className="overlay" onMouseDown={() => setResetOpen(false)}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id="reset-title">Reset the demo?</h3>
        <p className="story">
          This clears purchases, stays, listings, and loans, and disconnects the wallet so you can record again.
        </p>
        <button type="button" className="btn primary full" onClick={reset}>
          Reset demo
        </button>
        <button type="button" className="btn ghost full" onClick={() => setResetOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function Toaster() {
  const { toast } = useWayfinder()
  if (!toast) return null
  return (
    <div className="toaster" role="status">
      {toast}
    </div>
  )
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
