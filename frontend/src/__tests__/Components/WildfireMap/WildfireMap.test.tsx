import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as L from 'leaflet'
import WildfireMap from '../../../Components/WildfireMap/WildfireMap'
import type { ShortNodeData } from '../../../types/nodeTypes'

const { mockMarkerOn } = vi.hoisted(() => ({
  mockMarkerOn: vi.fn(),
}))

vi.mock('leaflet', () => {
  const Icon = function (this: object) { return this }
  const Map = { addInitHook: vi.fn(), prototype: { options: { icon: null } } }
  const Marker = { prototype: { options: { icon: null } } }
  return {
    Icon, Map, Marker,
    latLngBounds: vi.fn(() => ({})),
    marker: vi.fn(() => ({ on: mockMarkerOn })),
    markerClusterGroup: vi.fn(() => ({ addLayer: vi.fn() })),
    divIcon: vi.fn(() => ({})),
  }
})

vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('leaflet.markercluster', () => ({}))
vi.mock('leaflet.markercluster/dist/MarkerCluster.css', () => ({}))
vi.mock('leaflet.markercluster/dist/MarkerCluster.Default.css', () => ({}))
vi.mock('leaflet-gesture-handling', () => ({ GestureHandling: vi.fn() }))
vi.mock('leaflet-gesture-handling/dist/leaflet-gesture-handling.css', () => ({}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  useMap: () => ({
    getBounds: vi.fn(() => ({})),
    on: vi.fn(),
    off: vi.fn(),
    setView: vi.fn(),
    fitBounds: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
  }),
}))

const makeNode = (eui: string, overrides: Partial<ShortNodeData> = {}): ShortNodeData => ({
  device_eui: eui,
  temperature_c: 22,
  smoke_detected: false,
  humidity_pct: 50,
  latitude: 44.5,
  longitude: -123.2,
  battery_level: 80,
  ...overrides,
})

const defaultProps = {
  nodeData: [] as ShortNodeData[],
  mostRecentExpandedNodeEui: null,
  expandedNodeEuis: [] as string[],
  onMarkerClick: vi.fn(),
  setMapBounds: vi.fn(),
}

// Unique positions passed to L.marker across all effect runs
function uniquePositions() {
  return new Set(
    vi.mocked(L.marker).mock.calls.map(
      ([pos]) => `${(pos as number[])[0]},${(pos as number[])[1]}`
    )
  )
}

describe('WildfireMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the map container', () => {
    render(<WildfireMap {...defaultProps} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('renders a tile layer', () => {
    render(<WildfireMap {...defaultProps} />)
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
  })

  it('creates a marker for each valid node', () => {
    const nodes = [
      makeNode('EUI:01', { latitude: 44.1, longitude: -123.1 }),
      makeNode('EUI:02', { latitude: 44.2, longitude: -123.2 }),
      makeNode('EUI:03', { latitude: 44.3, longitude: -123.3 }),
    ]
    render(<WildfireMap {...defaultProps} nodeData={nodes} />)
    expect(uniquePositions().size).toBe(3)
  })

  it('creates no markers when nodeData is empty', () => {
    render(<WildfireMap {...defaultProps} />)
    expect(vi.mocked(L.marker)).not.toHaveBeenCalled()
  })

  it('calls onMarkerClick with correct EUI when marker click handler fires', () => {
    const onMarkerClick = vi.fn()
    const nodes = [makeNode('EUI:01')]
    render(
      <WildfireMap {...defaultProps} nodeData={nodes} onMarkerClick={onMarkerClick} />
    )

    const clickCall = mockMarkerOn.mock.calls.find(([event]) => event === 'click')
    expect(clickCall).toBeDefined()
    clickCall![1]()
    expect(onMarkerClick).toHaveBeenCalledWith('EUI:01')
  })

  it('skips nodes without valid coordinates', () => {
    const nodes = [
      makeNode('EUI:01', { latitude: 44.5, longitude: -123.2 }),
      { ...makeNode('EUI:02'), latitude: null as unknown as number, longitude: null as unknown as number },
    ]
    render(<WildfireMap {...defaultProps} nodeData={nodes} />)
    expect(uniquePositions().size).toBe(1)
  })
})
