import { Metadata } from 'next'
import { generateBrowseMetadata } from '@/lib/metadata/page-metadata'
import { generateBreadcrumbSchema } from '@/lib/metadata/structured-data'

export const metadata: Metadata = generateBrowseMetadata()

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Browse', url: '/browse' }
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
