import { Metadata } from "next";
import { Billboard } from "@/lib/types/billboard";
import { siteConfig } from "./seo-config";

export function generateHomeMetadata(): Metadata {
  return {
    title: "Ghana's Premier Billboard Rental Marketplace",
    description:
      "Connect billboard owners with advertisers in Ghana. Browse thousands of digital and static billboards across Accra, Kumasi, and major cities. List your billboard or find the perfect advertising space today.",
    keywords: [
      "billboard Ghana",
      "outdoor advertising Ghana",
      "billboard rental Accra",
      "billboard owners Ghana",
      "advertising marketplace Ghana",
      "OOH advertising",
      "digital billboards",
      "billboard listing Ghana",
    ],
    openGraph: {
      title: "Ghana's Premier Billboard Rental Marketplace | Xposure GH",
      description:
        "Connect billboard owners with advertisers in Ghana. Browse thousands of billboards across major cities.",
      url: siteConfig.url,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: "Xposure GH Billboard Marketplace",
        },
      ],
    },
    alternates: {
      canonical: siteConfig.url,
    },
  };
}

export function generateBrowseMetadata(): Metadata {
  return {
    title: "Browse Billboards - Find Advertising Space in Ghana",
    description:
      "Discover available billboards across Ghana. Filter by location, type, price, and views. Find the perfect advertising space for your campaign in Accra, Kumasi, and other cities.",
    keywords: [
      "browse billboards Ghana",
      "find advertising space",
      "billboard locations Ghana",
      "digital billboards Accra",
      "static billboards Kumasi",
      "billboard pricing Ghana",
    ],
    openGraph: {
      title: "Browse Billboards - Find Advertising Space in Ghana",
      description:
        "Discover available billboards across Ghana. Filter by location, type, and price.",
      url: `${siteConfig.url}/browse`,
    },
    alternates: {
      canonical: `${siteConfig.url}/browse`,
    },
  };
}

export function generateBillboardMetadata(billboard: Billboard): Metadata {
  const title = `${billboard.title} - ${billboard.location}`;
  const sizeText = `${billboard.widthFt}m x ${billboard.heightFt}m`;
  const description = `${billboard.description.slice(0, 155)}... | ${
    billboard.billboardType
  } Billboard | ${billboard.views.toLocaleString()} monthly views | ${sizeText} | Available for rent in ${
    billboard.location
  }, Ghana.`;

  return {
    title,
    description,
    keywords: [
      billboard.location,
      billboard.billboardType,
      `billboard ${billboard.location}`,
      "outdoor advertising",
      "billboard rental Ghana",
      sizeText,
    ],
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/billboard/${billboard.id}`,
      images: [
        {
          url: billboard.images[0],
          width: 1200,
          height: 630,
          alt: billboard.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [billboard.images[0]],
    },
    alternates: {
      canonical: `${siteConfig.url}/billboard/${billboard.id}`,
    },
  };
}

export function generateOwnerMetadata(
  ownerName: string,
  billboardCount: number
): Metadata {
  return {
    title: `${ownerName}'s Billboards - View All Listings`,
    description: `Browse all ${billboardCount} billboards listed by ${ownerName}. Find available advertising spaces across Ghana. Contact directly for bookings and inquiries.`,
    openGraph: {
      title: `${ownerName}'s Billboard Listings`,
      description: `Browse ${billboardCount} billboards listed by ${ownerName} in Ghana.`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generatePricingMetadata(): Metadata {
  return {
    title: "Pricing Plans - Billboard Listing Tiers",
    description:
      "Transparent pricing for billboard owners. Choose from Basic, Premium, or Featured listing tiers. Maximize your billboard visibility with promoted listings.",
    keywords: [
      "billboard listing pricing",
      "billboard promotion plans",
      "advertising space pricing Ghana",
      "list billboard cost",
    ],
    alternates: {
      canonical: `${siteConfig.url}/pricing`,
    },
  };
}

export function generateContactMetadata(): Metadata {
  return {
    title: "Contact Us - Get in Touch",
    description:
      "Have questions about billboard advertising in Ghana? Contact Xposure GH for support with listings, bookings, or general inquiries. We're here to help.",
    openGraph: {
      title: "Contact Xposure GH",
      description: "Get in touch with Ghana's premier billboard marketplace.",
    },
    alternates: {
      canonical: `${siteConfig.url}/contact`,
    },
  };
}
