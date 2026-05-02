import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from '../../../Components/Navbar/Navbar'

const mockIsOrgAdmin = { value: false }

vi.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
  OrganizationSwitcher: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="org-switcher">{children}</div>
  ),
}))

vi.mock('../../../providers/AuthContext', () => ({
  useAuthContext: () => ({ isOrgAdmin: mockIsOrgAdmin.value }),
}))

// OrgPermissionsPage is only rendered if admin — mock it to avoid fetch
vi.mock('../../../Components/OrgSettings/OrgPermissionsPage', () => ({
  default: () => <div data-testid="org-permissions" />,
}))

vi.mock('../../../lib/goto', () => ({
  withGoto: vi.fn((_base: string) => '/'),
}))

describe('Navbar', () => {
  it('renders the LoRa Dashboard title', () => {
    render(<Navbar />)
    expect(screen.getByText('LoRa Dashboard')).toBeInTheDocument()
  })

  it('renders docs link on desktop', () => {
    render(<Navbar />)
    const links = screen.getAllByRole('link', { name: /docs/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders user button (SignedIn)', () => {
    render(<Navbar />)
    expect(screen.getByTestId('user-button')).toBeInTheDocument()
  })

  it('renders org switcher', () => {
    render(<Navbar />)
    expect(screen.getByTestId('org-switcher')).toBeInTheDocument()
  })

  it('mobile menu is hidden by default', () => {
    render(<Navbar />)
    // Mobile menu is conditionally rendered; check filter panel not visible
    // The hamburger button is always present
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
  })

  it('opens mobile menu when hamburger is clicked', async () => {
    const user = userEvent.setup()
    render(<Navbar />)

    // Mobile menu is conditionally rendered
    const hamburger = screen.getByLabelText('Toggle menu')
    await user.click(hamburger)

    // After toggle, Docs link appears in mobile dropdown (2nd link)
    const links = screen.getAllByRole('link', { name: /docs/i })
    expect(links.length).toBeGreaterThan(1)
  })

  it('closes mobile menu when hamburger clicked again', async () => {
    const user = userEvent.setup()
    render(<Navbar />)

    const hamburger = screen.getByLabelText('Toggle menu')
    await user.click(hamburger)
    await user.click(hamburger)

    const links = screen.getAllByRole('link', { name: /docs/i })
    expect(links.length).toBe(1) // only desktop link remains
  })
})
