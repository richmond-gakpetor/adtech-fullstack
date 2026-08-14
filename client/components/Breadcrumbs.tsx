"use client"

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbs = items || generateBreadcrumbsFromPath(pathname)

  if (breadcrumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        <li>
          <Link 
            href="/" 
            className="hover:text-green-600 transition-colors flex items-center"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link 
                href={item.href}
                className="hover:text-green-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  let currentPath = ''
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`
    
    // Skip dynamic route IDs (UUIDs or numeric IDs)
    if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        !isNaN(Number(segment))) {
      continue
    }

    breadcrumbs.push({
      label: formatLabel(segment),
      href: currentPath,
    })
  }

  return breadcrumbs
}

function formatLabel(segment: string): string {
  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
