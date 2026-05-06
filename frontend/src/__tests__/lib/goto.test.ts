import { describe, it, expect, beforeEach, vi } from 'vitest'

function loadGoto() {
  return import('../../lib/goto')
}

describe('goto utilities', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.resetModules()
    // Reset location to default
    window.history.replaceState({}, '', '/')
  })

  describe('currentPath', () => {
    it('returns current pathname', async () => {
      window.history.pushState({}, '', '/dashboard')
      const { currentPath } = await loadGoto()
      expect(currentPath()).toBe('/dashboard')
    })

    it('includes search params', async () => {
      window.history.pushState({}, '', '/dashboard?foo=bar')
      const { currentPath } = await loadGoto()
      expect(currentPath()).toBe('/dashboard?foo=bar')
    })
  })

  describe('storeGoto', () => {
    it('stores current path by default', async () => {
      window.history.pushState({}, '', '/some/path')
      const { storeGoto } = await loadGoto()
      storeGoto()
      expect(sessionStorage.getItem('lora_goto_url')).toBe('/some/path')
    })

    it('stores provided path', async () => {
      const { storeGoto } = await loadGoto()
      storeGoto('/custom/path')
      expect(sessionStorage.getItem('lora_goto_url')).toBe('/custom/path')
    })
  })

  describe('clearGoto', () => {
    it('removes from sessionStorage', async () => {
      sessionStorage.setItem('lora_goto_url', '/saved')
      const { clearGoto } = await loadGoto()
      clearGoto()
      expect(sessionStorage.getItem('lora_goto_url')).toBeNull()
    })

    it('removes goto param from URL', async () => {
      window.history.pushState({}, '', '/page?goto=%2Fdest')
      const { clearGoto } = await loadGoto()
      clearGoto()
      expect(window.location.search).not.toContain('goto')
    })

    it('preserves other query params', async () => {
      window.history.pushState({}, '', '/page?other=val&goto=%2Fdest')
      const { clearGoto } = await loadGoto()
      clearGoto()
      expect(window.location.search).toContain('other=val')
      expect(window.location.search).not.toContain('goto')
    })
  })

  describe('getGoto', () => {
    it('returns null when no goto is stored', async () => {
      const { getGoto } = await loadGoto()
      expect(getGoto()).toBeNull()
    })

    it('reads from sessionStorage', async () => {
      sessionStorage.setItem('lora_goto_url', '/stored-path')
      const { getGoto } = await loadGoto()
      expect(getGoto()).toBe('/stored-path')
    })

    it('reads from URL param over sessionStorage', async () => {
      sessionStorage.setItem('lora_goto_url', '/session-path')
      window.history.pushState({}, '', '/?goto=%2Fparam-path')
      const { getGoto } = await loadGoto()
      expect(getGoto()).toBe('/param-path')
    })

    it('rejects protocol-relative URLs', async () => {
      sessionStorage.setItem('lora_goto_url', '//evil.com')
      const { getGoto } = await loadGoto()
      expect(getGoto()).toBeNull()
    })

    it('rejects javascript: URIs', async () => {
      sessionStorage.setItem('lora_goto_url', 'javascript:alert(1)')
      const { getGoto } = await loadGoto()
      expect(getGoto()).toBeNull()
    })

    it('rejects foreign origins', async () => {
      sessionStorage.setItem('lora_goto_url', 'https://evil.com/path')
      const { getGoto } = await loadGoto()
      expect(getGoto()).toBeNull()
    })

    it('accepts relative paths starting with /', async () => {
      sessionStorage.setItem('lora_goto_url', '/valid/path?q=1')
      const { getGoto } = await loadGoto()
      expect(getGoto()).toBe('/valid/path?q=1')
    })
  })

  describe('withGoto', () => {
    it('appends goto param to base URL', async () => {
      window.history.pushState({}, '', '/current')
      const { withGoto } = await loadGoto()
      const result = withGoto('/sign-in', '/dashboard')
      expect(result).toContain('/sign-in')
      expect(result).toContain('goto=%2Fdashboard')
    })

    it('uses currentPath when goto not provided', async () => {
      window.history.pushState({}, '', '/current-page')
      const { withGoto } = await loadGoto()
      const result = withGoto('/sign-in')
      expect(result).toContain('goto=%2Fcurrent-page')
    })
  })
})
