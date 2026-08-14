"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"

interface ReviewFormProps {
  revieweeId: string
  revieweeName: string
  billboardId?: string
  billboardTitle?: string
  bookingId?: string
  reviewType: "billboard" | "owner" | "advertiser"
  onSubmit?: (reviewData: any) => void
  onCancel?: () => void
}

export function ReviewForm({
  revieweeId,
  revieweeName,
  billboardId,
  billboardTitle,
  bookingId,
  reviewType,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [formData, setFormData] = useState({
    title: "",
    comment: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      alert("Please select a rating")
      return
    }

    setIsSubmitting(true)
    try {
      const reviewData = {
        revieweeId,
        billboardId,
        bookingId,
        rating,
        title: formData.title,
        comment: formData.comment,
        reviewType,
      }

      // Here you would submit to your API
      console.log("Submitting review:", reviewData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (onSubmit) {
        onSubmit(reviewData)
      } else {
        alert("Review submitted successfully!")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>
          Share your experience with {revieweeName}
          {billboardTitle && ` for "${billboardTitle}"`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <Label>Rating</Label>
            <div className="flex items-center space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 && (
                  <>
                    {rating} star{rating !== 1 ? "s" : ""} -{rating === 5 && " Excellent"}
                    {rating === 4 && " Good"}
                    {rating === 3 && " Average"}
                    {rating === 2 && " Poor"}
                    {rating === 1 && " Very Poor"}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Review Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Summarize your experience"
              required
            />
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Your Review</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange("comment", e.target.value)}
              placeholder="Tell others about your experience..."
              rows={4}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
