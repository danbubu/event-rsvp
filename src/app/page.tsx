"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import confetti from "canvas-confetti"
import { PARTY_CONFIG } from "@/lib/config"
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
const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
  </svg>
)
const UserPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [guestCount, setGuestCount] = useState(0)
  const [attending, setAttending] = useState<"yes" | "no" | null>(null)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const saved = localStorage.getItem("rsvp-theme") as "dark" | "light" | null
    const initial = saved ?? "dark"
    setTheme(initial)
    document.documentElement.setAttribute("data-theme", initial)
  }, [])

  useEffect(() => {
    setCountdown(getCountdownParts(PARTY_CONFIG.startsAtISO))
    const timer = window.setInterval(() => {
      setCountdown(getCountdownParts(PARTY_CONFIG.startsAtISO))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    const particles: Array<{
      x: number
      y: number
      size: number
      speedY: number
      driftSeed: number
      rotation: number
      rotationSpeed: number
      color: string
      type: "dot" | "rect" | "sparkle"
    }> = []

    const palette = ["#7C3AED", "#DB2777", "#F59E0B", "#FFFFFF"]
    const rand = (min: number, max: number) => Math.random() * (max - min) + min

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const seedParticles = () => {
      particles.length = 0
      const count = Math.min(90, Math.floor(window.innerWidth / 14))
      for (let i = 0; i < count; i++) {
        const roll = Math.random()
        particles.push({
          x: rand(0, window.innerWidth),
          y: rand(0, window.innerHeight),
          size: roll > 0.86 ? rand(3.6, 5.4) : rand(1.6, 3.3),
          speedY: rand(0.22, 0.52),
          driftSeed: rand(0.6, 1.4),
          rotation: rand(0, Math.PI * 2),
          rotationSpeed: rand(-0.02, 0.02),
          color: palette[Math.floor(Math.random() * palette.length)] ?? "#7C3AED",
          type: roll > 0.83 ? "sparkle" : roll > 0.5 ? "rect" : "dot",
        })
      }
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const wind = Math.sin(t * 0.00055) * 0.36

      for (const p of particles) {
        p.y += p.speedY
        p.x += wind + Math.sin((p.y + t * 0.02) * 0.01) * 0.18 * p.driftSeed
        p.rotation += p.rotationSpeed

        if (p.y > window.innerHeight + 20) {
          p.y = -20
          p.x = rand(0, window.innerWidth)
        }
        if (p.x < -20) p.x = window.innerWidth + 20
        if (p.x > window.innerWidth + 20) p.x = -20

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.type === "sparkle" ? 0.8 : 0.62

        if (p.type === "dot") {
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.type === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        } else {
          ctx.beginPath()
          ctx.moveTo(0, -p.size)
          ctx.lineTo(p.size * 0.36, 0)
          ctx.lineTo(0, p.size)
          ctx.lineTo(-p.size * 0.36, 0)
          ctx.closePath()
          ctx.fill()
        }
        ctx.restore()
      }

      raf = window.requestAnimationFrame(draw)
    }

    resize()
    seedParticles()
    raf = window.requestAnimationFrame(draw)
    window.addEventListener("resize", resize)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    localStorage.setItem("rsvp-theme", next)
  }

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
  const watchedExtraGuest1 = watch("extraGuest1")
  const watchedExtraGuest2 = watch("extraGuest2")
  const watchedExtraGuest3 = watch("extraGuest3")

  useEffect(() => {
    if (guestCount === 0) {
      setValue("extraGuest1", "")
      setValue("extraGuest2", "")
      setValue("extraGuest3", "")
      return
    }

    if (guestCount === 1) {
      setValue("extraGuest2", "")
      setValue("extraGuest3", "")
      return
    }

    if (guestCount === 2) {
      setValue("extraGuest3", "")
    }
  }, [guestCount, setValue])

  const onSubmit = async (data: FormData) => {
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
          extraGuest1: data.extraGuest1 || undefined,
          extraGuest2: data.extraGuest2 || undefined,
          extraGuest3: data.extraGuest3 || undefined,
          website: data.website || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error || "Something went wrong. Please try again.")
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
    return <SuccessScreen attending={watchedAttending === "yes"} name={watchedName ?? ""} />
  }

  return (
    <main className="rsvp-root rsvp-theme">
      <div className="top-shimmer" />
      <div className="aurora" aria-hidden="true" />
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
      {/* Theme Toggle */}
      <button
        id="theme-toggle-btn"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className={`toggle-icon ${theme === "dark" ? "sun" : "moon"}`}>{theme === "dark" ? "☀️" : "🌙"}</span>
      </button>

      <div className="rsvp-container">
        {/* Hero Card */}
        <div className="hero-card">
          <div className="card-celebration-emoji" aria-hidden="true">
            🎉
          </div>
          <h1 className="hero-title">{PARTY_CONFIG.name}</h1>
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
            <div className="detail-vibe">
              <SparkleIcon />
              <span>{PARTY_CONFIG.theme}</span>
            </div>
          </div>

          <div className="deadline-wrap">
            <span className="deadline-ring" />
            <div className="deadline-badge">RSVP by {PARTY_CONFIG.rsvpDeadline}</div>
          </div>
        </div>

        <section className="countdown-card" aria-live="polite">
          <p className="countdown-label">Party starts in</p>
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

        {/* RSVP Form Card */}
        <div className="form-card">
          <h2 className="form-title">Will you be there?</h2>
          <p className="form-subtitle">Let us know so we can plan accordingly 🥂</p>

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
              <div className="attend-buttons">
                <button
                  type="button"
                  id="rsvp-attending-yes"
                  className={`attend-btn attend-yes ${attending === "yes" ? "active" : ""}`}
                  onClick={() => {
                    setAttending("yes")
                    setValue("attending", "yes", { shouldValidate: true })
                  }}
                >
                  <span>🥳</span> Absolutely Yes!
                </button>
                <button
                  type="button"
                  id="rsvp-attending-no"
                  className={`attend-btn attend-no ${attending === "no" ? "active" : ""}`}
                  onClick={() => {
                    setAttending("no")
                    setValue("attending", "no", { shouldValidate: true })
                    setGuestCount(0)
                  }}
                >
                  <span>😔</span> Can&apos;t Make It
                </button>
              </div>
              <input type="hidden" {...register("attending")} />
              {errors.attending && <span className="error-msg">{errors.attending.message}</span>}
            </div>

            {/* Extra guests — only shown if attending */}
            {attending === "yes" && (
              <div className="guest-section">
                <div className="guest-section-header">
                  <UserPlusIcon />
                  <span>Bringing anyone?</span>
                </div>
                <p className="guest-section-sub">You can bring up to {PARTY_CONFIG.maxExtraGuests} extra guests. Name them below!</p>

                <div className="guest-count-row segmented">
                  <div className="segment-track">
                    <span className="segment-indicator" style={{ transform: `translateX(${guestCount * 100}%)` }} />
                    {[0, 1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        id={`rsvp-guest-count-${n}`}
                        className={`guest-count-btn ${guestCount === n ? "active" : ""}`}
                        onClick={() => setGuestCount(n)}
                      >
                        {n === 0 ? "Just me" : `+${n}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`guest-fields-wrap ${guestCount >= 1 ? "open" : ""}`}>
                  <div className={`field-group floating-field ${watchedExtraGuest1 ? "has-value" : ""}`}>
                    <input
                      id="rsvp-extra-guest-1"
                      type="text"
                      placeholder=" "
                      className="field-input"
                      {...register("extraGuest1")}
                    />
                    <label htmlFor="rsvp-extra-guest-1" className="field-label">Extra Guest 1 — Full Name</label>
                  </div>
                </div>
                <div className={`guest-fields-wrap ${guestCount >= 2 ? "open" : ""}`}>
                  <div className={`field-group floating-field ${watchedExtraGuest2 ? "has-value" : ""}`}>
                    <input
                      id="rsvp-extra-guest-2"
                      type="text"
                      placeholder=" "
                      className="field-input"
                      {...register("extraGuest2")}
                    />
                    <label htmlFor="rsvp-extra-guest-2" className="field-label">Extra Guest 2 — Full Name</label>
                  </div>
                </div>
                <div className={`guest-fields-wrap ${guestCount >= 3 ? "open" : ""}`}>
                  <div className={`field-group floating-field ${watchedExtraGuest3 ? "has-value" : ""}`}>
                    <input
                      id="rsvp-extra-guest-3"
                      type="text"
                      placeholder=" "
                      className="field-input"
                      {...register("extraGuest3")}
                    />
                    <label htmlFor="rsvp-extra-guest-3" className="field-label">Extra Guest 3 — Full Name</label>
                  </div>
                </div>
              </div>
            )}

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
                "Send My RSVP 🪅"
              )}
            </button>
          </form>
        </div>
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
function SuccessScreen({ attending, name }: { attending: boolean; name: string }) {
  useEffect(() => {
    playConfettiBurstSound()
    void confetti({
      particleCount: 120,
      spread: 60,
      origin: { x: 0.1, y: 1 },
      colors: ["#7C3AED", "#DB2777", "#F59E0B", "#FFFFFF"],
    })
    void confetti({
      particleCount: 120,
      spread: 60,
      origin: { x: 0.9, y: 1 },
      colors: ["#7C3AED", "#DB2777", "#F59E0B", "#FFFFFF"],
    })
  }, [])

  const firstName = name.trim().split(" ")[0] || "friend"

  return (
    <main className="rsvp-root rsvp-theme">
      <div className="top-shimmer" />
      <div className="aurora" aria-hidden="true" />
      <div className="success-card">
        <div className="success-emoji">🎉</div>
        <h1 className="success-title">{attending ? "You're on the list!" : "You'll be missed 💜"}</h1>
        <p className="success-body">
          {attending
            ? "Mary-Ann can't wait to see you. Get ready to party 🔥"
            : "Mary-Ann hopes to see you next time. Thanks for sending your RSVP with love."}
        </p>
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
