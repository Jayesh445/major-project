"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth-store"
import apiClient from "@/lib/api/client"
import { Loader2, Save, Edit2, X, User, Mail, UserCheck, Calendar } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})

  // Load profile data
  useEffect(() => {
    if (user?.userId) {
      loadProfile()
    }
  }, [user?.userId])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/users/profile')
      const data = response.data.data
      setProfileData(data)
      setFormData({
        name: data.name,
        email: data.email,
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      await apiClient.patch('/users/profile', {
        name: formData.name,
      })
      await loadProfile()
      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: profileData?.name,
      email: profileData?.email,
    })
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    admin: "destructive",
    warehouse_manager: "default",
    procurement_officer: "secondary",
    supplier: "outline",
  }

  const roleLabel = profileData.role?.replace(/_/g, " ") || "User"

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="My Profile"
        description="View and manage your account information"
      />

      {/* Main Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {profileData.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-xl">{profileData.name}</p>
                <Badge variant={roleColors[profileData.role] || "secondary"} className="mt-1">
                  {roleLabel}
                </Badge>
              </div>
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Basic Information
            </h3>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profileData.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>
            <div>
              <p className="text-sm text-muted-foreground">Email Address</p>
              <p className="font-medium">{profileData.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Role & Permissions
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Your Role</p>
                <div className="mt-2">
                  <Badge variant={roleColors[profileData.role] || "secondary"} className="text-sm px-3 py-1">
                    {roleLabel}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-2">Role Description:</p>
                {profileData.role === "admin" && (
                  <p>Full system access. Can manage users, products, warehouses, suppliers, and view analytics.</p>
                )}
                {profileData.role === "procurement_officer" && (
                  <p>Can create and manage purchase orders, negotiate with suppliers, and track procurement.</p>
                )}
                {profileData.role === "warehouse_manager" && (
                  <p>Can manage warehouse inventory, track receipts, and handle goods distribution.</p>
                )}
                {profileData.role === "supplier" && (
                  <p>Can view purchase orders sent to you and acknowledge orders.</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Account Details
            </h3>
            <div className="grid gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Account Created</p>
                <p className="font-medium">
                  {profileData.createdAt
                    ? new Date(profileData.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {profileData.updatedAt
                    ? new Date(profileData.updatedAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 border-t pt-6">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="gap-2 flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="gap-2 flex-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-medium text-blue-900">💡 Profile Tips</p>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Your role determines what features you can access</li>
              <li>Email address is used for login and cannot be changed</li>
              <li>Contact your administrator if you need role changes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
