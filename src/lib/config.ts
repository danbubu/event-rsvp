// ============================================================
// Party Configuration — Edit these to customize the event
// ============================================================

export const PARTY_CONFIG = {
  name: "Birthday Celebration Party",
  hostName: "Mary-Ann",
  date: "Friday, 25th April 2026",
  time: "9:00 PM",
  startsAtISO: "2026-04-25T21:00:00+00:00",
  endsAtISO: "2026-04-26T03:00:00+00:00",
  location: "Somewhere in Kumasi",
  theme: "No Dirty Vibes ✨",
  rsvpDeadline: "April 23rd, 2026",
  maxExtraGuests: 3, // guests can bring up to 3 extras
  confirmationEmail: {
    subject: "You're on the list! 🎉",
    greeting: "Hey [name], you're officially on the list!",
    body: `We can't wait to celebrate with you. Here are the details:

📅  ${`Friday, 25th April 2026`}
⏰  ${"9:00 PM"}
📍  ${"Somewhere in Kumasi"}
✨  Dress Code: No Dirty Vibes

If you brought friends along, make sure they're ready to match the energy!
See you there. 🥂`,
  },
} as const

export type PartyConfig = typeof PARTY_CONFIG
