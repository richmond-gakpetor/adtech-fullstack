'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogleMaps } from '@/lib/google-maps-loader'

export interface PlaceResult {
  placeId: string
  description: string  // Full display text (e.g., "Accra Mall, Spintex Road, Accra, Ghana")
  mainText: string     // Primary text (e.g., "Accra Mall")
  secondaryText: string // Secondary text (e.g., "Spintex Road, Accra, Ghana")
  coordinates?: { lat: number; lng: number }
}

interface UseGooglePlacesAutocompleteProps {
  onSelect?: (place: PlaceResult) => void
  debounceMs?: number
  restrictToGhana?: boolean
}

export function useGooglePlacesAutocomplete({
  onSelect,
  debounceMs = 300,
  restrictToGhana = true,
}: UseGooglePlacesAutocompleteProps = {}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<PlaceResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize Google Maps
  useEffect(() => {
    const initPlaces = async () => {
      try {
        await loadGoogleMaps()

        // Create geocoder for coordinate fetching
        geocoderRef.current = new google.maps.Geocoder()

        setIsLoaded(true)
      } catch (err: any) {
        console.error('Google Places loading error:', err)
        setError('Failed to load Google Places')
      }
    }

    initPlaces()

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Search for places using Geocoding API (no legacy API required)
  const searchPlaces = useCallback((input: string) => {
    if (!input.trim()) {
      setPredictions([])
      return
    }

    if (!isLoaded || !geocoderRef.current) {
      return
    }

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // Debounce the search
    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true)

      // Use Geocoding API which doesn't require legacy Places API
      const request: google.maps.GeocoderRequest = {
        address: input,
        // Restrict to Ghana
        ...(restrictToGhana && {
          componentRestrictions: { country: 'GH' },
        }),
      }

      geocoderRef.current!.geocode(request, (results, status) => {
        setIsLoading(false)

        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          // Convert geocoding results to PlaceResult format
          const places: PlaceResult[] = results.slice(0, 5).map((result) => {
            // Extract main text (locality or first address component)
            let mainText = ''
            let location = ''
            
            for (const component of result.address_components) {
              if (component.types.includes('locality') || component.types.includes('sublocality')) {
                location = component.long_name
                mainText = component.long_name
                break
              }
              if (!mainText && component.types.includes('administrative_area_level_2')) {
                mainText = component.long_name
                location = component.long_name
              }
            }
            
            if (!mainText) {
              mainText = result.formatted_address.split(',')[0]
            }

            return {
              placeId: result.place_id,
              description: result.formatted_address,
              mainText: mainText,
              secondaryText: result.formatted_address,
              coordinates: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              },
            }
          })
          
          setPredictions(places)
        } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
          setPredictions([])
        } else {
          console.error('Geocoding error:', status)
          setPredictions([])
        }
      })
    }, debounceMs)
  }, [isLoaded, debounceMs, restrictToGhana])

  // Handle place selection (now simpler since we already have coordinates)
  const selectPlace = useCallback((place: PlaceResult) => {
    onSelect?.(place)
    setPredictions([]) // Clear predictions after selection
  }, [onSelect])

  // Clear predictions
  const clearPredictions = useCallback(() => {
    setPredictions([])
  }, [])

  return {
    isLoaded,
    error,
    predictions,
    isLoading,
    searchPlaces,
    selectPlace,
    clearPredictions,
  }
}

// Hook for reverse geocoding (map click → address)
export function useReverseGeocode() {
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await loadGoogleMaps()
        geocoderRef.current = new google.maps.Geocoder()
        setIsLoaded(true)
      } catch (err) {
        console.error('Geocoder init error:', err)
      }
    }

    init()
  }, [])

  const reverseGeocode = useCallback(async (
    lat: number,
    lng: number
  ): Promise<{ address: string; location: string } | null> => {
    if (!geocoderRef.current) return null

    try {
      const response = await geocoderRef.current.geocode({
        location: { lat, lng },
      })

      if (response.results && response.results.length > 0) {
        const result = response.results[0]
        
        // Extract location (city/area) from address components
        let location = ''
        for (const component of result.address_components) {
          if (component.types.includes('locality')) {
            location = component.long_name
            break
          }
          if (component.types.includes('administrative_area_level_2')) {
            location = component.long_name
          }
        }

        return {
          address: result.formatted_address,
          location: location || 'Ghana',
        }
      }
      return null
    } catch (err) {
      console.error('Reverse geocode error:', err)
      return null
    }
  }, [])

  return { isLoaded, reverseGeocode }
}
