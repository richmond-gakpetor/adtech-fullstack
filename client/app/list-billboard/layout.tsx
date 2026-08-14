import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List Your Billboard - Start Earning Today',
  description: 'List your billboard on Ghana\'s premier advertising marketplace. Reach thousands of advertisers looking for premium billboard spaces. Free to list, easy to manage.',
  openGraph: {
    title: 'List Your Billboard on Xposure GH',
    description: 'Connect with advertisers across Ghana. Free listings, secure payments, and full control.',
  },
}

export default function ListBillboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
