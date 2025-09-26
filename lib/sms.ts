// SMS notification service
// This is a mock implementation - in production, you would integrate with services like:
// - Twilio
// - AWS SNS
// - Vonage (Nexmo)
// - Local SMS gateway providers

export interface SMSConfig {
  provider: "twilio" | "aws-sns" | "vonage" | "mock"
  apiKey?: string
  apiSecret?: string
  fromNumber?: string
  enabled: boolean
}

export interface SMSMessage {
  to: string
  message: string
  studentName: string
  lrn: string
}

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

// Mock SMS service for demonstration
class MockSMSService {
  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock success/failure (90% success rate)
    const success = Math.random() > 0.1

    if (success) {
      console.log(`[MOCK SMS] Sent to ${message.to}: ${message.message}`)
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    } else {
      return {
        success: false,
        error: "Mock SMS service failure",
      }
    }
  }
}

// Twilio SMS service (placeholder implementation)
class TwilioSMSService {
  constructor(private config: SMSConfig) {}

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      // In production, you would use the Twilio SDK:
      // const client = twilio(this.config.apiKey, this.config.apiSecret);
      // const result = await client.messages.create({
      //   body: message.message,
      //   from: this.config.fromNumber,
      //   to: message.to
      // });

      console.log(`[TWILIO SMS] Would send to ${message.to}: ${message.message}`)

      return {
        success: true,
        messageId: `twilio_${Date.now()}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Twilio SMS error",
      }
    }
  }
}

// SMS service factory
export class SMSService {
  private service: MockSMSService | TwilioSMSService
  private config: SMSConfig

  constructor(config: SMSConfig) {
    this.config = config

    switch (config.provider) {
      case "twilio":
        this.service = new TwilioSMSService(config)
        break
      case "mock":
      default:
        this.service = new MockSMSService()
        break
    }
  }

  async sendAttendanceNotification(
    phoneNumber: string,
    studentName: string,
    lrn: string,
    timestamp: Date,
    location = "School Gate",
  ): Promise<SMSResult> {
    if (!this.config.enabled) {
      return { success: false, error: "SMS notifications are disabled" }
    }

    if (!phoneNumber) {
      return { success: false, error: "No phone number provided" }
    }

    const timeStr = timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const dateStr = timestamp.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    const message = `ATTENDANCE ALERT: ${studentName} (LRN: ${lrn}) has arrived at ${location} on ${dateStr} at ${timeStr}. Thank you for using our attendance tracking system.`

    return await this.service.sendSMS({
      to: phoneNumber,
      message,
      studentName,
      lrn,
    })
  }

  async sendBulkNotifications(
    notifications: Array<{
      phoneNumber: string
      studentName: string
      lrn: string
      timestamp: Date
      location?: string
    }>,
  ): Promise<SMSResult[]> {
    const results: SMSResult[] = []

    for (const notification of notifications) {
      const result = await this.sendAttendanceNotification(
        notification.phoneNumber,
        notification.studentName,
        notification.lrn,
        notification.timestamp,
        notification.location,
      )
      results.push(result)

      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return results
  }
}

// Default SMS configuration
export const defaultSMSConfig: SMSConfig = {
  provider: "mock",
  enabled: true,
  fromNumber: "+1234567890", // Default from number
}

// Get SMS configuration from environment variables
export function getSMSConfig(): SMSConfig {
  return {
    provider: (process.env.SMS_PROVIDER as any) || "mock",
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    fromNumber: process.env.SMS_FROM_NUMBER || "+1234567890",
    enabled: process.env.SMS_ENABLED !== "false",
  }
}
