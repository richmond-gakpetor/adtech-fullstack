"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Users,
  MapPin,
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Shield,
  Loader2,
  FileCheck,
  Clock,
  RefreshCw,
  AlertCircle,
  Send,
} from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"
import { AuthGuard } from "@/components/auth/AuthGuard"
import {
  useBillboards,
  useAdminUsers,
  useReviewKYC,
  useMarkKYCSubmitted,
  useSchedulerStatus,
  useTriggerReminderCheck,
  useTriggerViewsIncrement,
  useSendManualReminder,
} from "@/app/api/exports"

// ---------------------------------------------------------------------------
// Constants — defined once at module level, not recreated on every render
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  available: { color: "bg-green-100 text-green-800", label: "Active" },
  booked: { color: "bg-blue-100 text-blue-800", label: "Booked" },
  unavailable: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
}

const USER_TYPE_BADGE: Record<string, { color: string; label: string }> = {
  owner: { color: "bg-purple-100 text-purple-800", label: "Owner" },
  advertiser: { color: "bg-blue-100 text-blue-800", label: "Advertiser" },
  admin: { color: "bg-red-100 text-red-800", label: "Admin" },
}

const KYC_STATUS_BADGE: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  pending: { color: "bg-gray-100 text-gray-800", label: "Pending", icon: Clock },
  submitted: { color: "bg-blue-100 text-blue-800", label: "Under Review", icon: Eye },
  approved: { color: "bg-green-100 text-green-800", label: "Approved", icon: CheckCircle },
  rejected: { color: "bg-red-100 text-red-800", label: "Rejected", icon: XCircle },
}

const FALLBACK_BADGE = { color: "bg-gray-100 text-gray-800", label: "Unknown" }
const FALLBACK_KYC_BADGE = { ...FALLBACK_BADGE, icon: AlertCircle }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString("en-US", opts ?? {
    year: "numeric", month: "short", day: "numeric",
  })
}

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// UserCard
// ---------------------------------------------------------------------------

function UserCard({ user }: { user: any }) {
  const badge = USER_TYPE_BADGE[user.userType] ?? FALLBACK_BADGE
  const createdDate = formatDate(user.createdAt)

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header row — name + badges */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-700 font-semibold text-sm">
                {getInitials(user.firstName, user.lastName)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>

            {/* Badges wrap instead of overflowing */}
            <div className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[45%]">
              <Badge className={badge.color}>{badge.label}</Badge>
              {user.isVerified && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Badge className={user.isActive ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Phone</p>
              <p className="font-medium truncate">{user.phoneNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Joined</p>
              <p className="font-medium">{createdDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Billboards</p>
              <p className="font-medium">{user.billboardCount ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Reviews</p>
              <p className="font-medium">{user.reviewCount ?? 0}</p>
            </div>
          </div>

          {/* Actions */}
          {user.userType === "owner" && (
            <div className="flex justify-end">
              <Link href={`/owner/${user.id}`} target="_blank">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// KYCUserCard
// ---------------------------------------------------------------------------

function KYCUserCard({
  user,
  onApprove,
  onReject,
  onView,
  onMarkSubmitted,
}: {
  user: any
  onApprove: () => void
  onReject: () => void
  onView: () => void
  onMarkSubmitted: () => void
}) {
  const badge = KYC_STATUS_BADGE[user.kycStatus ?? "pending"] ?? FALLBACK_KYC_BADGE
  const StatusIcon = badge.icon
  const submittedDate = user.kycSubmittedAt
    ? formatDate(user.kycSubmittedAt, {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "Not submitted"

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-700 font-semibold text-sm">
                {getInitials(user.firstName, user.lastName)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>

            <div className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[45%]">
              <Badge className={badge.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {badge.label}
              </Badge>
              {user.emailVerified && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Phone</p>
              <p className="font-medium truncate">{user.phoneNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
              <p className="font-medium">{submittedDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Submissions</p>
              <p className="font-medium">{user.kycSubmissionCount ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Billboards</p>
              <p className="font-medium">{user.billboardCount ?? 0}</p>
            </div>
          </div>

          {/* Previous rejection reason */}
          {user.kycRejectionReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-semibold text-red-800 mb-1">Previous Rejection Reason:</p>
              <p className="text-sm text-red-700">{user.kycRejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            {user.kycStatus === "submitted" ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={onReject}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={onApprove}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                {(user.kycStatus === "pending" || user.kycStatus === "rejected") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={onMarkSubmitted}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Mark as Submitted
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// AdminDashboardContent
// ---------------------------------------------------------------------------

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [billboardPage] = useState(1)
  const [userPage] = useState(1)
  const [kycPage] = useState(1)

  // KYC modal state
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [kycReviewOpen, setKycReviewOpen] = useState(false)
  const [kycAction, setKycAction] = useState<"approve" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [reviewNotes, setReviewNotes] = useState("")

  // Manual reminder modal state
  const [manualReminderOpen, setManualReminderOpen] = useState(false)
  const [reminderBillboardId, setReminderBillboardId] = useState("")

  // Data fetching
  const { data: billboardData, isLoading: billboardsLoading } = useBillboards({}, billboardPage, 20)
  const { data: userData, isLoading: usersLoading } = useAdminUsers({ page: userPage, pageSize: 20 })
  const { data: kycUserData, isLoading: kycUsersLoading } = useAdminUsers({
    userType: "owner", page: kycPage, pageSize: 20,
  })
  const { data: schedulerData, isLoading: schedulerLoading, refetch: refetchScheduler } = useSchedulerStatus()

  const billboards = billboardData?.data.items ?? []
  const totalBillboards = billboardData?.data.total ?? 0
  const users = userData?.data?.users ?? []
  const totalUsers = userData?.data?.total ?? 0
  const kycUsers = kycUserData?.data?.users ?? []
  const totalKycUsers = kycUserData?.data?.total ?? 0
  const schedulerStatus = schedulerData?.data ?? null

  // Mutations
  const reviewKYCMutation = useReviewKYC()
  const markKYCSubmittedMutation = useMarkKYCSubmitted()
  const triggerReminderMutation = useTriggerReminderCheck()
  const triggerViewsMutation = useTriggerViewsIncrement()
  const sendManualReminderMutation = useSendManualReminder()

  const stats = {
    totalUsers,
    totalBillboards,
    activeListings: billboards.filter((b: any) => b.availability === "available").length,
    pendingKYC: kycUsers.filter((u: any) => u.kycStatus === "submitted").length,
  }

  // ---------------------------------------------------------------------------
  // Modal helpers
  // ---------------------------------------------------------------------------

  const openKYCModal = (user: any, action: "approve" | "reject" | null) => {
    setSelectedUser(user)
    setKycAction(action)
    setKycReviewOpen(true)
  }

  const closeKYCModal = () => {
    setKycReviewOpen(false)
    setSelectedUser(null)
    setKycAction(null)
    setRejectionReason("")
    setReviewNotes("")
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleMarkKYCSubmitted = async (user: any) => {
    try {
      await markKYCSubmittedMutation.mutateAsync(user.id)
    } catch (error) {
      console.error("Mark KYC submitted failed:", error)
    }
  }

  const handleKYCReview = async () => {
    if (!selectedUser || !kycAction) return
    try {
      await reviewKYCMutation.mutateAsync({
        userId: selectedUser.id,
        review: {
          approved: kycAction === "approve",
          rejectionReason: kycAction === "reject" ? rejectionReason : undefined,
          notes: reviewNotes || undefined,
        },
      })
      closeKYCModal()
    } catch (error) {
      console.error("KYC review failed:", error)
    }
  }

  const handleTriggerReminders = async () => {
    try {
      await triggerReminderMutation.mutateAsync()
      refetchScheduler()
    } catch (error) {
      console.error("Failed to trigger reminders:", error)
    }
  }

  const handleTriggerViews = async () => {
    try {
      await triggerViewsMutation.mutateAsync()
    } catch (error) {
      console.error("Failed to trigger views increment:", error)
    }
  }

  const handleSendManualReminder = async () => {
    if (!reminderBillboardId.trim()) return
    try {
      await sendManualReminderMutation.mutateAsync(reminderBillboardId.trim())
      setManualReminderOpen(false)
      setReminderBillboardId("")
    } catch (error) {
      console.error("Failed to send manual reminder:", error)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500">Platform management and moderation</p>
        </div>

        {/* Stats — 2-col on mobile, 4-col on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[
            { label: "Total Users",      value: stats.totalUsers,      sub: "Registered accounts", Icon: Users },
            { label: "Total Billboards", value: stats.totalBillboards, sub: "Listed billboards",   Icon: MapPin },
            { label: "Active Listings",  value: stats.activeListings,  sub: "Available now",       Icon: TrendingUp },
            { label: "Pending KYC",      value: stats.pendingKYC,      sub: "Awaiting review",     Icon: FileCheck },
          ].map(({ label, value, sub, Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs — horizontally scrollable on mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="inline-flex min-w-max w-full sm:grid sm:grid-cols-5">
              <TabsTrigger value="overview"   className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="users"      className="text-xs sm:text-sm">Users ({totalUsers})</TabsTrigger>
              <TabsTrigger value="billboards" className="text-xs sm:text-sm">Billboards ({totalBillboards})</TabsTrigger>
              <TabsTrigger value="kyc"        className="text-xs sm:text-sm">KYC ({totalKycUsers})</TabsTrigger>
              <TabsTrigger value="scheduler"  className="text-xs sm:text-sm">Scheduler</TabsTrigger>
            </TabsList>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* Overview                                                          */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Users</CardTitle>
                      <CardDescription>Latest registrations</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("users")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {users.slice(0, 5).map((user: any) => {
                        const badge = USER_TYPE_BADGE[user.userType] ?? FALLBACK_BADGE
                        return (
                          <div key={user.id} className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{user.fullName}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            <Badge className={`${badge.color} shrink-0`}>{badge.label}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Billboards</CardTitle>
                      <CardDescription>Latest listings</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("billboards")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {billboardsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {billboards.slice(0, 5).map((billboard: any) => {
                        const badge = STATUS_BADGE[billboard.availability] ?? FALLBACK_BADGE
                        return (
                          <div key={billboard.id} className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium line-clamp-1">{billboard.title}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{billboard.location}</span>
                              </p>
                            </div>
                            <Badge className={`${badge.color} shrink-0`}>{badge.label}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* Users                                                             */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <LoadingState message="Loading users..." />
                ) : (
                  <div className="space-y-3">
                    {users.map((user: any) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* Billboards                                                        */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="billboards" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <CardTitle>Billboard Management</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search billboards..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {billboardsLoading ? (
                  <LoadingState message="Loading billboards..." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {billboards.map((billboard: any) => {
                      const badge = STATUS_BADGE[billboard.availability] ?? FALLBACK_BADGE
                      return (
                        <Card key={billboard.id} className="overflow-hidden">
                          <div className="relative">
                            <img
                              src={billboard.images[0] || "/placeholder.svg"}
                              alt={billboard.title}
                              className="w-full h-32 object-cover"
                            />
                            <Badge className={`absolute top-2 right-2 ${badge.color}`}>
                              {badge.label}
                            </Badge>
                          </div>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm line-clamp-1">{billboard.title}</CardTitle>
                            <CardDescription className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{billboard.location}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex justify-between text-xs mb-3">
                              <span className="text-gray-600">Views:</span>
                              <span>{billboard.views ?? 0}</span>
                            </div>
                            <Link href={`/billboard/${billboard.id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="h-3 w-3 mr-2" />
                                View Details
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* KYC Review                                                        */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
                  <div>
                    <CardTitle>KYC Verification</CardTitle>
                    <CardDescription>Review and approve billboard owner KYC submissions</CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1 self-start shrink-0">
                    <FileCheck className="h-3 w-3" />
                    {stats.pendingKYC} Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {kycUsersLoading ? (
                  <LoadingState message="Loading KYC submissions..." />
                ) : kycUsers.length === 0 ? (
                  <EmptyState icon={FileCheck} message="No KYC submissions found" />
                ) : (
                  <div className="space-y-3">
                    {kycUsers.map((user: any) => (
                      <KYCUserCard
                        key={user.id}
                        user={user}
                        onApprove={() => openKYCModal(user, "approve")}
                        onReject={() => openKYCModal(user, "reject")}
                        onView={() => openKYCModal(user, null)}
                        onMarkSubmitted={() => handleMarkKYCSubmitted(user)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* Scheduler                                                         */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="scheduler" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Scheduler Status</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetchScheduler()}
                      disabled={schedulerLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${schedulerLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                  <CardDescription>Background job scheduler information</CardDescription>
                </CardHeader>
                <CardContent>
                  {schedulerLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                  ) : schedulerStatus ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${schedulerStatus.running ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="font-medium">
                            {schedulerStatus.running ? "Running" : "Stopped"}
                          </span>
                        </div>
                        <Badge variant={schedulerStatus.running ? "default" : "destructive"}>
                          {schedulerStatus.running ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Scheduled Jobs</p>
                        <div className="text-2xl font-bold text-gray-900">{schedulerStatus.jobCount ?? 0}</div>
                      </div>

                      {schedulerStatus.jobs?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Active Jobs:</p>
                          {schedulerStatus.jobs.map((job: any) => (
                            <div key={job.id} className="p-3 bg-white border rounded-lg">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium truncate">{job.name}</span>
                                <Badge variant="outline" className="text-xs shrink-0">{job.trigger}</Badge>
                              </div>
                              {job.nextRunTime && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Next run: {new Date(job.nextRunTime).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyState icon={AlertCircle} message="Unable to load scheduler status" />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual Controls</CardTitle>
                  <CardDescription>Trigger scheduled tasks manually for testing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Trigger Reminder Check</h4>
                      <p className="text-xs text-gray-600">
                        Manually check all billboards and send expiration reminders where needed
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleTriggerReminders}
                      disabled={triggerReminderMutation.isPending}
                    >
                      {triggerReminderMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><RefreshCw className="h-4 w-4 mr-2" />Trigger Reminder Check</>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Trigger Views Increment</h4>
                      <p className="text-xs text-gray-600">
                        Manually increment view counts by 25 for all active billboard listings
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleTriggerViews}
                      disabled={triggerViewsMutation.isPending}
                    >
                      {triggerViewsMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-2" />Trigger Views Increment</>
                      )}
                    </Button>
                    {triggerViewsMutation.isSuccess && triggerViewsMutation.data && (
                      <p className="text-xs text-green-700 font-medium">
                        ✓ {triggerViewsMutation.data.data?.billboardsUpdated ?? 0} billboard(s) updated
                      </p>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Send Manual Reminder</h4>
                      <p className="text-xs text-gray-600">
                        Send an expiration reminder for a specific billboard
                      </p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setManualReminderOpen(true)}>
                      <Send className="h-4 w-4 mr-2" />
                      Send to Billboard
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-900">About Reminders</p>
                        <p className="text-xs text-blue-700 mt-1">
                          The scheduler automatically sends reminders 14, 7, and 3 days before billboard listings expire.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* ----------------------------------------------------------------- */}
        {/* KYC Review Modal                                                   */}
        {/* ----------------------------------------------------------------- */}
        <Dialog open={kycReviewOpen} onOpenChange={(open) => !open && closeKYCModal()}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {kycAction === "approve" && "Approve KYC Submission"}
                {kycAction === "reject"  && "Reject KYC Submission"}
                {!kycAction              && "KYC Details"}
              </DialogTitle>
              {selectedUser && (
                <DialogDescription>
                  {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                </DialogDescription>
              )}
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">KYC Status</Label>
                    <p className="text-sm font-medium mt-0.5">
                      {(KYC_STATUS_BADGE[selectedUser.kycStatus ?? "pending"] ?? FALLBACK_KYC_BADGE).label}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Submission Count</Label>
                    <p className="text-sm font-medium mt-0.5">{selectedUser.kycSubmissionCount ?? 0}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Email Verified</Label>
                    <p className="text-sm font-medium mt-0.5">{selectedUser.emailVerified ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Billboards</Label>
                    <p className="text-sm font-medium mt-0.5">{selectedUser.billboardCount ?? 0}</p>
                  </div>
                </div>

                {kycAction === "reject" && (
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Explain why this KYC submission is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {kycAction && (
                  <div className="space-y-2">
                    <Label htmlFor="review-notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="review-notes"
                      placeholder="Any additional notes about this review..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeKYCModal}>Cancel</Button>
              {kycAction && (
                <Button
                  onClick={handleKYCReview}
                  disabled={reviewKYCMutation.isPending || (kycAction === "reject" && !rejectionReason.trim())}
                  className={kycAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {reviewKYCMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <>
                      {kycAction === "approve"
                        ? <CheckCircle className="h-4 w-4 mr-2" />
                        : <XCircle className="h-4 w-4 mr-2" />}
                      {kycAction === "approve" ? "Approve" : "Reject"}
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ----------------------------------------------------------------- */}
        {/* Manual Reminder Modal                                              */}
        {/* ----------------------------------------------------------------- */}
        <Dialog open={manualReminderOpen} onOpenChange={setManualReminderOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Send Manual Reminder</DialogTitle>
              <DialogDescription>Enter the billboard ID to send an expiration reminder</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="billboard-id">Billboard ID</Label>
              <Input
                id="billboard-id"
                placeholder="Enter billboard UUID..."
                value={reminderBillboardId}
                onChange={(e) => setReminderBillboardId(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => { setManualReminderOpen(false); setReminderBillboardId("") }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendManualReminder}
                disabled={sendManualReminderMutation.isPending || !reminderBillboardId.trim()}
              >
                {sendManualReminderMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Send Reminder</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-12">
        <Footer />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  return (
    <AuthGuard requiredUserType="admin">
      <AdminDashboardContent />
    </AuthGuard>
  )
}
