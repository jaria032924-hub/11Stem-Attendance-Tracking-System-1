import { type NextRequest, NextResponse } from "next/server"

// In a real application, you would store this in a database or environment variables
let smsConfig = {
  provider: "mock",
  enabled: true,
  fromNumber: "+1234567890",
  apiKey: "",
  apiSecret: "",
}

export async function GET() {
  try {
    // Don't return sensitive information like API keys in the response
    const safeConfig = {
      provider: smsConfig.provider,
      enabled: smsConfig.enabled,
      fromNumber: smsConfig.fromNumber,
      apiKey: smsConfig.apiKey ? "***" : "",
      apiSecret: smsConfig.apiSecret ? "***" : "",
    }

    return NextResponse.json(safeConfig)
  } catch (error) {
    console.error("Error fetching SMS config:", error)
    return NextResponse.json({ message: "Failed to fetch SMS configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Update configuration
    smsConfig = {
      provider: body.provider || "mock",
      enabled: body.enabled !== false,
      fromNumber: body.fromNumber || "+1234567890",
      apiKey: body.apiKey || "",
      apiSecret: body.apiSecret || "",
    }

    return NextResponse.json({ message: "Configuration saved successfully" })
  } catch (error) {
    console.error("Error saving SMS config:", error)
    return NextResponse.json({ message: "Failed to save SMS configuration" }, { status: 500 })
  }
}
