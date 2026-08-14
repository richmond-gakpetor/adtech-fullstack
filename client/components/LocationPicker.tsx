'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Search, Loader2, X, Navigation } from 'lucide-react'
import { loadGoogleMaps } from '@/lib/google-maps-loader'
import { useGooglePlacesAutocomplete, useReverseGeocode, PlaceResult } from '@/lib/hooks/useGooglePlaces'
import { cn } from '@/lib/utils'

const GOOGLE_MAPS_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || ''

// Ghana center coordinates
const GHANA_CENTER = { lat: 5.6037, lng: -0.1870 } // Accra

export interface LocationData {
  location: string        // City/area name (e.g., "Spintex")
  fullAddress: string     // Full address text
  coordinates: {
    lat: number
    lng: number
  }
}

interface LocationPickerProps {
  value?: Partial<LocationData>
  onChange: (data: LocationData) => void
  className?: string
}

export function LocationPicker({ value, onChange, className }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState(value?.fullAddress || '')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    value?.coordinates?.lat && value?.coordinates?.lng ? value.coordinates : null
  )
  
  const containerRef = useRef<HTMLDivElement>(null)
  const { reverseGeocode } = useReverseGeocode()

  const {
    isLoaded: placesLoaded,
    predictions,
    isLoading,
    searchPlaces,
    selectPlace,
    clearPredictions,
  } = useGooglePlacesAutocomplete({
    onSelect: (place) => {
      if (place.coordinates) {
        handleLocationSelect(place)
      }
    },
  })

  // Initialize the map
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMaps()

        if (mapRef.current) {
          const mapOptions: google.maps.MapOptions = {
            center: selectedCoords || GHANA_CENTER,
            zoom: selectedCoords ? 15 : 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          }

          if (GOOGLE_MAPS_ID && GOOGLE_MAPS_ID !== 'default') {
            mapOptions.mapId = GOOGLE_MAPS_ID
          }

          const map = new google.maps.Map(mapRef.current, mapOptions)
          mapInstanceRef.current = map

          // Add click listener for placing marker
          map.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const lat = event.latLng.lat()
              const lng = event.latLng.lng()
              handleMapClick(lat, lng)
            }
          })

          // If there's an initial position, add a marker
          if (selectedCoords) {
            addMarker(selectedCoords.lat, selectedCoords.lng)
          }

          setIsMapLoaded(true)
        }
      } catch (err: any) {
        console.error('Map loading error:', err)
        setMapError('Failed to load map')
      }
    }

    initMap()
  }, [])

  // Add or update marker
  const addMarker = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.map = null
    }

    // Create marker content
    const markerContent = document.createElement('div')
    markerContent.innerHTML = `
      <div style="
        width: 40px;
        height: 50px;
        position: relative;
      ">
        <div style="
          width: 40px;
          height: 40px;
          background: #10b981;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 18px;
          ">📍</div>
        </div>
      </div>
    `

    try {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        map: mapInstanceRef.current,
        content: markerContent,
        gmpDraggable: true,
      })

      // Handle marker drag end
      marker.addListener('dragend', async () => {
        const position = marker.position as google.maps.LatLngLiteral
        if (position) {
          await handleMapClick(position.lat, position.lng)
        }
      })

      markerRef.current = marker
    } catch (err) {
      // Fallback to regular marker if Advanced Marker fails
      console.warn('Using fallback marker')
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        draggable: true,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 30 20 30s20-15 20-30c0-11.046-8.954-20-20-20z" fill="#10b981"/>
              <circle cx="20" cy="20" r="8" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50),
        },
      })

      marker.addListener('dragend', async () => {
        const position = marker.getPosition()
        if (position) {
          await handleMapClick(position.lat(), position.lng())
        }
      })
    }

    // Center map on marker
    mapInstanceRef.current.panTo({ lat, lng })
    mapInstanceRef.current.setZoom(15)
  }, [])

  // Handle map click - reverse geocode and update state
  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng })
    addMarker(lat, lng)

    // Reverse geocode to get address
    const result = await reverseGeocode(lat, lng)
    
    if (result) {
      setInputValue(result.address)
      onChange({
        location: result.location,
        fullAddress: result.address,
        coordinates: { lat, lng },
      })
    } else {
      // Still update with coordinates even if reverse geocode fails
      onChange({
        location: 'Ghana',
        fullAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        coordinates: { lat, lng },
      })
    }
  }

  // Handle autocomplete selection
  const handleLocationSelect = async (place: PlaceResult) => {
    if (place.coordinates) {
      const { lat, lng } = place.coordinates
      
      setInputValue(place.description)
      setSelectedCoords({ lat, lng })
      setIsOpen(false)
      clearPredictions()
      
      // Add marker on map
      addMarker(lat, lng)
      
      // Extract location name from place
      onChange({
        location: place.mainText,
        fullAddress: place.description,
        coordinates: { lat, lng },
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
    searchPlaces(newValue)
  }

  const handleClear = () => {
    setInputValue('')
    setSelectedCoords(null)
    clearPredictions()
    setIsOpen(false)
    
    // Remove marker
    if (markerRef.current) {
      markerRef.current.map = null
      markerRef.current = null
    }
    
    // Reset map view
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(GHANA_CENTER)
      mapInstanceRef.current.setZoom(12)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div ref={containerRef} className="relative">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Billboard Location
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => inputValue && predictions.length > 0 && setIsOpen(true)}
            placeholder="Search for address or click on map..."
            className="pl-10 pr-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
            disabled={!placesLoaded}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
          {!isLoading && inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Predictions Dropdown */}
        {isOpen && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {predictions.map((place) => (
              <button
                key={place.placeId}
                type="button"
                onClick={() => {
                  selectPlace(place)
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{place.mainText}</p>
                  <p className="text-sm text-gray-500 truncate">{place.secondaryText}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium text-gray-700">
            Pin Location on Map
          </Label>
          <span className="text-xs text-gray-500">
            Click on the map or drag the marker
          </span>
        </div>
        
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {mapError ? (
              <div className="h-64 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">{mapError}</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div ref={mapRef} className="h-64 w-full bg-gray-100" />
                {!isMapLoaded && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Coordinates Display */}
      {selectedCoords && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <Navigation className="h-4 w-4" />
            <span className="text-sm font-medium">Location Selected</span>
          </div>
          <div className="mt-1 text-sm text-green-700">
            <span className="font-mono">
              {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
            </span>
          </div>
          {inputValue && (
            <p className="mt-1 text-sm text-green-600 truncate">{inputValue}</p>
          )}
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-500">
        💡 Tip: Search for a landmark or address, or click directly on the map to set the billboard location. 
        You can drag the marker to fine-tune the position.
      </p>
    </div>
  )
}
