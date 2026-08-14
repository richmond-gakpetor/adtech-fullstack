"use client"

import { useMemo, useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MapPin, Grid, List, Map, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { ViewMode, BillboardFilters } from "@/lib/types/billboard"
import { FiltersComponent } from "@/components/Filters"
import { BillboardCard } from "@/components/BillboardCard"
import { useAuthStore } from "@/lib/stores/auth-store"
import { MapView } from "@/components/MapView"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"
import { useBillboards } from "@/app/api/exports"

function BrowsePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [priceRange, setPriceRange] = useState([0, 20000])
  const [filters, setFilters] = useState<BillboardFilters>({
    location: undefined,
    billboardType: undefined,
    isAvailable: undefined,
    minViews: undefined,
    nearLat: undefined,
    nearLng: undefined,
    radiusKm: undefined,
  })
  const [searchQuery, setSearchQuery] = useState("")

  // Get page from URL or default to 1
  const currentPage = parseInt(searchParams.get("page") || "1", 10)

  // Update URL when page changes
  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`/browse?${params.toString()}`, { scroll: false })
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    currentPage !== 1 && updatePage(1)
  }, [filters, searchQuery, priceRange])

  // Build API filters from UI state
  const apiFilters = useMemo((): BillboardFilters => ({
    ...filters,
    ...(searchQuery && { search: searchQuery }),
    ...(priceRange[0] > 0 && { minMonthlyRate: priceRange[0] }),
    ...(priceRange[1] < 20000 && { maxMonthlyRate: priceRange[1] }),
  }), [filters, searchQuery, priceRange])

  // Fetch billboards with filters
  const { data, isLoading, isError } = useBillboards(apiFilters, currentPage, 20)

  const billboards = data?.data.items || []
  const total = data?.data.total || 0
  const totalPages = data?.data.pages || 1

  // Auth state
  const { isAuthenticated } = useAuthStore()

  const handleClearFilters = () => {
    setFilters({ 
      location: undefined, 
      billboardType: undefined, 
      isAvailable: undefined, 
      minViews: undefined,
      nearLat: undefined,
      nearLng: undefined,
      radiusKm: undefined,
    })
    setPriceRange([0, 20000])
    setSearchQuery("")
    updatePage(1)
  }

  // Generate page numbers to display
  const getPageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    
    const pages: (number | string)[] = [1]
    const start = Math.max(2, currentPage <= 3 ? 2 : currentPage >= totalPages - 2 ? totalPages - 3 : currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage <= 3 ? 4 : currentPage >= totalPages - 2 ? totalPages - 1 : currentPage + 1)
    
    if (start > 2) pages.push("...")
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push("...")
    pages.push(totalPages)
    
    return pages
  }, [currentPage, totalPages])

  // Count featured billboards (if promoted field exists)
  const featuredCount = 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header showListBillboard />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Renders as sidebar on desktop, floating button on mobile */}
          <div className="lg:w-80">
            <FiltersComponent
              filters={filters}
              priceRange={priceRange}
              searchQuery={searchQuery}
              onFiltersChange={setFilters}
              onPriceRangeChange={setPriceRange}
              onSearchChange={setSearchQuery}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 pb-24 lg:pb-0">
            {/* Enhanced Results Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Browse Billboards
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {isLoading ? "Loading..." : `${total} billboards found • Premium locations across Ghana`}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={viewMode === "grid" ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" : ""}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" : ""}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "map" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("map")}
                      className={viewMode === "map" ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" : ""}
                    >
                      <Map className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content based on view mode */}
            {isLoading ? (
              <div className="flex items-center justify-center py-24 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading billboards...</p>
                </div>
              </div>
            ) : isError ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-red-100">
                <div className="text-red-400 mb-6">
                  <MapPin className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading billboards</h3>
                <p className="text-gray-600 mb-6">Please try again later.</p>
              </div>
            ) : viewMode === "map" ? (
              <MapView billboards={billboards} />
            ) : (
              <>
                {/* Enhanced Billboard Grid/List */}
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                  {billboards.map((billboard) => (
                    <BillboardCard
                      key={billboard.id}
                      billboard={billboard}
                      variant="public"
                      viewMode={viewMode}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>

                {billboards.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="text-gray-400 mb-6">
                      <MapPin className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No billboards found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your filters to see more results.</p>
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center space-y-4 mt-8">
                    {/* Page info */}
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(currentPage * 20, total)}</span> of{" "}
                      <span className="font-medium">{total}</span> results
                    </div>
                    
                    {/* Pagination controls */}
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-gray-200 hover:bg-gray-50"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      
                      {getPageNumbers.map((pageNum, idx) => 
                        pageNum === "..." ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                        ) : (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => updatePage(pageNum as number)}
                            className={currentPage === pageNum ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-200 hover:bg-gray-50"}
                          >
                            {pageNum}
                          </Button>
                        )
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="border-gray-200 hover:bg-gray-50"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Header showListBillboard />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <BrowsePageContent />
    </Suspense>
  )
}
