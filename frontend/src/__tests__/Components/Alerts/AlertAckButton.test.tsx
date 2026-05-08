import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlertAckButton from '../../../Components/Alerts/AlertAckButton'

const mockGetToken = vi.fn().mockResolvedValue('mock-token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}))

describe('AlertAckButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Acknowledge" when not acknowledged', () => {
    render(
      <AlertAckButton alertId={1} acknowledged={false} onAckChange={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument()
  })

  it('renders "Acknowledged" when acknowledged', () => {
    render(
      <AlertAckButton alertId={1} acknowledged={true} onAckChange={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: /acknowledged/i })).toBeInTheDocument()
  })

  it('applies green styles when acknowledged', () => {
    render(<AlertAckButton alertId={1} acknowledged={true} onAckChange={vi.fn()} />)
    expect(screen.getByRole('button').className).toContain('bg-green-500')
  })

  it('applies gray styles when not acknowledged', () => {
    render(<AlertAckButton alertId={1} acknowledged={false} onAckChange={vi.fn()} />)
    expect(screen.getByRole('button').className).toContain('bg-gray-300')
  })

  it('calls onAckChange(true) when acknowledging a pending alert', async () => {
    const user = userEvent.setup()
    const onAckChange = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response)

    render(
      <AlertAckButton alertId={42} acknowledged={false} onAckChange={onAckChange} />
    )

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(onAckChange).toHaveBeenCalledWith(true)
    })
  })

  it('calls onAckChange(false) when un-acknowledging', async () => {
    const user = userEvent.setup()
    const onAckChange = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response)

    render(
      <AlertAckButton alertId={42} acknowledged={true} onAckChange={onAckChange} />
    )

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(onAckChange).toHaveBeenCalledWith(false)
    })
  })

  it('calls the correct API endpoint', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response)

    render(
      <AlertAckButton alertId={99} acknowledged={false} onAckChange={vi.fn()} />
    )

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/alerts/99/ack'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('does not call onAckChange when fetch fails', async () => {
    const user = userEvent.setup()
    const onAckChange = vi.fn()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))

    render(
      <AlertAckButton alertId={1} acknowledged={false} onAckChange={onAckChange} />
    )

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(onAckChange).not.toHaveBeenCalled()
    })
  })

  it('does not call onAckChange when response is not ok', async () => {
    const user = userEvent.setup()
    const onAckChange = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response)

    render(
      <AlertAckButton alertId={1} acknowledged={false} onAckChange={onAckChange} />
    )

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(onAckChange).not.toHaveBeenCalled()
    })
  })
})
