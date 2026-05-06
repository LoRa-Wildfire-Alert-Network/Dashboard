import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NodeFilter from '../../../Components/NodeFilter/NodeFilter'

describe('NodeFilter', () => {
  it('renders all filter headings', () => {
    render(<NodeFilter onChange={vi.fn()} />)
    expect(screen.getByText('Filter Options')).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('Node Health')).toBeInTheDocument()
  })

  it('renders all filter checkboxes', () => {
    render(<NodeFilter onChange={vi.fn()} />)
    expect(screen.getByLabelText(/only show subscribed/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/smoke detected/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/temp above/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/humidity below/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/low battery/i)).toBeInTheDocument()
  })

  it('calls onChange with initial state on mount', async () => {
    const onChange = vi.fn()
    render(<NodeFilter onChange={onChange} />)
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        smokeDetected: false,
        tempAbove: undefined,
        humidityBelow: undefined,
        lowBattery: false,
        onlySubscribed: false,
      })
    })
  })

  it('toggles smokeDetected filter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NodeFilter onChange={onChange} />)

    await user.click(screen.getByLabelText(/smoke detected/i))

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect(lastCall.smokeDetected).toBe(true)
    })
  })

  it('toggles lowBattery filter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NodeFilter onChange={onChange} />)

    await user.click(screen.getByLabelText(/low battery/i))

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect(lastCall.lowBattery).toBe(true)
    })
  })

  it('toggles onlySubscribed filter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NodeFilter onChange={onChange} />)

    await user.click(screen.getByLabelText(/only show subscribed/i))

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect(lastCall.onlySubscribed).toBe(true)
    })
  })

  it('shows temp input when temp above is checked', async () => {
    const user = userEvent.setup()
    render(<NodeFilter onChange={vi.fn()} />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText(/temp above/i))
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0)
  })

  it('shows humidity input when humidity below is checked', async () => {
    const user = userEvent.setup()
    render(<NodeFilter onChange={vi.fn()} />)

    await user.click(screen.getByLabelText(/humidity below/i))
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0)
  })

  it('updates tempAbove when value typed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NodeFilter onChange={onChange} />)

    await user.click(screen.getByLabelText(/temp above/i))
    const input = screen.getAllByRole('textbox')[0]
    await user.type(input, '35')

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect(lastCall.tempAbove).toBe(35)
    })
  })

  it('clears tempAbove when temp checkbox is unchecked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NodeFilter onChange={onChange} />)

    await user.click(screen.getByLabelText(/temp above/i))
    await user.click(screen.getByLabelText(/temp above/i))

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect(lastCall.tempAbove).toBeUndefined()
    })
  })
})
