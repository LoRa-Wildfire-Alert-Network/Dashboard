import { describe, it, expect, vi, beforeEach } from 'vitest'
import { broadcastSignIn, broadcastSignOut, onAuthMessage } from '../../lib/broadcast'

describe('broadcast utilities', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('broadcastSignIn', () => {
    it('posts a signed-in message', () => {
      const postMessage = vi.spyOn(BroadcastChannel.prototype, 'postMessage')
      broadcastSignIn()
      expect(postMessage).toHaveBeenCalledWith({ type: 'signed-in' })
    })
  })

  describe('broadcastSignOut', () => {
    it('posts a signed-out message without goto', () => {
      const postMessage = vi.spyOn(BroadcastChannel.prototype, 'postMessage')
      broadcastSignOut()
      expect(postMessage).toHaveBeenCalledWith({ type: 'signed-out', goto: undefined })
    })

    it('posts a signed-out message with goto URL', () => {
      const postMessage = vi.spyOn(BroadcastChannel.prototype, 'postMessage')
      broadcastSignOut('/dashboard')
      expect(postMessage).toHaveBeenCalledWith({ type: 'signed-out', goto: '/dashboard' })
    })
  })

  describe('onAuthMessage', () => {
    it('registers a message listener and returns an unsubscribe fn', () => {
      const addListener = vi.spyOn(BroadcastChannel.prototype, 'addEventListener')
      const removeListener = vi.spyOn(BroadcastChannel.prototype, 'removeEventListener')

      const callback = vi.fn()
      const unsub = onAuthMessage(callback)

      expect(addListener).toHaveBeenCalledWith('message', expect.any(Function))

      unsub()
      expect(removeListener).toHaveBeenCalledWith('message', expect.any(Function))
    })
  })
})
