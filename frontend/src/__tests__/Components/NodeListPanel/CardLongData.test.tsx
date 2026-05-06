import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CardLongData from '../../../Components/NodeListPanel/CardLongData'
import type { ShortNodeData } from '../../../types/nodeTypes'

const baseNode: ShortNodeData = {
  device_eui: 'AA:BB:CC:DD:EE:FF',
  temperature_c: 20,
  smoke_detected: false,
  humidity_pct: 50,
  latitude: 44.5,
  longitude: -123.2,
  battery_level: 80,
}

const defaultProps = {
  nodeData: baseNode,
  onClick: vi.fn(),
  loading: false,
  canSubscribe: true,
  isSubscribed: false,
}

describe('CardLongData', () => {
  it('renders EUI', () => {
    render(<CardLongData {...defaultProps} />)
    expect(screen.getByText(/AA:BB:CC:DD:EE:FF/)).toBeInTheDocument()
  })

  it('renders temperature', () => {
    render(<CardLongData {...defaultProps} />)
    expect(screen.getByText(/20 °C/)).toBeInTheDocument()
  })

  it('renders humidity', () => {
    render(<CardLongData {...defaultProps} />)
    expect(screen.getByText(/50 %/)).toBeInTheDocument()
  })

  it('renders battery level', () => {
    render(<CardLongData {...defaultProps} />)
    expect(screen.getByText(/80 %/)).toBeInTheDocument()
  })

  it('shows "No" for smoke when not detected', () => {
    render(<CardLongData {...defaultProps} />)
    expect(screen.getByText(/Smoke Detected\?: No/)).toBeInTheDocument()
  })

  it('shows "Yes" for smoke when detected', () => {
    const props = { ...defaultProps, nodeData: { ...baseNode, smoke_detected: true } }
    render(<CardLongData {...props} />)
    expect(screen.getByText(/Smoke Detected\?: Yes/)).toBeInTheDocument()
  })

  it('shows subscribe button when canSubscribe is true', () => {
    render(<CardLongData {...defaultProps} />)
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument()
  })

  it('hides subscribe button when canSubscribe is false', () => {
    render(<CardLongData {...defaultProps} canSubscribe={false} />)
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument()
  })

  it('shows "Subscribed" label when subscribed', () => {
    render(<CardLongData {...defaultProps} isSubscribed={true} />)
    expect(screen.getByRole('button', { name: /subscribed/i })).toBeInTheDocument()
  })

  it('shows "Updating..." when loading', () => {
    render(<CardLongData {...defaultProps} loading={true} />)
    expect(screen.getByRole('button', { name: /updating/i })).toBeInTheDocument()
  })

  it('disables button while loading', () => {
    render(<CardLongData {...defaultProps} loading={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick when subscribe button clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<CardLongData {...defaultProps} onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: /subscribe/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies warning icon for high temperature', () => {
    const hotNode = { ...baseNode, temperature_c: 40 }
    const { container } = render(<CardLongData {...defaultProps} nodeData={hotNode} />)
    expect(screen.getByText(/40 °C/)).toBeInTheDocument()
    // Temperature warning icon should be rendered (not the spacer div)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies low humidity warning', () => {
    const dryNode = { ...baseNode, humidity_pct: 10 }
    const { container } = render(<CardLongData {...defaultProps} nodeData={dryNode} />)
    expect(screen.getByText(/10 %/)).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
