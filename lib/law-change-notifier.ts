/**
 * Gesetzesänderungs-Alert System für Enterprise-Kunden
 *
 * Ermöglicht es, alle aktiven Enterprise-Kunden über relevante
 * Gesetzesänderungen (EU AI Act, DSGVO, etc.) zu benachrichtigen.
 *
 * Flow:
 * 1. Admin erstellt Alert (Titel, Beschreibung, Rechtsgrundlage, Schweregrad)
 * 2. System lädt alle aktiven Enterprise-Subscriptions
 * 3. Für jeden Kunden: Claude generiert personalisierte Relevanz-Einschätzung
 * 4. E-Mail mit Alert + personalisierter Einschätzung wird versendet
 * 5. Versand wird in DB protokolliert
 */

import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServiceClient } from './supabase'
import { getActiveSubscriptions, type Subscription } from './subscription'
import { sendLawChangeAlertEmail } from './email-updates'
import { LEGAL_CHANGE_ALERT_PROMPT } from './update-prompt'
import * as Sentry from '@sentry/nextjs'

// ─── Typen ──────────────────────────────────────────────────────────────────

export interface LawChangeAlert {
  id: string
  title: string
  description: string
  law_reference: string
  effective_date: string | null
  severity: 'info' | 'warning' | 'critical'
  status: 'draft' | 'sending' | 'sent'
  created_by: string
  total_recipients: number
  emails_sent: number
  created_at: string
  sent_at: string | null
}

export interface CreateAlertParams {
  title: string
  description: string
  lawReference: string
  effectiveDate?: string
  severity: 'info' | 'warning' | 'critical'
}

interface SendAlertResult {
  success: boolean
  alertId: string
  totalRecipients: number
  emailsSent: number
  errors: string[]
}

// ─── Alert erstellen ────────────────────────────────────────────────────────

/**
 * Erstellt einen neuen Gesetzesänderungs-Alert in der Datenbank.
 * Status initial: 'draft'.
 */
export async function createLawChangeAlert(params: CreateAlertParams): Promise<string> {
  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('law_change_alerts')
    .insert({
      title: params.title,
      description: params.description,
      law_reference: params.lawReference,
      effective_date: params.effectiveDate ?? null,
      severity: params.severity,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Alert konnte nicht erstellt werden: ${error?.message}`)
  }

  console.log(`[LawChangeAlert] Alert ${data.id} erstellt: "${params.title}"`)
  return data.id
}

// ─── Alert an alle Enterprise-Kunden senden ─────────────────────────────────

/**
 * Sendet einen bestehenden Alert an alle aktiven Enterprise-Kunden.
 * Für jeden Kunden wird eine personalisierte Relevanz-Einschätzung generiert.
 */
export async function sendLawChangeAlertToAll(alertId: string): Promise<SendAlertResult> {
  const supabase = createSupabaseServiceClient()
  const errors: string[] = []

  // Alert laden
  const { data: alert, error: alertError } = await supabase
    .from('law_change_alerts')
    .select('*')
    .eq('id', alertId)
    .single()

  if (alertError || !alert) {
    throw new Error(`Alert ${alertId} nicht gefunden: ${alertError?.message}`)
  }

  const typedAlert = alert as LawChangeAlert

  // Idempotenz: Nicht nochmal senden wenn bereits gesendet
  if (typedAlert.status === 'sent') {
    console.log(`[LawChangeAlert] Alert ${alertId} wurde bereits gesendet.`)
    return {
      success: true,
      alertId,
      totalRecipients: typedAlert.total_recipients,
      emailsSent: typedAlert.emails_sent,
      errors: [],
    }
  }

  // Status auf 'sending' setzen
  await supabase
    .from('law_change_alerts')
    .update({ status: 'sending' })
    .eq('id', alertId)

  // Alle aktiven Enterprise-Subscriptions laden
  let subscriptions: Subscription[]
  try {
    subscriptions = await getActiveSubscriptions()
  } catch (err) {
    await supabase
      .from('law_change_alerts')
      .update({ status: 'draft' })
      .eq('id', alertId)
    throw err
  }

  // Total recipients setzen
  await supabase
    .from('law_change_alerts')
    .update({ total_recipients: subscriptions.length })
    .eq('id', alertId)

  console.log(`[LawChangeAlert] Sende Alert "${typedAlert.title}" an ${subscriptions.length} Enterprise-Kunden...`)

  let emailsSent = 0

  for (const subscription of subscriptions) {
    try {
      // Personalisierte Relevanz-Einschätzung für diesen Kunden generieren
      const personalizedNote = await generatePersonalizedNote({
        alert: typedAlert,
        subscription,
      })

      // E-Mail senden
      await sendLawChangeAlertEmail({
        to: subscription.email,
        companyName: subscription.company_name,
        alertTitle: typedAlert.title,
        alertDescription: typedAlert.description,
        lawReference: typedAlert.law_reference,
        severity: typedAlert.severity as 'info' | 'warning' | 'critical',
        effectiveDate: typedAlert.effective_date
          ? new Date(typedAlert.effective_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
          : undefined,
        personalizedNote,
      })

      emailsSent++
      console.log(`[LawChangeAlert] ✅ Alert an ${subscription.company_name} (${subscription.email}) gesendet.`)

      // Fortschritt in DB aktualisieren
      await supabase
        .from('law_change_alerts')
        .update({ emails_sent: emailsSent })
        .eq('id', alertId)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[LawChangeAlert] ❌ Fehler bei ${subscription.company_name}:`, message)
      errors.push(`${subscription.company_name}: ${message}`)

      Sentry.captureException(err, {
        tags: {
          flow: 'law-change-alerts',
          alert_id: alertId,
          subscription_id: subscription.id,
        },
      })
    }
  }

  // Alert als gesendet markieren
  await supabase
    .from('law_change_alerts')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      emails_sent: emailsSent,
    })
    .eq('id', alertId)

  console.log(`[LawChangeAlert] Alert "${typedAlert.title}" abgeschlossen: ${emailsSent}/${subscriptions.length} E-Mails gesendet.`)

  return {
    success: errors.length === 0,
    alertId,
    totalRecipients: subscriptions.length,
    emailsSent,
    errors,
  }
}

// ─── Personalisierte Relevanz-Einschätzung ──────────────────────────────────

/**
 * Generiert eine personalisierte Einschätzung der Relevanz einer
 * Gesetzesänderung für ein spezifisches Unternehmen.
 */
async function generatePersonalizedNote(params: {
  alert: LawChangeAlert
  subscription: Subscription
}): Promise<string> {
  const { alert, subscription } = params

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: LEGAL_CHANGE_ALERT_PROMPT,
      messages: [{
        role: 'user',
        content: `Bewerte die Relevanz dieser Gesetzesänderung für das folgende Unternehmen in 2-3 Sätzen.

Gesetzesänderung:
- Titel: ${alert.title}
- Beschreibung: ${alert.description}
- Rechtsgrundlage: ${alert.law_reference}
- Schweregrad: ${alert.severity}

Unternehmensprofil:
${JSON.stringify(subscription.questionnaire, null, 2)}

Antworte NUR mit der personalisierten Relevanz-Einschätzung (2-3 Sätze). Keine Einleitung, kein Schluss.`,
      }],
    })

    const textBlock = message.content.find(block => block.type === 'text')
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text
    }
    return ''
  } catch (err) {
    // Personalisierung ist nice-to-have, nicht kritisch
    console.warn(`[LawChangeAlert] Personalisierung fehlgeschlagen für ${subscription.company_name}:`, err)
    return ''
  }
}

// ─── Alle Alerts laden (für Admin-UI) ───────────────────────────────────────

/**
 * Lädt alle Gesetzesänderungs-Alerts (neueste zuerst).
 */
export async function getAllAlerts(): Promise<LawChangeAlert[]> {
  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('law_change_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Fehler beim Laden der Alerts: ${error.message}`)
  }

  return (data ?? []) as LawChangeAlert[]
}
