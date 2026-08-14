import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthInitializer } from '@/components/providers/auth-initializer'
import { Toaster } from 'sonner'
import { defaultMetadata } from '@/lib/metadata/seo-config'
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/metadata/structured-data'
import { Analytics } from "@vercel/analytics/next"

const outfit = Outfit({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#16a34a',
}

export const metadata: Metadata = defaultMetadata

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationSchema = generateOrganizationSchema()
  const websiteSchema = generateWebsiteSchema()

  return (
    <html lang="en-GH">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={outfit.className}>
        <QueryProvider>
          <AuthInitializer>
            {children}
          </AuthInitializer>
        </QueryProvider>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
