'use client'

import { useState, useEffect } from 'react'
import { useGoogleMaps } from '@/lib/hooks/useGoogleMaps'
import { Billboard } from '@/lib/types/billboard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Eye, Maximize2, Minimize2, X, Ruler } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface MapViewProps {
  billboards: Billboard[]
  className?: string
}

const GHANA_CENTER = { lat: 7.9465, lng: -1.0232 }


export function MapView({ billboards, className = '' }: MapViewProps) {
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const { mapRef, map, isLoaded, error } = useGoogleMaps({
    center: GHANA_CENTER,
    zoom: 7,
    billboards,
    onMarkerClick: setSelectedBillboard,
    onMapClick: () => setSelectedBillboard(null),
  })

  // Trigger map resize when fullscreen toggles so tiles render correctly
  useEffect(() => {
    if (!map) return

    const savedCenter = map.getCenter()

    // Double rAF: first waits for React's DOM commit, second for browser layout/paint
    let raf1 = 0
    let raf2 = 0

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        google.maps.event.trigger(map, 'resize')
        // Re-center after resize — without this the viewport shifts and tiles go blank
        if (savedCenter) map.setCenter(savedCenter)
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [isFullscreen, map])

  if (error) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load map</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      {/* Map Container */}
      <div 
        className={`relative bg-gray-100 overflow-hidden ${
          isFullscreen 
            ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl' 
            : 'h-[600px] rounded-2xl shadow-lg border border-gray-200'
        }`}
      >
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Top bar with count + controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          {/* Billboard count */}
          <div className="pointer-events-auto">
            <Badge className="bg-white/95 backdrop-blur-sm text-gray-800 shadow-lg border-0 px-3 py-1.5 text-sm font-medium hover:bg-white">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-green-600" />
              {billboards.length} billboard{billboards.length !== 1 ? 's' : ''} on map
            </Badge>
          </div>

          {/* Fullscreen toggle */}
          <div className="pointer-events-auto">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border-0 h-9 w-9"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* Selected Billboard Card */}
        {selectedBillboard && (
          <Card className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-white/95 backdrop-blur-md shadow-2xl border-0 rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                {/* Image */}
                <div className="relative w-32 sm:w-36 flex-shrink-0">
                  <Image
                    src={selectedBillboard.images?.[0] || "/placeholder.svg"}
                    alt={selectedBillboard.title}
                    fill
                    className="object-cover"
                  />
                  {/* Availability badge */}
                  <Badge
                    className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 ${
                      selectedBillboard.isAvailable
                        ? "bg-green-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {selectedBillboard.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 p-3">
                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                    onClick={() => setSelectedBillboard(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>

                  <h3 className="font-semibold text-sm text-gray-900 truncate pr-6">
                    {selectedBillboard.title}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center mt-1 truncate">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-green-500" />
                    {selectedBillboard.location}
                  </p>

                  {/* Quick stats */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center text-[11px] text-gray-500">
                      <Ruler className="h-3 w-3 mr-0.5" />
                      {selectedBillboard.widthFt}×{selectedBillboard.heightFt}ft
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-green-200 text-green-700">
                      {selectedBillboard.billboardType}
                    </Badge>
                    <span className="inline-flex items-center text-[11px] text-gray-500">
                      <Eye className="h-3 w-3 mr-0.5" />
                      {selectedBillboard.views || 0}
                    </span>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                    <span className="text-sm font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                      GHS {selectedBillboard.monthlyRate || selectedBillboard.weeklyRate * 4}
                      <span className="text-xs font-normal text-gray-500">/mo</span>
                    </span>
                    <Link href={`/billboard/${selectedBillboard.id}`}>
                      <Button size="sm" className="text-xs h-7 px-3 bg-green-600 hover:bg-green-700">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Map Legend */}
      <div className="mt-3 flex items-center justify-center space-x-6 text-xs text-gray-500">
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-green-600 rounded-full shadow-sm"></div>
          <span>Billboard location</span>
        </div>
        <span className="text-gray-300">•</span>
        <span>Click a marker to see details</span>
      </div>
    </div>
  )
}
