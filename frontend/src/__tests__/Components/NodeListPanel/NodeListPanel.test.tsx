import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NodeListPanel from '../../../Components/NodeListPanel/NodeListPanel'
import type { ShortNodeData } from '../../../types/nodeTypes'

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('token') }),
}))

vi.mock('../../../providers/AuthContext', () => ({
  useAuthContext: () => ({ hasPermission: () => true }),
}))

const makeNode = (eui: string): ShortNodeData => ({
  device_eui: eui,
  temperature_c: 22,
  smoke_detected: false,
  humidity_pct: 55,
  latitude: 44.5,
  longitude: -123.2,
  battery_level: 80,
})

const defaultProps = {
  nodeData: [makeNode('EUI:01')],
  userSubscriptions: [] as string[],
  expandedNodeEuis: [] as string[],
  onCardClick: vi.fn(),
  apiBaseUrl: 'http://localhost:8000',
  onSubscriptionsChange: vi.fn(),
  onFilterChange: vi.fn(),
}

describe('NodeListPanel', () => {
  it('renders "Node List" heading', () => {
    render(<NodeListPanel {...defaultProps} />)
    expect(screen.getByText('Node List')).toBeInTheDocument()
  })

  it('renders filter icon button', () => {
    render(<NodeListPanel {...defaultProps} />)
    // FontAwesome filter icon renders as SVG
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('does not show NodeFilter by default', () => {
    render(<NodeListPanel {...defaultProps} />)
    expect(screen.queryByText('Filter Options')).not.toBeInTheDocument()
  })

  it('shows NodeFilter after clicking the filter icon', async () => {
    const user = userEvent.setup()
    render(<NodeListPanel {...defaultProps} />)
    await user.click(document.querySelector('svg')!)
    expect(screen.getByText('Filter Options')).toBeInTheDocument()
  })

  it('hides NodeFilter after clicking the filter icon again', async () => {
    const user = userEvent.setup()
    render(<NodeListPanel {...defaultProps} />)
    const icon = document.querySelector('svg')!
    await user.click(icon)
    await user.click(icon)
    expect(screen.queryByText('Filter Options')).not.toBeInTheDocument()
  })

  it('renders node cards', () => {
    render(<NodeListPanel {...defaultProps} />)
    expect(screen.getByText(/EUI: EUI:01/)).toBeInTheDocument()
  })
})
