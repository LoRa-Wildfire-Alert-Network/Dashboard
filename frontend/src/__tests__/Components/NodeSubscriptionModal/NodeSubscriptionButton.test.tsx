import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import NodeSubscriptionButton from '../../../Components/NodeSubscriptionModal/NodeSubscriptionButton'

const mockGetToken = vi.fn().mockResolvedValue('mock-token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}))

describe('NodeSubscriptionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing (returns null)', () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => [],
    } as Response)
    const { container } = render(
      <NodeSubscriptionButton
        apiBaseUrl="http://localhost:8000"
        onSubscriptionsChange={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('fetches subscriptions on mount', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ['EUI:01', 'EUI:02'],
    } as Response)
    const onSubscriptionsChange = vi.fn()

    render(
      <NodeSubscriptionButton
        apiBaseUrl="http://localhost:8000"
        onSubscriptionsChange={onSubscriptionsChange}
      />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/subscriptions',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
        })
      )
    })
  })

  it('calls onSubscriptionsChange with fetched subscription IDs', async () => {
    const subs = ['EUI:01', 'EUI:02']
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => subs,
    } as Response)
    const onSubscriptionsChange = vi.fn()

    render(
      <NodeSubscriptionButton
        apiBaseUrl="http://localhost:8000"
        onSubscriptionsChange={onSubscriptionsChange}
      />
    )

    await waitFor(() => {
      expect(onSubscriptionsChange).toHaveBeenCalledWith(subs)
    })
  })

  it('calls onSubscriptionsChange with [] when response is not an array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: 'bad' }),
    } as Response)
    const onSubscriptionsChange = vi.fn()

    render(
      <NodeSubscriptionButton
        apiBaseUrl="http://localhost:8000"
        onSubscriptionsChange={onSubscriptionsChange}
      />
    )

    await waitFor(() => {
      expect(onSubscriptionsChange).toHaveBeenCalledWith([])
    })
  })

  it('silently handles fetch errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))
    const onSubscriptionsChange = vi.fn()

    render(
      <NodeSubscriptionButton
        apiBaseUrl="http://localhost:8000"
        onSubscriptionsChange={onSubscriptionsChange}
      />
    )

    // Should not throw
    await new Promise((r) => setTimeout(r, 50))
    expect(onSubscriptionsChange).not.toHaveBeenCalled()
  })
})
