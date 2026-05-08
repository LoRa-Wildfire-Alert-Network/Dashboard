import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShowAckedButton from '../../../Components/Alerts/ShowAckedButton'

describe('ShowAckedButton', () => {
  it('shows "Show Acknowledged" when showAcked is false', () => {
    render(<ShowAckedButton showAcked={false} setShowAcked={vi.fn()} />)
    expect(screen.getByText('Show Acknowledged')).toBeInTheDocument()
  })

  it('shows "Showing Acknowledged" when showAcked is true', () => {
    render(<ShowAckedButton showAcked={true} setShowAcked={vi.fn()} />)
    expect(screen.getByText('Showing Acknowledged')).toBeInTheDocument()
  })

  it('calls setShowAcked with toggled value on click', async () => {
    const user = userEvent.setup()
    const setShowAcked = vi.fn()
    render(<ShowAckedButton showAcked={false} setShowAcked={setShowAcked} />)
    await user.click(screen.getByRole('button'))
    expect(setShowAcked).toHaveBeenCalledWith(true)
  })

  it('calls setShowAcked with false when currently true', async () => {
    const user = userEvent.setup()
    const setShowAcked = vi.fn()
    render(<ShowAckedButton showAcked={true} setShowAcked={setShowAcked} />)
    await user.click(screen.getByRole('button'))
    expect(setShowAcked).toHaveBeenCalledWith(false)
  })

  it('applies active styles when showAcked is true', () => {
    render(<ShowAckedButton showAcked={true} setShowAcked={vi.fn()} />)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-slate-600')
  })

  it('applies inactive styles when showAcked is false', () => {
    render(<ShowAckedButton showAcked={false} setShowAcked={vi.fn()} />)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-white')
  })
})
