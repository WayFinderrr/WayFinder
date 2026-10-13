import { ASSETS, getAsset } from './data'
import {
  TODAY,
  addDays,
  fakeSig,
  money,
  solFmt,
  solR,
  uid,
  usdcFmt,
  SOL_USD,
} from './format'
import type { Activity, Holding, Instrument, Loan, State, Stay } from './types'

export const YOU = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'

const SELLERS = [
  '9kLm2pQ8sT4vW1yZ7aB3cD6eF5gH8jN4rU2',
  '3fQp8aL2mN6kR9tY5uV1wX4zB7cD2eH5jK9',
  '8sD4kP1qW7eR3tY6uI9oA2sF5gH8jL1mN3',
  '2wE6rT9yU3iO5pA8sD1fG4hJ7kL2zX5cVb8',
  '6nB8vC3xZ1mQ4wE7rT2yU5iO9pA3sD6fGh',
  '5hJ2kL8mN4bV7cX1zQ6wE9rT3yU5iO2pLm',
]

export type Result = { state: State } | { error: string }

function act(assetId: string, title: string, detail: string): Activity {
  return { id: uid('tx'), assetId, title, detail, sig: fakeSig(), at: Date.now() }
}

function withActivity(state: State, item: Activity): State {
  return { ...state, activity: [item, ...state.activity].slice(0, 24) }
}

export function createInitialState(): State {
  const now = Date.now()
  const stay: Stay = {
    id: 'stay-solara-autumn',
    assetId: 'solara',
    dates: ['2026-11-02', '2026-11-03', '2026-11-04'],
    source: 'sol',
  }
  return {
    connected: false,
    sol: 120,
    usdc: 3500,
    holdings: [
      { assetId: 'solara', fractions: 250, nightTokens: 3, stays: [stay] },
      { assetId: 'cenote', fractions: 80, nightTokens: 0, stays: [] },
      { assetId: 'alfama', fractions: 40, nightTokens: 1, stays: [] },
    ],
    listings: [
      { id: 'l1', assetId: 'solara', seller: SELLERS[0], kind: 'fraction', amount: 15, priceSol: 1.19 },
      { id: 'l2', assetId: 'solara', seller: SELLERS[1], kind: 'night', amount: 2, priceSol: 1.68 },
      { id: 'l3', assetId: 'cenote', seller: SELLERS[2], kind: 'fraction', amount: 40, priceSol: 0.63 },
      { id: 'l4', assetId: 'kumo', seller: SELLERS[3], kind: 'night', amount: 3, priceSol: 2.35 },
      { id: 'l5', assetId: 'lumen', seller: SELLERS[4], kind: 'fraction', amount: 4, priceSol: 2.46 },
      { id: 'l6', assetId: 'alfama', seller: SELLERS[5], kind: 'fraction', amount: 20, priceSol: 0.48 },
      { id: 'l7', assetId: 'lumen', seller: SELLERS[1], kind: 'night', amount: 3, priceSol: 5.85 },
    ],
    loans: [],
    activity: [
      {
        id: 'a1',
        assetId: 'cenote',
        title: 'Nights booked',
        detail: '4 nights · Casa Cenote · 5.00 SOL',
        sig: fakeSig(),
        at: now - 1000 * 60 * 18,
      },
      {
        id: 'a2',
        assetId: 'solara',
        title: 'Fractions traded',
        detail: '25 WF-MAR · 1.19 SOL',
        sig: fakeSig(),
        at: now - 1000 * 60 * 54,
      },
      {
        id: 'a3',
        assetId: 'lumen',
        title: 'Collateral posted',
        detail: '12 WF-ZER locked · 1,800 USDC borrowed',
        sig: fakeSig(),
        at: now - 1000 * 60 * 60 * 5,
      },
      {
        id: 'a4',
        assetId: 'kumo',
        title: 'Primary issuance',
        detail: '100 WF-KYO minted to the SPV book',
        sig: fakeSig(),
        at: now - 1000 * 60 * 60 * 26,
      },
    ],
    sold: {},
  }
}

export function isState(value: unknown): value is State {
  if (!value || typeof value !== 'object') return false
  const state = value as State
  return (
    Array.isArray(state.holdings) &&
    Array.isArray(state.listings) &&
    Array.isArray(state.loans) &&
    Array.isArray(state.activity) &&
    typeof state.sol === 'number' &&
    typeof state.usdc === 'number' &&
    !!state.sold
  )
}

export function shortAddr(addr: string, connected: boolean) {
  if (addr === YOU && connected) return 'You'
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

export function holdingOf(state: State, assetId: string): Holding {
  return (
    state.holdings.find((item) => item.assetId === assetId) ?? {
      assetId,
      fractions: 0,
      nightTokens: 0,
      stays: [],
    }
  )
}

export function loanOf(state: State, assetId: string): Loan | undefined {
  return state.loans.find((item) => item.assetId === assetId)
}

export function listedAmount(state: State, assetId: string, kind: Instrument) {
  return state.listings
    .filter((item) => item.seller === YOU && item.assetId === assetId && item.kind === kind)
    .reduce((sum, item) => sum + item.amount, 0)
}

export function freeFractions(state: State, assetId: string) {
  const holding = holdingOf(state, assetId)
  const locked = loanOf(state, assetId)?.locked ?? 0
  return holding.fractions - locked - listedAmount(state, assetId, 'fraction')
}

export function freeNights(state: State, assetId: string) {
  return holdingOf(state, assetId).nightTokens - listedAmount(state, assetId, 'night')
}

export function fractionsLeft(state: State, assetId: string) {
  return getAsset(assetId).fractionsForSale - (state.sold[assetId]?.fractions ?? 0)
}

export function nightsLeft(state: State, assetId: string) {
  return getAsset(assetId).nightsForSale - (state.sold[assetId]?.nights ?? 0)
}

export function fractionUsd(assetId: string) {
  return getAsset(assetId).fractionPriceSol * SOL_USD
}

export function nightUsd(assetId: string) {
  return getAsset(assetId).nightPriceSol * SOL_USD
}

export function maxBorrow(locked: number, assetId: string) {
  return Math.floor(locked * fractionUsd(assetId) * getAsset(assetId).maxLtv)
}

export function healthFactor(locked: number, debt: number, assetId: string) {
  if (debt <= 0 || locked <= 0) return Number.POSITIVE_INFINITY
  return (locked * fractionUsd(assetId) * getAsset(assetId).liqThreshold) / debt
}

export function takenDates(state: State, assetId: string) {
  const asset = getAsset(assetId)
  const stays = holdingOf(state, assetId).stays.flatMap((stay) => stay.dates)
  return new Set([...asset.blackouts, ...asset.reserved, ...stays])
}

function upsertHolding(state: State, next: Holding) {
  const exists = state.holdings.some((item) => item.assetId === next.assetId)
  const holdings = exists
    ? state.holdings.map((item) => (item.assetId === next.assetId ? next : item))
    : [...state.holdings, next]
  return holdings
}

function bumpSold(state: State, assetId: string, kind: 'fractions' | 'nights', amount: number) {
  const prev = state.sold[assetId] ?? { fractions: 0, nights: 0 }
  return {
    ...state.sold,
    [assetId]: { ...prev, [kind]: prev[kind] + amount },
  }
}

function continuous(dates: string[]) {
  const sorted = [...dates].sort()
  for (let i = 1; i < sorted.length; i++) {
    if (addDays(sorted[i - 1], 1) !== sorted[i]) return false
  }
  return sorted
}

export function reasonBuyFractions(state: State, assetId: string, amount: number) {
  if (!state.connected) return 'Connect a wallet first.'
  if (!Number.isInteger(amount) || amount < 1) return 'Enter at least 1 fraction.'
  const left = fractionsLeft(state, assetId)
  if (amount > left) {
    return left < 1 ? 'Primary inventory is sold out.' : `Only ${left} fractions left on primary.`
  }
  const cost = amount * getAsset(assetId).fractionPriceSol
  if (cost > state.sol + 1e-9) return 'Not enough SOL in this wallet.'
  return null
}

export function applyBuyFractions(state: State, assetId: string, amount: number): Result {
  const error = reasonBuyFractions(state, assetId, amount)
  if (error) return { error }
  const asset = getAsset(assetId)
  const cost = solR(amount * asset.fractionPriceSol)
  const prev = holdingOf(state, assetId)
  const next = withActivity(
    {
      ...state,
      sol: solR(state.sol - cost),
      holdings: upsertHolding(state, { ...prev, fractions: prev.fractions + amount }),
      sold: bumpSold(state, assetId, 'fractions', amount),
    },
    act(assetId, 'Fractions bought', `${amount} ${asset.fractionSymbol} · ${solFmt(cost)}`),
  )
  return { state: next }
}

function reasonDates(state: State, assetId: string, dates: string[]) {
  if (!state.connected) return 'Connect a wallet first.'
  if (dates.length < 1) return 'Select at least one night.'
  const sorted = continuous(dates)
  if (!sorted) return 'Select a continuous range.'
  const asset = getAsset(assetId)
  if (sorted.length < asset.minStay) {
    return `${asset.name} has a ${asset.minStay}-night minimum.`
  }
  const taken = takenDates(state, assetId)
  if (sorted.some((day) => day < TODAY || taken.has(day))) return 'Those dates are not available.'
  return null
}

export function reasonBook(state: State, assetId: string, dates: string[]) {
  const error = reasonDates(state, assetId, dates)
  if (error) return error
  const left = nightsLeft(state, assetId)
  if (dates.length > left) {
    return left < 1 ? 'Night inventory is sold out.' : `Only ${left} nights left in inventory.`
  }
  const cost = dates.length * getAsset(assetId).nightPriceSol
  if (cost > state.sol + 1e-9) return 'Not enough SOL in this wallet.'
  return null
}

export function applyBook(state: State, assetId: string, dates: string[]): Result {
  const error = reasonBook(state, assetId, dates)
  if (error) return { error }
  const asset = getAsset(assetId)
  const sorted = [...dates].sort()
  const cost = solR(sorted.length * asset.nightPriceSol)
  const prev = holdingOf(state, assetId)
  const stay: Stay = { id: uid('stay'), assetId, dates: sorted, source: 'sol' }
  const next = withActivity(
    {
      ...state,
      sol: solR(state.sol - cost),
      holdings: upsertHolding(state, { ...prev, stays: [...prev.stays, stay] }),
      sold: bumpSold(state, assetId, 'nights', sorted.length),
    },
    act(assetId, 'Stay booked', `${sorted.length} nights · ${asset.name} · ${solFmt(cost)}`),
  )
  return { state: next }
}

export function reasonRedeem(state: State, assetId: string, dates: string[]) {
  const error = reasonDates(state, assetId, dates)
  if (error) return error
  const free = freeNights(state, assetId)
  if (dates.length > free) {
    return free < 1
      ? 'You have no free night tokens for this asset.'
      : `You can redeem ${free} night token${free === 1 ? '' : 's'}.`
  }
  return null
}

export function applyRedeem(state: State, assetId: string, dates: string[]): Result {
  const error = reasonRedeem(state, assetId, dates)
  if (error) return { error }
  const asset = getAsset(assetId)
  const sorted = [...dates].sort()
  const prev = holdingOf(state, assetId)
  const stay: Stay = { id: uid('stay'), assetId, dates: sorted, source: 'redeem' }
  const next = withActivity(
    {
      ...state,
      holdings: upsertHolding(state, {
        ...prev,
        nightTokens: prev.nightTokens - sorted.length,
        stays: [...prev.stays, stay],
      }),
    },
    act(assetId, 'Nights redeemed', `${sorted.length} ${asset.nightSymbol} · ${asset.name}`),
  )
  return { state: next }
}

export function reasonBuyListing(state: State, listingId: string) {
  if (!state.connected) return 'Connect a wallet first.'
  const listing = state.listings.find((item) => item.id === listingId)
  if (!listing) return 'That order is no longer on the book.'
  if (listing.seller === YOU) return 'This is your own order.'
  const cost = listing.amount * listing.priceSol
  if (cost > state.sol + 1e-9) return 'Not enough SOL in this wallet.'
  return null
}

export function applyBuyListing(state: State, listingId: string): Result {
  const error = reasonBuyListing(state, listingId)
  if (error) return { error }
  const listing = state.listings.find((item) => item.id === listingId)!
  const asset = getAsset(listing.assetId)
  const cost = solR(listing.amount * listing.priceSol)
  const prev = holdingOf(state, listing.assetId)
  const holding: Holding =
    listing.kind === 'fraction'
      ? { ...prev, fractions: prev.fractions + listing.amount }
      : { ...prev, nightTokens: prev.nightTokens + listing.amount }
  const symbol = listing.kind === 'fraction' ? asset.fractionSymbol : asset.nightSymbol
  const next = withActivity(
    {
      ...state,
      sol: solR(state.sol - cost),
      holdings: upsertHolding(state, holding),
      listings: state.listings.filter((item) => item.id !== listingId),
    },
    act(listing.assetId, 'Order filled', `${listing.amount} ${symbol} · ${solFmt(cost)}`),
  )
  return { state: next }
}

export function reasonList(
  state: State,
  assetId: string,
  kind: Instrument,
  amount: number,
  priceSol: number,
) {
  if (!state.connected) return 'Connect a wallet first.'
  if (!Number.isInteger(amount) || amount < 1) return 'Enter at least 1 token.'
  if (!(priceSol > 0)) return 'Set a price above 0.'
  const free = kind === 'fraction' ? freeFractions(state, assetId) : freeNights(state, assetId)
  if (amount > free) {
    return free < 1 ? 'Nothing free to list. Locked and listed tokens are held back.' : `You can list ${free}.`
  }
  return null
}

export function applyList(
  state: State,
  assetId: string,
  kind: Instrument,
  amount: number,
  priceSol: number,
): Result {
  const error = reasonList(state, assetId, kind, amount, priceSol)
  if (error) return { error }
  const asset = getAsset(assetId)
  const symbol = kind === 'fraction' ? asset.fractionSymbol : asset.nightSymbol
  const listing = {
    id: uid('list'),
    assetId,
    seller: YOU,
    kind,
    amount,
    priceSol: solR(priceSol),
  }
  const next = withActivity(
    { ...state, listings: [listing, ...state.listings] },
    act(assetId, 'Order listed', `${amount} ${symbol} · ${solFmt(priceSol)} each`),
  )
  return { state: next }
}

export function applyCancel(state: State, listingId: string): Result {
  const listing = state.listings.find((item) => item.id === listingId)
  if (!listing || listing.seller !== YOU) return { error: 'Order not found.' }
  const asset = getAsset(listing.assetId)
  const symbol = listing.kind === 'fraction' ? asset.fractionSymbol : asset.nightSymbol
  const next = withActivity(
    { ...state, listings: state.listings.filter((item) => item.id !== listingId) },
    act(listing.assetId, 'Order cancelled', `${listing.amount} ${symbol} returned to your wallet`),
  )
  return { state: next }
}

export function reasonLockBorrow(state: State, assetId: string, lock: number, borrow: number) {
  if (!state.connected) return 'Connect a wallet first.'
  if (!Number.isInteger(lock) || lock < 0) return 'Lock amount looks wrong.'
  if (!Number.isInteger(borrow) || borrow < 0) return 'Borrow amount looks wrong.'
  if (lock === 0 && borrow === 0) return 'Set a lock or a borrow amount.'
  const free = freeFractions(state, assetId)
  if (lock > free) return free < 1 ? 'No free fractions to lock.' : `You can lock ${free} fractions.`
  const current = loanOf(state, assetId)
  const newLocked = (current?.locked ?? 0) + lock
  const newDebt = (current?.debtUsdc ?? 0) + borrow
  if (newDebt > 0 && newLocked < 1) return 'Lock fractions before borrowing.'
  const cap = maxBorrow(newLocked, assetId)
  if (newDebt > cap) {
    return `That loan passes the ${Math.round(getAsset(assetId).maxLtv * 100)}% LTV cap of ${cap.toLocaleString('en-US')} USDC.`
  }
  return null
}

export function applyLockBorrow(state: State, assetId: string, lock: number, borrow: number): Result {
  const error = reasonLockBorrow(state, assetId, lock, borrow)
  if (error) return { error }
  const asset = getAsset(assetId)
  const current = loanOf(state, assetId)
  const loan: Loan = {
    assetId,
    locked: (current?.locked ?? 0) + lock,
    debtUsdc: money((current?.debtUsdc ?? 0) + borrow),
  }
  const loans = current
    ? state.loans.map((item) => (item.assetId === assetId ? loan : item))
    : [...state.loans, loan]
  const detail =
    borrow > 0
      ? `${lock} ${asset.fractionSymbol} locked · ${usdcFmt(borrow)} borrowed`
      : `${lock} ${asset.fractionSymbol} locked`
  const next = withActivity(
    { ...state, usdc: money(state.usdc + borrow), loans },
    act(assetId, borrow > 0 ? 'Collateral posted' : 'Fractions locked', detail),
  )
  return { state: next }
}

export function reasonRepay(state: State, assetId: string, amount: number) {
  if (!state.connected) return 'Connect a wallet first.'
  const loan = loanOf(state, assetId)
  if (!loan || loan.debtUsdc <= 0) return 'There is no debt on this asset.'
  if (!(amount > 0)) return 'Enter a repayment.'
  if (amount > state.usdc + 0.001) return 'Not enough USDC in this wallet.'
  if (amount > loan.debtUsdc + 0.001) return 'That is more than the balance.'
  return null
}

export function applyRepay(state: State, assetId: string, amount: number): Result {
  const error = reasonRepay(state, assetId, amount)
  if (error) return { error }
  const loan = loanOf(state, assetId)!
  const asset = getAsset(assetId)
  const pay = money(Math.min(amount, loan.debtUsdc))
  const remaining = money(loan.debtUsdc - pay)
  const loans =
    remaining <= 0
      ? state.loans.filter((item) => item.assetId !== assetId)
      : state.loans.map((item) => (item.assetId === assetId ? { ...item, debtUsdc: remaining } : item))
  const detail =
    remaining <= 0
      ? `${usdcFmt(pay)} repaid · ${asset.fractionSymbol} unlocked`
      : `${usdcFmt(pay)} repaid · ${usdcFmt(remaining)} still open`
  const next = withActivity(
    { ...state, usdc: money(state.usdc - pay), loans },
    act(assetId, remaining <= 0 ? 'Loan closed' : 'Loan repaid', detail),
  )
  return { state: next }
}

export function portfolioUsd(state: State) {
  let fractions = 0
  let nights = 0
  for (const holding of state.holdings) {
    const asset = ASSETS.find((item) => item.id === holding.assetId)
    if (!asset) continue
    fractions += holding.fractions * asset.fractionPriceSol * SOL_USD
    nights += holding.nightTokens * asset.nightPriceSol * SOL_USD
  }
  const debt = state.loans.reduce((sum, loan) => sum + loan.debtUsdc, 0)
  const liquid = state.sol * SOL_USD + state.usdc
  return { fractions, nights, debt, liquid, net: fractions + nights + liquid - debt }
}

export function monthlyYieldUsd(state: State) {
  return state.holdings.reduce((sum, holding) => {
    const asset = ASSETS.find((item) => item.id === holding.assetId)
    if (!asset) return sum
    return sum + (holding.fractions * asset.fractionPriceSol * SOL_USD * asset.yieldPct) / 100 / 12
  }, 0)
}

export function borrowPowerUsd(state: State) {
  return state.holdings.reduce((sum, holding) => {
    const asset = ASSETS.find((item) => item.id === holding.assetId)
    if (!asset) return sum
    const locked = loanOf(state, holding.assetId)?.locked ?? 0
    const debt = loanOf(state, holding.assetId)?.debtUsdc ?? 0
    const free = freeFractions(state, holding.assetId)
    const headroom = Math.max(0, maxBorrow(locked, holding.assetId) - debt)
    return sum + headroom + maxBorrow(free, holding.assetId)
  }, 0)
}

export function appraisedTotal() {
  return ASSETS.reduce((sum, asset) => sum + asset.appraisedUsd, 0)
}
