"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Eye, CalendarDays, Ruler, Monitor, Star, User, X, ChevronLeft, ChevronRight, Loader2, Heart, Phone, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { DynamicMetaTags } from "@/components/DynamicMetaTags"
import { useBillboard, useIncrementViews, useSaveBillboard } from "@/app/api/exports"
import { useAuthStore } from "@/lib/stores/auth-store"
import { LoginPromptModal } from "@/components/LoginPromptModal"

function formatDuration(duration: string | null | undefined): string {
  if (!duration) return "Flexible"
  return duration
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function BillboardDetailPage() {
  const params = useParams()
  const billboardId = params.id as string

  // Fetch billboard data
  const { data, isLoading, isError } = useBillboard(billboardId)
  const { mutate: incrementViews } = useIncrementViews()
  const { mutate: toggleSave } = useSaveBillboard()

  const billboard = data?.data

  // Auth state
  const { isAuthenticated, user } = useAuthStore()
  const isLoggedIn = isAuthenticated && !!user

  const [selectedImage, setSelectedImage] = useState(0)
  const [showPhoneNumber, setShowPhoneNumber] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  // Resolve effective contact info — admin-set overrides take precedence
  const contactName = billboard?.contactName || billboard?.owner?.fullName
  const contactPhone = billboard?.contactPhone || billboard?.owner?.phoneNumber

  // Combined lightbox state for better performance
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    imageIndex: 0
  })

  // Touch state for swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // Constants
  const minSwipeDistance = 50

  // Track view on mount
  useEffect(() => {
    if (billboardId) {
      incrementViews(billboardId)
    }
  }, [billboardId, incrementViews])

  // Handle save/unsave
  const handleToggleSave = () => {
    if (!isLoggedIn) {
      setLoginModalOpen(true)
      return
    }
    if (billboard) {
      toggleSave({ id: billboardId, save: !billboard.isSaved })
    }
  }

  // Handle show contact
  const handleShowContact = () => {
    if (!isLoggedIn) {
      setLoginModalOpen(true)
      return
    }
    setShowPhoneNumber(!showPhoneNumber)
  }

  // Optimized lightbox handlers with useCallback
  const openLightbox = useCallback((index: number) => {
    setLightbox({
      isOpen: true,
      imageIndex: index
    })
  }, [])

  const closeLightbox = useCallback(() => {
    setLightbox(prev => ({ ...prev, isOpen: false }))
  }, [])

  const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
    if (!billboard) return

    setLightbox(prev => {
      const newIndex = direction === 'prev'
        ? (prev.imageIndex === 0 ? billboard.images.length - 1 : prev.imageIndex - 1)
        : (prev.imageIndex === billboard.images.length - 1 ? 0 : prev.imageIndex + 1)

      return {
        ...prev,
        imageIndex: newIndex
      }
    })
  }, [billboard])

  // Optimized touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return

    const touchEnd = e.changedTouches[0].clientX
    const distance = touchStart - touchEnd

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        navigateLightbox('next')
      } else {
        navigateLightbox('prev')
      }
    }
    setTouchStart(null)
  }, [touchStart, navigateLightbox])

  // Optimized keyboard navigation
  useEffect(() => {
    if (!lightbox.isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          closeLightbox()
          break
        case 'ArrowLeft':
          e.preventDefault()
          navigateLightbox('prev')
          break
        case 'ArrowRight':
          e.preventDefault()
          navigateLightbox('next')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [lightbox.isOpen, closeLightbox, navigateLightbox])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {billboard && <DynamicMetaTags billboard={billboard} />}
      <Header />

      {isLoading ? (
        <div className="container mx-auto px-4 py-24">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading billboard details...</p>
            </div>
          </div>
        </div>
      ) : isError || !billboard ? (
        <div className="container mx-auto px-4 py-24">
          <div className="text-center bg-white rounded-2xl shadow-lg border border-red-100 p-12">
            <div className="text-red-400 mb-6">
              <MapPin className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Billboard not found</h3>
            <p className="text-gray-600 mb-6">This billboard may have been removed or does not exist.</p>
            <Link href="/browse">
              <Button>Browse Billboards</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs 
            items={[
              { label: 'Browse', href: '/browse' },
              { label: billboard.title, href: `/billboard/${billboard.id}` }
            ]}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Enhanced Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enhanced Image Gallery */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative group">
                    <div
                      className="cursor-pointer relative"
                      onClick={() => openLightbox(selectedImage)}
                    >
                      <Image
                        src={billboard.images[selectedImage] || "/placeholder.svg"}
                        alt={billboard.title}
                        width={600}
                        height={400}
                        className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2 text-white">
                          <span className="font-medium">Click to expand</span>
                        </div>
                      </div>
                      {/* Image counter — only meaningful with multiple images */}
                      {billboard.images.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {selectedImage + 1} / {billboard.images.length}
                        </div>
                      )}
                    </div>
                    <Badge
                      className={`absolute top-4 left-4 ${billboard.isAvailable
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gradient-to-r from-yellow-500 to-orange-500"
                        } text-white shadow-lg`}
                    >
                      {billboard.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  {billboard.images.length > 1 && (
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50">
                      <div className="grid grid-cols-4 gap-3">
                        {billboard.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            onDoubleClick={() => openLightbox(index)}
                            className={`relative rounded-xl overflow-hidden transition-all duration-200 ${selectedImage === index ? "ring-2 ring-green-500 shadow-lg" : "hover:shadow-md hover:ring-1 hover:ring-green-300"
                              }`}
                          >
                            <Image
                              src={image || "/placeholder.svg"}
                              alt={`View ${index + 1}`}
                              width={150}
                              height={100}
                              className="w-full h-20 object-cover transition-transform duration-200 hover:scale-110"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Billboard Details */}
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 leading-snug">
                        {billboard.title}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-2 text-gray-500">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-green-500 flex-shrink-0" />
                        <span className="truncate">{billboard.location}</span>
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0 sm:text-right">
                      <div className="text-2xl font-bold text-green-700">
                        GHS {billboard.monthlyRate || billboard.weeklyRate * 4}
                      </div>
                      <div className="text-sm text-gray-500">per month</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Enhanced Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                      <Ruler className="h-8 w-8 mx-auto mb-3 text-green-600" />
                      <div className="font-bold text-gray-900">{billboard.widthFt} × {billboard.heightFt} m</div>
                      <div className="text-sm text-gray-600">Size</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                      <Monitor className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                      <div className="font-bold text-gray-900">{billboard.billboardType}</div>
                      <div className="text-sm text-gray-600">Type</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                      <Eye className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                      <div className="font-bold text-gray-900">{billboard.views || 0}</div>
                      <div className="text-sm text-gray-600">Views</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                      <CalendarDays className="h-8 w-8 mx-auto mb-3 text-orange-600" />
                      <div className="font-bold text-gray-900">{formatDuration(billboard.minimumDuration)}</div>
                      <div className="text-sm text-gray-600">Min. Booking</div>
                    </div>
                  </div>

                  <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                  {/* Enhanced Description */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">{billboard.description}</p>
                  </div>

                </CardContent>
              </Card>

              {/* Enhanced Owner Information */}
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                  <CardTitle className="flex items-center text-gray-900">
                    <User className="h-6 w-6 mr-2 text-green-600" />
                    Billboard Owner/Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-2xl text-gray-900 mb-2">{contactName || 'Owner'}</h4>
                      <div className="flex items-center mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${i < Math.floor((billboard.owner as any)?.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                          />
                        ))}
                        <span className="ml-3 text-sm text-gray-600 font-medium">
                          {(billboard.owner as any)?.rating || 0} ({(billboard.owner as any)?.totalReviews || 0} reviews)
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Member since {new Date(billboard.createdAt).getFullYear()}
                      </div>
                    </div>
                    {!billboard.contactName && (
                      <Link href={`/owner/${billboard.ownerId}`}>
                        <Button variant="outline" className="hidden border-green-200 text-green-700 hover:bg-green-50 transition-all duration-200">
                          View Profile
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Enhanced Pricing Card */}
              <Card className="sticky top-24 border-0 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                  <CardTitle className="text-green-700">Pricing & Booking</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Enhanced Pricing Options */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:shadow-md transition-all duration-200">
                      <div>
                        <div className="font-bold text-gray-900">Monthly Rate</div>
                        <div className="text-sm text-gray-600">Standard booking rate</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-2xl text-green-600">GHS {billboard.monthlyRate || billboard.weeklyRate * 4}</div>
                        <div className="text-xs text-gray-500">per month</div>
                      </div>
                    </div>

                    {/* Additional Fees for Static Billboards */}
                    {billboard.billboardType === "Static" && (billboard.printingFee || billboard.flightFee) && (
                      <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-900 mb-3 text-center">Additional Fees (Static Billboard)</h4>
                          <div className="space-y-3">
                            {billboard.printingFee && (
                              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                                <div>
                                  <div className="font-bold text-gray-900">Printing Fee</div>
                                  <div className="text-sm text-gray-600">One-time artwork printing</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-xl text-blue-600">GHS {billboard.printingFee}</div>
                                  <div className="text-xs text-gray-500">per campaign</div>
                                </div>
                              </div>
                            )}

                            {billboard.flightFee && (
                              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
                                <div>
                                  <div className="font-bold text-gray-900">Flight Fee</div>
                                  <div className="text-sm text-gray-600">One-time hoisting service</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-xl text-orange-600">GHS {billboard.flightFee}</div>
                                  <div className="text-xs text-gray-500">per campaign</div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="bg-yellow-50 p-3 rounded-lg mt-4">
                            <div className="text-xs text-yellow-800">
                              <strong>Note:</strong> These fees are charged once per campaign in addition to the rental rate.
                            </div>
                          </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                  {/* Enhanced Action Buttons */}
                  <div className="space-y-3">
                    {/* Contact Owner Section */}
                    <div className="space-y-3">
                      <Button
                        onClick={handleShowContact}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-200 px-6 py-4 text-lg font-semibold"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        {showPhoneNumber ? 'Hide Contact' : 'Show Contact'}
                      </Button>

                      {/* Phone Number Reveal */}
                      {showPhoneNumber && contactPhone && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Phone className="h-5 w-5 text-green-600" />
                              <span className="font-semibold text-gray-900">Phone:</span>
                            </div>
                            <a
                              href={`tel:${contactPhone}`}
                              className="text-lg font-bold text-green-700 hover:text-green-800 transition-colors"
                            >
                              {contactPhone}
                            </a>
                          </div>

                          {/* WhatsApp Button */}
                          <a
                            href={`https://wa.me/${(() => { const d = contactPhone.replace(/[^0-9]/g, ''); return d.startsWith('0') ? `233${d.slice(1)}` : d; })()}?text=${encodeURIComponent(`Hi ${contactName}, I found your billboard "${billboard.title}" (${billboard.location}) on Xposure GH. I'd like to discuss rental details.\n\nView billboard: ${typeof window !== 'undefined' ? window.location.origin : 'https://xposuregh.com'}/billboard/${billboard.id}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full"
                          >
                            <Button
                              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-md transition-all duration-200"
                              type="button"
                            >
                              <MessageCircle className="h-5 w-5 mr-2" />
                              Chat on WhatsApp
                            </Button>
                          </a>
                        </div>
                      )}

                      {/* No Phone Number Available */}
                      {showPhoneNumber && !contactPhone && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <p className="text-sm text-yellow-800 text-center">
                            Phone number not available. Please contact support for assistance.
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleToggleSave}
                      variant="outline"
                      className={`w-full border-2 transition-all duration-200 ${billboard?.isSaved ? 'border-red-500 text-red-600 hover:bg-red-50' : 'border-green-500 text-green-600 hover:bg-green-50'}`}
                    >
                      <Heart className={`h-5 w-5 mr-2 ${billboard?.isSaved ? 'fill-red-500' : ''}`} />
                      {billboard?.isSaved ? 'Saved' : 'Save Billboard'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Contact Info */}
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
                  <CardTitle className="text-purple-700">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="text-sm text-gray-600">
                    Have questions about this billboard? Our team is here to help.
                  </div>
                  <Button onClick={
                    () => window.location.href = "/contact"
                  } variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 transition-all duration-200">
                    Contact Support
                  </Button>
                  <div className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-lg">
                    Response time: Within 1 hour
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Optimized Lightbox Modal */}
      {lightbox.isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation arrows — only shown when there are multiple images */}
          {billboard && billboard.images.length > 1 && (
            <>
              <button
                onClick={() => navigateLightbox('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>

              <button
                onClick={() => navigateLightbox('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Main image container */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <div className="max-w-7xl max-h-full">
              {billboard && (
                <Image
                  src={billboard.images[lightbox.imageIndex] || "/placeholder.svg"}
                  alt={`${billboard.title} - Image ${lightbox.imageIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  priority
                />
              )}
            </div>
          </div>

          {/* Bottom thumbnail bar — only shown when there are multiple images */}
          {billboard && billboard.images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {billboard.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setLightbox(prev => ({ ...prev, imageIndex: index }))}
                      className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all duration-200 ${index === lightbox.imageIndex
                          ? "ring-2 ring-white shadow-lg opacity-100"
                          : "opacity-60 hover:opacity-100"
                        }`}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        width={80}
                        height={60}
                        className="w-20 h-15 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Login Prompt Modal */}
      <LoginPromptModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />

      <Footer />
    </div>
  )
}
