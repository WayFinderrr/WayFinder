export type Instrument = 'fraction' | 'night'

export type Stay = {
  id: string
  assetId: string
  dates: string[]
  source: 'sol' | 'redeem'
}

export type Holding = {
  assetId: string
  fractions: number
  nightTokens: number
  stays: Stay[]
}

export type Listing = {
  id: string
  assetId: string
  seller: string
  kind: Instrument
  amount: number
  priceSol: number
}

export type Loan = {
  assetId: string
  locked: number
  debtUsdc: number
}

export type Activity = {
  id: string
  assetId: string
  title: string
  detail: string
  sig: string
  at: number
}

export type State = {
  connected: boolean
  sol: number
  usdc: number
  holdings: Holding[]
  listings: Listing[]
  loans: Loan[]
  activity: Activity[]
  sold: Record<string, { fractions: number; nights: number }>
}

export type Asset = {
  id: string
  name: string
  kind: string
  place: string
  country: string
  blurb: string
  story: string
  image: string
  spv: string
  jurisdiction: string
  operator: string
  rules: string
  fractionSymbol: string
  nightSymbol: string
  fractionSupply: number
  nightCap: number
  fractionsForSale: number
  nightsForSale: number
  fractionPriceSol: number
  nightPriceSol: number
  yieldPct: number
  occupancyPct: number
  maxLtv: number
  liqThreshold: number
  minStay: number
  changePct: number
  spark: number[]
  blackouts: string[]
  reserved: string[]
  appraisedUsd: number
}
