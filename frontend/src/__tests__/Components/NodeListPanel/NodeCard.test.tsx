import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NodeCard from '../../../Components/NodeListPanel/NodeCard'
import type { ShortNodeData } from '../../../types/nodeTypes'

const mockGetToken = vi.fn().mockResolvedValue('mock-token')
const mockHasPermission = vi.fn().mockReturnValue(true)

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}))

vi.mock('../../../providers/AuthContext', () => ({
  useAuthContext: () => ({ hasPermission: mockHasPermission }),
}))

const node: ShortNodeData = {
  device_eui: 'AA:BB:CC:DD',
  temperature_c: 22,
  smoke_detected: false,
  humidity_pct: 55,
  latitude: 44.5,
  longitude: -123.2,
  battery_level: 90,
}

const defaultProps = {
  nodeData: node,
  expandedNodeEuis: [] as string[],
  onCardClick: vi.fn(),
  apiBaseUrl: 'http://localhost:8000',
  subscribedNodeIds: [] as string[],
  onSubscriptionsChange: vi.fn(),
}

describe('NodeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasPermission.mockReturnValue(true)
  })

  it('renders collapsed (CardShortData) when not in expandedNodeEuis', () => {
    render(<NodeCard {...defaultProps} />)
    expect(screen.getByText(/EUI: AA:BB:CC:DD/)).toBeInTheDocument()
    // Subscribe button only appears in expanded view
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument()
  })

  it('renders expanded (CardLongData) when in expandedNodeEuis', () => {
    render(<NodeCard {...defaultProps} expandedNodeEuis={['AA:BB:CC:DD']} />)
    expect(screen.getByText(/Temperature:/)).toBeInTheDocument()
    expect(screen.getByText(/Humidity:/)).toBeInTheDocument()
  })

  it('calls onCardClick when card is clicked', async () => {
    const user = userEvent.setup()
    const onCardClick = vi.fn()
    render(<NodeCard {...defaultProps} onCardClick={onCardClick} />)
    await user.click(screen.getByText(/EUI: AA:BB:CC:DD/).closest('div')!)
    expect(onCardClick).toHaveBeenCalledTimes(1)
  })

  it('optimistically subscribes before API call', async () => {
    const user = userEvent.setup()
    const onSubscriptionsChange = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response)

    render(
      <NodeCard
        {...defaultProps}
        expandedNodeEuis={['AA:BB:CC:DD']}
        onSubscriptionsChange={onSubscriptionsChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /subscribe/i }))

    // Optimistic update is called before fetch resolves
    expect(onSubscriptionsChange).toHaveBeenCalledWith(['AA:BB:CC:DD'])
  })

  it('calls unsubscribe endpoint when already subscribed', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response)

    render(
      <NodeCard
        {...defaultProps}
        expandedNodeEuis={['AA:BB:CC:DD']}
        subscribedNodeIds={['AA:BB:CC:DD']}
      />
    )

    await user.click(screen.getByRole('button', { name: /subscribed/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/unsubscribe'),
        expect.any(Object)
      )
    })
  })

  it('calls subscribe endpoint when not subscribed', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response)

    render(
      <NodeCard
        {...defaultProps}
        expandedNodeEuis={['AA:BB:CC:DD']}
      />
    )

    await user.click(screen.getByRole('button', { name: /subscribe/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/subscribe'),
        expect.any(Object)
      )
    })
  })

  it('reverts optimistic update on fetch error', async () => {
    const user = userEvent.setup()
    const onSubscriptionsChange = vi.fn()
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))

    render(
      <NodeCard
        {...defaultProps}
        expandedNodeEuis={['AA:BB:CC:DD']}
        subscribedNodeIds={[]}
        onSubscriptionsChange={onSubscriptionsChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /subscribe/i }))

    await waitFor(() => {
      // First call is optimistic, second reverts
      expect(onSubscriptionsChange).toHaveBeenCalledTimes(2)
      const revertCall = onSubscriptionsChange.mock.calls[1][0]
      expect(revertCall).toEqual([])
    })
  })

  it('hides subscribe button when canSubscribe is false', () => {
    mockHasPermission.mockReturnValue(false)
    render(<NodeCard {...defaultProps} expandedNodeEuis={['AA:BB:CC:DD']} />)
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument()
  })
})
