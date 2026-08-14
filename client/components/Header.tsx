"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { UserMenu } from "@/components/UserMenu"
import { useAuthStore } from "@/lib/stores/auth-store"

interface HeaderProps {
  showBrowse?: boolean
  showListBillboard?: boolean
  className?: string
}

export function Header({ 
  showBrowse = false,
  showListBillboard = false,
  className = ""
}: HeaderProps) {
  const { isAuthenticated, user } = useAuthStore()
  
  // Ensure isAuthenticated reflects actual user state
  const isLoggedIn = isAuthenticated && !!user

  return (
    <header className={`border-b border-gray-200/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">XP</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Xposure GH
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {/* Optional Browse Link */}
            {showBrowse && (
              <Link href="/browse">
                <Button variant="outline" className="hidden md:flex">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Billboards
                </Button>
              </Link>
            )}

            {/* Optional List Billboard Link */}
            {showListBillboard && (
              <Link href="/list-billboard">
                <Button className="hidden md:flex bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  List Billboard
                </Button>
              </Link>
            )}

            {/* Auth Section */}
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-600 hover:text-green-600">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
