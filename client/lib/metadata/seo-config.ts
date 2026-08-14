import { Metadata } from "next";

// Base configuration - Update these with actual company details
export const siteConfig = {
  name: "Xposure GH",
  description:
    "Ghana's Premier Billboard Rental Platform - Connect Billboard Owners with Advertisers",
  url: "https://xposuregh.com", // Update with actual domain
  ogImage: "https://xposuregh.com/og-image.jpg", // Update with actual OG image
  links: {
    twitter: "https://twitter.com/xposuregh", // Update with actual
    facebook: "https://facebook.com/xposuregh", // Update with actual
    linkedin: "https://linkedin.com/company/xposuregh", // Update with actual
  },
  contact: {
    phone: "+233 50 416 2366", // Update with actual phone
    email: "info@xposuregh.com", // Update with actual email
    address: "Accra, Ghana", // Update with actual address
  },
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "billboard advertising Ghana",
    "outdoor advertising Ghana",
    "billboard rental Ghana",
    "advertising space Ghana",
    "billboard marketplace",
    "billboard owners Ghana",
    "digital billboards Ghana",
    "static billboards Ghana",
    "Accra billboards",
    "Kumasi billboards",
    "billboard listing",
    "OOH advertising Ghana",
  ],
  authors: [{ name: "Xposure GH" }],
  creator: "Xposure GH",
  publisher: "Xposure GH",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Xposure GH - Billboard Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@xposuregh", // Update with actual handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};
