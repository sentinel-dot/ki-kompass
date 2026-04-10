/**
 * Zod-Validierungsschemas für alle API-Routes
 *
 * Single Source of Truth für erlaubte Werte im gesamten Fragebogen.
 * Wird serverseitig in den API-Routes verwendet und kann auch
 * clientseitig importiert werden.
 */
import { z } from 'zod'

// ─── Erlaubte Werte (identisch mit Frontend-Optionen) ───────────────────────

export const BRANCHEN_VALUES = [
  'logistik', 'gesundheit', 'finanzen', 'handel', 'it', 'fertigung',
  'beratung', 'bildung', 'oeffentlich', 'gastronomie', 'bau', 'sonstige',
] as const

export const MITARBEITER_VALUES = [
  '1-10', '11-50', '51-250', '251-500', '500+',
] as const

export const LAENDER_VALUES = [
  'deutschland', 'oesterreich', 'schweiz', 'eu_andere', 'nicht_eu',
] as const

export const KI_STATUS_VALUES = [
  'freigegeben', 'teilweise', 'shadow', 'nicht_genutzt', 'weiss_nicht',
] as const

export const EXTERNE_TOOLS_VALUES = [
  'chatgpt', 'copilot', 'gemini', 'claude', 'github_copilot',
  'bildgenerierung', 'branchenspezifisch', 'keine', 'sonstige',
] as const

export const USE_CASES_VALUES = [
  'texte', 'code', 'datenanalyse', 'kundenservice', 'uebersetzung',
  'bilder', 'personal', 'entscheidung', 'sonstige',
] as const

export const INTERNE_KI_VALUES = [
  'ja', 'nein', 'geplant',
] as const

export const DATENARTEN_VALUES = [
  'kundendaten', 'gesundheitsdaten', 'finanzdaten',
  'personaldaten', 'geschaeftsgeheimnisse', 'oeffentlich',
] as const

export const DSB_VALUES = [
  'intern', 'extern', 'nein',
] as const

export const CLOUD_EU_VALUES = [
  'ja', 'nein', 'teilweise', 'weiss_nicht',
] as const

export const STRIKTHEIT_VALUES = [
  'innovationsfreundlich', 'ausgewogen', 'restriktiv',
] as const

export const VERANTWORTUNG_VALUES = [
  'geschaeftsfuehrung', 'it', 'dsb', 'komitee', 'unklar',
] as const

export const TIER_VALUES = [
  'basis', 'professional', 'enterprise',
] as const

// ─── Questionnaire-Schema ───────────────────────────────────────────────────

/**
 * Vollständiges Fragebogen-Schema.
 * Validiert alle Felder aus Block 1–4 + Final.
 */
export const questionnaireSchema = z.object({
  // Block 1: Unternehmensprofil
  firmenname: z
    .string()
    .trim()
    .min(1, 'Firmenname ist erforderlich.')
    .max(200, 'Firmenname darf maximal 200 Zeichen lang sein.'),
  branche: z.enum(BRANCHEN_VALUES, {
    errorMap: () => ({ message: 'Ungültige Branche.' }),
  }),
  branche_sonstige: z
    .string()
    .max(200, 'Branche (Freitext) darf maximal 200 Zeichen lang sein.')
    .optional()
    .default(''),
  mitarbeiter: z.enum(MITARBEITER_VALUES, {
    errorMap: () => ({ message: 'Ungültige Mitarbeiteranzahl.' }),
  }),
  laender: z
    .array(z.enum(LAENDER_VALUES, {
      errorMap: () => ({ message: 'Ungültiger Länderwert.' }),
    }))
    .min(1, 'Mindestens ein Tätigkeitsland ist erforderlich.'),

  // Block 2: KI-Nutzung
  ki_status: z.enum(KI_STATUS_VALUES, {
    errorMap: () => ({ message: 'Ungültiger KI-Status.' }),
  }),
  externe_tools: z
    .array(z.enum(EXTERNE_TOOLS_VALUES, {
      errorMap: () => ({ message: 'Ungültiger Tool-Wert.' }),
    }))
    .min(1, 'Mindestens ein externes Tool (oder "Keine") muss ausgewählt werden.'),
  externe_tools_sonstige: z
    .string()
    .max(500, 'Externe Tools (Freitext) darf maximal 500 Zeichen lang sein.')
    .optional()
    .default(''),
  use_cases: z
    .array(z.enum(USE_CASES_VALUES, {
      errorMap: () => ({ message: 'Ungültiger Use-Case-Wert.' }),
    }))
    .min(1, 'Mindestens ein Einsatzzweck ist erforderlich.'),
  use_cases_sonstige: z
    .string()
    .max(500, 'Use Cases (Freitext) darf maximal 500 Zeichen lang sein.')
    .optional()
    .default(''),
  interne_ki: z.enum(INTERNE_KI_VALUES, {
    errorMap: () => ({ message: 'Ungültige Auswahl für interne KI.' }),
  }),
  interne_ki_beschreibung: z
    .string()
    .max(1000, 'Beschreibung der internen KI darf maximal 1000 Zeichen lang sein.')
    .optional()
    .default(''),

  // Block 3: Datenschutz
  datenarten: z
    .array(z.enum(DATENARTEN_VALUES, {
      errorMap: () => ({ message: 'Ungültige Datenart.' }),
    }))
    .min(1, 'Mindestens eine Datenart ist erforderlich.'),
  dsb: z.enum(DSB_VALUES, {
    errorMap: () => ({ message: 'Ungültige DSB-Auswahl.' }),
  }),
  cloud_ausserhalb_eu: z.enum(CLOUD_EU_VALUES, {
    errorMap: () => ({ message: 'Ungültige Cloud-Auswahl.' }),
  }),

  // Block 4: Umfang
  striktheit: z.enum(STRIKTHEIT_VALUES, {
    errorMap: () => ({ message: 'Ungültige Striktheit-Auswahl.' }),
  }),
  verantwortung: z.enum(VERANTWORTUNG_VALUES, {
    errorMap: () => ({ message: 'Ungültige Verantwortungs-Auswahl.' }),
  }),

  // Meta
  email: z
    .string()
    .trim()
    .min(1, 'E-Mail-Adresse ist erforderlich.')
    .email('Ungültige E-Mail-Adresse.')
    .max(320, 'E-Mail-Adresse darf maximal 320 Zeichen lang sein.'),
  tier: z.enum(TIER_VALUES, {
    errorMap: () => ({ message: 'Ungültiges Paket.' }),
  }),
})

export type ValidatedQuestionnaire = z.infer<typeof questionnaireSchema>

// ─── Checkout-Schema (= Questionnaire, alle Felder) ────────────────────────

/**
 * Schema für den /api/create-checkout Endpoint.
 * Identisch mit dem Fragebogen — der gesamte Datensatz wird beim
 * Checkout übermittelt.
 */
export const checkoutRequestSchema = questionnaireSchema

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>

// ─── Generate-Policy-Schema (interner Test-Endpoint) ────────────────────────

/**
 * Schema für den /api/generate-policy Endpoint (nur internes Testing).
 * Erwartet ein `questionnaire`-Objekt.
 */
export const generatePolicyRequestSchema = z.object({
  questionnaire: questionnaireSchema,
})

export type GeneratePolicyRequest = z.infer<typeof generatePolicyRequestSchema>

// ─── Process-Orders Query-Params ────────────────────────────────────────────

/**
 * Schema für die Query-Parameter von /api/process-orders.
 * `order_id` muss, falls vorhanden, ein gültiges UUID-Format haben.
 */
export const processOrdersQuerySchema = z.object({
  order_id: z
    .string()
    .uuid('order_id muss eine gültige UUID sein.')
    .optional(),
})

export type ProcessOrdersQuery = z.infer<typeof processOrdersQuerySchema>

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

/**
 * Formatiert Zod-Fehler zu einer lesbaren, zusammengefassten Fehlermeldung.
 */
export function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map(issue => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
      return `${path}${issue.message}`
    })
    .join(' | ')
}

/**
 * Formatiert Zod-Fehler als strukturiertes Objekt für JSON-Responses.
 */
export function formatZodErrorsDetailed(error: z.ZodError): {
  message: string
  fieldErrors: Record<string, string[]>
} {
  const fieldErrors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root'
    if (!fieldErrors[key]) fieldErrors[key] = []
    fieldErrors[key].push(issue.message)
  }

  return {
    message: 'Validierungsfehler: Die übermittelten Daten sind ungültig.',
    fieldErrors,
  }
}
