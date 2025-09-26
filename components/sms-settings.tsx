"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, Settings, TestTube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SMSConfig {
  provider: string
  enabled: boolean
  fromNumber: string
  apiKey?: string
  apiSecret?: string
}

export function SMSSettings() {
  const [config, setConfig] = useState<SMSConfig>({
    provider: "mock",
    enabled: true,
    fromNumber: "+1234567890",
    apiKey: "",
    apiSecret: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testPhone, setTestPhone] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/sms/config")
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error("Error loading SMS config:", error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/sms/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "SMS configuration has been updated successfully.",
        })
      } else {
        throw new Error("Failed to save configuration")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SMS configuration.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number to test.",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch("/api/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: testPhone }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Test Successful",
          description: "Test SMS sent successfully!",
        })
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Failed to send test SMS.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test SMS.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SMS Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="sms-enabled"
              checked={config.enabled}
              onCheckedChange={(enabled) => setConfig((prev) => ({ ...prev, enabled }))}
            />
            <Label htmlFor="sms-enabled">Enable SMS Notifications</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">SMS Provider</Label>
              <Select
                value={config.provider}
                onValueChange={(provider) => setConfig((prev) => ({ ...prev, provider }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">Mock (Testing)</SelectItem>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="aws-sns">AWS SNS</SelectItem>
                  <SelectItem value="vonage">Vonage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-number">From Phone Number</Label>
              <Input
                id="from-number"
                type="tel"
                placeholder="+1234567890"
                value={config.fromNumber}
                onChange={(e) => setConfig((prev) => ({ ...prev, fromNumber: e.target.value }))}
              />
            </div>

            {config.provider !== "mock" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter API key"
                    value={config.apiKey || ""}
                    onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-secret">API Secret</Label>
                  <Input
                    id="api-secret"
                    type="password"
                    placeholder="Enter API secret"
                    value={config.apiSecret || ""}
                    onChange={(e) => setConfig((prev) => ({ ...prev, apiSecret: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>

          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Configuration"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test SMS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-phone">Test Phone Number</Label>
            <Input
              id="test-phone"
              type="tel"
              placeholder="+1234567890"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
          </div>

          <Button onClick={handleTest} disabled={isTesting || !config.enabled}>
            {isTesting ? "Sending..." : "Send Test SMS"}
          </Button>

          {!config.enabled && (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                SMS notifications are currently disabled. Enable them above to send test messages.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
