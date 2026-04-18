import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseServiceClient } from "@/lib/supabase"
import { appendRSVPToSheet, ensureSheetHeaders } from "@/lib/googleSheets"
import { sendConfirmationEmail } from "@/lib/email"

// Validation schema
const rsvpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  attending: z.boolean(),
  extraGuest1: z.string().optional(),
  extraGuest2: z.string().optional(),
  website: z.string().optional(), // honeypot field
})

const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const requestLog = new Map<string, number[]>()

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "anonymous"
  }
  return request.headers.get("x-real-ip") ?? "anonymous"
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - RATE_WINDOW_MS
  const attempts = requestLog.get(ip) ?? []
  const recent = attempts.filter((ts) => ts > cutoff)

  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(ip, recent)
    return true
  }

  recent.push(now)
  requestLog.set(ip, recent)
  return false
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const parsed = rsvpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, attending, extraGuest1, extraGuest2 } = parsed.data
    if (parsed.data.website) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 })
    }

    const submittedAt = new Date().toISOString()

    // 1. Save to Supabase (primary store)
    const supabase = getSupabaseServiceClient()
    const { error: dbError } = await supabase.from("rsvps").insert({
      name,
      email,
      attending,
      extra_guest_1: extraGuest1 ?? null,
      extra_guest_2: extraGuest2 ?? null,
      submitted_at: submittedAt,
    })

    if (dbError) {
      console.error("Supabase insert error:", dbError)
      // Check for duplicate email
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "An RSVP with this email has already been submitted." },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: "Failed to save RSVP. Please try again." }, { status: 500 })
    }

    const [sheetResult, emailResult] = await Promise.allSettled([
      ensureSheetHeaders().then(() =>
        appendRSVPToSheet({
          guestName: name,
          email,
          attending,
          extraGuest1,
          extraGuest2,
          submittedAt: new Date(submittedAt).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        })
      ),
      sendConfirmationEmail({ name, email, attending, extraGuest1, extraGuest2 }),
    ])

    if (sheetResult.status === "rejected") {
      console.error("Google Sheets sync failed (non-fatal):", sheetResult.reason)
    }
    if (emailResult.status === "rejected") {
      console.error("Confirmation email failed (non-fatal):", emailResult.reason)
    }

    return NextResponse.json({ success: true, message: "RSVP submitted successfully!" })
  } catch (error) {
    console.error("RSVP route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
