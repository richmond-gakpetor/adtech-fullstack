"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAuth } from "@/app/api/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface AuthGuardProps {
  children: React.ReactNode
  requiredUserType?: "owner" | "advertiser" | "admin"
  requireAuth?: boolean
}

const LoadingScreen = ({ message = "Loading..." }: { message?: string }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)

const dashboardPaths: Record<string, string> = {
  advertiser: "/advertiser-dashboard",
  owner: "/owner-dashboard",
  admin: "/admin",
}

export function AuthGuard({ children, requiredUserType, requireAuth = true }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const { isLoading, user: authUser } = useAuth()

  // Use user from useAuth hook if available (more up-to-date), otherwise fallback to store
  const currentUser = authUser || user

  useEffect(() => {
    if (requireAuth && _hasHydrated && !isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [requireAuth, _hasHydrated, isLoading, isAuthenticated, router, pathname])

  // Wait for hydration and auth verification to complete
  if (!_hasHydrated || (requireAuth && isLoading)) {
    return <LoadingScreen message={requireAuth && isLoading ? "Verifying authentication..." : "Loading..."} />
  }

  if (requireAuth && !isAuthenticated) {
    return null // Redirect handled by useEffect
  }

  // Wait for user data to be available before checking userType
  if (requiredUserType && (!currentUser || currentUser.userType !== requiredUserType)) {
    const dashboardPath = currentUser?.userType ? dashboardPaths[currentUser.userType] : null
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Required:</strong> {requiredUserType} account
              </p>
              <p className="text-sm text-red-800 mt-1">
                <strong>Your account:</strong> {currentUser?.userType || "unknown"}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </Link>
              {dashboardPath && (
                <Link href={dashboardPath}>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Go to My Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
