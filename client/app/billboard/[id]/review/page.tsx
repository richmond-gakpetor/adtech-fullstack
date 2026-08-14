"use client"
import { ArrowLeft, Star, MessageSquare, User } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ReviewForm } from "@/components/review-form"
import { Footer } from "@/components/footer"

// Mock data - in real app, this would come from API
const mockBillboard = {
  id: 1,
  title: "Prime Location - Accra Mall",
  owner: {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Kwame Asante",
  },
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()

  const handleReviewSubmit = (reviewData: any) => {
    console.log("Review submitted:", reviewData)
    alert("Thank you for your review! It will be published after moderation.")
    router.push(`/billboard/${params.id}`)
  }

  const handleCancel = () => {
    router.push(`/billboard/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/billboard/${params.id}`}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Billboard</span>
            </Link>
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">XP</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Xposure GH</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Write a Review</h1>
            <p className="text-gray-600 text-lg">Share your experience with this billboard</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{mockBillboard.owner.name}</h3>
                <p className="text-sm text-gray-600">Billboard Owner</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-medium text-gray-900 mb-2">{mockBillboard.title}</h4>
              <p className="text-sm text-gray-600">East Legon, Accra</p>
            </div>
          </div>

          <ReviewForm
            revieweeId={mockBillboard.owner.id}
            revieweeName={mockBillboard.owner.name}
            billboardId={params.id as string}
            billboardTitle={mockBillboard.title}
            reviewType="billboard"
            onSubmit={handleReviewSubmit}
            onCancel={handleCancel}
          />

          <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-start space-x-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Review Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be honest and constructive in your feedback</li>
                  <li>• Focus on your experience with the billboard and owner</li>
                  <li>• Avoid personal attacks or inappropriate language</li>
                  <li>• Reviews are moderated and may take 24-48 hours to appear</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
