// ============================================================
// Party Configuration — Edit these to customize the event
// ============================================================

export const PARTY_CONFIG = {
  name: "✨ Mary-Ann's 21st ✨",
  hostName: "Mary-Ann",
  date: "Friday, 24th April 2026",
  time: "9:00 PM",
  startsAtISO: "2026-04-24T21:00:00+00:00",
  endsAtISO: "2026-04-25T03:00:00+00:00",
  location: "Somewhere in Kumasi",
  /** Vibe line (flanked by 🥂 in the UI) */
  theme: "No Dirty Vibes",
  /** Shown in the deadline pill after “RSVP by ” */
  rsvpDeadline: "Wednesday, April 22nd",
  /**
   * Submissions close at this instant (Ghana is UTC+0 year-round — use the same offset).
   * “RSVP by Wednesday 22 Apr” → close at the start of Thursday 23 Apr (first moment after Wed ends).
   */
  rsvpClosesAtISO: "2026-04-23T00:00:00+00:00",
  maxExtraGuests: 3, // guests can bring up to 3 extras
  confirmationEmail: {
    subject: "You're on the list! 🎉",
    greeting: "Hey [name], you're officially on the list!",
    body: `We can't wait to celebrate with you. Here are the details:

📅  ${`Friday, 24th April 2026`}
⏰  ${"9:00 PM"}
📍  ${"Somewhere in Kumasi"}
✨  Dress code: white & gold · No Dirty Vibes

If you brought friends along, make sure they're ready to match the energy!
See you there. 🥂`,
  },
} as const

export type PartyConfig = typeof PARTY_CONFIG

/** True while new RSVP submissions are accepted (checked on server and client). */
export function isRsvpOpen(now: Date = new Date()): boolean {
  return now.getTime() < new Date(PARTY_CONFIG.rsvpClosesAtISO).getTime()
}
