export type Route =
  | { page: 'discover' }
  | { page: 'market' }
  | { page: 'vault' }
  | { page: 'portfolio' }
  | { page: 'asset'; id: string }

export type Go = (route: Route) => void
