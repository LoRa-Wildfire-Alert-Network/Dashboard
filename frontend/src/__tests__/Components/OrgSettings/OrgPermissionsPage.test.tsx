import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrgPermissionsPage from '../../../Components/OrgSettings/OrgPermissionsPage'

const mockGetToken = vi.fn().mockResolvedValue('mock-token')

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}))

vi.mock('../../../providers/AuthContext', () => ({
  useAuthContext: () => ({ orgId: 'org_123' }),
}))

const defaultSettings = {
  'org:member': ['view_nodes'],
}

describe('OrgPermissionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => defaultSettings,
    } as Response)
  })

  it('shows loading state initially', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}))
    render(<OrgPermissionsPage />)
    expect(screen.getByText(/loading permission settings/i)).toBeInTheDocument()
  })

  it('renders role labels after loading', async () => {
    render(<OrgPermissionsPage />)
    await waitFor(() => {
      expect(screen.getByText('Member')).toBeInTheDocument()
    })
  })

  it('renders permission labels', async () => {
    render(<OrgPermissionsPage />)
    await waitFor(() => {
      expect(screen.getByText('View nodes & telemetry')).toBeInTheDocument()
      expect(screen.getByText('Subscribe to nodes')).toBeInTheDocument()
    })
  })

  it('renders permission descriptions', async () => {
    render(<OrgPermissionsPage />)
    await waitFor(() => {
      expect(screen.getByText(/Can see sensor nodes/i)).toBeInTheDocument()
      expect(screen.getByText(/Can subscribe and unsubscribe/i)).toBeInTheDocument()
    })
  })

  it('pre-checks permissions from API response', async () => {
    render(<OrgPermissionsPage />)
    await waitFor(() => screen.getByText('View nodes & telemetry'))

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    const viewNodesCheckbox = checkboxes.find((cb) =>
      cb.closest('label')?.textContent?.includes('View nodes & telemetry')
    )
    expect(viewNodesCheckbox?.checked).toBe(true)
  })

  it('unchecked permissions are not checked', async () => {
    render(<OrgPermissionsPage />)
    await waitFor(() => screen.getByText('Subscribe to nodes'))

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    const subscribeCheckbox = checkboxes.find((cb) =>
      cb.closest('label')?.textContent?.includes('Subscribe to nodes')
    )
    expect(subscribeCheckbox?.checked).toBe(false)
  })

  it('toggles a permission when checkbox clicked', async () => {
    const user = userEvent.setup()
    render(<OrgPermissionsPage />)
    await waitFor(() => screen.getByText('Subscribe to nodes'))

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    const subscribeCheckbox = checkboxes.find((cb) =>
      cb.closest('label')?.textContent?.includes('Subscribe to nodes')
    )!

    await user.click(subscribeCheckbox)
    expect(subscribeCheckbox.checked).toBe(true)

    await user.click(subscribeCheckbox)
    expect(subscribeCheckbox.checked).toBe(false)
  })

  it('saves permissions on Save button click', async () => {
    const user = userEvent.setup()
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => defaultSettings,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

    render(<OrgPermissionsPage />)
    await waitFor(() => screen.getByRole('button', { name: /save/i }))

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/org/role-settings/'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('shows "Saved ✓" after successful save', async () => {
    const user = userEvent.setup()
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => defaultSettings,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

    render(<OrgPermissionsPage />)
    await waitFor(() => screen.getByRole('button', { name: /save/i }))

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/Saved ✓/)).toBeInTheDocument()
    })
  })

  it('shows error message when load fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Unauthorized' }),
    } as Response)

    render(<OrgPermissionsPage />)
    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument()
    })
  })

  it('shows error message when save fails', async () => {
    const user = userEvent.setup()
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => defaultSettings,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Save failed' }),
      } as Response)

    render(<OrgPermissionsPage />)
    await waitFor(() => screen.getByRole('button', { name: /save/i }))

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument()
    })
  })

  it('sends org ID header in requests', async () => {
    render(<OrgPermissionsPage />)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Org-Id': 'org_123' }),
        })
      )
    })
  })
})
