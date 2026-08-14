import { generateHomeMetadata } from "@/lib/metadata/page-metadata"
import { generateLocalBusinessSchema } from "@/lib/metadata/structured-data"
import { HomeClient } from "./HomeClient"

export const metadata = generateHomeMetadata()

export default function HomePage() {
  const schema = generateLocalBusinessSchema()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <HomeClient />
    </>
  )
}

