"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MapPin, Camera, ArrowLeft, Plus, X, Shield, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { LocationPicker, LocationData } from "@/components/LocationPicker"
import { useRouter } from "next/navigation"
import { useCreateBillboard, useAdminCreateBillboard } from "@/app/api/hooks/useBillboards"
import { useUploadBillboardImages } from "@/app/api/hooks/useUploads"
import { useVerificationStatus } from "@/app/api/hooks/useVerification"
import { usePublicConfig } from "@/app/api/hooks/useConfig"
import { useAuthStore } from "@/lib/stores/auth-store"
import type { BillboardCreateInput } from "@/lib/types"

export default function ListBillboardPage() {
  const router = useRouter()
  const createBillboard = useCreateBillboard()
  const adminCreateBillboard = useAdminCreateBillboard()
  const uploadImages = useUploadBillboardImages()
  const { data: verificationStatus, isLoading: verificationLoading } = useVerificationStatus()
  const { data: config, isLoading: configLoading } = usePublicConfig()
  const { user, _hasHydrated } = useAuthStore()
  const isAdmin = user?.userType === 'admin'
  
  
  const [currentPhase, setCurrentPhase] = useState<'details' | 'images'>('details')
  const [currentStep, setCurrentStep] = useState(1) // Only used in Phase 1
  const [billboardId, setBillboardId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check verification status
  useEffect(() => {
    if (!_hasHydrated) return // Wait for auth store to rehydrate from localStorage
    if (isAdmin) return // Admin bypasses verification
    if (verificationStatus && !verificationStatus.canListBillboards) {
      // Redirect to dashboard with message
      if (verificationStatus.needsEmailVerification) {
        router.push('/owner-dashboard?message=verify_email_required')
      } else if (verificationStatus.needsKyc) {
        router.push('/owner-dashboard?message=kyc_required')
      } else if (verificationStatus.kycUnderReview) {
        router.push('/owner-dashboard?message=kyc_under_review')
      }  
    }
  }, [verificationStatus, router, isAdmin, _hasHydrated])
  const [formData, setFormData] = useState({
    // Basic Information
    title: "",
    description: "",
    location: "",
    fullAddress: "",
    coordinates: { lat: "", lng: "" },

    // Owner contact (admin only — shown instead of admin's profile info)
    contactName: "",
    contactPhone: "",

    // Billboard Specifications
    width: "",
    height: "",
    type: "",
    orientation: "",
    illumination: "",

    // Pricing
    weeklyRate: "",
    monthlyRate: "",
    minimumDuration: "",
    // Additional fees for static billboards only
    printingFee: "",  
    flightFee: "",    

    // Features & Landmarks 
    features: [] as string[],
    nearbyLandmarks: [] as string[],

    // Availability
    availableFrom: "",
    availableTo: "",

    // Terms
    agreeToTerms: false,
    listingFeeAgreed: false,    
  })

  // Image upload state (separate from form data)
  const [images, setImages] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const [newFeature, setNewFeature] = useState("")
  const [newLandmark, setNewLandmark] = useState("")

  const handleInputChange = (field: string, value: string | boolean | string[] | object) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle location picker changes
  const handleLocationChange = (locationData: LocationData) => {
    setFormData((prev) => ({
      ...prev,
      location: locationData.location,
      fullAddress: locationData.fullAddress,
      coordinates: {
        lat: String(locationData.coordinates.lat),
        lng: String(locationData.coordinates.lng),
      },
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const maxImages = 4
    
    setImages((prev) => {
      const remainingSlots = maxImages - prev.length
      if (remainingSlots <= 0) {
        alert(`Maximum ${maxImages} images allowed. Please remove some images first.`)
        return prev
      }
      
      const filesToAdd = files.slice(0, remainingSlots)
      if (files.length > remainingSlots) {
        alert(`Only ${remainingSlots} more image${remainingSlots > 1 ? 's' : ''} can be added. Maximum ${maxImages} images allowed.`)
      }
      
      return [...prev, ...filesToAdd]
    })
    
    // Clear the input so the same files can be selected again if needed
    event.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const addLandmark = () => {
    if (newLandmark.trim()) {
      setFormData((prev) => ({
        ...prev,
        nearbyLandmarks: [...prev.nearbyLandmarks, newLandmark.trim()],
      }))
      setNewLandmark("")
    }
  }

  const removeLandmark = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      nearbyLandmarks: prev.nearbyLandmarks.filter((_, i) => i !== index),
    }))
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Transform form data to match API schema
      const billboardData: BillboardCreateInput = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        fullAddress: formData.fullAddress || null,
        coordinates: {
          lat: formData.coordinates.lat ? parseFloat(formData.coordinates.lat) : 0,
          lng: formData.coordinates.lng ? parseFloat(formData.coordinates.lng) : 0,
        },
        // Normalize type: "digital" → "Digital", "static" → "Static"
        billboardType: (formData.type?.toLowerCase() === 'digital' ? 'Digital' : 'Static') as 'Digital' | 'Static',
        widthFt: parseFloat(formData.width) || 0,
        heightFt: parseFloat(formData.height) || 0,
        weeklyRate: parseInt(formData.weeklyRate),
        monthlyRate: formData.monthlyRate ? parseInt(formData.monthlyRate) : null,
        orientation: formData.orientation || null,
        illumination: formData.illumination || null,
        minimumDuration: formData.minimumDuration || null,
        printingFee: formData.printingFee ? parseInt(formData.printingFee) : null,
        flightFee: formData.flightFee ? parseInt(formData.flightFee) : null,
        features: formData.features,
        nearbyLandmarks: formData.nearbyLandmarks,
        availableFrom: formData.availableFrom || null,
        availableTo: formData.availableTo || null,
        images: [], // Images will be added in phase 2
        contactName: isAdmin ? (formData.contactName || null) : null,
        contactPhone: isAdmin ? (formData.contactPhone || null) : null,
      }

      // Create billboard via API — admin uses dedicated endpoint
      const response = isAdmin
        ? await adminCreateBillboard.mutateAsync(billboardData)
        : await createBillboard.mutateAsync(billboardData)
      
      // Store the billboard ID for image upload
      setBillboardId(response.data.id)
      
      // Move to Phase 2: Image Upload
      setCurrentPhase('images')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create billboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageSubmit = async () => {
    if (!billboardId || images.length === 0) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Upload images to S3 via API (automatically attaches to billboard)
      await uploadImages.mutateAsync({ files: images, billboardId })
      
      if (isAdmin) {
        // Admin-created billboards are already active — go straight to admin panel
        router.push('/admin?message=billboard_created')
      } else if (config && !config.require_payment_for_visibility) {
        // Promo mode: Billboard is already live, redirect to dashboard
        router.push(`/owner-dashboard?message=billboard_live&days=${config.promotional_listing_days}`)
      } else {
        // Payment required: Redirect to pricing
        router.push(`/pricing?billboardId=${encodeURIComponent(billboardId)}`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: "Basic Info", description: "Billboard details" },
    { number: 2, title: "Specifications", description: "Size & type" },
    { number: 3, title: "Details & Pricing", description: "Features & rates" },
    { number: 4, title: "Review & Submit", description: "Confirm details" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Promotional Banner */}
          {config && !config.require_payment_for_visibility && (
            <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-center space-x-3">
                <div className="text-4xl">🎉</div>
                <div>
                  <h3 className="text-2xl font-bold">Free Listing Promotion!</h3>
                  <p className="text-green-50">
                    List your billboard for FREE and get {config.promotional_listing_days} days of visibility to advertisers. 
                    No payment required!
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {(verificationLoading || configLoading) && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </CardContent>
            </Card>
          )}
          
          {/* Verification Blocked State — owners only, never shown to admin */}
          {!isAdmin && !verificationLoading && verificationStatus && !verificationStatus.canListBillboards && (
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <Shield className="h-8 w-8 text-amber-600" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">Verification Required</CardTitle>
                <CardDescription className="text-center">
                  Complete verification to list billboards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {verificationStatus.needsEmailVerification && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900">Email Verification Required</AlertTitle>
                    <AlertDescription className="text-amber-800">
                      Please verify your email address before listing billboards.
                    </AlertDescription>
                  </Alert>
                )}
                
                {!verificationStatus.needsEmailVerification && verificationStatus.needsKyc && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900">KYC Verification Required</AlertTitle>
                    <AlertDescription className="text-amber-800">
                      <p className="mb-3">Complete KYC verification to start listing billboards.</p>
                      <Link href="/kyc-submission">
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                          Complete KYC Now
                        </Button>
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}
                
                {verificationStatus.kycUnderReview && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">KYC Under Review</AlertTitle>
                    <AlertDescription className="text-blue-800">
                      Your KYC documents are being reviewed. You'll be able to list billboards once approved.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="text-center pt-4">
                  <Link href="/owner-dashboard">
                    <Button variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Show form only if verified OR if admin */}
          {(_hasHydrated && !verificationLoading && (verificationStatus?.canListBillboards || isAdmin)) && (
            <>
          {/* Show different UI based on current phase */}
          {currentPhase === 'details' ? (
            <>
              {/* Progress Steps - Phase 1 */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 mb-4">
                    Phase 1 of 2: Billboard Details
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          currentStep >= step.number
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-300 text-gray-500"
                        }`}
                      >
                        {step.number}
                      </div>
                      <div className="ml-3 hidden sm:block">
                        <div
                          className={`text-sm font-medium ${
                            currentStep >= step.number ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-500">{step.description}</div>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`hidden sm:block w-16 h-0.5 ml-6 ${
                            currentStep > step.number ? "bg-green-600" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Tell us about your billboard and its location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Admin-only: owner contact override fields */}
                  {isAdmin && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-amber-600" />
                        <p className="text-sm font-semibold text-amber-900">Admin: Owner Contact Details</p>
                      </div>
                      <p className="text-xs text-amber-700">
                        These details will be shown to advertisers instead of your admin profile.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactName">Owner Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="contactName"
                            value={formData.contactName}
                            onChange={(e) => handleInputChange("contactName", e.target.value)}
                            placeholder="e.g., Kwame Mensah"
                            required={isAdmin}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactPhone">Owner Phone <span className="text-red-500">*</span></Label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                              +233
                            </span>
                            <Input
                              id="contactPhone"
                              type="tel"
                              className="rounded-l-none"
                              value={formData.contactPhone.replace(/^\+233/, "")}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "")
                                const limited = digits.slice(0, 9)
                                handleInputChange("contactPhone", limited ? `+233${limited}` : "")
                              }}
                              placeholder="200000000"
                              required={isAdmin}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Enter digits only, e.g. 200000000</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="title">Billboard Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g., Prime Location - Accra Mall Entrance"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Create an attractive title that highlights your billboard's best feature
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe your billboard's location, visibility, and what makes it special..."
                      rows={4}
                      required
                    />
                  </div>

                  {/* Location Picker - Search & Map */}
                  <Separator />
                  <LocationPicker
                    value={{
                      location: formData.location,
                      fullAddress: formData.fullAddress,
                      coordinates: formData.coordinates.lat && formData.coordinates.lng
                        ? {
                            lat: parseFloat(formData.coordinates.lat) || 0,
                            lng: parseFloat(formData.coordinates.lng) || 0,
                          }
                        : undefined,
                    }}
                    onChange={handleLocationChange}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Specifications */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Billboard Specifications</CardTitle>
                  <CardDescription>Provide technical details about your billboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width">Width (m)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={formData.width}
                        onChange={(e) => handleInputChange("width", e.target.value)}
                        placeholder="e.g., 48"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (m)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        placeholder="e.g., 14"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Billboard Type</Label>
                      <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital">Digital/LED</SelectItem>
                          <SelectItem value="static">Static/Print</SelectItem>
                          <SelectItem value="vinyl">Vinyl Banner</SelectItem>
                          <SelectItem value="neon">Neon Sign</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Orientation</Label>
                      <Select
                        value={formData.orientation}
                        onValueChange={(value) => handleInputChange("orientation", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select orientation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landscape">Landscape</SelectItem>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Illumination</Label>
                    <Select
                      value={formData.illumination}
                      onValueChange={(value) => handleInputChange("illumination", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select illumination type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="led-backlit">LED Backlit</SelectItem>
                        <SelectItem value="front-lit">Front Lit</SelectItem>
                        <SelectItem value="non-illuminated">Non-illuminated</SelectItem>
                        <SelectItem value="solar-powered">Solar Powered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Details & Pricing */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Details & Pricing</CardTitle>
                  <CardDescription>Set your rates and add billboard features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pricing Section */}
                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-900">Pricing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="weeklyRate">Weekly Rate (GHS)</Label>
                        <Input
                          id="weeklyRate"
                          type="number"
                          value={formData.weeklyRate}
                          onChange={(e) => handleInputChange("weeklyRate", e.target.value)}
                          placeholder="3000"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum booking duration</p>
                      </div>
                      <div>
                        <Label htmlFor="monthlyRate">Monthly Rate (GHS)</Label>
                        <Input
                          id="monthlyRate"
                          type="number"
                          value={formData.monthlyRate}
                          onChange={(e) => handleInputChange("monthlyRate", e.target.value)}
                          placeholder="10000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional: Usually 25% discount from weekly rate</p>
                      </div>
                    </div>

                    <div>
                      <Label>Minimum Rental Duration</Label>
                      <Select
                        value={formData.minimumDuration}
                        onValueChange={(value) => handleInputChange("minimumDuration", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select minimum duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-week">1 Week</SelectItem>
                          <SelectItem value="2-weeks">2 Weeks</SelectItem>
                          <SelectItem value="1-month">1 Month</SelectItem>
                          <SelectItem value="3-months">3 Months</SelectItem>
                          <SelectItem value="6-months">6 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Additional Fees for Static Billboards */}
                    {formData.type && ['static', 'vinyl', 'neon'].includes(formData.type) && (
                      <div className="border-t pt-6">
                        <h5 className="font-semibold text-gray-900 mb-4">Additional Fees for Static Billboards</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="printingFee">Printing Fee (GHS)</Label>
                            <Input
                              id="printingFee"
                              type="number"
                              value={formData.printingFee}
                              onChange={(e) => handleInputChange("printingFee", e.target.value)}
                              placeholder="800"
                              required={!!formData.type && ['static', 'vinyl', 'neon'].includes(formData.type)}
                            />
                            <p className="text-xs text-gray-500 mt-1">One-time fee for printing artwork/banner</p>
                          </div>
                          <div>
                            <Label htmlFor="flightFee">Flight Fee (GHS)</Label>
                            <Input
                              id="flightFee"
                              type="number"
                              value={formData.flightFee}
                              onChange={(e) => handleInputChange("flightFee", e.target.value)}
                              placeholder="400"
                              required={!!formData.type && ['static', 'vinyl', 'neon'].includes(formData.type)}
                            />
                            <p className="text-xs text-gray-500 mt-1">One-time fee for hoisting artwork on billboard</p>
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                          <h5 className="font-medium text-yellow-900 mb-2">Static Billboard Fees Explained</h5>
                          <ul className="text-sm text-yellow-800 space-y-1">
                            <li>• <strong>Printing Fee:</strong> Covers the cost of printing your artwork/banner material</li>
                            <li>• <strong>Flight Fee:</strong> Covers the cost of professionally mounting/hoisting your banner</li>
                            <li>• These are one-time fees charged at the start of each campaign</li>
                            <li>• Fees vary based on billboard size and material requirements</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Features Section */}
                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-900">Features & Details</h4>
                    
                    {/* Features */}
                    <div>
                      <Label>Billboard Features</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="e.g., LED Display, Weather Resistant"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                        />
                        <Button type="button" onClick={addFeature}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {feature}
                              <button onClick={() => removeFeature(index)}>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Nearby Landmarks */}
                    <div>
                      <Label>Nearby Landmarks</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          value={newLandmark}
                          onChange={(e) => setNewLandmark(e.target.value)}
                          placeholder="e.g., Accra Mall, Tetteh Quarshie Interchange"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLandmark())}
                        />
                        <Button type="button" onClick={addLandmark}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.nearbyLandmarks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.nearbyLandmarks.map((landmark, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {landmark}
                              <button onClick={() => removeLandmark(index)}>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Availability */}
                    <div>
                      <Label>Availability</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label htmlFor="availableFrom">Available From</Label>
                          <Input
                            id="availableFrom"
                            type="date"
                            value={formData.availableFrom}
                            onChange={(e) => handleInputChange("availableFrom", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="availableTo">Available Until (Optional)</Label>
                          <Input
                            id="availableTo"
                            type="date"
                            value={formData.availableTo}
                            onChange={(e) => handleInputChange("availableTo", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Pricing Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Research similar billboards in your area</li>
                      <li>• Consider your location's foot traffic and visibility</li>
                      <li>• Offer discounts for longer bookings</li>
                      <li>• Factor in your costs (electricity, maintenance, permits)</li>
                      {formData.type && ['static', 'vinyl', 'neon'].includes(formData.type) && (
                        <>
                          <li>• Static billboards include separate printing and flight fees</li>
                          <li>• Base printing/flight fees on your actual costs from suppliers</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Listing</CardTitle>
                  <CardDescription>Please review all information before submitting your billboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Title:</span> {formData.title}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {formData.fullAddress}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {formData.width} x {formData.height} m
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {formData.type}
                        </div>
                        <div>
                          <span className="font-medium">Orientation:</span> {formData.orientation}
                        </div>
                        <div>
                          <span className="font-medium">Illumination:</span> {formData.illumination}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Pricing</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Weekly Rate:</span> GHS {formData.weeklyRate}
                        </div>
                        {formData.monthlyRate && (
                          <div>
                            <span className="font-medium">Monthly Rate:</span> GHS {formData.monthlyRate}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Min Duration:</span> {formData.minimumDuration}
                        </div>
                        {formData.type && ['static', 'vinyl', 'neon'].includes(formData.type) && (
                          <>
                            <div className="pt-2 border-t">
                              <span className="font-medium text-blue-700">Additional Fees (Static Billboard):</span>
                            </div>
                            {formData.printingFee && (
                              <div className="ml-2">
                                <span className="font-medium">Printing Fee:</span> GHS {formData.printingFee}
                              </div>
                            )}
                            {formData.flightFee && (
                              <div className="ml-2">
                                <span className="font-medium">Flight Fee:</span> GHS {formData.flightFee}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Features & Landmarks */}
                  {(formData.features.length > 0 || formData.nearbyLandmarks.length > 0) && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {formData.features.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3">Features</h4>
                            <div className="flex flex-wrap gap-2">
                              {formData.features.map((feature, index) => (
                                <Badge key={index} variant="secondary">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.nearbyLandmarks.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3">Nearby Landmarks</h4>
                            <div className="flex flex-wrap gap-2">
                              {formData.nearbyLandmarks.map((landmark, index) => (
                                <Badge key={index} variant="outline" className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {landmark}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Availability */}
                  {(formData.availableFrom || formData.availableTo) && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-3">Availability</h4>
                        <div className="text-sm space-y-1">
                          {formData.availableFrom && (
                            <div>
                              <span className="font-medium">Available From:</span> {formData.availableFrom}
                            </div>
                          )}
                          {formData.availableTo && (
                            <div>
                              <span className="font-medium">Available Until:</span> {formData.availableTo}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
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

                    {config && config.require_payment_for_visibility && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="listingFee"
                          checked={formData.listingFeeAgreed}
                          onCheckedChange={(checked) => handleInputChange("listingFeeAgreed", checked as boolean)}
                        />
                        <Label htmlFor="listingFee" className="text-sm">
                          I understand and agree to pay the required listing fee for active listings
                        </Label>
                      </div>
                    )}
                  </div>

                  <div className={config && !config.require_payment_for_visibility ? "bg-green-50 p-4 rounded-lg" : "bg-yellow-50 p-4 rounded-lg"}>
                    <h4 className={config && !config.require_payment_for_visibility ? "font-medium text-green-900 mb-2" : "font-medium text-yellow-900 mb-2"}>
                      What happens next?
                    </h4>
                    <ul className={config && !config.require_payment_for_visibility ? "text-sm text-green-800 space-y-1" : "text-sm text-yellow-800 space-y-1"}>
                      <li>• Your billboard details will be saved</li>
                      <li>• Next, you'll be able to upload photos of your billboard</li>
                      {config && !config.require_payment_for_visibility ? (
                        <>
                          <li>• Your billboard will be LIVE immediately for {config.promotional_listing_days} days</li>
                          <li>• Advertisers can start viewing and contacting you right away!</li>
                        </>
                      ) : (
                        <>
                          <li>• You'll be redirected to payment for listing activation</li>
                          <li>• Once paid, it will be visible to advertisers</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons - Phase 1 */}
            <div className="flex justify-between mt-8">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!formData.agreeToTerms || (config?.require_payment_for_visibility && !formData.listingFeeAgreed) || isSubmitting}
                >
                  {isSubmitting ? 'Creating Billboard...' : 'Create Billboard'}
                </Button>
              )}
            </div>
          </form>
        </>
      ) : (
        /* Phase 2: Image Upload */
        <>
          <div className="mb-8">
            <div className="text-sm text-gray-600 mb-4">
              Phase 2 of 2: Upload Images
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
                <div>
                  <h3 className="font-medium text-green-900">Billboard Created Successfully!</h3>
                  <p className="text-sm text-green-700">Now add some photos to showcase your billboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Image Upload Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Billboard Photos</CardTitle>
              <CardDescription>
                Add high-quality photos to attract more advertisers. You can skip this step and add photos later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload Area */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Billboard Photos</Label>
                  <span className="text-sm text-gray-500">
                    {images.length}/4 images
                  </span>
                </div>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <div className="text-lg font-medium text-gray-700 mb-2">Upload Photos</div>
                  <div className="text-sm text-gray-600 mb-4">
                    Choose up to 4 high-quality photos of your billboard
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload-phase2"
                    disabled={images.length >= 4}
                  />
                  <Label htmlFor="image-upload-phase2">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      asChild
                      disabled={images.length >= 4}
                    >
                      <span>
                        {images.length >= 4 ? 'Maximum Images Reached' : 'Choose Photos'}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-gray-500 mt-3">
                    Supported formats: JPG, PNG, WebP (Max 5MB each) • Maximum 4 images
                  </p>
                </div>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">{images.length} Photo{images.length > 1 ? 's' : ''} Selected</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Billboard ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          
                          {/* Upload Progress */}
                          {uploadProgress[index] !== undefined && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                              <div className="text-white text-sm font-medium">
                                {uploadProgress[index] === 100 ? '✓ Uploaded' : `${uploadProgress[index]}%`}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Tips */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Photo Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload up to 4 high-quality images to showcase your billboard</li>
                  <li>• Take photos from multiple angles and distances</li>
                  <li>• Show the billboard in its environment</li>
                  <li>• Capture both day and night views if illuminated</li>
                  <li>• Include photos of nearby landmarks or traffic</li>
                  <li>• Ensure photos are clear and high resolution</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons - Phase 2 */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Skip images and go to pricing
                router.push(`/pricing?billboardId=${encodeURIComponent(billboardId || '')}`)
              }}
            >
              Skip for Now
            </Button>

            <Button
              onClick={handleImageSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={images.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Uploading Images...' : `Upload ${images.length} Photo${images.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </>
      )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
