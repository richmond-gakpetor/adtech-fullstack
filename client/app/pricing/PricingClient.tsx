"use client"

import { useState } from "react"
import { Check, HelpCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"
import { useRouter, useSearchParams } from "next/navigation"
import { LISTING_GRACE_DAYS, LISTING_TIERS, getListingTier } from "@/lib/billing/listingTiers"

// Derive "best value" tier at module level — lowest cost-per-day
const bestValueId = LISTING_TIERS.reduce((best, tier) =>
  tier.priceGhs / tier.durationDays < best.priceGhs / best.durationDays ? tier : best
).id

const FAQ_ITEMS = [
  {
    q: "What happens after my listing expires?",
    a: `Your listing stays visible during a ${LISTING_GRACE_DAYS}-day grace period. After that, it's hidden from browse until you renew.`,
  },
  {
    q: "Can I renew before expiry?",
    a: "Yes — renew anytime. Your remaining days are preserved and extended from the current end date.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 30-day money-back guarantee if you're not satisfied. No questions asked.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Mobile Money (MTN, Vodafone, AirtelTigo), bank transfers, and all major credit/debit cards via our secure payment gateway.",
  },
  {
    q: "Are there any setup fees?",
    a: "None. The price you see is exactly what you pay.",
  },
  {
    q: "Can I list billboards in multiple cities?",
    a: "Yes — list billboards anywhere in Ghana. Each billboard is priced individually.",
  },
]

export default function PricingClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const billboardId = searchParams.get("billboardId")
  const isRenewal = searchParams.get("renew") === "true"

  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)

  const handleSelectTier = (tierId: string) => {
    setSelectedTierId(tierId)
    if (!billboardId) return
    const tier = getListingTier(tierId)
    if (!tier) return

    const qs = new URLSearchParams({
      type: "listing_access",
      amount: String(tier.priceGhs),
      durationDays: String(tier.durationDays),
      tierId: tier.id,
      billboardId,
    })
    router.push(`/payment?${qs.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 pt-12 pb-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {isRenewal ? "Renew Your Billboard Listing" : "Simple, Transparent Pricing"}
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          {isRenewal
            ? "Select a duration to extend your listing."
            : "One-time payment per billboard. No subscriptions."}
        </p>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* ---------------------------------------------------------------- */}
        {/* Pricing cards                                                     */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {LISTING_TIERS.map((tier) => {
            const isBestValue = tier.id === bestValueId
            const isSelected = selectedTierId === tier.id
            const perDay = (tier.priceGhs / tier.durationDays).toFixed(2)

            return (
              <Card
                key={tier.id}
                className={`relative flex flex-col overflow-hidden transition-all duration-200 cursor-pointer
                  ${isBestValue ? "border-green-400 shadow-green-100 shadow-md" : "border-gray-200"}
                  ${isSelected ? "ring-2 ring-green-500" : "hover:shadow-lg"}
                `}
                onClick={() => billboardId && handleSelectTier(tier.id)}
              >
                {isBestValue && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-green-600 text-white text-xs px-2.5 py-1">Best Value</Badge>
                  </div>
                )}

                <CardHeader className={`pt-8 pb-6 px-6 ${isBestValue ? "bg-green-600" : "bg-gray-800"}`}>
                  <CardTitle className="text-white text-xl font-bold">{tier.label}</CardTitle>
                  <p className="text-white/70 text-sm mt-0.5">Per billboard listing</p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 p-6">
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">GHS {tier.priceGhs.toLocaleString()}</span>
                      <span className="text-gray-400 text-sm">one-time</span>
                    </div>
                    <p className="hidden text-xs text-gray-400 mt-1">≈ GHS {perDay}/day · {tier.durationDays} days visibility</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {[
                      "Visible to all advertisers",
                      "Chat & inquiry support",
                      "Renew anytime before expiry",
                      `${LISTING_GRACE_DAYS}-day grace period after expiry`,
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA — only when a billboard payment is in progress */}
                  {billboardId && (
                    <Button
                      className={`w-full font-semibold ${isBestValue ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900"} text-white`}
                      onClick={(e) => { e.stopPropagation(); handleSelectTier(tier.id) }}
                    >
                      {isRenewal ? "Renew for this Duration" : "Continue to Payment"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Prompt for owners browsing without a billboard context */}
        {!billboardId && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Ready to list your billboard? Start from the upload flow and you'll be directed here to complete payment.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/list-billboard")}
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              List a Billboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* FAQ                                                               */}
        {/* ---------------------------------------------------------------- */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-500 mt-2 text-sm">Everything you need to know before getting started.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FAQ_ITEMS.map(({ q, a }) => (
              <div key={q} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">{q}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
