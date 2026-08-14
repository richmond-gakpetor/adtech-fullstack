"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogIn } from "lucide-react"

interface LoginPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginPromptModal({ open, onOpenChange }: LoginPromptModalProps) {
  const router = useRouter()
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md backdrop-blur-xl bg-white/90 border border-gray-200 shadow-2xl">
        <DialogHeader className="space-y-3 text-center">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Login Required
          </DialogTitle>
          <DialogDescription className="text-base text-gray-700">
            Please log in to save billboards and access them from your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 h-11 text-base font-semibold" 
            onClick={() => router.push("/login")}
          >
            <LogIn className="h-5 w-5 mr-2" />
            Log In
          </Button>
          
          <Button 
            className="w-full h-10" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
