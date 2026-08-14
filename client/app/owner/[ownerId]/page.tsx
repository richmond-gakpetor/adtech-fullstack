"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MapPin, Star, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Header } from "@/components/Header"
import { useUser, useUserBillboards } from "@/app/api/hooks/useUsers"
import { useUserReviews, useUserReviewSummary } from "@/app/api/hooks/useReviews"
import { formatDistanceToNow } from "date-fns"
import type { Billboard } from "@/lib/types"
import { useMyBillboards } from "@/app/api/exports"

export default function OwnerProfilePage() {
  const params = useParams() as { ownerId?: string }
  const ownerId = params?.ownerId
  
  // Fetch owner data
  const { data: ownerData, isLoading: ownerLoading, error: ownerError } = useUser(ownerId || '')
  const { data: billboardsData, isLoading: billboardsLoading } = useMyBillboards()
  const { data: reviewsData, isLoading: reviewsLoading } = useUserReviews(ownerId || '', 1, 10)
  const { data: reviewSummaryData } = useUserReviewSummary(ownerId || '')
  
  const owner = ownerData?.data
  const billboards = billboardsData?.data?.items || []
  const reviews = reviewsData?.data?.items || []
  const reviewSummary = reviewSummaryData?.data
  
  if (ownerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading owner profile...</p>
        </div>
      </div>
    )
  }
  
  if (ownerError || !owner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Owner Not Found</h2>
          <p className="text-gray-600 mb-4">The owner profile you're looking for doesn't exist.</p>
          <Link href="/browse">
            <Button className="bg-green-600 hover:bg-green-700">Back to Browse</Button>
          </Link>
        </Card>
      </div>
    )
  }
  
  const joinedDate = owner.createdAt 
    ? formatDistanceToNow(new Date(owner.createdAt), { addSuffix: true })
    : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center text-gray-900 justify-between">
              <span>{owner.companyName || owner.fullName}</span>
              <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Joined {joinedDate}</Badge>
            </CardTitle>
            <CardDescription className="text-gray-600">Billboard Owner</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {reviewSummary && reviewSummary.totalReviews > 0 && (
              <div className="flex items-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => {
                    const avgRating = reviewSummary.averageRating || 0
                    return (
                      <Star key={i} className={`h-5 w-5 ${i < Math.floor(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    )
                  })}
                </div>
                <span className="ml-3 text-sm text-gray-600 font-medium">
                  {reviewSummary.averageRating?.toFixed(1)} ({reviewSummary.totalReviews} reviews)
                </span>
              </div>
            )}

            <Separator />

            {owner.bio && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  About
                </h3>
                <p className="text-gray-700">{owner.bio}</p>
              </div>
            )}

            <Separator />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                Listings ({billboards.length})
              </h3>
              {billboardsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : billboards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {billboards.map((billboard: Billboard) => (
                    <Card key={billboard.id} className="border border-green-200/60">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{billboard.title}</div>
                          <div className="text-sm text-gray-600 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {billboard.location}
                          </div>
                          <div className="text-sm font-medium text-green-600 mt-1">
                            GHS {billboard.monthlyRate || billboard.weeklyRate * 4}/month
                          </div>
                        </div>
                        <Link href={`/billboard/${billboard.id}`}>
                          <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">View</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No billboards listed yet</p>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews ({reviewSummary?.totalReviews || 0})</h3>
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <Card key={review.id} className="border border-green-200/60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-900">{review.reviewerName}</div>
                            <div className="flex items-center mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {review.title && <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>}
                        <p className="text-gray-700">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No reviews yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
