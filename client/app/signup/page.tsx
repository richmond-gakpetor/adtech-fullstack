"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, Megaphone, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useRegister } from "@/app/api/hooks/useAuth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Validation Schema
const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.union([
    z.string().regex(/^\+233[0-9]{9}$/, "Enter a valid Ghanaian number (9 digits after +233)"),
    z.null(),
  ]),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
  confirmPassword: z.string(),
  userType: z.enum(["owner", "advertiser"]),
  companyName: z.string().optional().nullable(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const defaultType = (searchParams.get("type") as "owner" | "advertiser") || "advertiser"

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phoneDisplay, setPhoneDisplay] = useState("")
  const { mutate: register, isPending } = useRegister()

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: null,
      password: "",
      confirmPassword: "",
      userType: defaultType,
      companyName: null,
      agreeToTerms: false,
    },
  })

  const userType = watch("userType")
  const agreeToTerms = watch("agreeToTerms")

  const onSubmit = (data: SignupFormData) => {
    register({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      userType: data.userType,
      companyName: data.companyName,
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
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Join Xposure GH</h1>
          <p className="text-gray-600 mt-2">Create your account to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Choose your account type and fill in your details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* User Type Selection */}
              <div>
                <Label className="text-base font-medium">I am a...</Label>
                <RadioGroup 
                  value={userType} 
                  onValueChange={(value) => setValue("userType", value as "owner" | "advertiser")} 
                  className="mt-3"
                  disabled={isPending}
                >
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="owner" id="owner" />
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-green-600" />
                      <div>
                        <Label htmlFor="owner" className="font-medium cursor-pointer">
                          Billboard Owner
                        </Label>
                        <p className="text-sm text-gray-500">I want to list my billboards for rent</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="advertiser" id="advertiser" />
                    <div className="flex items-center space-x-3">
                      <Megaphone className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label htmlFor="advertiser" className="font-medium cursor-pointer">
                          Advertiser
                        </Label>
                        <p className="text-sm text-gray-500">I want to rent billboard space</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  {...registerField("fullName")}
                  disabled={isPending}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...registerField("email")}
                  disabled={isPending}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                    +233
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    className="rounded-l-none"
                    placeholder="200000000"
                    value={phoneDisplay}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "")
                      const limited = digits.slice(0, 9)
                      setPhoneDisplay(limited)
                      setValue("phone", limited ? `+233${limited}` : null, { shouldValidate: true })
                    }}
                    disabled={isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Used for WhatsApp contact. Enter digits only, e.g. 200000000</p>
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Company Information (optional) */}
              <div>
                <Label htmlFor="companyName">
                  {userType === "owner" ? "Company/Business Name (Optional)" : "Company Name (Optional)"}
                </Label>
                <Input
                  id="companyName"
                  {...registerField("companyName")}
                  placeholder={userType === "owner" ? "Your billboard company" : "Your advertising company"}
                  disabled={isPending}
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...registerField("password")}
                    className="pr-10"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isPending}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...registerField("confirmPassword")}
                    className="pr-10"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isPending}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setValue("agreeToTerms", checked as boolean)}
                    disabled={isPending}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Link href="/terms" className="text-green-600 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-green-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!agreeToTerms || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-green-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
