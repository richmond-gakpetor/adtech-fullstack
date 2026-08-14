"use client"

import { useEffect } from 'react'
import { Billboard } from '@/lib/types/billboard'

interface DynamicMetaTagsProps {
  billboard: Billboard
}

export function DynamicMetaTags({ billboard }: DynamicMetaTagsProps) {
  useEffect(() => {
    if (billboard) {
      // Update document title
      document.title = `${billboard.title} - ${billboard.location} | Xposure GH`
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', `${billboard.description.slice(0, 155)}... | ${billboard.billboardType} Billboard in ${billboard.location}, Ghana`)
      
      // Update OG tags
      const updateOrCreateMeta = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`)
        if (!meta) {
          meta = document.createElement('meta')
          meta.setAttribute('property', property)
          document.head.appendChild(meta)
        }
        meta.setAttribute('content', content)
      }
      
      updateOrCreateMeta('og:title', billboard.title)
      updateOrCreateMeta('og:description', billboard.description.slice(0, 200))
      updateOrCreateMeta('og:image', billboard.images[0])
      updateOrCreateMeta('og:url', `https://xposuregh.com/billboard/${billboard.id}`)
      
      // Twitter card
      updateOrCreateMeta('twitter:title', billboard.title)
      updateOrCreateMeta('twitter:description', billboard.description.slice(0, 200))
      updateOrCreateMeta('twitter:image', billboard.images[0])
    }
  }, [billboard])

  if (!billboard) return null

  // Server-side structured data for billboard
  const billboardSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: billboard.title,
    description: billboard.description,
    image: billboard.images,
    offers: {
      '@type': 'Offer',
      url: `https://xposuregh.com/billboard/${billboard.id}`,
      priceCurrency: 'GHS',
      price: billboard.monthlyRate || billboard.weeklyRate,
      availability: billboard.isAvailable
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://xposuregh.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Browse',
        item: 'https://xposuregh.com/browse',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: billboard.title,
        item: `https://xposuregh.com/billboard/${billboard.id}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(billboardSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}
