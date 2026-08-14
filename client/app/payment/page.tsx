"use client"

import { useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, CreditCard, Shield, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useInitializePayment } from "@/app/api/exports"
import { toast } from "sonner"

interface PaymentDetails {
  type: "listing_fee" | "booking" | "commission" | "listing_access"
  amount: number
  description: string
  billboardTitle?: string
  duration?: string
  durationDays?: number
  tierId?: string
  billboardId?: string
  reference: string
}

function getPaymentDescription(type: PaymentDetails["type"], billboardTitle?: string | null) {
  switch (type) {
    case "listing_fee":
      return "Billboard listing access"
    case "listing_access":
      return "Billboard listing access"
    case "booking":
      return `Booking payment for ${billboardTitle || "billboard"}`
    case "commission":
      return "Platform commission fee"
    default:
      return "Payment"
  }
}

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { mutate: initializePayment, isPending } = useInitializePayment()

  const referenceRef = useRef<string | null>(null)
  if (!referenceRef.current) {
    referenceRef.current = `XP_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }

  const paymentDetails = useMemo<PaymentDetails | null>(() => {
    const type = searchParams.get("type") as PaymentDetails["type"]
    const amount = Number.parseFloat(searchParams.get("amount") || "0")
    const billboardTitle = searchParams.get("billboard")
    const duration = searchParams.get("duration")
    const durationDaysRaw = searchParams.get("durationDays")
    const durationDays = durationDaysRaw ? Number.parseInt(durationDaysRaw) : undefined
    const tierId = searchParams.get("tierId") ?? undefined
    const billboardId = searchParams.get("billboardId") ?? undefined

    if (!type || !amount) return null

    return {
      type,
      amount,
      description: getPaymentDescription(type, billboardTitle),
      billboardTitle: billboardTitle ?? undefined,
      duration: duration ?? undefined,
      durationDays,
      tierId,
      billboardId,
      reference: referenceRef.current!,
    }
  }, [searchParams])

  const handlePayment = async () => {
    if (!paymentDetails) return

    // Validate required fields
    if (!paymentDetails.billboardId || !paymentDetails.tierId) {
      toast.error('Missing required payment information')
      return
    }

    initializePayment({
      billboardId: paymentDetails.billboardId,
      tierId: paymentDetails.tierId,
    })
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Payment Request</h1>
          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-green-600 hover:text-green-700">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">XP</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Xposure GH</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h1>
            <p className="text-gray-600">Complete your payment using Paystack</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Details */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>Review your payment information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Payment Type:</span>
                    <Badge variant="outline">
                      {paymentDetails.type === "listing_fee" && "Listing Fee"}
                      {paymentDetails.type === "listing_access" && "Listing Access"}
                      {paymentDetails.type === "booking" && "Booking Payment"}
                      {paymentDetails.type === "commission" && "Commission Fee"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium">Description:</span>
                    <span className="text-gray-600">{paymentDetails.description}</span>
                  </div>

                  {paymentDetails.billboardTitle && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Billboard:</span>
                      <span className="text-gray-600">{paymentDetails.billboardTitle}</span>
                    </div>
                  )}

                  {paymentDetails.duration && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Duration:</span>
                      <span className="text-gray-600">{paymentDetails.duration}</span>
                    </div>
                  )}

                  {paymentDetails.durationDays && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Duration:</span>
                      <span className="text-gray-600">{paymentDetails.durationDays} days</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="font-medium">Reference:</span>
                    <span className="text-gray-600 font-mono text-sm">{paymentDetails.reference}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">GHS {paymentDetails.amount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="lg:sticky lg:top-6 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>GHS {paymentDetails.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Processing Fee:</span>
                      <span>GHS 0.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">GHS {paymentDetails.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handlePayment}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay with Paystack
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    You will be redirected to Paystack to complete your payment securely
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
