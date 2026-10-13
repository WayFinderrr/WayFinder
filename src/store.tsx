import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createInitialState, isState, type Result } from './logic'
import type { State } from './types'

const KEY = 'wayfinder-demo-v1'

export type TxRequest = {
  id: string
  eyebrow: string
  title: string
  rows: { label: string; value: string }[]
  confirm: string
  commit: () => string | null
}

type Api = {
  state: State
  dispatch: (fn: (state: State) => Result) => string | null
  tx: TxRequest | null
  requestTx: (tx: Omit<TxRequest, 'id'>) => void
  closeTx: () => void
  walletOpen: boolean
  setWalletOpen: (open: boolean) => void
  linking: boolean
  connect: () => void
  disconnect: () => void
  resetOpen: boolean
  setResetOpen: (open: boolean) => void
  reset: () => void
  toast: string | null
  notify: (message: string) => void
}

const Ctx = createContext<Api | null>(null)

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createInitialState()
    const parsed: unknown = JSON.parse(raw)
    if (isState(parsed)) return parsed
  } catch {
    /* use a fresh demo wallet */
  }
  return createInitialState()
}

export function WayfinderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)
  const ref = useRef(state)
  ref.current = state
  const [tx, setTx] = useState<TxRequest | null>(null)
  const [walletOpen, setWalletOpen] = useState(false)
  const [linking, setLinking] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<number>(0)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignore quota */
    }
  }, [state])

  const notify = (message: string) => {
    setToast(message)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 2800)
  }

  const dispatch = (fn: (current: State) => Result) => {
    const result = fn(ref.current)
    if ('error' in result) return result.error
    setState(result.state)
    return null
  }

  const connect = () => {
    if (linking || state.connected) return
    setLinking(true)
    window.setTimeout(() => {
      setState((current) => ({ ...current, connected: true }))
      setLinking(false)
      setWalletOpen(false)
      notify('Wallet connected')
    }, 700)
  }

  const api: Api = {
    state,
    dispatch,
    tx,
    requestTx: (next) => setTx({ ...next, id: `ui-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }),
    closeTx: () => setTx(null),
    walletOpen,
    setWalletOpen,
    linking,
    connect,
    disconnect: () => {
      setState((current) => ({ ...current, connected: false }))
      notify('Wallet disconnected')
    },
    resetOpen,
    setResetOpen,
    reset: () => {
      setState(createInitialState())
      setResetOpen(false)
      setTx(null)
      notify('Demo reset')
    },
    toast,
    notify,
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useWayfinder() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('WayFinder store is missing')
  return ctx
}
