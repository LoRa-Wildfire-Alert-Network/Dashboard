import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { AuthContext, useAuthContext } from '../../providers/AuthContext'
import type { AuthCtx } from '../../providers/AuthContext'

describe('AuthContext', () => {
  describe('useAuthContext default values', () => {
    it('returns null orgId by default', () => {
      const { result } = renderHook(() => useAuthContext())
      expect(result.current.orgId).toBeNull()
    })

    it('returns null orgName by default', () => {
      const { result } = renderHook(() => useAuthContext())
      expect(result.current.orgName).toBeNull()
    })

    it('returns null orgRole by default', () => {
      const { result } = renderHook(() => useAuthContext())
      expect(result.current.orgRole).toBeNull()
    })

    it('returns false isOrgAdmin by default', () => {
      const { result } = renderHook(() => useAuthContext())
      expect(result.current.isOrgAdmin).toBe(false)
    })

    it('returns empty permissions array by default', () => {
      const { result } = renderHook(() => useAuthContext())
      expect(result.current.permissions).toEqual([])
    })

    it('hasPermission returns true by default (no org context)', () => {
      const { result } = renderHook(() => useAuthContext())
      expect(result.current.hasPermission('view_nodes')).toBe(true)
      expect(result.current.hasPermission('subscribe_nodes')).toBe(true)
    })
  })

  describe('useAuthContext with Provider', () => {
    const mockCtx: AuthCtx = {
      orgId: 'org_123',
      orgName: 'Test Org',
      orgRole: 'org:member',
      isOrgAdmin: false,
      permissions: ['view_nodes'],
      hasPermission: (p) => p === 'view_nodes',
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockCtx}>{children}</AuthContext.Provider>
    )

    it('reads orgId from Provider', () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper })
      expect(result.current.orgId).toBe('org_123')
    })

    it('reads orgName from Provider', () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper })
      expect(result.current.orgName).toBe('Test Org')
    })

    it('reads permissions from Provider', () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper })
      expect(result.current.permissions).toContain('view_nodes')
    })

    it('hasPermission works correctly with granted permission', () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper })
      expect(result.current.hasPermission('view_nodes')).toBe(true)
    })

    it('hasPermission returns false for missing permission', () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper })
      expect(result.current.hasPermission('subscribe_nodes')).toBe(false)
    })
  })
})
