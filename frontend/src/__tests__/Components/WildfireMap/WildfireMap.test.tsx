import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WildfireMap from '../../../Components/WildfireMap/WildfireMap'
import type { ShortNodeData } from '../../../types/nodeTypes'

// Must mock leaflet before WildfireMap is loaded
vi.mock('leaflet', async () => {
  const Icon = function (this: object) { return this }
  const Map = {
    addInitHook: vi.fn(),
    prototype: { options: { icon: null } },
  }
  const Marker = {
    prototype: { options: { icon: null } },
  }
  return {
    default: { Icon, Map, Marker, latLngBounds: vi.fn(() => ({})) },
    Icon,
    Map,
    Marker,
    latLngBounds: vi.fn(() => ({})),
  }
})

vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('leaflet-gesture-handling', () => ({ GestureHandling: vi.fn() }))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({
    children,
    eventHandlers,
  }: {
    children?: React.ReactNode
    eventHandlers?: { click?: () => void }
  }) => (
    <div
      data-testid="map-marker"
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  ),
  useMap: () => ({
    getBounds: vi.fn(() => ({})),
    on: vi.fn(),
    off: vi.fn(),
    setView: vi.fn(),
    fitBounds: vi.fn(),
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

describe('WildfireMap', () => {
  it('renders the map container', () => {
    render(<WildfireMap {...defaultProps} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('renders a tile layer', () => {
    render(<WildfireMap {...defaultProps} />)
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
  })

  it('renders one marker per node', () => {
    const nodes = [makeNode('EUI:01'), makeNode('EUI:02'), makeNode('EUI:03')]
    render(<WildfireMap {...defaultProps} nodeData={nodes} />)
    expect(screen.getAllByTestId('map-marker')).toHaveLength(3)
  })

  it('renders no markers when nodeData is empty', () => {
    render(<WildfireMap {...defaultProps} />)
    expect(screen.queryAllByTestId('map-marker')).toHaveLength(0)
  })

  it('calls onMarkerClick with correct EUI when marker is clicked', async () => {
    const user = userEvent.setup()
    const onMarkerClick = vi.fn()
    const nodes = [makeNode('EUI:01')]
    render(
      <WildfireMap {...defaultProps} nodeData={nodes} onMarkerClick={onMarkerClick} />
    )

    await user.click(screen.getByTestId('map-marker'))
    expect(onMarkerClick).toHaveBeenCalledWith('EUI:01')
  })

  it('skips nodes without valid coordinates', () => {
    const nodes = [
      makeNode('EUI:01', { latitude: 44.5, longitude: -123.2 }),
      { ...makeNode('EUI:02'), latitude: null as unknown as number, longitude: null as unknown as number },
    ]
    render(<WildfireMap {...defaultProps} nodeData={nodes} />)
    expect(screen.getAllByTestId('map-marker')).toHaveLength(1)
  })
})
