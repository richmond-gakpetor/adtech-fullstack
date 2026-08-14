import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up - Join Xposure GH',
  description: 'Create your free account to start listing billboards or booking advertising space across Ghana. Join thousands of billboard owners and advertisers.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
