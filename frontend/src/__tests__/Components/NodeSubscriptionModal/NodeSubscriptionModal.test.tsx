import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NodeSubscriptionModal from '../../../Components/NodeSubscriptionModal/NodeSubscriptionModal'

vi.mock('axios')
import axios from 'axios'

const mockNodes = [
  { device_eui: 'EUI:01', node_id: 'Node-1' },
  { device_eui: 'EUI:02', node_id: 'Node-2' },
  { device_eui: 'EUI:03', node_id: null },
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  subscribedNodeIds: [] as string[],
  onUpdate: vi.fn(),
  apiBaseUrl: 'http://localhost:8000',
  getAuthToken: vi.fn().mockResolvedValue('mock-token'),
}

describe('NodeSubscriptionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(axios.get).mockResolvedValue({ data: mockNodes })
    vi.mocked(axios.post).mockResolvedValue({ data: {} })
  })

  it('renders nothing when isOpen is false', () => {
    render(<NodeSubscriptionModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Nodes')).not.toBeInTheDocument()
  })

  it('renders modal when isOpen is true', async () => {
    render(<NodeSubscriptionModal {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Nodes')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    vi.mocked(axios.get).mockImplementation(() => new Promise(() => {}))
    render(<NodeSubscriptionModal {...defaultProps} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders nodes after loading', async () => {
    render(<NodeSubscriptionModal {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('EUI:01')).toBeInTheDocument()
      expect(screen.getByText('EUI:02')).toBeInTheDocument()
    })
  })

  it('shows error state when fetch fails', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('network error'))
    render(<NodeSubscriptionModal {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Failed to load nodes.')).toBeInTheDocument()
    })
  })

  it('closes when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<NodeSubscriptionModal {...defaultProps} onClose={onClose} />)
    await waitFor(() => screen.getByText('Cancel'))
    await user.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when × button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<NodeSubscriptionModal {...defaultProps} onClose={onClose} />)
    await waitFor(() => screen.getByLabelText('Close'))
    await user.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('pre-checks already subscribed nodes', async () => {
    render(
      <NodeSubscriptionModal {...defaultProps} subscribedNodeIds={['EUI:01']} />
    )
    // Wait for nodes to load
    await waitFor(() => screen.getByText('EUI:01'))

    const checkbox = screen.getByRole('checkbox', { name: /EUI:01/i }) as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('toggles a node checkbox', async () => {
    const user = userEvent.setup()
    render(<NodeSubscriptionModal {...defaultProps} />)
    await waitFor(() => screen.getByText('EUI:01'))

    const checkbox = screen.getByRole('checkbox', { name: /EUI:01/i }) as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    await user.click(checkbox)
    expect(checkbox.checked).toBe(true)
  })

  it('saves subscriptions on Save click and calls onUpdate', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    const onClose = vi.fn()
    render(
      <NodeSubscriptionModal
        {...defaultProps}
        onUpdate={onUpdate}
        onClose={onClose}
      />
    )
    await waitFor(() => screen.getByText('EUI:01'))

    await user.click(screen.getByRole('checkbox', { name: /EUI:01/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/subscribe'),
        { device_eui: 'EUI:01' },
        expect.any(Object)
      )
      expect(onUpdate).toHaveBeenCalledWith(['EUI:01'])
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('unsubscribes removed nodes on Save', async () => {
    const user = userEvent.setup()
    render(
      <NodeSubscriptionModal
        {...defaultProps}
        subscribedNodeIds={['EUI:01']}
      />
    )
    await waitFor(() => screen.getByText('EUI:01'))

    const checkbox = screen.getByRole('checkbox', { name: /EUI:01/i }) as HTMLInputElement
    await user.click(checkbox) // uncheck

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/unsubscribe'),
        { device_eui: 'EUI:01' },
        expect.any(Object)
      )
    })
  })

  it('shows select-all button', async () => {
    render(<NodeSubscriptionModal {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByTitle(/select all/i)).toBeInTheDocument()
    })
  })

  it('select-all selects all nodes', async () => {
    const user = userEvent.setup()
    render(<NodeSubscriptionModal {...defaultProps} />)
    await waitFor(() => screen.getByTitle(/select all/i))

    await user.click(screen.getByTitle(/select all/i))

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    checkboxes.forEach((cb) => expect(cb.checked).toBe(true))
  })
})
