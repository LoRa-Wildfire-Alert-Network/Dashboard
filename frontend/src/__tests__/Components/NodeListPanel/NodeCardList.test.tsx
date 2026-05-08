import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NodeCardList from '../../../Components/NodeListPanel/NodeCardList'
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
  nodeData: [] as ShortNodeData[],
  expandedNodeEuis: [] as string[],
  onCardClick: vi.fn(),
  apiBaseUrl: 'http://localhost:8000',
}

describe('NodeCardList', () => {
  it('shows "No nodes available" when list is empty', () => {
    render(<NodeCardList {...defaultProps} />)
    expect(screen.getByText('No nodes available.')).toBeInTheDocument()
  })

  it('renders one NodeCard per node', () => {
    const nodes = [makeNode('EUI:01'), makeNode('EUI:02'), makeNode('EUI:03')]
    render(<NodeCardList {...defaultProps} nodeData={nodes} />)
    expect(screen.getByText(/EUI: EUI:01/)).toBeInTheDocument()
    expect(screen.getByText(/EUI: EUI:02/)).toBeInTheDocument()
    expect(screen.getByText(/EUI: EUI:03/)).toBeInTheDocument()
  })

  it('does not show empty message when nodes exist', () => {
    render(<NodeCardList {...defaultProps} nodeData={[makeNode('X')]} />)
    expect(screen.queryByText('No nodes available.')).not.toBeInTheDocument()
  })

  it('passes subscribedNodeIds to NodeCard', () => {
    const nodes = [makeNode('EUI:01')]
    render(
      <NodeCardList
        {...defaultProps}
        nodeData={nodes}
        expandedNodeEuis={['EUI:01']}
        subscribedNodeIds={['EUI:01']}
      />
    )
    expect(screen.getByRole('button', { name: /subscribed/i })).toBeInTheDocument()
  })
})
