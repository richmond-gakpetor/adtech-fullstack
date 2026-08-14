"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useVerifyEmail } from "@/app/api/hooks/useVerification"

type VerificationStatus = "loading" | "success" | "error"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<VerificationStatus>("loading")
  const [message, setMessage] = useState("")
  
  const { mutate: verifyEmail } = useVerifyEmail()

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token provided. Please check your email for the verification link.")
      return
    }

    // Verify the token
    verifyEmail(token, {
      onSuccess: () => {
        setStatus("success")
        setMessage("Email verified successfully! You can now log in.")
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login?message=email_verified")
        }, 2000)
      },
      onError: (error: any) => {
        setStatus("error")
        const errorMessage = error?.response?.data?.message || "Verification failed. The link may be expired or invalid."
        setMessage(errorMessage)
      },
    })
  }, [token, verifyEmail, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              status === "loading" ? "bg-blue-100" : 
              status === "success" ? "bg-green-100" : 
              "bg-red-100"
            }`}>
              {status === "loading" && <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />}
              {status === "success" && <CheckCircle2 className="h-8 w-8 text-green-600" />}
              {status === "error" && <XCircle className="h-8 w-8 text-red-600" />}
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            {status === "loading" && "Verifying Email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 text-center">
                ✓ Your email has been verified successfully
              </p>
              <p className="text-sm text-green-600 text-center mt-2">
                Redirecting to login...
              </p>
            </div>
          )}
          
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-3">
                {message}
              </p>
              <div className="text-sm text-red-700">
                <strong>Common issues:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Link expired (valid for 24 hours)</li>
                  <li>Link already used</li>
                  <li>Invalid token</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {status === "error" && (
              <Link href="/verify-email/pending">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Request a New Link
                </Button>
              </Link>
            )}
            
            {status === "success" && (
              <Link href="/login">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Continue to Login
                </Button>
              </Link>
            )}
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
