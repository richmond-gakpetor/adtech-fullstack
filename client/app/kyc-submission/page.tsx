"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ExternalLink, CheckCircle2, Shield, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useKYCFormUrl, useSubmitKYC, useVerificationStatus } from "@/app/api/hooks/useVerification"

function KYCSubmissionContent() {
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [formOpened, setFormOpened] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const { data: verificationStatus, isLoading: statusLoading } = useVerificationStatus()
  const { data: formUrlData, refetch: getFormUrl, isLoading: urlLoading } = useKYCFormUrl()
  const { mutate: submitKYC, isPending: isSubmitting } = useSubmitKYC()

  // Check if user needs KYC
  useEffect(() => {
    if (verificationStatus) {
      // If email not verified, redirect to dashboard
      if (verificationStatus.needsEmailVerification) {
        router.push('/owner-dashboard?message=verify_email_first')
        return
      }
      
      // If already approved, redirect to dashboard
      if (verificationStatus.kycStatus === 'approved') {
        router.push('/owner-dashboard?message=kyc_already_approved')
        return
      }
      
      // If under review, show status
      if (verificationStatus.kycUnderReview) {
        // Allow viewing but show under review message
      }
    }
  }, [verificationStatus, router])

  const handleGetFormUrl = async () => {
    await getFormUrl()
  }

  const handleOpenForm = () => {
    if (formUrlData?.formUrl) {
      window.open(formUrlData.formUrl, '_blank')
      setFormOpened(true)
    }
  }

  const handleConfirmSubmission = () => {
    submitKYC(
      { confirmed: true, notes: notes || undefined },
      {
        onSuccess: () => {
          setSubmitted(true)
          setTimeout(() => {
            router.push('/owner-dashboard')
          }, 3000)
        },
      }
    )
  }

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    )
  }

  // If under review, show different UI
  if (verificationStatus?.kycUnderReview) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showListBillboard={false} />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">KYC Under Review</CardTitle>
                <CardDescription className="text-center">
                  Your documents are being reviewed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="border-blue-200 bg-blue-50 mb-6">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Your KYC submission is currently under review by our team. 
                    We'll notify you via email within 3 business days.
                  </AlertDescription>
                </Alert>
                <div className="text-center">
                  <Link href="/owner-dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showListBillboard={false} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center text-3xl">KYC Verification</CardTitle>
              <CardDescription className="text-center text-base">
                {verificationStatus?.kycStatus === 'rejected' 
                  ? 'Resubmit your KYC documents'
                  : 'Complete your verification to start listing billboards'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {verificationStatus?.kycStatus === 'rejected' && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Previous submission was not approved.</strong>
                    <p className="mt-1">Please review the requirements and submit again with correct documents.</p>
                  </AlertDescription>
                </Alert>
              )}

              {!formUrlData && !submitted && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Required Documents
                    </h3>
                    <ul className="space-y-2 text-blue-800">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Business Registration Documents</strong> (Certificate of Incorporation or Business License)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Proof of Address</strong> (Utility bill or Bank statement, not older than 3 months)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Billboard Ownership Proof</strong> (Property deed, lease agreement, or permission letter)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
                    <ol className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">1.</span>
                        <span>Click the button below to get your personalized KYC form</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">2.</span>
                        <span>Fill out the form and upload your documents</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">3.</span>
                        <span>Come back here and confirm your submission</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">4.</span>
                        <span>We'll review within 3 business days and notify you via email</span>
                      </li>
                    </ol>
                  </div>

                  <Button
                    onClick={handleGetFormUrl}
                    disabled={urlLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {urlLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Loading Form...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-5 w-5" />
                        Start KYC Process
                      </>
                    )}
                  </Button>
                </div>
              )}

              {formUrlData && !submitted && (
                <div className="space-y-6">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Your personalized KYC form is ready. Click the button below to open it in a new tab.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleOpenForm}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Open KYC Form
                  </Button>

                  {formOpened && (
                    <>
                      <div className="border-t pt-6">
                        <h3 className="font-semibold text-gray-900 mb-4">
                          Already submitted the form?
                        </h3>
                        <p className="text-gray-600 mb-4">
                          After completing and submitting the KYC form, come back here to confirm your submission.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="notes" className="text-gray-700">
                              Additional Notes (Optional)
                            </Label>
                            <Textarea
                              id="notes"
                              placeholder="Any additional information you'd like to provide..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="mt-2"
                              rows={4}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              You can add any clarifications or notes about your submission
                            </p>
                          </div>

                          <Button
                            onClick={handleConfirmSubmission}
                            disabled={isSubmitting}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Confirming...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Confirm KYC Submission
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {submitted && (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-900">
                    KYC Submitted Successfully!
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Your documents are now under review. We'll notify you via email within 3 business days.
                  </p>
                  <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default function KYCSubmissionPage() {
  return (
    <AuthGuard requiredUserType="owner">
      <KYCSubmissionContent />
    </AuthGuard>
  )
}
