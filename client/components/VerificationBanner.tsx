"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Mail, Shield, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useVerificationStatus, useResendVerification } from "@/app/api/hooks/useVerification"
import { useAuth } from "@/app/api/hooks/useAuth"

interface VerificationBannerProps {
  hasListings?: boolean
}

export function VerificationBanner({ hasListings = false }: VerificationBannerProps) {
  const { user } = useAuth()
  const { data: verificationStatus, isLoading } = useVerificationStatus()
  const { mutate: resendVerification, isPending: isResending } = useResendVerification()

  if (isLoading || !verificationStatus) return null

  const handleResendVerification = () => {
    if (user?.email) {
      resendVerification({ email: user.email })
    }
  }

  const isOwner = user?.userType === 'owner'

  return (
    <div className="space-y-4 mb-6">
      {/* Email Verification Banner */}
      {verificationStatus.needsEmailVerification && (
        <Alert className="border-amber-200 bg-amber-50">
          <Mail className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Email Verification Required</AlertTitle>
          <AlertDescription className="text-amber-800">
            <p className="mb-3">
              Please verify your email address to access all features.
              {isOwner && " Email verification is required before you can list billboards."}
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={handleResendVerification}
                disabled={isResending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </Button>
              <span className="text-xs text-amber-700 self-center">
                Check your inbox for the verification link
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* KYC Verification Banners (Owner Only) */}
      {isOwner && !verificationStatus.needsEmailVerification && (
        <>
          {/* KYC Pending/Rejected - Action Required */}
          {verificationStatus.needsKyc && (
            <Alert className="border-amber-200 bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">KYC Verification Required</AlertTitle>
              <AlertDescription className="text-amber-800">
                <p className="mb-3">
                  {verificationStatus.kycStatus === 'rejected' 
                    ? "Your KYC submission was not approved. Please review the feedback and submit again."
                    : "Complete KYC verification to start listing billboards on the marketplace."
                  }
                </p>
                <div className="flex gap-3">
                  <Link href="/kyc-submission">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                      {verificationStatus.kycStatus === 'rejected' ? 'Resubmit KYC' : 'Complete KYC'}
                    </Button>
                  </Link>
                  <span className="text-xs text-amber-700 self-center">
                    Required to list billboards
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* KYC Under Review */}
          {verificationStatus.kycUnderReview && (
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">KYC Under Review</AlertTitle>
              <AlertDescription className="text-blue-800">
                <p>
                  Your KYC documents are currently being reviewed by our team. 
                  We'll notify you via email within 3 business days.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* KYC Approved — only show as onboarding nudge when owner has no listings yet */}
          {verificationStatus.kycStatus === 'approved' && verificationStatus.emailVerified && !hasListings && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Fully Verified!</AlertTitle>
              <AlertDescription className="text-green-800">
                <p className="mb-2">
                  Your account is fully verified. You can now list billboards on the marketplace.
                </p>
                <Link href="/list-billboard">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    List Your First Billboard
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Advertiser - Verified */}
      {!isOwner && verificationStatus.emailVerified && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Account Verified</AlertTitle>
          <AlertDescription className="text-green-800">
            Your account is verified. Start exploring billboard opportunities!
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
