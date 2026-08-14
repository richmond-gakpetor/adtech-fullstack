import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Access Your Account',
  description: 'Sign in to your Xposure GH account to manage your billboard listings, view inquiries, and track your bookings.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
