import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import AuthProvider from '../../providers/AuthProvider'
import { useAuthContext } from '../../providers/AuthContext'

const mockGetToken = vi.fn().mockResolvedValue('mock-token')
const mockUseAuth = { isSignedIn: true as boolean | undefined, getToken: mockGetToken }
const mockUseOrganization = {
  organization: null as { id: string; name: string } | null,
  membership: null as { role: string } | null,
}

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => mockUseAuth,
  useOrganization: () => mockUseOrganization,
}))

vi.mock('../../lib/broadcast', () => ({
  broadcastSignIn: vi.fn(),
  broadcastSignOut: vi.fn(),
  onAuthMessage: vi.fn(() => () => {}),
}))

vi.mock('../../lib/goto', () => ({
  getGoto: vi.fn(() => null),
  storeGoto: vi.fn(),
  clearGoto: vi.fn(),
  currentPath: vi.fn(() => '/'),
}))

function ContextConsumer() {
  const ctx = useAuthContext()
  return (
    <div>
      <span data-testid="orgId">{ctx.orgId ?? 'null'}</span>
      <span data-testid="isOrgAdmin">{String(ctx.isOrgAdmin)}</span>
      <span data-testid="permissions">{ctx.permissions.join(',')}</span>
      <span data-testid="hasViewNodes">{String(ctx.hasPermission('view_nodes'))}</span>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.isSignedIn = true
    mockUseOrganization.organization = null
    mockUseOrganization.membership = null
  })

  it('fetches and exposes permissions when signed in', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ permissions: ['view_nodes', 'subscribe_nodes'] }),
    } as Response)

    render(
      <AuthProvider>
        <ContextConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('permissions').textContent).toBe('view_nodes,subscribe_nodes')
    })
  })

  it('sets empty permissions when not signed in', async () => {
    mockUseAuth.isSignedIn = false
    global.fetch = vi.fn()

    render(
      <AuthProvider>
        <ContextConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('permissions').textContent).toBe('')
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sets empty permissions when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))

    render(
      <AuthProvider>
        <ContextConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('permissions').textContent).toBe('')
    })
  })

  it('sets empty permissions when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    render(
      <AuthProvider>
        <ContextConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('permissions').textContent).toBe('')
    })
  })

  it('sets isOrgAdmin when membership role is org:admin', async () => {
    mockUseOrganization.organization = { id: 'org_1', name: 'Test Org' }
    mockUseOrganization.membership = { role: 'org:admin' }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ permissions: [] }),
    } as Response)

    render(
      <AuthProvider>
        <ContextConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('isOrgAdmin').textContent).toBe('true')
    })
  })

  it('hasPermission returns true when no orgId (no org context)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ permissions: [] }),
    } as Response)

    render(
      <AuthProvider>
        <ContextConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('hasViewNodes').textContent).toBe('true')
    })
  })

  it('sends X-Org-Id header when orgId is present', async () => {
    mockUseOrganization.organization = { id: 'org_abc', name: 'Test Org' }
    mockUseOrganization.membership = { role: 'org:member' }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ permissions: ['view_nodes'] }),
    } as Response)

    render(
      <AuthProvider>
        <ContextConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Org-Id': 'org_abc' }),
        })
      )
    })
  })
})
