import { google } from "googleapis"

export interface RSVPSheetRow {
  guestName: string
  email: string
  attending: boolean
  extraGuest1?: string
  extraGuest2?: string
  submittedAt: string
}

export async function appendRSVPToSheet(data: RSVPSheetRow) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  const sheets = google.sheets({ version: "v4", auth })

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          data.guestName,
          data.email,
          data.attending ? "Yes ✅" : "No ❌",
          data.extraGuest1 ?? "",
          data.extraGuest2 ?? "",
          data.submittedAt,
        ],
      ],
    },
  })
}

/**
 * Sets up the header row in Google Sheets.
 * Call this once manually, or it runs automatically if the Sheet is empty.
 */
export async function ensureSheetHeaders() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  const sheets = google.sheets({ version: "v4", auth })

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A1",
  })

  // Only write headers if row 1 is empty
  if (!existing.data.values || existing.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A1:F1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["Guest Name", "Email", "Attending", "Extra Guest 1", "Extra Guest 2", "Submitted At"],
        ],
      },
    })
  }
}
