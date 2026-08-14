"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Loader2 } from "lucide-react"
import { useUpdateBillboard } from "@/app/api/hooks/useBillboards"
import type { Billboard, BillboardUpdateInput } from "@/lib/types"

interface EditBillboardModalProps {
  billboard: Billboard | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditBillboardModal({
  billboard,
  open,
  onOpenChange,
  onSuccess,
}: EditBillboardModalProps) {
  const updateBillboard = useUpdateBillboard(billboard?.id || "")
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    weeklyRate: "",
    monthlyRate: "",
    printingFee: "",
    flightFee: "",
    minimumDuration: "",
    features: [] as string[],
    nearbyLandmarks: [] as string[],
    availableFrom: "",
    availableTo: "",
    isAvailable: true,
  })

  const [newFeature, setNewFeature] = useState("")
  const [newLandmark, setNewLandmark] = useState("")

  // Populate form when billboard changes
  useEffect(() => {
    if (billboard) {
      setFormData({
        title: billboard.title || "",
        description: billboard.description || "",
        weeklyRate: billboard.weeklyRate?.toString() || "",
        monthlyRate: billboard.monthlyRate?.toString() || "",
        printingFee: billboard.printingFee?.toString() || "",
        flightFee: billboard.flightFee?.toString() || "",
        minimumDuration: billboard.minimumDuration || "",
        features: billboard.features || [],
        nearbyLandmarks: billboard.nearbyLandmarks || [],
        availableFrom: billboard.availableFrom || "",
        availableTo: billboard.availableTo || "",
        isAvailable: billboard.isAvailable ?? true,
      })
    }
  }, [billboard])

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billboard) return

    const updateData: BillboardUpdateInput = {
      title: formData.title,
      description: formData.description,
      weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : undefined,
      monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : undefined,
      printingFee: formData.printingFee ? parseFloat(formData.printingFee) : undefined,
      flightFee: formData.flightFee ? parseFloat(formData.flightFee) : undefined,
      minimumDuration: formData.minimumDuration || undefined,
      features: formData.features,
      nearbyLandmarks: formData.nearbyLandmarks,
      availableFrom: formData.availableFrom || undefined,
      availableTo: formData.availableTo || undefined,
      isAvailable: formData.isAvailable,
    }

    try {
      await updateBillboard.mutateAsync(updateData)
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  if (!billboard) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Billboard</DialogTitle>
          <DialogDescription>
            Update your billboard details. Some fields like location and dimensions cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weeklyRate">Weekly Rate (GHS)</Label>
                <Input
                  id="weeklyRate"
                  type="number"
                  value={formData.weeklyRate}
                  onChange={(e) => handleInputChange("weeklyRate", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="monthlyRate">Monthly Rate (GHS)</Label>
                <Input
                  id="monthlyRate"
                  type="number"
                  value={formData.monthlyRate}
                  onChange={(e) => handleInputChange("monthlyRate", e.target.value)}
                />
              </div>
            </div>

            {billboard.billboardType === "Static" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="printingFee">Printing Fee (GHS)</Label>
                  <Input
                    id="printingFee"
                    type="number"
                    value={formData.printingFee}
                    onChange={(e) => handleInputChange("printingFee", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="flightFee">Flight Fee (GHS)</Label>
                  <Input
                    id="flightFee"
                    type="number"
                    value={formData.flightFee}
                    onChange={(e) => handleInputChange("flightFee", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="minimumDuration">Minimum Rental Duration</Label>
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
          </div>

          <Separator />

          {/* Features & Landmarks */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Features & Landmarks</h3>
            
            <div>
              <Label>Features</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="e.g., LED Display, Weather Resistant"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Nearby Landmarks</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  value={newLandmark}
                  onChange={(e) => setNewLandmark(e.target.value)}
                  placeholder="e.g., Accra Mall, Tetteh Quarshie Interchange"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLandmark())}
                />
                <Button type="button" onClick={addLandmark} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.nearbyLandmarks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.nearbyLandmarks.map((landmark, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {landmark}
                      <button
                        type="button"
                        onClick={() => removeLandmark(index)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Availability */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Availability</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => handleInputChange("isAvailable", e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isAvailable" className="cursor-pointer">
                Billboard is currently available for booking
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateBillboard.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateBillboard.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateBillboard.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
