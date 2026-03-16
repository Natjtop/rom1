"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { User, Lock, Save, Check, Loader2, Eye, EyeOff, AlertTriangle, Mail, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { team as teamApi, auth as authApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function AccountSettingsPage() {
  const { user, updateUser, logout, workspace } = useAuth()

  // Profile
  const [name, setName] = useState(user?.name || "")
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Password
  const [hasExistingPassword, setHasExistingPassword] = useState(true) // assume yes until loaded
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Delete account
  const [deleteCodeRequested, setDeleteCodeRequested] = useState(false)
  const [deleteCode, setDeleteCode] = useState("")
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false)
  const [deleteCodeSending, setDeleteCodeSending] = useState(false)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [ownerStatusLoaded, setOwnerStatusLoaded] = useState(false)
  const [workspaceDeleteCodeRequested, setWorkspaceDeleteCodeRequested] = useState(false)
  const [workspaceDeleteCode, setWorkspaceDeleteCode] = useState("")
  const [workspaceDeleteText, setWorkspaceDeleteText] = useState("")
  const [workspaceDeleteAcknowledged, setWorkspaceDeleteAcknowledged] = useState(false)
  const [workspaceDeleteCodeSending, setWorkspaceDeleteCodeSending] = useState(false)
  const [workspaceDeleteConfirming, setWorkspaceDeleteConfirming] = useState(false)

  // Check if user has a password set
  useEffect(() => {
    authApi.hasPassword().then((r) => setHasExistingPassword(r.hasPassword)).catch(() => {})
  }, [])

  useEffect(() => {
    authApi.listWorkspaces()
      .then((result) => {
        const current = result.workspaces.find((ws) => ws.isCurrent)
        setIsOwner(!!current?.isOwner)
      })
      .catch(() => {})
      .finally(() => setOwnerStatusLoaded(true))
  }, [])

  const handleProfileSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty")
      return
    }
    try {
      setProfileSaving(true)
      if (user?.id) {
        await teamApi.updateProfile({ name: name.trim() })
      }
      updateUser({ name: name.trim() })
      setProfileSaved(true)
      toast.success("Profile updated successfully")
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (err) {
      console.error("Failed to update profile:", err)
      toast.error("Failed to update profile")
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (hasExistingPassword && !currentPassword) {
      toast.error("Please enter your current password")
      return
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    try {
      setPasswordSaving(true)
      await authApi.changePassword({ currentPassword: hasExistingPassword ? currentPassword : undefined, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setHasExistingPassword(true) // now they have a password
      toast.success(hasExistingPassword ? "Password changed successfully" : "Password set successfully")
    } catch (err) {
      console.error("Failed to change password:", err)
      toast.error(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSendDeleteCode = async () => {
    try {
      setDeleteCodeSending(true)
      const result = await authApi.requestDeleteAccountCode()
      setDeleteCodeRequested(true)
      setDeleteCode("")
      toast.success(result.message)
    } catch (err) {
      console.error("Failed to request delete-account code:", err)
      toast.error(err instanceof Error ? err.message : "Failed to send verification code")
    } finally {
      setDeleteCodeSending(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteAcknowledged) {
      toast.error("Please confirm that you understand this action")
      return
    }

    if (deleteCode.trim().length !== 6) {
      toast.error("Enter the 6-digit verification code from your email")
      return
    }

    try {
      setDeleteConfirming(true)
      const result = await authApi.confirmDeleteAccount(deleteCode.trim())
      toast.success(
        result.redirectWorkspace
          ? `Account deleted. You can still sign in to ${result.redirectWorkspace.name}.`
          : result.message
      )
      await logout()
    } catch (err) {
      console.error("Failed to delete account:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete account")
    } finally {
      setDeleteConfirming(false)
    }
  }

  const handleSendWorkspaceDeleteCode = async () => {
    try {
      setWorkspaceDeleteCodeSending(true)
      const result = await authApi.requestDeleteWorkspaceCode()
      setWorkspaceDeleteCodeRequested(true)
      setWorkspaceDeleteCode("")
      toast.success(result.message)
    } catch (err) {
      console.error("Failed to request delete-workspace code:", err)
      toast.error(err instanceof Error ? err.message : "Failed to send verification code")
    } finally {
      setWorkspaceDeleteCodeSending(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceDeleteAcknowledged) {
      toast.error("Please confirm that you understand this action")
      return
    }

    if (workspaceDeleteCode.trim().length !== 6) {
      toast.error("Enter the 6-digit verification code from your email")
      return
    }

    if (workspaceDeleteText.trim().toUpperCase() !== "DELETE") {
      toast.error("Type DELETE to confirm workspace deletion")
      return
    }

    try {
      setWorkspaceDeleteConfirming(true)
      const result = await authApi.confirmDeleteWorkspace({
        otp: workspaceDeleteCode.trim(),
        confirmation: workspaceDeleteText.trim(),
      })
      toast.success(result.message)
      await logout()
    } catch (err) {
      console.error("Failed to delete workspace:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete workspace")
    } finally {
      setWorkspaceDeleteConfirming(false)
    }
  }

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: "bg-accent/10 text-accent border-accent/20",
      AGENT: "bg-blue-50 text-blue-700 border-blue-200",
      VIEWER: "bg-secondary text-muted-foreground border-border/60",
    }
    return map[role] || map.AGENT
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Page header */}
      <div className="border-b border-border/60 px-3 sm:px-6 py-6">
        <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Account</span>
        </div>
        <h1 className="text-lg font-semibold text-foreground">Account</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Manage your personal profile and security settings.
        </p>
      </div>

      <div className="p-3 sm:p-6 space-y-8">
        {/* Profile section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Profile</h2>
            <p className="text-[13px] text-muted-foreground">Your personal information visible to team members.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="p-3 sm:p-5 space-y-5">
              {/* Avatar + role */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[18px] font-semibold text-accent">
                  {(user?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-foreground truncate">{user?.name || "User"}</p>
                  <p className="text-[12px] text-muted-foreground truncate">{user?.email || ""}</p>
                </div>
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
                  roleBadge(user?.role || "AGENT")
                )}>
                  {(user?.role || "Agent").toLowerCase()}
                </span>
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label htmlFor="account-name" className="text-[13px] font-medium text-foreground">Display name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    id="account-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background pl-10 pr-3 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <p className="text-[12px] text-muted-foreground/60">This is how your name appears in conversations and team views.</p>
              </div>

              {/* Email (read only) */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Email address</label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-secondary/30 px-3 text-[13px] text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[12px] text-muted-foreground/60">Contact your workspace admin to change your email address.</p>
              </div>
            </div>

            {/* Save profile */}
            <div className="border-t border-border/60 px-3 sm:px-5 py-3 flex justify-end">
              <button
                onClick={handleProfileSave}
                disabled={profileSaving || name.trim() === (user?.name || "")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 sm:py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.98] min-h-[44px] sm:min-h-0",
                  profileSaved
                    ? "bg-emerald-500 text-white"
                    : "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                )}
              >
                {profileSaving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                ) : profileSaved ? (
                  <><Check className="h-3.5 w-3.5" /> Saved</>
                ) : (
                  <><Save className="h-3.5 w-3.5" /> Save profile</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Password section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">{hasExistingPassword ? "Change password" : "Set password"}</h2>
            <p className="text-[13px] text-muted-foreground">
              {hasExistingPassword
                ? "Update your password to keep your account secure."
                : "Set a password to sign in with email and password. Currently you can only sign in with Google."}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="p-3 sm:p-5 space-y-5">
              {/* Current password — only shown if user already has one */}
              {hasExistingPassword && <div className="space-y-1.5">
                <label htmlFor="current-password" className="text-[13px] font-medium text-foreground">Current password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background pl-10 pr-10 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>}

              {/* New password */}
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-[13px] font-medium text-foreground">{hasExistingPassword ? "New password" : "Password"}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background pl-10 pr-10 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[12px] text-muted-foreground/60">Must be at least 8 characters long.</p>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-[13px] font-medium text-foreground">Confirm new password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background pl-10 pr-10 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[12px] text-red-500">Passwords do not match.</p>
                )}
              </div>
            </div>

            {/* Save password */}
            <div className="border-t border-border/60 px-3 sm:px-5 py-3 flex justify-end">
              <button
                onClick={handlePasswordChange}
                disabled={passwordSaving || (hasExistingPassword && !currentPassword) || !newPassword || !confirmPassword}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-all duration-150 hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50 min-h-[44px] sm:min-h-0"
              >
                {passwordSaving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...</>
                ) : (
                  <><Lock className="h-3.5 w-3.5" /> {hasExistingPassword ? "Change password" : "Set password"}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Danger zone</h2>
            <p className="text-[13px] text-muted-foreground">
              {isOwner
                ? "As the workspace owner, you can permanently delete the entire workspace and your account."
                : "Permanently remove your account from this workspace after confirming with a code sent to your email."}
            </p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50/40">
            <div className="p-3 sm:p-5 space-y-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="space-y-2">
                  <p className="text-[14px] font-medium text-foreground">
                    {isOwner ? "Delete workspace and account" : "Delete account"}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {isOwner ? (
                      <>
                        This permanently deletes <span className="font-medium text-foreground">{workspace?.name || "this workspace"}</span>,
                        your account <span className="font-medium text-foreground">{user?.email}</span>, tickets, messages, settings, and connected data in this workspace.
                      </>
                    ) : (
                      <>
                        This removes your user account from <span className="font-medium text-foreground">{user?.email}</span> in the current workspace.
                        Your existing sessions will be signed out right away.
                      </>
                    )}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {isOwner
                      ? "If this workspace has an active Stripe subscription, we'll cancel it before deleting the workspace."
                      : "If you created this workspace or you are its only admin, deletion will be blocked until ownership/admin access is transferred."}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-red-200/80 bg-background p-3 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">Email confirmation</p>
                    <p className="text-[12px] text-muted-foreground">
                      We&apos;ll send a 6-digit code to <span className="font-medium text-foreground">{user?.email || "your email"}</span>.
                    </p>
                  </div>
                  <button
                    onClick={isOwner ? handleSendWorkspaceDeleteCode : handleSendDeleteCode}
                    disabled={isOwner ? workspaceDeleteCodeSending : deleteCodeSending || !ownerStatusLoaded}
                    className="inline-flex min-h-[44px] sm:min-h-0 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2.5 sm:py-2 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    {(isOwner ? workspaceDeleteCodeSending : deleteCodeSending) ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</>
                    ) : (
                      <><Mail className="h-3.5 w-3.5" /> {(isOwner ? workspaceDeleteCodeRequested : deleteCodeRequested) ? "Resend code" : "Send confirmation code"}</>
                    )}
                  </button>
                </div>

                {(isOwner ? workspaceDeleteCodeRequested : deleteCodeRequested) ? (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <label htmlFor="delete-account-code" className="text-[13px] font-medium text-foreground">
                        Verification code
                      </label>
                      <input
                        id="delete-account-code"
                        inputMode="numeric"
                        maxLength={6}
                        value={isOwner ? workspaceDeleteCode : deleteCode}
                        onChange={(e) => (isOwner ? setWorkspaceDeleteCode : setDeleteCode)(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="h-11 sm:h-9 w-full rounded-lg border border-red-200 bg-white px-3 text-[13px] tracking-[0.3em] text-foreground focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-200 transition-colors"
                        placeholder="123456"
                      />
                      <p className="text-[12px] text-muted-foreground">The code expires in 10 minutes.</p>
                    </div>

                    {isOwner && (
                      <div className="space-y-1.5">
                        <label htmlFor="workspace-delete-confirmation" className="text-[13px] font-medium text-foreground">
                          Type DELETE to confirm
                        </label>
                        <input
                          id="workspace-delete-confirmation"
                          value={workspaceDeleteText}
                          onChange={(e) => setWorkspaceDeleteText(e.target.value)}
                          className="h-11 sm:h-9 w-full rounded-lg border border-red-200 bg-white px-3 text-[13px] text-foreground focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-200 transition-colors"
                          placeholder="DELETE"
                        />
                      </div>
                    )}

                    <label className="flex items-start gap-2.5 rounded-lg border border-red-200/80 bg-red-50/50 p-3">
                      <input
                        type="checkbox"
                        checked={isOwner ? workspaceDeleteAcknowledged : deleteAcknowledged}
                        onChange={(e) => (isOwner ? setWorkspaceDeleteAcknowledged : setDeleteAcknowledged)(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-[12px] leading-5 text-muted-foreground">
                        {isOwner
                          ? "I understand that this permanently deletes the entire workspace, all workspace data, and my account."
                          : "I understand that this permanently removes my account from the current workspace and signs me out immediately."}
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-red-200 px-3 sm:px-5 py-3 flex justify-end">
              <button
                onClick={isOwner ? handleDeleteWorkspace : handleDeleteAccount}
                disabled={isOwner
                  ? !workspaceDeleteCodeRequested || workspaceDeleteCode.length !== 6 || workspaceDeleteText.trim().toUpperCase() !== "DELETE" || !workspaceDeleteAcknowledged || workspaceDeleteConfirming
                  : !deleteCodeRequested || deleteCode.length !== 6 || !deleteAcknowledged || deleteConfirming}
                className="flex min-h-[44px] sm:min-h-0 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-white transition-all duration-150 hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
              >
                {(isOwner ? workspaceDeleteConfirming : deleteConfirming) ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="h-3.5 w-3.5" /> {isOwner ? "Delete workspace and account" : "Delete account"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
