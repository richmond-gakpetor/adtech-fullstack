'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Filter, Search, Zap, MapPin, X, SlidersHorizontal } from 'lucide-react'
import { BillboardFilters } from '@/lib/types/billboard'
import { LocationSearchInput } from '@/components/LocationSearchInput'

interface FiltersProps {
  filters: BillboardFilters
  priceRange: number[]
  searchQuery: string
  onFiltersChange: (filters: BillboardFilters) => void
  onPriceRangeChange: (range: number[]) => void
  onSearchChange: (query: string) => void
  onClearFilters: () => void
}

export function FiltersComponent({
  filters,
  priceRange,
  searchQuery,
  onFiltersChange,
  onPriceRangeChange,
  onSearchChange,
  onClearFilters
}: FiltersProps) {
  // Track selected location name for display
  const [selectedLocationName, setSelectedLocationName] = useState<string>('')
  // Mobile sheet state
  const [isOpen, setIsOpen] = useState(false)
  // Internal search state with debounce
  const [internalSearch, setInternalSearch] = useState(searchQuery)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync internal state if parent resets the search query (e.g. clear filters)
  useEffect(() => {
    setInternalSearch(searchQuery)
  }, [searchQuery])

  const handleSearchChange = (value: string) => {
    setInternalSearch(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      onSearchChange(value)
    }, 400)
  }

  const handleLocationSelect = (location: {
    description: string
    mainText: string
    coordinates: { lat: number; lng: number }
  }) => {
    setSelectedLocationName(location.mainText)
    onFiltersChange({
      ...filters,
      location: location.mainText,
      nearLat: location.coordinates.lat,
      nearLng: location.coordinates.lng,
      radiusKm: 5, // Default 5km radius
    })
  }

  const handleLocationClear = () => {
    setSelectedLocationName('')
    onFiltersChange({
      ...filters,
      location: undefined,
      nearLat: undefined,
      nearLng: undefined,
      radiusKm: undefined,
    })
  }

  const handleClearAll = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setSelectedLocationName('')
    onClearFilters()
  }

  // Check if location-based search is active
  const hasLocationFilter = filters.nearLat !== undefined && filters.nearLng !== undefined

  // Count active filters
  const activeFilterCount = [
    searchQuery,
    filters.billboardType,
    filters.isAvailable !== undefined,
    hasLocationFilter,
    priceRange[0] > 0 || priceRange[1] < 20000,
  ].filter(Boolean).length

  // Filter content component (reused for both mobile and desktop)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Enhanced Search */}
      <div>
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by title or description..."
              value={internalSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Location Search with Google Places */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Location</Label>
          <div className="mt-2">
            <LocationSearchInput
              value={selectedLocationName}
              placeholder="Search by area or landmark..."
              onLocationSelect={handleLocationSelect}
              onClear={handleLocationClear}
            />
          </div>
          {/* Show active location filter */}
          {hasLocationFilter && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                Within 5km of {selectedLocationName || filters.location}
                <button
                  type="button"
                  onClick={handleLocationClear}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>

        {/* Billboard Type */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Billboard Type</Label>
          <Select
            value={filters.billboardType || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, billboardType: value === "all" ? undefined : value as 'Digital' | 'Static' })}
          >
            <SelectTrigger className="border-gray-200 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Digital">Digital</SelectItem>
              <SelectItem value="Static">Static</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Availability */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Availability</Label>
          <Select
            value={filters.isAvailable === undefined ? "all" : filters.isAvailable ? "available" : "unavailable"}
            onValueChange={(value) => onFiltersChange({ ...filters, isAvailable: value === "all" ? undefined : value === "available" })}
          >
            <SelectTrigger className="border-gray-200 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available Now</SelectItem>
              <SelectItem value="unavailable">Not Available</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enhanced Price Range */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Monthly Rate (GHS)</Label>
          <div className="mt-3">
            <Slider
              value={priceRange}
              onValueChange={onPriceRangeChange}
              max={20000}
              min={0}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span className="font-medium">GHS {priceRange[0]}</span>
              <span className="font-medium">GHS {priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
          onClick={handleClearAll}
        >
          Clear All Filters
        </Button>

        {/* Featured Benefits */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Featured Benefits</span>
          </div>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Higher search ranking</li>
            <li>• Enhanced visibility</li>
            <li>• Priority placement</li>
            <li>• Premium positioning</li>
          </ul>
        </div>
      </div>
  )

  return (
    <>
      {/* Mobile: Floating Filter Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-2xl bg-green-600 hover:bg-green-700 h-14 px-6"
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-white text-green-700 hover:bg-white">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile: Filter Sheet/Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="flex items-center text-green-700">
              <Filter className="h-5 w-5 mr-2" />
              Smart Filters
            </SheetTitle>
            <SheetDescription>Find your perfect billboard</SheetDescription>
          </SheetHeader>
          {FilterContent()}
        </SheetContent>
      </Sheet>

      {/* Desktop: Sidebar */}
      <div className="hidden lg:block">
        <Card className="sticky top-24 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center text-green-700">
              <Filter className="h-5 w-5 mr-2" />
              Smart Filters
            </CardTitle>
            <CardDescription>Find your perfect billboard</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {FilterContent()}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
