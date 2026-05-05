import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

class MockBroadcastChannel {
  name: string
  private listeners: Map<string, Set<(e: MessageEvent) => void>> = new Map()

  constructor(name: string) {
    this.name = name
  }

  postMessage() {}

  addEventListener(type: string, listener: (e: MessageEvent) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(listener)
  }

  removeEventListener(type: string, listener: (e: MessageEvent) => void) {
    this.listeners.get(type)?.delete(listener)
  }

  close() {}
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
})
