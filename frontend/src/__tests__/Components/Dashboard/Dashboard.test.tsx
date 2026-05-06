import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from '../../../Components/Dashboard/Dashboard'
import type { Alert, ShortNodeData } from '../../../types/nodeTypes'

const mockGetToken = vi.fn().mockResolvedValue('mock-token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}))

const mockHasPermission = vi.fn().mockReturnValue(true)

vi.mock('../../../providers/AuthContext', () => ({
  useAuthContext: () => ({ hasPermission: mockHasPermission }),
}))

vi.mock('../../../Components/WildfireMap/WildfireMap', () => ({
  default: ({ nodeData }: { nodeData: ShortNodeData[] }) => (
    <div data-testid="wildfire-map">{nodeData.length} nodes</div>
  ),
}))

vi.mock('../../../Components/NodeDetails/NodeDetails', () => ({
  default: ({ nodeEui }: { nodeEui: string }) => (
    <div data-testid="node-details">{nodeEui}</div>
  ),
}))

vi.mock('../../../Components/NodeListPanel/NodeListPanel', () => ({
  default: ({ nodeData }: { nodeData: ShortNodeData[] }) => (
    <div data-testid="node-list-panel">
      <span>Node List</span>
      <span>{nodeData.length} nodes</span>
    </div>
  ),
}))

vi.mock('../../../Components/Alerts/AlertAckButton', () => ({
  default: () => <button>Acknowledge</button>,
}))

const mockNode: ShortNodeData = {
  device_eui: 'EUI:01',
  temperature_c: 22,
  smoke_detected: false,
  humidity_pct: 55,
  latitude: 44.5,
  longitude: -123.2,
  battery_level: 80,
}

const mockAlert: Alert = {
  id: 1,
  dev_eui: 'EUI:01',
  alert_type: 'smoke',
  message: 'Smoke detected!',
  created_at: new Date().toISOString(),
  acknowledged: false,
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasPermission.mockReturnValue(true)
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({
          json: async () => [mockNode],
        } as Response)
      }
      if (url.includes('/subscriptions')) {
        return Promise.resolve({
          json: async () => ['EUI:01'],
        } as Response)
      }
      if (url.includes('/alerts')) {
        return Promise.resolve({
          json: async () => [mockAlert],
        } as Response)
      }
      return Promise.resolve({ json: async () => [] } as Response)
    })
  })

  it('renders the map', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('wildfire-map')).toBeInTheDocument()
    })
  })

  it('renders the Node List panel', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText('Node List')).toBeInTheDocument()
    })
  })

  it('renders All Alerts count section', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText('All Alerts')).toBeInTheDocument()
    })
  })

  it('shows unacknowledged alert count', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('unacknowledged')).toBeInTheDocument()
    })
  })

  it('shows access restricted when missing view_nodes permission', async () => {
    mockHasPermission.mockReturnValue(false)
    render(<Dashboard />)
    expect(screen.getByText('Access Restricted')).toBeInTheDocument()
  })

  it('fetches summary and passes nodes to map', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('wildfire-map').textContent).toBe('1 nodes')
    })
  })

  it('fetches from /summary, /subscriptions, /alerts on mount', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      const calls = vi.mocked(global.fetch).mock.calls.map(([url]) => url as string)
      expect(calls.some((u) => u.includes('/summary'))).toBe(true)
      expect(calls.some((u) => u.includes('/subscriptions'))).toBe(true)
      expect(calls.some((u) => u.includes('/alerts'))).toBe(true)
    })
  })

  it('deduplicates nodes with same device_eui', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({
          json: async () => [mockNode, { ...mockNode }],
        } as Response)
      }
      return Promise.resolve({ json: async () => [] } as Response)
    })

    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('wildfire-map').textContent).toBe('1 nodes')
    })
  })

  it('shows all nodes when no filter is active', async () => {
    const smokyNode = { ...mockNode, device_eui: 'EUI:02', smoke_detected: true }
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({
          json: async () => [mockNode, smokyNode],
        } as Response)
      }
      return Promise.resolve({ json: async () => [] } as Response)
    })

    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('wildfire-map').textContent).toBe('2 nodes')
    })
  })
})
