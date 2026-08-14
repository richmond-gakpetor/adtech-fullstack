"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Eye,
  Heart,
  MapPin,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditBillboardModal } from "@/components/EditBillboardModal"
import { useBillboardListingStatus } from "@/app/api/hooks/useBillboards"
import { useDeleteBillboard } from "@/app/api/exports"
import { useQueryClient } from "@tanstack/react-query"
import type { Billboard } from "@/lib/types"
import { LoginPromptModal } from "@/components/LoginPromptModal"

interface BillboardCardProps {
  billboard: Billboard
  variant?: "public" | "owner"
  viewMode?: "grid" | "list"
  onSave?: (id: string) => void
  isSaved?: boolean
  onEditSuccess?: () => void
  isAuthenticated?: boolean
}

/**
 * Unified BillboardCard Component
 * 
 * Supports two variants:
 * - "public" (default): For advertisers browsing the marketplace
 *   - Features: Save/unsave, View Details, Make Offer buttons
 *   - Shows availability badge
 * 
 * - "owner": For billboard owners managing their listings
 *   - Features: Edit/delete actions, listing expiration status
 *   - Shows renewal options and grace period warnings
 *   - Fetches and displays listing payment status
 */
export function BillboardCard({
  billboard,
  variant = "public",
  viewMode = "grid",
  onSave,
  isSaved = false,
  onEditSuccess,
  isAuthenticated = true,
}: BillboardCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { mutate: deleteBillboard } = useDeleteBillboard()
  
  // Only fetch listing status for owner variant
  const { data: listingStatus, isLoading: statusLoading } = useBillboardListingStatus(
    billboard.id,
    variant === "owner"
  )

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this billboard?")) {
      deleteBillboard(id)
    }
  }

  const handleRenew = () => {
    window.location.href = `/pricing?billboardId=${billboard.id}&renew=true`
  }

  const getStatusBadge = () => {
    if (billboard.isAvailable && billboard.isActive) {
      return { text: "Available", className: "bg-green-100 text-green-800" }
    } else if (billboard.isActive && !billboard.isAvailable) {
      return { text: "Booked", className: "bg-blue-100 text-blue-800" }
    } else {
      return { text: "Inactive", className: "bg-gray-100 text-gray-800" }
    }
  }

  const getExpirationBadge = () => {
    if (variant !== "owner" || statusLoading || !listingStatus?.data) return null

    const status = listingStatus.data
    const { daysRemaining, isExpired, isInGracePeriod, hasActiveListing } = status

    if (!hasActiveListing && isExpired && !isInGracePeriod) {
      return {
        text: "Expired",
        className: "bg-red-100 text-red-800",
        icon: AlertCircle,
      }
    }

    if (isInGracePeriod) {
      return {
        text: `Grace Period (${Math.abs(daysRemaining || 0)}d left)`,
        className: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      }
    }

    if (hasActiveListing && daysRemaining !== null && daysRemaining !== undefined) {
      if (daysRemaining <= 3) {
        return {
          text: `Expires in ${daysRemaining}d`,
          className: "bg-orange-100 text-orange-800",
          icon: Clock,
        }
      }
      return {
        text: `Active (${daysRemaining}d left)`,
        className: "bg-green-100 text-green-800",
        icon: CheckCircle2,
      }
    }

    return null
  }

  const statusBadge = getStatusBadge()
  const expirationBadge = getExpirationBadge()

  return (
    <>
      <Card
        className={`group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md bg-white ${
          viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"
        }`}
      >
        {/* Image Section */}
        <div className={viewMode === "list" ? "w-full sm:w-72 flex-shrink-0" : ""}>
          <div className={`relative overflow-hidden ${viewMode === "list" ? "h-52 sm:h-full" : "h-52"}`}>
            <Image
              src={billboard.images[0] || "/placeholder.svg"}
              alt={billboard.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Public Variant: Save Button */}
            {variant === "public" && onSave && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-md rounded-full h-8 w-8 p-0 transition-all duration-200"
                onClick={() => {
                  if (isAuthenticated) {
                    onSave(billboard.id)
                  } else {
                    setLoginModalOpen(true)
                  }
                }}
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-200 ${
                    isSaved ? "fill-red-500 text-red-500 scale-110" : "text-gray-600"
                  }`}
                />
              </Button>
            )}

            {/* Owner Variant: Status Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              {statusBadge && variant === "owner" && (
                <Badge className={`${statusBadge.className} text-xs shadow-sm`}>{statusBadge.text}</Badge>
              )}
              {expirationBadge && variant === "owner" && (
                <Badge className={`${expirationBadge.className} text-xs shadow-sm`}>
                  {expirationBadge.icon && <expirationBadge.icon className="h-3 w-3 mr-1 inline" />}
                  {expirationBadge.text}
                </Badge>
              )}
            </div>

            {/* Public Variant: Availability Badge */}
            {variant === "public" && (
              <Badge
                className={`absolute top-3 left-3 text-xs font-medium ${
                  billboard.isAvailable
                    ? "bg-green-500 hover:bg-green-500"
                    : "bg-orange-500 hover:bg-orange-500"
                } text-white shadow-sm`}
              >
                {billboard.isAvailable ? "Available" : "Unavailable"}
              </Badge>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-5">
          {/* Title & Dropdown */}
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200 text-base leading-snug line-clamp-2">
                {billboard.title}
              </h3>
              <p className="flex items-center text-gray-500 text-sm mt-1">
                <MapPin className="h-3.5 w-3.5 mr-1 text-green-500 flex-shrink-0" />
                <span className="truncate">{billboard.location}</span>
              </p>
            </div>

            {/* Owner Variant: Dropdown Menu */}
            {variant === "owner" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/billboard/${billboard.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(billboard.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Info Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
              {billboard.widthFt} × {billboard.heightFt} m
            </span>
            <Badge variant="outline" className="border-green-200 text-green-700 text-xs rounded-full">
              {billboard.billboardType}
            </Badge>
          </div>

          {/* Owner Variant: Stats */}
          {variant === "owner" && (
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {billboard.views || 0} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {billboard.totalSaves || 0} saves
              </span>
            </div>
          )}

          {/* Push pricing to bottom */}
          <div className="flex-1" />

          {/* Pricing & CTA */}
          <div className="pt-3 border-t border-gray-100">
            {viewMode === "list" ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xl font-bold text-green-700">
                    GHS {billboard.monthlyRate || billboard.weeklyRate * 4}
                  </span>
                  <span className="text-gray-500 text-sm ml-0.5">/mo</span>
                </div>
                {variant === "public" && (
                  <Link href={`/billboard/${billboard.id}`}>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm whitespace-nowrap">
                      View Details
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div>
                  <span className="text-xl font-bold text-green-700">
                    GHS {billboard.monthlyRate || billboard.weeklyRate * 4}
                  </span>
                  <span className="text-gray-500 text-sm ml-0.5">/month</span>
                </div>
                {variant === "public" && (
                  <Link href={`/billboard/${billboard.id}`} className="block">
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm">
                      View Details
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Owner Variant: Listing Status Info */}
          {variant === "owner" && listingStatus?.data && (
            <div className="pt-3 border-t border-gray-100 mt-3 space-y-2">
              {listingStatus.data.hasActiveListing && listingStatus.data.daysRemaining !== null && (
                <p className="text-xs text-gray-500">
                  Listing expires in {listingStatus.data.daysRemaining} day
                  {listingStatus.data.daysRemaining !== 1 ? "s" : ""}
                </p>
              )}
              {listingStatus.data.isExpired && !listingStatus.data.isInGracePeriod && (
                <p className="text-xs text-red-600">Listing has expired. Renew to keep it visible.</p>
              )}
              {listingStatus.data.isInGracePeriod && (
                <p className="text-xs text-yellow-600">In grace period. Renew soon to avoid being hidden.</p>
              )}
              {listingStatus.data.canRenew && (
                <Button
                  onClick={handleRenew}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {listingStatus.data.isExpired || listingStatus.data.isInGracePeriod
                    ? "Renew Listing"
                    : "Extend Listing"}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Owner Variant: Edit Modal */}
      {variant === "owner" && (
        <EditBillboardModal
          billboard={billboard}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["billboards"] })
            onEditSuccess?.()
          }}
        />
      )}

      {/* Public Variant: Login Prompt Modal */}
      {variant === "public" && (
        <LoginPromptModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
      )}
    </>
  )
}
