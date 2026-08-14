"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Eye,
  DollarSign,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  MapPin,
  Loader2,
  Heart,
} from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"
import { VerificationBanner } from "@/components/VerificationBanner"
import { useRouter } from "next/navigation"
import { useMyBillboards, useDeleteBillboard } from "@/app/api/exports"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BillboardCard } from "@/components/BillboardCard"
import { EditBillboardModal } from "@/components/EditBillboardModal"
import { useQueryClient } from "@tanstack/react-query"
import type { Billboard } from "@/lib/types"

function OwnerDashboardContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("overview")
  const [page, setPage] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null)
  
  // Fetch owner's billboards
  const { data, isLoading, isError } = useMyBillboards(page, 20)
  const { mutate: deleteBillboard } = useDeleteBillboard()
  
  const billboards = data?.data.items || []
  const total = data?.data.total || 0
  
  // Calculate stats from real data
  const stats = {
    totalListings: total,
    totalViews: billboards.reduce((sum, b) => sum + (b.views || 0), 0),
    totalSaves: billboards.reduce((sum, b) => sum + (b.totalSaves || 0), 0),
    activeListings: billboards.filter(b => b.isActive && b.isAvailable).length
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this billboard?")) {
      deleteBillboard(id)
    }
  }

  const getStatusBadge = (billboard: Billboard) => {
    if (billboard.isAvailable && billboard.isActive) {
      return { text: "Available", className: "bg-green-100 text-green-800" }
    } else if (billboard.isActive && !billboard.isAvailable) {
      return { text: "Booked", className: "bg-blue-100 text-blue-800" }
    } else {
      return { text: "Inactive", className: "bg-gray-100 text-gray-800" }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        showListBillboard={true}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Verification Status Banner */}
        <VerificationBanner hasListings={total > 0} />
        
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Billboard Dashboard</h1>
            <p className="text-gray-600">Manage your billboard listings and track performance</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalListings}</div>
              <p className="text-xs text-muted-foreground">Active billboards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all listings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saves</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSaves}</div>
              <p className="text-xs text-muted-foreground">By advertisers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
              <p className="text-xs text-muted-foreground">Available now</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">All Listings ({total})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your billboard portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/list-billboard">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <Plus className="h-6 w-6 mb-2" />
                      Add Billboard
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col"
                    onClick={() => setActiveTab("listings")}
                  >
                    <MapPin className="h-6 w-6 mb-2" />
                    View All ({total})
                  </Button>
                  <Link href="/browse">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <Eye className="h-6 w-6 mb-2" />
                      Browse Market
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Listings */}
            {billboards.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Listings</CardTitle>
                      <CardDescription>Your latest billboards</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("listings")}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {billboards.slice(0, 3).map((billboard) => (
                      <Card key={billboard.id} className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={billboard.images[0] || "/placeholder.svg"}
                            alt={billboard.title}
                            className="w-full h-32 object-cover"
                          />
                          <Badge className={`absolute top-2 right-2 ${getStatusBadge(billboard).className}`}>
                            {getStatusBadge(billboard).text}
                          </Badge>
                        </div>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm line-clamp-1">{billboard.title}</CardTitle>
                          <CardDescription className="flex items-center text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {billboard.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Monthly Rate:</span>
                            <span className="font-bold text-green-600">GHS {billboard.monthlyRate || billboard.weeklyRate * 4}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Views:</span>
                            <span>{billboard.views || 0}</span>
                          </div>
                          <Link href={`/billboard/${billboard.id}`}>
                            <Button variant="outline" size="sm" className="w-full mt-2">
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
            {billboards.length === 0 && !isLoading && (
              <Card className="p-12 text-center">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Billboards Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start by adding your first billboard to the marketplace
                </p>
                <Link href="/list-billboard">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Billboard
                  </Button>
                </Link>
              </Card>
            )}
          </TabsContent>

          {/* All Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading billboards...</p>
                </div>
              </div>
            ) : isError ? (
              <Card className="p-12 text-center">
                <p className="text-red-600 mb-4">Error loading billboards</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </Card>
            ) : billboards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {billboards.map((billboard) => (
                  <BillboardCard
                    key={billboard.id}
                    billboard={billboard}
                    variant="owner"
                    viewMode="grid"
                    onEditSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ["billboards"] })
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Billboards Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start by adding your first billboard to the marketplace
                </p>
                <Link href="/list-billboard">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Billboard
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

export default function OwnerDashboard() {
  return (
    <AuthGuard requiredUserType="owner">
      <OwnerDashboardContent />
    </AuthGuard>
  )
}
