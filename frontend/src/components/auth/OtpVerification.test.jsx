import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import api from '../../api/client'
import OtpVerification from './OtpVerification'

vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('OtpVerification Component', () => {
  it('renders masked email and 6 digit inputs', () => {
    render(
      <OtpVerification
        email="traveler@example.com"
        onVerified={vi.fn()}
        onBackToSignUp={vi.fn()}
        devOtp="123456"
      />,
    )

    expect(screen.getByText(/Verify your email/i)).toBeInTheDocument()
    expect(screen.getByText(/tr\*\*\*r@example\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/Development OTP:/i)).toBeInTheDocument()

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)
  })

  it('allows pasting 6-digit code and calls verification API', async () => {
    const onVerified = vi.fn()
    api.post.mockResolvedValueOnce({
      data: {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: { email: 'traveler@example.com', role: 'traveler' },
      },
    })

    render(
      <OtpVerification
        email="traveler@example.com"
        onVerified={onVerified}
        onBackToSignUp={vi.fn()}
      />,
    )

    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.paste(firstInput, {
      clipboardData: {
        getData: () => '654321',
      },
    })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register/verify-otp/', {
        email: 'traveler@example.com',
        otp: '654321',
      })
    })

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalled()
    })
  })

  it('shows error banner when API returns error', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          code: 'OTP_INVALID',
          message: "That verification code doesn't match.",
        },
      },
    })

    render(
      <OtpVerification
        email="traveler@example.com"
        onVerified={vi.fn()}
        onBackToSignUp={vi.fn()}
      />,
    )

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input, i) => {
      fireEvent.change(input, { target: { value: String(i + 1) } })
    })

    await waitFor(() => {
      expect(screen.getByText(/That verification code doesn't match\./i)).toBeInTheDocument()
    })
  })
})
