import nodemailer from "nodemailer"
import { PARTY_CONFIG } from "./config"

interface ConfirmationEmailData {
  name: string
  email: string
  attending: boolean
  extraGuest1?: string
  extraGuest2?: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Email not configured — skipping confirmation email")
    return
  }

  const transporter = createTransport()

  const guestList = [data.extraGuest1, data.extraGuest2]
    .filter(Boolean)
    .map((g) => `• ${escapeHtml(g ?? "")}`)
    .join("\n")

  const safeName = escapeHtml(data.name)

  const attendingText = data.attending
    ? `We can't wait to celebrate with you! Here are the details:\n\n📅  ${PARTY_CONFIG.date}\n⏰  ${PARTY_CONFIG.time}\n📍  ${PARTY_CONFIG.location}\n✨  Dress Code: ${PARTY_CONFIG.theme}${guestList ? `\n\n🎊  You're bringing:\n${guestList}` : ""}\n\nSee you there! 🥂`
    : `That's okay — we'll miss you! If your plans change before ${PARTY_CONFIG.rsvpDeadline}, feel free to re-submit your RSVP.`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #111; border-radius: 16px; overflow: hidden; border: 1px solid #222; }
    .header { background: linear-gradient(135deg, #6d28d9, #db2777); padding: 40px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 15px; }
    .body { padding: 32px; color: #d1d5db; font-size: 15px; line-height: 1.7; }
    .body h2 { color: #f9fafb; font-size: 20px; margin: 0 0 16px; }
    .details { background: #1a1a1a; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #2a2a2a; }
    .detail-row { display: flex; gap: 12px; margin: 8px 0; }
    .emoji { width: 24px; flex-shrink: 0; }
    .footer { background: #0d0d0d; padding: 24px 32px; text-align: center; border-top: 1px solid #1f1f1f; }
    .footer p { color: #6b7280; font-size: 13px; margin: 0; }
    .badge { display: inline-block; background: linear-gradient(135deg, #6d28d9, #db2777); color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎉 ${PARTY_CONFIG.name}</h1>
      <p>Hosted by ${PARTY_CONFIG.hostName}</p>
    </div>
    <div class="body">
      <div class="badge">${data.attending ? "RSVP Confirmed ✅" : "RSVP Received"}</div>
      <h2>Hey ${safeName}! 👋</h2>
      <p>${attendingText.replace(/\n/g, "<br/>")}</p>
    </div>
    <div class="footer">
      <p>RSVP deadline: <strong style="color:#f9fafb">${PARTY_CONFIG.rsvpDeadline}</strong></p>
      <p style="margin-top:8px;">Questions? Just reply to this email.</p>
    </div>
  </div>
</body>
</html>`

  await transporter.sendMail({
    from: `"${PARTY_CONFIG.hostName}'s Party 🎉" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: data.attending
      ? `You're on the list for ${PARTY_CONFIG.name}! 🎉`
      : `RSVP received — ${PARTY_CONFIG.name}`,
    html,
  })
}
