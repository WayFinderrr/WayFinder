import { WayfinderProvider } from './store'
import { Shell } from './shell'

export function App() {
  return (
    <WayfinderProvider>
      <Shell />
    </WayfinderProvider>
  )
}
