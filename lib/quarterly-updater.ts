/**
 * Vierteljährliche Policy-Update-Logik für Enterprise-Kunden
 *
 * Ablauf:
 * 1. Fällige Subscriptions laden
 * 2. Für jede: Original-Policy + Fragebogen an Claude senden
 * 3. Claude generiert aktualisierte Version + Änderungszusammenfassung
 * 4. PDF + DOCX erstellen, hochladen
 * 5. Update-E-Mail mit Zusammenfassung + Download-Links senden
 * 6. Subscription-Status aktualisieren
 */

import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServiceClient } from './supabase'
import {
  getDueSubscriptions,
  createSubscriptionUpdate,
  markSubscriptionUpdated,
  completeSubscriptionUpdate,
  failSubscriptionUpdate,
  markUpdateEmailSent,
  type Subscription,
} from './subscription'
import {
  UPDATE_SYSTEM_PROMPT,
  buildUpdateUserPrompt,
  CHANGE_SUMMARY_SYSTEM_PROMPT,
  buildChangeSummaryPrompt,
} from './update-prompt'
import { validateLegalReferences, buildCorrectionPrompt } from './validation'
import { markdownToHTML } from './markdown-to-html'
import { generateDOCX } from './docx-generator'
import { sendUpdateEmail } from './email-updates'
import { sendAdminAlert } from './admin-alert'
import * as Sentry from '@sentry/nextjs'

const MAX_UPDATE_RETRIES = 2
const MAX_VALIDATION_RETRIES = 2

// ─── Typen ──────────────────────────────────────────────────────────────────

interface UpdateResult {
  success: boolean
  subscriptionId: string
  companyName: string
  error?: string
}

// ─── Haupt-Batch-Funktion ───────────────────────────────────────────────────

/**
 * Verarbeitet alle fälligen Enterprise-Subscription-Updates.
 * Wird vom Cron-Endpoint aufgerufen.
 */
export async function processQuarterlyUpdates(): Promise<UpdateResult[]> {
  const results: UpdateResult[] = []

  let subscriptions: Subscription[]
  try {
    subscriptions = await getDueSubscriptions()
  } catch (err) {
    Sentry.captureException(err, {
      tags: { flow: 'quarterly-updates', step: 'load-subscriptions' },
    })
    return [{ success: false, subscriptionId: 'query', companyName: '', error: String(err) }]
  }

  if (subscriptions.length === 0) {
    console.log('[QuarterlyUpdate] Keine fälligen Updates gefunden.')
    return []
  }

  console.log(`[QuarterlyUpdate] ${subscriptions.length} fällige(s) Update(s) gefunden.`)

  for (const subscription of subscriptions) {
    const result = await processSubscriptionUpdate(subscription)
    results.push(result)
  }

  return results
}

// ─── Einzelnes Subscription-Update ──────────────────────────────────────────

/**
 * Generiert ein vierteljährliches Update für eine einzelne Subscription.
 */
export async function processSubscriptionUpdate(subscription: Subscription): Promise<UpdateResult> {
  const { id: subId, company_name, order_id, email } = subscription

  return Sentry.withScope(scope => {
    scope.setTag('subscription_id', subId)
    scope.setTag('order_id', order_id)
    scope.setTag('flow', 'quarterly-updates')
    scope.setContext('subscription', {
      id: subId,
      company_name,
      email,
      update_count: subscription.update_count,
    })

    return Sentry.startSpan(
      {
        name: 'quarterly-updater.processSubscriptionUpdate',
        op: 'subscription.update',
        attributes: {
          'subscription.id': subId,
          'subscription.company_name': company_name,
          'subscription.update_count': subscription.update_count,
        },
      },
      async (span) => {
        console.log(`[QuarterlyUpdate] Starte Update für ${company_name} (Sub ${subId.slice(0, 8)}..., Update #${subscription.update_count + 1})`)

        try {
          // 1. Vorherige Policy laden (aus Subscription oder aus der Original-Order)
          const previousPolicy = await loadPreviousPolicy(subscription)

          if (!previousPolicy) {
            const msg = `Keine vorherige Policy gefunden für Subscription ${subId}`
            console.error(`[QuarterlyUpdate] ${msg}`)
            Sentry.captureMessage(msg, { level: 'error' })
            return { success: false, subscriptionId: subId, companyName: company_name, error: msg }
          }

          // 2. Claude: Aktualisierte Policy generieren
          const updatedPolicy = await generateUpdatedPolicy({
            questionnaire: subscription.questionnaire,
            previousPolicy,
            version: subscription.update_count + 1,
            previousDate: subscription.last_update_at ?? subscription.created_at,
          })

          // 3. Update-Eintrag in DB erstellen
          const update = await createSubscriptionUpdate(subscription, updatedPolicy)

          // 4. Änderungszusammenfassung generieren
          const changeSummary = await generateChangeSummary({
            companyName: company_name,
            version: subscription.update_count,
            previousPolicy,
            updatedPolicy,
          })

          // 5. PDF + DOCX parallel erzeugen
          const slugName = company_name.toLowerCase().replace(/\s+/g, '-')
          const versionStr = `v${subscription.update_count + 2}` // +2 weil Original = v1

          const [pdfBuffer, docxBuffer] = await Promise.all([
            generateUpdatePDF(updatedPolicy, { company_name, tier: subscription.tier, version: versionStr }),
            generateDOCX({
              companyName: company_name,
              tier: subscription.tier,
              markdown: updatedPolicy,
            }),
          ])

          // 6. In Supabase Storage hochladen
          const supabase = createSupabaseServiceClient()
          const pdfPath = `updates/${subId}/${versionStr}/ki-richtlinie-${slugName}-${versionStr}.pdf`
          const docxPath = `updates/${subId}/${versionStr}/ki-richtlinie-${slugName}-${versionStr}.docx`

          const [pdfUploadErr, docxUploadErr] = await Promise.all([
            supabase.storage.from('policies').upload(pdfPath, pdfBuffer, {
              contentType: 'application/pdf', upsert: true,
            }).then(r => r.error),
            supabase.storage.from('policies').upload(docxPath, docxBuffer, {
              contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', upsert: true,
            }).then(r => r.error),
          ])

          if (pdfUploadErr) throw new Error(`PDF-Upload fehlgeschlagen: ${pdfUploadErr.message}`)
          if (docxUploadErr) throw new Error(`DOCX-Upload fehlgeschlagen: ${docxUploadErr.message}`)

          // 7. Public URLs
          const { data: { publicUrl: pdfUrl } } = supabase.storage.from('policies').getPublicUrl(pdfPath)
          const { data: { publicUrl: docxUrl } } = supabase.storage.from('policies').getPublicUrl(docxPath)

          // 8. Update-Eintrag abschließen
          await completeSubscriptionUpdate(update.id, {
            changeSummary,
            pdfUrl,
            docxUrl,
          })

          // 9. Subscription aktualisieren (nächstes Update in 3 Monaten)
          await markSubscriptionUpdated(subId, updatedPolicy)

          // 10. Update-E-Mail senden
          await sendUpdateEmail({
            to: email,
            companyName: company_name,
            version: subscription.update_count + 2,
            changeSummary,
            pdfDownloadUrl: pdfUrl,
            docxDownloadUrl: docxUrl,
            orderId: order_id,
          })

          await markUpdateEmailSent(update.id)

          console.log(`[QuarterlyUpdate] ✅ Update für ${company_name} erfolgreich (Version ${subscription.update_count + 2}).`)
          span.setStatus({ code: 1, message: 'ok' })
          return { success: true, subscriptionId: subId, companyName: company_name }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
          console.error(`[QuarterlyUpdate] ❌ Update für ${company_name} fehlgeschlagen:`, message)

          Sentry.captureException(err, {
            tags: {
              subscription_id: subId,
              flow: 'quarterly-updates',
            },
            level: 'error',
          })

          span.setStatus({ code: 2, message })

          // Admin benachrichtigen bei Update-Fehler
          await sendAdminAlert({
            orderId: order_id,
            email,
            companyName: company_name,
            retryCount: 1,
            lastError: `[Quarterly Update] ${message}`,
            createdAt: subscription.created_at,
          }).catch(alertErr =>
            console.error('[QuarterlyUpdate] Admin-Alert fehlgeschlagen:', alertErr)
          )

          return { success: false, subscriptionId: subId, companyName: company_name, error: message }
        }
      }
    )
  })
}

// ─── Claude: Policy aktualisieren ───────────────────────────────────────────

async function generateUpdatedPolicy(params: {
  questionnaire: Record<string, unknown>
  previousPolicy: string
  version: number
  previousDate: string
}): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const userPrompt = buildUpdateUserPrompt({
    questionnaire: params.questionnaire,
    previousPolicy: params.previousPolicy,
    version: params.version,
    previousDate: new Date(params.previousDate).toLocaleDateString('de-DE'),
  })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: UPDATE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  let policyText = extractText(message)

  // Validierung der Rechtsreferenzen (gleicher Flow wie bei Erstgenerierung)
  let validation = validateLegalReferences(policyText)

  for (let attempt = 1; attempt <= MAX_VALIDATION_RETRIES && !validation.valid; attempt++) {
    console.warn(`[QuarterlyUpdate/Validierung] Korrekturversuch ${attempt}/${MAX_VALIDATION_RETRIES}`)

    Sentry.addBreadcrumb({
      category: 'validation',
      message: `Update-Validierungskorrektur Versuch ${attempt}`,
      level: 'warning',
      data: { errors: validation.errors.map(e => e.message) },
    })

    const correctionPrompt = buildCorrectionPrompt(policyText, validation.errors)
    const correctionMessage = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: UPDATE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: correctionPrompt }],
    })

    policyText = extractText(correctionMessage)
    validation = validateLegalReferences(policyText)
  }

  if (!validation.valid) {
    const errorSummary = validation.errors.map(e => `- ${e.message}`).join('\n')
    throw new Error(`Update-Validierung fehlgeschlagen:\n${errorSummary}`)
  }

  return policyText
}

// ─── Claude: Änderungszusammenfassung ───────────────────────────────────────

async function generateChangeSummary(params: {
  companyName: string
  version: number
  previousPolicy: string
  updatedPolicy: string
}): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: CHANGE_SUMMARY_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildChangeSummaryPrompt(params),
    }],
  })

  return extractText(message)
}

// ─── Vorherige Policy laden ─────────────────────────────────────────────────

async function loadPreviousPolicy(subscription: Subscription): Promise<string | null> {
  // Zuerst: Aus Subscription (gespeichertes Markdown)
  if (subscription.current_policy_markdown) {
    return subscription.current_policy_markdown
  }

  // Fallback: Letztes Update aus subscription_updates
  const supabase = createSupabaseServiceClient()
  const { data: lastUpdate } = await supabase
    .from('subscription_updates')
    .select('policy_markdown')
    .eq('subscription_id', subscription.id)
    .eq('status', 'completed')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastUpdate?.policy_markdown) {
    return lastUpdate.policy_markdown
  }

  // Letzter Fallback: Originale Policy aus der Order neu generieren lassen
  // ist nicht ideal, aber besser als gar kein Update
  console.warn(`[QuarterlyUpdate] Kein gespeichertes Markdown für Sub ${subscription.id}. Verwende leere Basis.`)

  // Wir könnten hier die PDF parsen, aber das ist fragil.
  // Stattdessen: NULL zurückgeben und im Caller eine Erstgenerierung triggern
  return null
}

// ─── PDF-Generierung für Updates ────────────────────────────────────────────

async function generateUpdatePDF(
  markdown: string,
  order: { company_name: string; tier: string; version: string }
): Promise<Buffer> {
  const chromium = await import('@sparticuz/chromium')
  const puppeteer = await import('puppeteer-core')

  const html = buildUpdatePDFHTML(markdown, order)

  const browser = await puppeteer.default.launch({
    args: chromium.default.args,
    executablePath: await chromium.default.executablePath(),
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '25mm', left: '20mm', right: '20mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;color:#8B96A8;width:100%;text-align:right;padding-right:20mm;font-family:Arial;">${order.company_name} — KI-Nutzungsrichtlinie (${order.version}) — VERTRAULICH</div>`,
      footerTemplate: `<div style="font-size:8px;color:#8B96A8;width:100%;display:flex;justify-content:space-between;padding:0 20mm;font-family:Arial;"><span>Erstellt mit KI-Kompass</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    })
    return Buffer.from(pdfUint8Array)
  } finally {
    await browser.close()
  }
}

function buildUpdatePDFHTML(
  markdown: string,
  order: { company_name: string; tier: string; version: string }
): string {
  const html = markdownToHTML(markdown)
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1B2A4A; line-height: 1.6; }
  .cover {
    background: #1B2A4A;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 60px;
    page-break-after: always;
  }
  .cover-logo { display: flex; align-items: center; gap: 10px; }
  .cover-logo-badge { width: 32px; height: 32px; background: rgba(201,168,76,0.2); border-radius: 2px; display: flex; align-items: center; justify-content: center; }
  .cover-logo-text { color: rgba(247,244,239,0.6); font-size: 13px; }
  .cover-main { }
  .cover-tag { color: #C9A84C; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 16px; }
  .cover-title { color: #F7F4EF; font-size: 32pt; font-weight: 300; line-height: 1.1; margin-bottom: 8px; font-style: italic; }
  .cover-company { color: #E8C87A; font-size: 20pt; font-weight: 400; margin-bottom: 16px; }
  .cover-update-badge { display: inline-block; background: rgba(201,168,76,0.2); border: 1px solid rgba(201,168,76,0.4); padding: 8px 16px; border-radius: 2px; margin-bottom: 24px; }
  .cover-update-badge span { color: #C9A84C; font-size: 11pt; font-weight: 500; }
  .cover-meta { color: rgba(247,244,239,0.4); font-size: 9pt; line-height: 1.8; }
  h1 { font-size: 18pt; font-weight: 300; color: #1B2A4A; border-bottom: 1px solid rgba(27,42,74,0.1); padding-bottom: 8px; margin: 32px 0 16px; page-break-after: avoid; }
  h2 { font-size: 13pt; font-weight: 600; color: #1B2A4A; margin: 24px 0 10px; page-break-after: avoid; }
  h3 { font-size: 11pt; font-weight: 600; color: #1B2A4A; margin: 16px 0 8px; }
  p { margin-bottom: 10px; }
  ul, ol { margin: 10px 0 10px 20px; }
  li { margin-bottom: 4px; }
  strong { font-weight: 600; }
  .summary-box { background: #E8F0FE; border-left: 3px solid #1B2A4A; padding: 12px 16px; margin: 16px 0; font-size: 9.5pt; }
  .warning-box { background: #FFF3E0; border-left: 3px solid #E65100; padding: 12px 16px; margin: 16px 0; font-size: 9.5pt; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 9.5pt; }
  th { background: #1B2A4A; color: #F7F4EF; padding: 8px 12px; text-align: left; font-weight: 600; font-size: 9pt; }
  td { padding: 8px 12px; border-bottom: 1px solid rgba(27,42,74,0.08); vertical-align: top; }
  tr:nth-child(even) td { background: rgba(27,42,74,0.02); }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="cover">
  <div class="cover-logo">
    <div class="cover-logo-badge"><span style="color:#C9A84C;font-size:11px;font-family:monospace;font-weight:500;">KI</span></div>
    <span class="cover-logo-text">KI-Kompass</span>
  </div>
  <div class="cover-main">
    <p class="cover-tag">KI-Nutzungsrichtlinie — Aktualisierung</p>
    <div class="cover-title">KI-Richtlinie</div>
    <div class="cover-company">${order.company_name}</div>
    <div class="cover-update-badge">
      <span>📋 Vierteljährliches Update — Version ${order.version}</span>
    </div>
  </div>
  <div class="cover-meta">
    <div>Version: ${order.version}</div>
    <div>Aktualisiert: ${today}</div>
    <div>Paket: Enterprise</div>
    <div>Erstellt mit KI-Kompass · Vierteljährliches Update</div>
  </div>
</div>
<div class="content">
${html}
</div>
</body>
</html>`
}

// ─── Hilfsfunktion ──────────────────────────────────────────────────────────

function extractText(message: Anthropic.Message): string {
  const textBlock = message.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Keine Textantwort von Claude erhalten')
  }
  return textBlock.text
}
