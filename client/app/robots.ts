import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://xposuregh.com' // Update with actual domain

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/browse',
          '/billboard/',
          '/pricing',
          '/contact',
          '/terms',
          '/privacy',
          '/login',
          '/signup',
          '/list-billboard',
          '/owner/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/owner-dashboard/',
          '/advertiser-dashboard/',
          '/payment/',
          '/kyc-submission/',
          '/verify-email/',
          '/reset-password/',
          '/forgot-password/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
