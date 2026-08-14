'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/lib/google-maps-loader'
import { Billboard } from '@/lib/types/billboard'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || ''

interface UseGoogleMapsProps {
  center: { lat: number; lng: number }
  zoom?: number
  billboards: Billboard[]
  onMarkerClick?: (billboard: Billboard) => void
  onMapClick?: () => void
}

// Pre-encoded once at module level — not recomputed per marker
const LEGACY_MARKER_URL =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="d"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/></filter></defs>
      <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 30 20 30s20-15 20-30C40 8.954 31.046 0 20 0z" fill="#10b981" filter="url(#d)"/>
      <circle cx="20" cy="20" r="8" fill="white"/>
      <circle cx="20" cy="20" r="4" fill="#10b981"/>
    </svg>`
  )

function createAdvancedMarkerElement(): HTMLElement {
  const pin = document.createElement('div')
  pin.style.cssText =
    'width:40px;height:50px;background:#10b981;border-radius:50% 50% 50% 0;' +
    'transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;' +
    'box-shadow:0 2px 4px rgba(0,0,0,.3);border:2px solid white;cursor:pointer'
  const icon = document.createElement('div')
  icon.style.cssText = 'transform:rotate(45deg);font-size:16px'
  icon.textContent = '📍'
  pin.appendChild(icon)
  return pin
}

export const useGoogleMaps = ({
  center,
  zoom = 10,
  billboards,
  onMarkerClick,
  onMapClick,
}: UseGoogleMapsProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Callback refs — listeners always call the latest version without re-registering
  const onMarkerClickRef = useRef(onMarkerClick)
  const onMapClickRef = useRef(onMapClick)
  onMarkerClickRef.current = onMarkerClick
  onMapClickRef.current = onMapClick

  const markersRef = useRef<any[]>([])
  // Ref instead of state — flipping this must not trigger an effect re-run
  const useAdvancedRef = useRef(Boolean(MAP_ID))

  // Initialize the map once on mount
  useEffect(() => {
    if (!API_KEY) {
      setError('Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local')
      return
    }

    let mounted = true

    ;(async () => {
      try {
        await loadGoogleMaps()
        if (!mounted || !mapRef.current) return

        const googleMap = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          // styles and mapId are mutually exclusive — applying both silently breaks styles
          ...(MAP_ID
            ? { mapId: MAP_ID }
            : { styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }] }),
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        })

        googleMap.addListener('click', () => onMapClickRef.current?.())

        if (mounted) {
          setMap(googleMap)
          setIsLoaded(true)
        }
      } catch (err: any) {
        if (!mounted) return
        const msg: string = err?.message ?? ''
        if (msg.includes('RefererNotAllowedMapError')) {
          setError('Maps API key is not authorized for this domain.')
        } else if (msg.includes('ApiNotActivatedMapError')) {
          setError('Google Maps JavaScript API is not enabled in your Cloud project.')
        } else if (msg.includes('InvalidKeyMapError')) {
          setError('Invalid Google Maps API key.')
        } else {
          setError('Failed to load Google Maps. Check your connection and API key.')
        }
      }
    })()

    return () => { mounted = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- center/zoom are stable module-level constants

  // Sync markers whenever map instance or billboard list changes
  useEffect(() => {
    if (!map) return

    // Clear existing markers — AdvancedMarkerElement uses .map property; legacy uses .setMap()
    markersRef.current.forEach(m => {
      if (typeof m.setMap === 'function') m.setMap(null)
      else m.map = null
    })
    markersRef.current = []

    const createLegacyMarker = (billboard: Billboard) => {
      const marker = new google.maps.Marker({
        position: billboard.coordinates,
        map,
        title: billboard.title,
        icon: {
          url: LEGACY_MARKER_URL,
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50),
        },
      })
      marker.addListener('click', () => onMarkerClickRef.current?.(billboard))
      return marker
    }

    billboards.forEach(billboard => {
      try {
        if (useAdvancedRef.current) {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: billboard.coordinates,
            map,
            title: billboard.title,
            content: createAdvancedMarkerElement(),
          })
          marker.addListener('click', () => onMarkerClickRef.current?.(billboard))
          markersRef.current.push(marker)
        } else {
          markersRef.current.push(createLegacyMarker(billboard))
        }
      } catch {
        // Advanced marker API unavailable — fall back immediately for this and all subsequent markers
        useAdvancedRef.current = false
        try { markersRef.current.push(createLegacyMarker(billboard)) } catch { /* skip */ }
      }
    })

    if (billboards.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      billboards.forEach(b => bounds.extend(b.coordinates))
      map.fitBounds(bounds, { top: 60, bottom: 80, left: 20, right: 20 })
      // Prevent over-zoom on sparse/single-marker sets
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const z = map.getZoom()
        if (z && z > 15) map.setZoom(15)
        google.maps.event.removeListener(listener)
      })
    }
  }, [map, billboards])

  return { mapRef, map, isLoaded, error }
}
