"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useVerifyPayment } from "@/app/api/exports"

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference") || ""
  
  // Use the API hook to verify payment
  const { data: verificationResponse, isLoading, isError } = useVerifyPayment(reference)
  
  const verificationStatus = isLoading ? "loading" : isError ? "failed" : verificationResponse?.data.status === "completed" ? "success" : "failed"
  const paymentData = verificationResponse?.data

  if (verificationStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">XP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Xposure GH</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {verificationStatus === "success" ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-6">
                  Your payment has been processed successfully. You will receive a confirmation email shortly.
                </p>

                {paymentData && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold mb-3">Payment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Reference:</span>
                        <span className="font-mono">{paymentData.reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>GHS {(paymentData.amount / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="text-green-600 font-medium">Successful</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(paymentData.paid_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Link href="/owner-dashboard">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Return Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                <p className="text-gray-600 mb-6">
                  We couldn't process your payment. Please try again or contact support if the problem persists.
                </p>

                <div className="space-y-3">
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => window.history.back()}>
                    Try Again
                  </Button>
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Return Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
