import { Metadata } from 'next'
import { generateContactMetadata } from '@/lib/metadata/page-metadata'
import { generateBreadcrumbSchema } from '@/lib/metadata/structured-data'

export const metadata: Metadata = generateContactMetadata()

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Contact', url: '/contact' }
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  )
}
