export async function GET() {
  return new Response(
    JSON.stringify({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING",
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "LOADED" : "MISSING",
    }),
    { status: 200 }
  );
}