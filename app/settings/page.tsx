"use client"

import { SMSSettings } from "@/components/sms-settings"
import { BackButton } from "@/components/back-button"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton />

      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">System Settings</h1>
      </div>

      <SMSSettings />
    </div>
  )
}
