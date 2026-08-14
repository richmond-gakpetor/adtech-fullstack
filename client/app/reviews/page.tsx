"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Star, Search, Filter, MapPin, Calendar, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAllReviews, useAllReviewsSummary, useToggleReviewHelpful } from "@/app/api/exports"
import type { Review } from "@/lib/types/review"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"

// Extended Review type for UI display (includes nested data that may come from API)
interface ReviewDisplay extends Review {
  reviewer?: {
    name: string
    avatar?: string | null
    company?: string | null
    type?: 'owner' | 'advertiser'
    verified?: boolean
  }
  reviewee?: {
    name: string
    company?: string | null
    type?: 'owner' | 'advertiser'
  }
  billboard?: {
    title: string
    location?: string
    image?: string | null
  }
  campaign?: string
}

// Transform API Review to display format
const transformReview = (review: Review): ReviewDisplay => {
  // Check if API already includes nested data (some APIs return relations)
  const apiReview = review as any
  
  return {
    ...review,
    reviewer: apiReview.reviewer || {
      name: review.reviewerName,
      avatar: review.reviewerImage,
      company: apiReview.reviewerCompany || null,
      type: apiReview.reviewerType || undefined,
      verified: apiReview.reviewerVerified || false,
    },
    reviewee: apiReview.reviewee || {
      name: apiReview.revieweeName || 'Unknown',
      company: apiReview.revieweeCompany || null,
      type: apiReview.revieweeType || undefined,
    },
    billboard: apiReview.billboard || {
      title: apiReview.billboardTitle || 'Billboard',
      location: apiReview.billboardLocation || null,
      image: apiReview.billboardImage || null,
    },
    campaign: apiReview.campaign || null,
  }
}

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRating, setFilterRating] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)

  // Build API filters
  const apiFilters = useMemo(() => {
    const filters: {
      rating?: number
      reviewType?: 'billboard' | 'owner' | 'advertiser'
      search?: string
    } = {}
    
    if (filterRating !== "all") {
      filters.rating = parseInt(filterRating)
    }
    if (filterType !== "all") {
      filters.reviewType = filterType as 'billboard' | 'owner' | 'advertiser'
    }
    if (searchTerm) {
      filters.search = searchTerm
    }
    
    return Object.keys(filters).length > 0 ? filters : undefined
  }, [filterRating, filterType, searchTerm])

  // Fetch reviews and summary
  const { data: reviewsData, isLoading: reviewsLoading, isError: reviewsError } = useAllReviews(page, 20, apiFilters)
  const { data: summaryData, isLoading: summaryLoading } = useAllReviewsSummary()
  const { mutate: toggleHelpful } = useToggleReviewHelpful()

  // Transform reviews for display
  const reviews = useMemo(() => {
    if (!reviewsData?.data?.items) return []
    return reviewsData.data.items.map(transformReview)
  }, [reviewsData])

  // Client-side filtering (for search that might not be handled server-side)
  const filteredReviews = useMemo(() => {
    if (!searchTerm) return reviews
    
    return reviews.filter((review) => {
      const billboardTitle = review.billboard?.title || ''
      const reviewerName = review.reviewer?.name || review.reviewerName
      const comment = review.comment || ''
      
      return (
        billboardTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [reviews, searchTerm])

  // Client-side sorting
  const sortedReviews = useMemo(() => {
    return [...filteredReviews].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "highest":
          return b.rating - a.rating
        case "lowest":
          return a.rating - b.rating
        case "helpful":
          return b.helpfulCount - a.helpfulCount
        default:
          return 0
      }
    })
  }, [filteredReviews, sortBy])

  // Calculate summary from API or fallback to calculated
  const summary = summaryData?.data
  const averageRating = summary?.averageRating ?? (reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0)
  const totalReviews = summary?.totalReviews ?? reviews.length
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = summary?.ratingDistribution?.[rating.toString() as '1' | '2' | '3' | '4' | '5'] ?? 
                  reviews.filter((review) => review.rating === rating).length
    return {
      rating,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    }
  })

  const handleToggleHelpful = (reviewId: string, currentIsHelpful: boolean) => {
    toggleHelpful({ reviewId, isHelpful: !currentIsHelpful })
  }

  const renderStars = (rating: number, size = "h-4 w-4") => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews & Ratings</h1>
            <p className="text-gray-600">See what our community says about billboard owners and advertisers</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Overall Rating */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    {summaryLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-gray-900">
                          {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                        </div>
                        <div className="flex justify-center mb-2">
                          {renderStars(Math.round(averageRating), "h-5 w-5")}
                        </div>
                        <p className="text-sm text-gray-600">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    {ratingDistribution.map(({ rating, count, percentage }) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <span className="text-sm w-2">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Rating</label>
                    <Select value={filterRating} onValueChange={setFilterRating}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Review Type</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="billboard">Billboard Reviews</SelectItem>
                        <SelectItem value="advertiser">Advertiser Reviews</SelectItem>
                        <SelectItem value="owner">Owner Reviews</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="highest">Highest Rating</SelectItem>
                        <SelectItem value="lowest">Lowest Rating</SelectItem>
                        <SelectItem value="helpful">Most Helpful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchTerm("")
                      setFilterRating("all")
                      setFilterType("all")
                      setSortBy("newest")
                      setPage(1)
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Results Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {reviewsLoading ? (
                    "Loading reviews..."
                  ) : (
                    <>
                      {reviewsData?.data?.total ?? sortedReviews.length} Review{(reviewsData?.data?.total ?? sortedReviews.length) !== 1 ? "s" : ""}
                    </>
                  )}
                </h2>
              </div>

              {/* Loading State */}
              {reviewsLoading && (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading reviews...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {reviewsError && !reviewsLoading && (
                <div className="text-center py-12">
                  <div className="text-red-400 mb-4">
                    <Star className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading reviews</h3>
                  <p className="text-gray-600">Please try again later.</p>
                </div>
              )}

              {/* Reviews List */}
              {!reviewsLoading && !reviewsError && (
                <div className="space-y-6">
                  {sortedReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={review.reviewer?.avatar || review.reviewerImage || "/placeholder.svg"} />
                          <AvatarFallback>{(review.reviewer?.name || review.reviewerName).charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{review.reviewer?.name || review.reviewerName}</h4>
                              {review.reviewer?.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                              <Badge variant="outline" className="text-xs">
                                {review.reviewer?.type === "advertiser" ? "Advertiser" : "Owner"}
                              </Badge>
                            </div>
                            <div className="text-right">
                              {renderStars(review.rating)}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {review.reviewer?.company && (
                            <p className="text-sm text-gray-600 mb-2">{review.reviewer.company}</p>
                          )}

                          <h5 className="font-medium mb-2">{review.title}</h5>
                          <p className="text-gray-700 mb-4">{review.comment}</p>

                          {/* Billboard/Campaign Info */}
                          {review.billboardId && (
                            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg mb-4">
                              {review.billboard?.image && (
                                <img
                                  src={review.billboard.image}
                                  alt={review.billboard.title}
                                  className="w-16 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {review.billboard?.title || 'Billboard'}
                                </p>
                                {review.billboard?.location && (
                                  <p className="text-xs text-gray-600 flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {review.billboard.location}
                                  </p>
                                )}
                                {review.campaign && (
                                  <p className="text-xs text-gray-600 flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Campaign: {review.campaign}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {review.reviewType === "billboard"
                                  ? "Billboard Review"
                                  : review.reviewType === "advertiser"
                                    ? "Advertiser Review"
                                    : "Owner Review"}
                              </Badge>
                            </div>
                          )}

                          {/* Review Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <button 
                                className={`text-sm hover:text-green-600 ${
                                  review.isHelpful ? 'text-green-600' : 'text-gray-600'
                                }`}
                                onClick={() => handleToggleHelpful(review.id, review.isHelpful)}
                              >
                                👍 Helpful ({review.helpfulCount})
                              </button>
                            </div>
                            {review.revieweeId && (
                              <p className="text-xs text-gray-500">
                                Reviewing: {review.reviewee?.name || 'User'} 
                                {review.reviewee?.company && ` (${review.reviewee.company})`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!reviewsLoading && !reviewsError && sortedReviews.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Star className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters to see more results.</p>
                </div>
              )}

              {/* Pagination */}
              {!reviewsLoading && !reviewsError && reviewsData?.data && reviewsData.data.pages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {reviewsData.data.pages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(reviewsData.data.pages, p + 1))}
                    disabled={page >= reviewsData.data.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
