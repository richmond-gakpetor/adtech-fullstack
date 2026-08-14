"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"

export function UserMenu() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  if (!user) return null

  const getInitials = () => {
    const names = user.fullName.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.fullName.substring(0, 2).toUpperCase()
  }

  const getDashboardLink = () => {
    switch (user.userType) {
      case "owner":
        return "/owner-dashboard"
      case "advertiser":
        return "/advertiser-dashboard"
      case "admin":
        return "/admin"
      default:
        return "/"
    }
  }

  const getRoleLabel = () => {
    switch (user.userType) {
      case "owner":
        return "Billboard Owner"
      case "advertiser":
        return "Advertiser"
      case "admin":
        return "Admin"
      default:
        return user.userType
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImage || undefined} alt={user.fullName} />
            <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <Badge variant="outline" className="w-fit mt-2">
              {getRoleLabel()}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={getDashboardLink()} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
