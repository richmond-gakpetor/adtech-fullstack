import { Billboard } from "@/lib/types/billboard";
import { siteConfig } from "./seo-config";

// Organization structured data for the company
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.contact.phone,
      contactType: "customer service",
      areaServed: "GH",
      availableLanguage: ["English"],
    },
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.facebook,
      siteConfig.links.linkedin,
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "GH",
      addressLocality: siteConfig.contact.address,
    },
  };
}

// LocalBusiness schema for homepage
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": siteConfig.url,
    name: siteConfig.name,
    image: siteConfig.ogImage,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      addressCountry: "GH",
      addressLocality: siteConfig.contact.address,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 5.6037,
      longitude: -0.187,
    },
    priceRange: "₵₵",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
  };
}

// Billboard product schema
export function generateBillboardSchema(billboard: Billboard) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: billboard.title,
    description: billboard.description,
    image: billboard.images,
    offers: {
      "@type": "Offer",
      url: `${siteConfig.url}/billboard/${billboard.id}`,
      priceCurrency: "GHS",
      price: billboard.monthlyRate || billboard.weeklyRate,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      availability: billboard.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Billboard Type",
        value: billboard.billboardType,
      },
      {
        "@type": "PropertyValue",
        name: "Location",
        value: billboard.location,
      },
      {
        "@type": "PropertyValue",
        name: "Monthly Views",
        value: billboard.views,
      },
      {
        "@type": "PropertyValue",
        name: "Size",
        value: `${billboard.widthFt}m x ${billboard.heightFt}m`,
      },
    ],
  };
}

// Breadcrumb list schema
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

// Website search action
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/browse?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
