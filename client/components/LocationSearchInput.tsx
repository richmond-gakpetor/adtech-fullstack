'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Loader2, X } from 'lucide-react'
import { useGooglePlacesAutocomplete, PlaceResult } from '@/lib/hooks/useGooglePlaces'
import { cn } from '@/lib/utils'

interface LocationSearchInputProps {
  value?: string
  placeholder?: string
  onLocationSelect: (location: {
    description: string
    mainText: string
    coordinates: { lat: number; lng: number }
  }) => void
  onClear?: () => void
  className?: string
  disabled?: boolean
}

export function LocationSearchInput({
  value = '',
  placeholder = 'Search for a location...',
  onLocationSelect,
  onClear,
  className,
  disabled = false,
}: LocationSearchInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    isLoaded,
    error,
    predictions,
    isLoading,
    searchPlaces,
    selectPlace,
    clearPredictions,
  } = useGooglePlacesAutocomplete({
    onSelect: (place) => {
      if (place.coordinates) {
        setInputValue(place.mainText)
        setIsOpen(false)
        onLocationSelect({
          description: place.description,
          mainText: place.mainText,
          coordinates: place.coordinates,
        })
      }
    },
  })

  // Sync external value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
    searchPlaces(newValue)
  }

  const handleSelectPlace = (place: PlaceResult) => {
    selectPlace(place)
  }

  const handleClear = () => {
    setInputValue('')
    clearPredictions()
    setIsOpen(false)
    onClear?.()
  }

  const handleFocus = () => {
    if (inputValue && predictions.length > 0) {
      setIsOpen(true)
    }
  }

  // Show error state if API not loaded
  if (error) {
    return (
      <div className={cn('relative', className)}>
        <Input
          placeholder={placeholder}
          disabled
          className="pl-10 bg-gray-50"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={isLoaded ? placeholder : 'Loading...'}
          disabled={disabled || !isLoaded}
          className={cn(
            'pl-10 pr-10 border-gray-200 focus:border-green-500 focus:ring-green-500',
            !isLoaded && 'bg-gray-50'
          )}
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
              onClick={() => handleSelectPlace(place)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0 transition-colors"
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

      {/* No Results */}
      {isOpen && inputValue && !isLoading && predictions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">No locations found</p>
        </div>
      )}
    </div>
  )
}
