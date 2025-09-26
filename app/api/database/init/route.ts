import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Database initialization is now handled directly via Supabase client.",
    },
    { status: 410 },
  )
}
