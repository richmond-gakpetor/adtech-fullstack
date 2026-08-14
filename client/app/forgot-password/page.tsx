"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { useRequestPasswordReset } from "@/app/api/hooks/useAuth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { mutate: requestReset, isPending } = useRequestPasswordReset()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    requestReset({ email }, {
      onSuccess: () => {
        setIsSubmitted(true)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 relative overflow-hidden">
      {/* Geometric Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-12 h-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div
              key={i}
              className="border border-green-600 aspect-square"
              style={{
                animationDelay: `${(i % 12) * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="container mx-auto max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center text-green-600 hover:text-green-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">
            {isSubmitted 
              ? "Check your email for reset instructions" 
              : "Enter your email to receive password reset instructions"
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-green-600" />
              {isSubmitted ? "Email Sent" : "Forgot Password"}
            </CardTitle>
            <CardDescription>
              {isSubmitted 
                ? "We've sent password reset instructions to your email address"
                : "We'll send you a link to reset your password"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isPending}
                >
                  {isPending ? "Sending..." : "Send Reset Instructions"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Remember your password?{" "}
                    <Link href="/login" className="text-green-600 hover:underline">
                      Back to login
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-600">
                  If an account with email <strong>{email}</strong> exists, you will receive password reset instructions shortly.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => setIsSubmitted(false)} 
                    variant="outline" 
                    className="w-full"
                  >
                    Send Another Email
                  </Button>
                  <Link href="/login" className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
