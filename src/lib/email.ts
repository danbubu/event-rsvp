import nodemailer from "nodemailer"
import { Resend } from "resend"
import { PARTY_CONFIG } from "./config"

/** Public shape for RSVP confirmation / decline emails */
export interface RSVPEmailData {
  guestName: string
  email: string
  attending: boolean
  /** 0 = just me, 1–3 = number of extra guest slots with names */
  guestCount: number
  extraGuests: string[]
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mary-ann-turns-up.vercel.app"

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function guestFirstName(guestName: string): string {
  return guestName.trim().split(/\s+/)[0] || "friend"
}

function buildAttendingEmailHtml(data: RSVPEmailData): string {
  const firstName = escapeHtml(guestFirstName(data.guestName))
  const guestRows = data.extraGuests
    .filter(Boolean)
    .map(
      (name) =>
        `<p style="margin:6px 0 0;font-size:14px;color:#A78BFA;font-weight:500;">· ${escapeHtml(name)}</p>`
    )
    .join("")

  const guestBlock =
    data.guestCount > 0
      ? `
          <tr>
            <td style="padding:0 32px 24px;">
              <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:16px 18px;">
                <p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(167,139,250,0.7);">Your Guest(s)</p>
                <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.6);font-style:italic;">Remember — all extra guests need Mary-Ann's pre-approval 🔒</p>
                ${guestRows}
              </div>
            </td>
          </tr>`
      : ""

  const dateLine = escapeHtml(PARTY_CONFIG.date)
  const timeLine = `${escapeHtml(PARTY_CONFIG.time)} — dress up, show up, glow up`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're on the list 🎉</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D1A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#13132A;border-radius:20px;overflow:hidden;border:1px solid rgba(124,58,237,0.25);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#7C3AED,#DB2777,#F59E0B);"></td>
          </tr>
          <tr>
            <td align="center" style="padding:40px 32px 24px;">
              <div style="font-size:48px;margin-bottom:16px;">🎉</div>
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;background:linear-gradient(90deg,#A78BFA,#F472B6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.02em;">You're on the list!</h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
                Hey <strong style="color:#A78BFA;">${firstName}</strong> 🤍<br/>
                Mary-Ann got your RSVP and she literally can't wait to see you.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:rgba(255,255,255,0.08);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35);">Event Details</p>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:14px;">
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;font-size:16px;">✨</td>
                  <td><p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;">Mary-Ann's 21st</p></td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:14px;">
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;font-size:16px;">📅</td>
                  <td><p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">${dateLine}</p></td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:14px;">
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;font-size:16px;">🕘</td>
                  <td><p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">${timeLine}</p></td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:6px;">
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;font-size:16px;">📍</td>
                  <td>
                    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">Kumasi — exact location coming soon 🤍</p>
                    <p style="margin:4px 0 0;font-size:12px;font-style:italic;color:rgba(255,255,255,0.35);">We'll send you the full address once it's confirmed.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${guestBlock}
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:rgba(255,255,255,0.08);"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px;">
              <p style="margin:0;font-size:16px;font-weight:600;color:#F59E0B;font-style:italic;letter-spacing:0.02em;">🥂 No Dirty Vibes 🥂</p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">Come with good energy, dress your best,<br/>and let's make her night unforgettable.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 32px;">
              <a href="${SITE_URL}" style="display:inline-block;padding:14px 32px;background:linear-gradient(90deg,#7C3AED,#DB2777);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:50px;letter-spacing:0.04em;">View Invitation 🎊</a>
            </td>
          </tr>
          <tr>
            <td style="background:#0D0D1A;padding:20px 32px;border-radius:0 0 20px 20px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;line-height:1.7;">This email was sent because you RSVPed to Mary-Ann's 21st birthday celebration.<br/>If this wasn't you, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildNotAttendingEmailHtml(data: RSVPEmailData): string {
  const firstName = escapeHtml(guestFirstName(data.guestName))
  const deadlineNote = escapeHtml(PARTY_CONFIG.rsvpDeadline)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You'll be missed 💜</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D1A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#13132A;border-radius:20px;overflow:hidden;border:1px solid rgba(124,58,237,0.25);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#7C3AED,#DB2777,#F59E0B);"></td>
          </tr>
          <tr>
            <td align="center" style="padding:48px 32px 40px;">
              <div style="font-size:48px;margin-bottom:20px;">💜</div>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#ffffff;">You'll be missed, ${firstName}.</h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;max-width:360px;">Mary-Ann's gutted you can't make it, but she appreciates you letting her know. Wishing you love from afar on her big night 🥂</p>
              <div style="margin:32px 0;height:1px;background:rgba(255,255,255,0.08);"></div>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);font-style:italic;">Changed your mind? The RSVP is open until ${deadlineNote}.</p>
              <a href="${SITE_URL}" style="display:inline-block;margin-top:16px;padding:12px 28px;border:1.5px solid rgba(124,58,237,0.5);color:#A78BFA;font-size:14px;font-weight:600;text-decoration:none;border-radius:50px;">Go back to the invite</a>
            </td>
          </tr>
          <tr>
            <td style="background:#0D0D1A;padding:20px 32px;border-radius:0 0 20px 20px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;">This email was sent because you responded to Mary-Ann's 21st birthday RSVP.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildEmailContent(data: RSVPEmailData): { html: string; subject: string } {
  const rawFirst = guestFirstName(data.guestName)

  if (data.attending) {
    return {
      html: buildAttendingEmailHtml(data),
      subject: `You're on the list, ${rawFirst}! 🎉 Mary-Ann's 21st`,
    }
  }

  return {
    html: buildNotAttendingEmailHtml(data),
    subject: `You'll be missed 💜 — Mary-Ann's 21st`,
  }
}

function createSmtpTransport() {
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

/**
 * Resend/SMTP "from" display name. Set RESEND_FROM to a verified domain, e.g.
 * `Mary-Ann's 21st <noreply@yourdomain.com>` — Vercel subdomains cannot send mail until verified in Resend.
 */
function defaultResendFrom(): string {
  return `Mary-Ann's 21st <onboarding@resend.dev>`
}

export async function sendConfirmationEmail(data: RSVPEmailData) {
  const resendKey = process.env.RESEND_API_KEY?.trim()
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = process.env.SMTP_PASS?.trim()

  if (!resendKey && (!smtpUser || !smtpPass)) {
    console.warn(
      "Email not configured — set RESEND_API_KEY (Resend) or SMTP_USER + SMTP_PASS (SMTP); skipping confirmation email"
    )
    return
  }

  const { html, subject } = buildEmailContent(data)

  if (resendKey) {
    const resend = new Resend(resendKey)
    const from = process.env.RESEND_FROM?.trim() || defaultResendFrom()
    const { error } = await resend.emails.send({
      from,
      to: data.email,
      subject,
      html,
    })
    if (error) {
      throw new Error(error.message)
    }
    return
  }

  const transporter = createSmtpTransport()
  await transporter.sendMail({
    from: `"Mary-Ann's 21st 🎉" <${smtpUser}>`,
    to: data.email,
    subject,
    html,
  })
}
