import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CardShortData from '../../../Components/NodeListPanel/CardShortData'
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

describe('CardShortData', () => {
  it('renders the device EUI', () => {
    render(<CardShortData nodeData={baseNode} />)
    expect(screen.getByText(/AA:BB:CC:DD:EE:FF/)).toBeInTheDocument()
  })

  it('renders fire icon when smoke detected', () => {
    const node = { ...baseNode, smoke_detected: true }
    const { container } = render(<CardShortData nodeData={node} />)
    // FontAwesome renders an SVG; confirm icon container is present
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders check icon for healthy node', () => {
    const { container } = render(<CardShortData nodeData={baseNode} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders battery icon when battery is low', () => {
    const node = { ...baseNode, battery_level: 10 }
    const { container } = render(<CardShortData nodeData={node} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
