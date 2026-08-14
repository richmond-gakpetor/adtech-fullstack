"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Heart, Calendar, MessageSquare, TrendingUp, Eye, MapPin, DollarSign, Loader2 } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"
import { VerificationBanner } from "@/components/VerificationBanner"
import { useSavedBillboards, useSaveBillboard } from "@/app/api/exports"

export default function AdvertiserDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [page, setPage] = useState(1)
  
  // Fetch saved billboards
  const { data, isLoading, isError } = useSavedBillboards(page, 20)
  const { mutate: toggleSave } = useSaveBillboard()
  
  const savedBillboards = data?.data.items || []
  const totalSaved = data?.data.total || 0

  const handleUnsave = (id: string) => {
    toggleSave({ id, save: false })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBrowse />

      <div className="container mx-auto px-4 py-8">
        {/* Verification Status Banner */}
        <VerificationBanner />
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-gray-600">Discover billboard opportunities and manage your saved listings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Billboards</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSaved}</div>
              <p className="text-xs text-muted-foreground">Ready to explore</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Billboards</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Browse</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/browse" className="text-green-600 hover:underline">
                  Explore marketplace
                </Link>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Start</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/browse" className="text-green-600 hover:underline">
                  Find billboards
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="saved">Saved Billboards</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with discovering billboards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/browse">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <Search className="h-6 w-6 mb-2" />
                      Browse Billboards
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col" 
                    onClick={() => setActiveTab("saved")}
                  >
                    <Heart className="h-6 w-6 mb-2" />
                    View Saved ({totalSaved})
                  </Button>
                  <Link href="/browse?filter=promoted">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      Featured Billboards
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Saved Billboards */}
            {savedBillboards.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recently Saved</CardTitle>
                      <CardDescription>Your latest saved billboards</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("saved")}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {savedBillboards.slice(0, 3).map((billboard) => (
                      <Card key={billboard.id} className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={billboard.images[0] || "/placeholder.svg"}
                            alt={billboard.title}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm line-clamp-1">{billboard.title}</CardTitle>
                          <CardDescription className="flex items-center text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {billboard.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-600">Monthly Rate:</span>
                            <span className="font-bold text-green-600">GHS {billboard.monthlyRate || billboard.weeklyRate * 4}</span>
                          </div>
                          <Link href={`/billboard/${billboard.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Details
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {savedBillboards.length === 0 && !isLoading && (
              <Card className="p-12 text-center">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Building Your Collection</h3>
                <p className="text-gray-600 mb-6">
                  Save billboards you're interested in to easily find them later
                </p>
                <Link href="/browse">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Billboards
                  </Button>
                </Link>
              </Card>
            )}
          </TabsContent>

          {/* Saved Billboards Tab */}
          <TabsContent value="saved" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Saved Billboards ({totalSaved})</h2>
              <Link href="/browse">
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Browse More
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading saved billboards...</p>
                </div>
              </div>
            ) : isError ? (
              <Card className="p-12 text-center">
                <p className="text-red-600 mb-4">Error loading saved billboards</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </Card>
            ) : savedBillboards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedBillboards.map((billboard) => (
                  <Card key={billboard.id}>
                    <div className="relative">
                      <img
                        src={billboard.images[0] || "/placeholder.svg"}
                        alt={billboard.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        onClick={() => handleUnsave(billboard.id)}
                      >
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </Button>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{billboard.title}</CardTitle>
                      <CardDescription className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {billboard.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monthly Rate:</span>
                          <span className="font-bold text-green-600">GHS {billboard.monthlyRate || billboard.weeklyRate * 4}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Views:</span>
                          <span className="font-medium flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {billboard.views || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Type:</span>
                          <span className="text-gray-500">{billboard.type}</span>
                        </div>
                        <div className="pt-2 border-t space-y-2">
                          <Link href={`/billboard/${billboard.id}`}>
                            <Button variant="outline" className="w-full">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You haven't saved any billboards yet.</p>
                <Link href="/browse">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Billboards
                  </Button>
                </Link>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <div className="mt-12">
        <Footer />
      </div>
    </div>
  )
}
