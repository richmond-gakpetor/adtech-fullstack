import { Metadata } from 'next'
import { generatePricingMetadata } from '@/lib/metadata/page-metadata'
import { generateBreadcrumbSchema } from '@/lib/metadata/structured-data'

export const metadata: Metadata = generatePricingMetadata()

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Pricing', url: '/pricing' }
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
