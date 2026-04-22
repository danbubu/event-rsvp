"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import confetti from "canvas-confetti"
import { PARTY_CONFIG, isRsvpOpen } from "@/lib/config"
import "./rsvp.css"

// ─── Schema ────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  attending: z.enum(["yes", "no"] as [string, ...string[]]),
  extraGuest1: z.string().optional(),
  extraGuest2: z.string().optional(),
  extraGuest3: z.string().optional(),
  website: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type SubmitState = "idle" | "loading" | "success" | "error"

// ─── Icons ─────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

function formatGoogleDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function createGoogleCalendarLink() {
  const url = new URL("https://calendar.google.com/calendar/render")
  url.searchParams.set("action", "TEMPLATE")
  url.searchParams.set("text", PARTY_CONFIG.name)
  url.searchParams.set("dates", `${formatGoogleDate(PARTY_CONFIG.startsAtISO)}/${formatGoogleDate(PARTY_CONFIG.endsAtISO)}`)
  url.searchParams.set("location", PARTY_CONFIG.location)
  url.searchParams.set("details", `Hosted by ${PARTY_CONFIG.hostName}. Theme: ${PARTY_CONFIG.theme}`)
  return url.toString()
}

function getCountdownParts(targetISO: string) {
  const now = Date.now()
  const target = new Date(targetISO).getTime()
  const delta = Math.max(target - now, 0)
  const days = Math.floor(delta / (1000 * 60 * 60 * 24))
  const hours = Math.floor((delta / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((delta / (1000 * 60)) % 60)
  const seconds = Math.floor((delta / 1000) % 60)
  return { days, hours, minutes, seconds }
}

function playConfettiBurstSound() {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return

  const ctx = new AudioContextClass()
  const master = ctx.createGain()
  master.gain.value = 0.07
  master.connect(ctx.destination)

  const now = ctx.currentTime
  const freqs = [880, 1174, 1320, 1568]

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = i % 2 === 0 ? "triangle" : "sine"
    osc.frequency.setValueAtTime(freq, now + i * 0.03)
    gain.gain.setValueAtTime(0.0001, now + i * 0.03)
    gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26 + i * 0.03)
    osc.connect(gain)
    gain.connect(master)
    osc.start(now + i * 0.03)
    osc.stop(now + 0.29 + i * 0.03)
  })

  window.setTimeout(() => {
    void ctx.close()
  }, 700)
}

// ─── Main Component ────────────────────────────────────────────
export default function RSVPPage() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [attending, setAttending] = useState<"yes" | "no" | null>(null)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [rsvpOpen, setRsvpOpen] = useState(() => isRsvpOpen())

  useEffect(() => {
    const tick = () => setRsvpOpen(isRsvpOpen())
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    setCountdown(getCountdownParts(PARTY_CONFIG.startsAtISO))
    const timer = window.setInterval(() => {
      setCountdown(getCountdownParts(PARTY_CONFIG.startsAtISO))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedAttending = watch("attending")
  const watchedName = watch("name")
  const watchedEmail = watch("email")

  const onSubmit = async (data: FormData) => {
    if (!isRsvpOpen()) {
      setSubmitState("error")
      setErrorMsg(`RSVP is closed — we stopped taking responses after ${PARTY_CONFIG.rsvpDeadline}.`)
      return
    }

    setSubmitState("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          attending: data.attending === "yes",
          extraGuest1: undefined,
          extraGuest2: undefined,
          extraGuest3: undefined,
          website: data.website || undefined,
        }),
      })

      const json = await res.json() as { error?: string; code?: string }
      if (!res.ok) {
        setErrorMsg(json.error || "Something went wrong. Please try again.")
        if (json.code === "RSVP_CLOSED") {
          setRsvpOpen(false)
        }
        setSubmitState("error")
        return
      }
      setSubmitState("success")
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.")
      setSubmitState("error")
    }
  }

  if (submitState === "success") {
    return (
      <SuccessScreen
        attending={watchedAttending === "yes"}
        name={watchedName ?? ""}
        hasExtraGuests={false}
      />
    )
  }

  return (
    <main className="rsvp-root rsvp-theme">
      <div className="top-shimmer" />

      <div className="rsvp-container">
        <div className="hero-card">
          <div className="card-monogram" aria-hidden="true">
            <Image
              src="/photo.png"
              alt=""
              className="card-monogram-photo"
              width={220}
              height={220}
              sizes="102px"
              quality={100}
              priority
            />
          </div>
          <p className="hero-script">Celebrating</p>
          <h1 className="hero-title">21</h1>
          <p className="hero-celebrating-line">{PARTY_CONFIG.hostName}&apos;s Birthday</p>
          <p className="hero-host">
            <span className="hero-host-label">Hosted by</span>
            <span className="hero-host-name">{PARTY_CONFIG.hostName}</span>
          </p>

          <div className="event-details">
            <div className="detail-item detail-date">
              <CalendarIcon />
              <span>{PARTY_CONFIG.date}</span>
            </div>
            <div className="detail-item detail-time">
              <ClockIcon />
              <span>{PARTY_CONFIG.time}</span>
            </div>
            <div className="detail-item detail-location">
              <MapPinIcon />
              <span>{PARTY_CONFIG.location}</span>
            </div>
            <a className="map-link-btn" href="https://maps.google.com" target="_blank" rel="noreferrer">
              Open Map
            </a>
            <div className="detail-vibe">
              <span>{PARTY_CONFIG.theme}</span>
            </div>
          </div>

          <div className={`deadline-wrap ${!rsvpOpen ? "deadline-wrap--closed" : ""}`}>
            <span className="deadline-ring" />
            <div className={`deadline-badge ${!rsvpOpen ? "deadline-badge--closed" : ""}`}>
              {rsvpOpen ? "RSVP by Friday, 24th April" : "RSVP closed"}
            </div>
          </div>
        </div>

        <section className="countdown-card" aria-live="polite">
          <p className="countdown-label">The Celebration Begins In</p>
          <div className="countdown-grid">
            <CountdownBlock value={countdown.days} label="Days" />
            <span className="countdown-sep">:</span>
            <CountdownBlock value={countdown.hours} label="Hours" />
            <span className="countdown-sep">:</span>
            <CountdownBlock value={countdown.minutes} label="Minutes" />
            <span className="countdown-sep">:</span>
            <CountdownBlock value={countdown.seconds} label="Seconds" />
          </div>
        </section>

        <section className="highlights-card">
          <p className="highlights-script">Evening Highlights</p>
          <div className="highlights-divider" aria-hidden="true">
            <div className="highlights-divider-line" />
            <span className="highlights-divider-diamond">◆</span>
            <div className="highlights-divider-line" />
          </div>
          <div className="highlights-list">
            {[
              { icon: "🎵", label: "Jams" },
              { icon: "🎲", label: "Games and vibes" },
              { icon: "🍽️", label: "Food and drinks" },
            ].map((item) => (
              <div key={item.label} className="highlight-item">
                <span className="highlight-item-icon" aria-hidden="true">{item.icon}</span>
                <span className="highlight-item-label">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="form-card">
          {rsvpOpen ? (
            <>
          <h2 className="form-title">Will you be there?</h2>
          <p className="form-subtitle">Let us know so we can plan accordingly.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="rsvp-form" id="rsvp-form" noValidate>
            {/* Name */}
            <div className={`field-group floating-field ${watchedName ? "has-value" : ""}`}>
              <input
                id="rsvp-name"
                type="text"
                placeholder=" "
                className={`field-input ${errors.name ? "field-error" : ""}`}
                {...register("name")}
              />
              <label htmlFor="rsvp-name" className="field-label">Your Name</label>
              {errors.name && <span className="error-msg">{errors.name.message}</span>}
            </div>

            {/* Email */}
            <div className={`field-group floating-field ${watchedEmail ? "has-value" : ""}`}>
              <input
                id="rsvp-email"
                type="email"
                placeholder=" "
                className={`field-input ${errors.email ? "field-error" : ""}`}
                {...register("email")}
              />
              <label htmlFor="rsvp-email" className="field-label">Email Address</label>
              {errors.email && <span className="error-msg">{errors.email.message}</span>}
            </div>

            {/* Attending */}
            <div className="field-group">
              <label className="field-label">Are you coming?</label>
              <div className="attend-buttons" role="group" aria-label="Will you attend?">
                <button
                  type="button"
                  id="rsvp-attending-yes"
                  className={`attend-btn attend-yes ${attending === "yes" ? "active" : ""}`}
                  onClick={() => {
                    setAttending("yes")
                    setValue("attending", "yes", { shouldValidate: true })
                  }}
                >
                  Absolutely Yes
                </button>
                <button
                  type="button"
                  id="rsvp-attending-no"
                  className={`attend-btn attend-no ${attending === "no" ? "active" : ""}`}
                  onClick={() => {
                    setAttending("no")
                    setValue("attending", "no", { shouldValidate: true })
                  }}
                >
                  Can&apos;t Make It
                </button>
              </div>
              <input type="hidden" {...register("attending")} />
              {errors.attending && <span className="error-msg">{errors.attending.message}</span>}
            </div>

            {/* Error banner */}
            {submitState === "error" && (
              <div className="error-banner" role="alert">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Submit */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ display: "none" }}
              {...register("website")}
            />
            <button
              type="submit"
              id="rsvp-submit-btn"
              className="submit-btn"
              disabled={submitState === "loading"}
            >
              {submitState === "loading" ? (
                <>
                  <span className="spinner" aria-label="Sending..." />
                  Sending...
                </>
              ) : (
                "Send My RSVP"
              )}
            </button>
          </form>
            </>
          ) : (
            <div className="rsvp-closed-panel">
              <h2 className="rsvp-closed-title">RSVP has closed</h2>
              <p className="rsvp-closed-body">
                Thanks to everyone who responded — we stopped taking new RSVPs after{" "}
                <strong>{PARTY_CONFIG.rsvpDeadline}</strong>. If you already sent yours, you&apos;re all set.
                The party countdown is still on; we can&apos;t wait to celebrate with you.
              </p>
            </div>
          )}
        </div>

        <section className="save-date-card">
          <p className="save-date-script">Save the Date</p>
          <p className="save-date-body">
            Add this celebration to your calendar so you don&apos;t miss a single highlight.
          </p>
          <a href={createGoogleCalendarLink()} target="_blank" rel="noreferrer" className="calendar-link-btn">
            Add to Calendar
          </a>
        </section>
      </div>
    </main>
  )
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  const valueRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = valueRef.current
    if (!el) return
    el.style.animation = "none"
    void el.offsetHeight
    el.style.removeProperty("animation")
  }, [value])
  return (
    <div className="countdown-block">
      <span ref={valueRef} className="countdown-value">
        {String(value).padStart(2, "0")}
      </span>
      <span className="countdown-key">{label}</span>
    </div>
  )
}

// ─── Success Screen ─────────────────────────────────────────────
function SuccessScreen({
  attending,
  name,
  hasExtraGuests,
}: {
  attending: boolean
  name: string
  hasExtraGuests: boolean
}) {
  useEffect(() => {
    playConfettiBurstSound()
    void confetti({
      particleCount: 120,
      spread: 60,
      origin: { x: 0.1, y: 1 },
      colors: ["#C9A15D", "#D9B878", "#E8D9B5", "#F7F1E3", "#113A3E"],
    })
    void confetti({
      particleCount: 120,
      spread: 60,
      origin: { x: 0.9, y: 1 },
      colors: ["#C9A15D", "#D9B878", "#E8D9B5", "#F7F1E3", "#113A3E"],
    })
  }, [])

  const firstName = name.trim().split(" ")[0] || "friend"

  return (
    <main className="rsvp-root rsvp-theme">
      <div className="top-shimmer" />
      <div className="success-card">
        <div className="success-emoji">🎉</div>
        <h1 className="success-title">{attending ? "You're on the list!" : "You'll be missed 💜"}</h1>
        <p className="success-body">
          {attending
            ? "Mary-Ann can't wait to see you. Get ready to party 🔥"
            : "Mary-Ann hopes to see you next time. Thanks for sending your RSVP with love."}
        </p>
        {attending && hasExtraGuests && (
          <p className="success-guest-followup">Mary-Ann will be in touch to confirm your guest(s) 🤍</p>
        )}
        <div className="success-vibe">We&apos;ve got you down, {firstName}.</div>
        <div className="success-actions">
          <a href={createGoogleCalendarLink()} target="_blank" rel="noreferrer" className="calendar-link">
            Add to Calendar
          </a>
        </div>
      </div>
    </main>
  )
}
