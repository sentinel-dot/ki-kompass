/**
 * Policy-Generierung — Entkoppelter Worker
 *
 * Zentrale Logik für die Policy-Generierung, PDF-Erstellung, Upload und E-Mail-Versand.
 * Wird sowohl vom Worker-Cron als auch (bei Bedarf) manuell aufgerufen.
 *
 * Ablauf:
 * 1. Order aus Supabase laden
 * 2. Lock setzen (processing_started_at) für Idempotenz
 * 3. Claude-Policy generieren
 * 4. PDF erzeugen
 * 5. In Supabase Storage hochladen
 * 6. Order mit policy_url + generated_at updaten
 * 7. Download-E-Mail senden
 * 8. Bei Fehler: retry_count hochzählen, bei Max → Alert
 */

import { createSupabaseServiceClient } from './supabase'
import { generatePolicy } from './claude'
import { sendDownloadEmail } from './email'
import { sendAdminAlert } from './admin-alert'
import { markdownToHTML } from './markdown-to-html'
import { generateDOCX } from './docx-generator'
import { createSubscriptionForOrder } from './subscription'
import { DISCLAIMER_HTML } from '@/components/LegalDisclaimer'
import * as Sentry from '@sentry/nextjs'

const MAX_RETRIES = 3
/** Lock-Timeout: Wenn eine Order länger als 10 Minuten "in Bearbeitung" ist, gilt sie als steckengeblieben */
const LOCK_TIMEOUT_MS = 10 * 60 * 1000

// ─── Typen ──────────────────────────────────────────────────────────────────

interface Order {
  id: string
  email: string
  company_name: string
  tier: string
  questionnaire: Record<string, unknown>
  payment_status: string
  policy_url: string | null
  docx_url: string | null
  generated_at: string | null
  retry_count: number
  processing_started_at: string | null
  last_error: string | null
}

interface ProcessResult {
  success: boolean
  orderId: string
  error?: string
}

// ─── Hauptfunktion: Alle offenen Orders abarbeiten ─────────────────────────

/**
 * Findet alle bezahlten Orders ohne Policy und verarbeitet sie.
 * Wird vom Cron-Endpoint aufgerufen.
 */
export async function processOpenOrders(): Promise<ProcessResult[]> {
  const supabase = createSupabaseServiceClient()
  const results: ProcessResult[] = []

  const staleBefore = new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString()

  // Finde alle Orders die:
  // - bezahlt sind (payment_status = 'paid')
  // - keine Policy haben (policy_url IS NULL)
  // - nicht gerade verarbeitet werden (processing_started_at IS NULL ODER älter als Lock-Timeout)
  // - Max-Retries nicht erreicht haben (retry_count < MAX_RETRIES)
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_status', 'paid')
    .is('policy_url', null)
    .lt('retry_count', MAX_RETRIES)
    .or(`processing_started_at.is.null,processing_started_at.lt.${staleBefore}`)
    .order('created_at', { ascending: true })
    .limit(10) // Batch-Größe begrenzen

  if (error) {
    console.error('[Worker] Fehler beim Laden offener Orders:', error.message)
    return [{ success: false, orderId: 'query', error: error.message }]
  }

  if (!orders || orders.length === 0) {
    console.log('[Worker] Keine offenen Orders gefunden.')
    return []
  }

  console.log(`[Worker] ${orders.length} offene Order(s) gefunden.`)

  for (const order of orders as Order[]) {
    const result = await processOrder(order)
    results.push(result)
  }

  // Prüfe auf Orders die Max-Retries erreicht haben und noch keinen Alert bekommen haben
  await alertOnExhaustedRetries()

  return results
}

// ─── Einzelne Order verarbeiten ─────────────────────────────────────────────

/**
 * Verarbeitet eine einzelne Order: Lock → Generate → PDF → Upload → E-Mail
 */
export async function processOrder(order: Order): Promise<ProcessResult> {
  const supabase = createSupabaseServiceClient()
  const orderId = order.id

  return Sentry.withScope(scope => {
    // Kontext für alle Sentry-Events in diesem Scope
    scope.setTag('order_id', orderId)
    scope.setTag('tier', order.tier)
    scope.setTag('flow', 'payment-to-delivery')
    scope.setContext('order', {
      id: orderId,
      email: order.email,
      company_name: order.company_name,
      tier: order.tier,
      retry_count: order.retry_count,
    })

    return Sentry.startSpan(
      {
        name: 'policy-generator.processOrder',
        op: 'process.order',
        attributes: {
          'order.id': orderId,
          'order.tier': order.tier,
          'order.retry_count': order.retry_count,
        },
      },
      async (span) => {
        console.log(`[Worker] Starte Verarbeitung für Order ${orderId} (Versuch ${order.retry_count + 1}/${MAX_RETRIES})`)

        // Lock setzen — verhindert parallele Verarbeitung derselben Order
        const { error: lockError, count } = await supabase
          .from('orders')
          .update({ processing_started_at: new Date().toISOString() })
          .eq('id', orderId)
          .is('policy_url', null) // Double-check: nur wenn noch keine Policy vorhanden
          .or(`processing_started_at.is.null,processing_started_at.lt.${new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString()}`)

        if (lockError || count === 0) {
          console.log(`[Worker] Order ${orderId} konnte nicht gelockt werden (bereits in Bearbeitung oder fertig).`)
          return { success: false, orderId, error: 'Lock fehlgeschlagen — Order wird bereits verarbeitet.' }
        }

        try {
          // 1. Policy via Claude generieren
          Sentry.addBreadcrumb({ category: 'policy', message: 'Claude-Generierung gestartet', level: 'info' })
          const markdownPolicy = await Sentry.startSpan(
            { name: 'claude.generatePolicy', op: 'ai.generate' },
            () => generatePolicy(order.questionnaire)
          )
          Sentry.addBreadcrumb({ category: 'policy', message: 'Claude-Generierung abgeschlossen', level: 'info' })

          // 2. PDF + DOCX parallel erzeugen
          const slugName = order.company_name.toLowerCase().replace(/\s+/g, '-')

          const [pdfBuffer, docxBuffer] = await Promise.all([
            Sentry.startSpan(
              { name: 'puppeteer.generatePDF', op: 'pdf.generate' },
              () => generatePDF(markdownPolicy, order)
            ),
            Sentry.startSpan(
              { name: 'docx.generateDOCX', op: 'docx.generate' },
              () => generateDOCX({
                companyName: order.company_name,
                tier: order.tier,
                markdown: markdownPolicy,
              })
            ),
          ])
          Sentry.addBreadcrumb({ category: 'policy', message: `PDF erzeugt (${pdfBuffer.length} bytes), DOCX erzeugt (${docxBuffer.length} bytes)`, level: 'info' })

          // 3. PDF + DOCX in Supabase Storage hochladen
          const pdfFileName = `policies/${orderId}/ki-richtlinie-${slugName}.pdf`
          const docxFileName = `policies/${orderId}/ki-richtlinie-${slugName}.docx`

          const [pdfUploadError, docxUploadError] = await Promise.all([
            Sentry.startSpan(
              { name: 'supabase.uploadPDF', op: 'storage.upload' },
              async () => {
                const { error } = await supabase.storage
                  .from('policies')
                  .upload(pdfFileName, pdfBuffer, {
                    contentType: 'application/pdf',
                    upsert: true,
                  })
                return error
              }
            ),
            Sentry.startSpan(
              { name: 'supabase.uploadDOCX', op: 'storage.upload' },
              async () => {
                const { error } = await supabase.storage
                  .from('policies')
                  .upload(docxFileName, docxBuffer, {
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    upsert: true,
                  })
                return error
              }
            ),
          ])

          if (pdfUploadError) throw new Error(`PDF-Upload fehlgeschlagen: ${pdfUploadError.message}`)
          if (docxUploadError) throw new Error(`DOCX-Upload fehlgeschlagen: ${docxUploadError.message}`)
          Sentry.addBreadcrumb({ category: 'policy', message: 'PDF + DOCX in Supabase hochgeladen', level: 'info' })

          // 4. Public URLs holen
          const { data: { publicUrl } } = supabase.storage
            .from('policies')
            .getPublicUrl(pdfFileName)

          const { data: { publicUrl: docxPublicUrl } } = supabase.storage
            .from('policies')
            .getPublicUrl(docxFileName)

          // 5. Order updaten — Policy fertig (PDF + DOCX)
          await supabase
            .from('orders')
            .update({
              policy_url: publicUrl,
              docx_url: docxPublicUrl,
              generated_at: new Date().toISOString(),
              processing_started_at: null, // Lock aufheben
              last_error: null,
            })
            .eq('id', orderId)

          // 6. Download-E-Mail senden (mit PDF + DOCX Links)
          await Sentry.startSpan(
            { name: 'brevo.sendDownloadEmail', op: 'email.send' },
            () => sendDownloadEmail({
              to: order.email,
              companyName: order.company_name,
              orderId,
              downloadUrl: publicUrl,
              docxDownloadUrl: docxPublicUrl,
              tier: order.tier,
            })
          )
          Sentry.addBreadcrumb({ category: 'policy', message: 'Download-E-Mail gesendet', level: 'info' })

          // 7. Enterprise: Subscription für vierteljährliche Updates anlegen
          if (order.tier === 'enterprise') {
            try {
              await createSubscriptionForOrder({
                id: orderId,
                email: order.email,
                company_name: order.company_name,
                tier: order.tier,
                policyMarkdown: markdownPolicy,
              })
              Sentry.addBreadcrumb({ category: 'subscription', message: 'Enterprise-Subscription erstellt', level: 'info' })
            } catch (subErr) {
              // Subscription-Fehler sind nicht kritisch — Policy wurde bereits ausgeliefert
              console.warn(`[Worker] Enterprise-Subscription konnte nicht erstellt werden:`, subErr)
              Sentry.captureException(subErr, {
                tags: { order_id: orderId, flow: 'subscription', step: 'create' },
                level: 'warning',
              })
            }
          }

          console.log(`[Worker] ✅ Order ${orderId} erfolgreich verarbeitet.`)
          span.setStatus({ code: 1, message: 'ok' }) // SpanStatusCode.OK
          return { success: true, orderId }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
          console.error(`[Worker] ❌ Order ${orderId} fehlgeschlagen:`, message)

          // Sentry: Fehler mit vollem Kontext erfassen
          Sentry.captureException(err, {
            tags: {
              order_id: orderId,
              flow: 'payment-to-delivery',
              retry_count: String(order.retry_count + 1),
            },
            level: order.retry_count + 1 >= MAX_RETRIES ? 'fatal' : 'error',
          })

          span.setStatus({ code: 2, message })

          // Retry-Count hochzählen, Lock aufheben, Fehler speichern
          await supabase
            .from('orders')
            .update({
              retry_count: order.retry_count + 1,
              processing_started_at: null,
              last_error: message,
            })
            .eq('id', orderId)

          return { success: false, orderId, error: message }
        }
      }
    )
  })
}

// ─── Alert bei erschöpften Retries ──────────────────────────────────────────

async function alertOnExhaustedRetries(): Promise<void> {
  const supabase = createSupabaseServiceClient()

  const { data: failedOrders } = await supabase
    .from('orders')
    .select('id, email, company_name, retry_count, last_error, created_at')
    .eq('payment_status', 'paid')
    .is('policy_url', null)
    .gte('retry_count', MAX_RETRIES)
    .is('admin_alerted_at', null) // Nur Orders die noch keinen Alert ausgelöst haben

  if (!failedOrders || failedOrders.length === 0) return

  for (const order of failedOrders) {
    console.error(`[Worker] 🚨 Order ${order.id} hat ${MAX_RETRIES} Retries erschöpft! Letzter Fehler: ${order.last_error}`)

    // Sentry: Fatal-Level Event für erschöpfte Retries
    Sentry.captureMessage(
      `🚨 Payment ohne Policy: Order ${order.id} hat alle ${MAX_RETRIES} Retries erschöpft`,
      {
        level: 'fatal',
        tags: {
          order_id: order.id,
          flow: 'payment-to-delivery',
          alert_type: 'retries_exhausted',
        },
        contexts: {
          order: {
            id: order.id,
            email: order.email,
            company_name: order.company_name,
            retry_count: order.retry_count,
            last_error: order.last_error ?? 'Unbekannt',
            created_at: order.created_at,
          },
        },
      }
    )

    await sendAdminAlert({
      orderId: order.id,
      email: order.email,
      companyName: order.company_name,
      retryCount: order.retry_count,
      lastError: order.last_error ?? 'Unbekannt',
      createdAt: order.created_at,
    })

    // Markieren, dass Alert gesendet wurde
    await supabase
      .from('orders')
      .update({ admin_alerted_at: new Date().toISOString() })
      .eq('id', order.id)
  }
}

// ─── PDF-Generierung ────────────────────────────────────────────────────────

async function generatePDF(markdown: string, order: { company_name: string; tier: string; questionnaire: Record<string, unknown> }): Promise<Buffer> {
  const chromium = await import('@sparticuz/chromium')
  const puppeteer = await import('puppeteer-core')

  const html = buildPDFHTML(markdown, order)

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
      headerTemplate: `<div style="font-size:8px;color:#8B96A8;width:100%;text-align:right;padding-right:20mm;font-family:Arial;">${order.company_name} — KI-Nutzungsrichtlinie — VERTRAULICH</div>`,
      footerTemplate: `<div style="font-size:8px;color:#8B96A8;width:100%;display:flex;justify-content:space-between;padding:0 20mm;font-family:Arial;"><span>Erstellt mit KI-Kompass</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    })
    return Buffer.from(pdfUint8Array)
  } finally {
    await browser.close()
  }
}

function buildPDFHTML(markdown: string, order: { company_name: string; tier: string }): string {
  // Markdown → HTML via marked-Parser (ersetzt fragile Regex-Konvertierung)
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
  .cover-company { color: #E8C87A; font-size: 20pt; font-weight: 400; margin-bottom: 24px; }
  .cover-deadline { background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3); padding: 16px 20px; border-radius: 2px; display: inline-block; }
  .cover-deadline p { color: rgba(247,244,239,0.6); font-size: 9pt; }
  .cover-deadline strong { color: #C9A84C; }
  .cover-meta { color: rgba(247,244,239,0.4); font-size: 9pt; line-height: 1.8; }
  h1 { font-size: 18pt; font-weight: 300; color: #1B2A4A; border-bottom: 1px solid rgba(27,42,74,0.1); padding-bottom: 8px; margin: 32px 0 16px; page-break-after: avoid; }
  h2 { font-size: 13pt; font-weight: 600; color: #1B2A4A; margin: 24px 0 10px; page-break-after: avoid; }
  h3 { font-size: 11pt; font-weight: 600; color: #1B2A4A; margin: 16px 0 8px; }
  p { margin-bottom: 10px; }
  ul, ol { margin: 10px 0 10px 20px; }
  li { margin-bottom: 4px; }
  strong { font-weight: 600; }
  .summary-box { background: #E8F0FE; border-left: 3px solid #1B2A4A; padding: 12px 16px; margin: 16px 0; font-size: 9.5pt; color: rgba(27,42,74,0.8); border-radius: 0 2px 2px 0; }
  .summary-box strong { color: #1B2A4A; }
  .warning-box { background: #FFF3E0; border-left: 3px solid #E65100; padding: 12px 16px; margin: 16px 0; font-size: 9.5pt; color: rgba(27,42,74,0.8); border-radius: 0 2px 2px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 9.5pt; }
  th { background: #1B2A4A; color: #F7F4EF; padding: 8px 12px; text-align: left; font-weight: 600; font-size: 9pt; }
  td { padding: 8px 12px; border-bottom: 1px solid rgba(27,42,74,0.08); vertical-align: top; }
  tr:nth-child(even) td { background: rgba(27,42,74,0.02); }
  .td-green { background: #E8F5E9 !important; color: #2E7D32; font-weight: 600; }
  .td-yellow { background: #FFF8E1 !important; color: #F57F17; font-weight: 600; }
  .td-red { background: #FFEBEE !important; color: #C62828; font-weight: 600; }
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
    <p class="cover-tag">KI-Nutzungsrichtlinie</p>
    <div class="cover-title">KI-Richtlinie</div>
    <div class="cover-company">${order.company_name}</div>
    <div class="cover-deadline">
      <p>⚠ <strong>EU AI Act Deadline</strong></p>
      <p>High-Risk-Pflichten gelten ab 2. August 2026</p>
      <p>Art. 4 + Art. 5 gelten bereits seit 2. Februar 2025</p>
    </div>
  </div>
  <div class="cover-meta">
    <div>Version: 1.0</div>
    <div>Erstellt: ${today}</div>
    <div>Paket: ${order.tier.charAt(0).toUpperCase() + order.tier.slice(1)}</div>
    <div>Erstellt mit KI-Kompass · Juristisch geprüft</div>
  </div>
</div>
<div class="content">
${DISCLAIMER_HTML}
${html}
</div>
</body>
</html>`
}
