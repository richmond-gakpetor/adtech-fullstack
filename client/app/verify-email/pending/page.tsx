"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, RefreshCw, ArrowLeft, Shield, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useResendVerification } from "@/app/api/hooks/useVerification"

const RESEND_COOLDOWN = 60

const KYC_DOCUMENTS = [
  "Proof of ownership (Deed, Lease Agreement, or Business Registration)",
  "Recent photos of your billboard(s)",
]

function PendingContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const isOwner = searchParams.get("type") === "owner"

  const [cooldown, setCooldown] = useState(0)
  const { mutate: resend, isPending } = useResendVerification()

  useEffect(() => {
    if (cooldown === 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = () => {
    if (!email || cooldown > 0 || isPending) return
    resend({ email }, { onSuccess: () => setCooldown(RESEND_COOLDOWN) })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Main card */}
        <Card>
          <CardContent className="px-8 pt-8 pb-8 text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
              <p className="text-sm text-gray-500">We sent a verification link to</p>
              <p className="font-semibold text-gray-900 bg-gray-100 rounded-lg px-4 py-2 text-sm break-all">
                {email || "your email address"}
              </p>
              <p className="text-xs text-gray-400">
                Click the link in the email to activate your account.
              </p>
            </div>

            {/* Email app shortcuts */}
            <div className="flex gap-2 justify-center">
              <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="text-xs">
                  Open Gmail
                </Button>
              </a>
              <a href="https://outlook.live.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="text-xs">
                  Open Outlook
                </Button>
              </a>
            </div>

            {/* Resend */}
            <div className="space-y-1">
              <p className="text-xs text-gray-400">
                Didn't receive it? Check your spam folder, or
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleResend}
                disabled={isPending || cooldown > 0 || !email}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
              </Button>
            </div>

            {/* Wrong email */}
            <div className="pt-2 border-t border-gray-100">
              <Link
                href="/signup"
                className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Wrong email? Go back to sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KYC info — owners only */}
        {isOwner && (
          <Card className="border-green-200">
            <CardContent className="px-6 pt-6 pb-6 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  Next step: KYC Verification
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                After verifying your email you&apos;ll need to complete a quick KYC check before
                you can list billboards.
              </p>
              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-green-800">You&apos;ll need to provide:</p>
                {KYC_DOCUMENTS.map((doc) => (
                  <div key={doc} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-green-700">{doc}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Review typically takes 2–3 business days.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      }
    >
      <PendingContent />
    </Suspense>
  )
}
