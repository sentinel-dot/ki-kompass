import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createSupabaseServiceClient } from '@/lib/supabase'
import { generatePolicy } from '@/lib/claude'
import { sendDownloadEmail } from '@/lib/email'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Keine Webhook-Signatur' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ungültige Signatur'
    return NextResponse.json({ error: `Webhook-Verifikation fehlgeschlagen: ${message}` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true })
  }

  const orderId = session.metadata?.order_id
  if (!orderId) {
    return NextResponse.json({ error: 'Keine Order-ID in Metadata' }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  // Update payment status
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId)
    .select('*')
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
  }

  try {
    // Generate policy via Claude
    const markdownPolicy = await generatePolicy(order.questionnaire)

    // Generate PDF
    const pdfBuffer = await generatePDF(markdownPolicy, order)

    // Upload to Supabase Storage
    const fileName = `policies/${orderId}/ki-richtlinie-${order.company_name.toLowerCase().replace(/\s+/g, '-')}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('policies')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('policies')
      .getPublicUrl(fileName)

    // Update order with policy URL and generation timestamp
    await supabase
      .from('orders')
      .update({
        policy_url: publicUrl,
        generated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // Send download email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ki-kompass.de'
    await sendDownloadEmail({
      to: order.email,
      companyName: order.company_name,
      orderId,
      downloadUrl: publicUrl,
      tier: order.tier,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    // Mark as failed so we can retry
    await supabase
      .from('orders')
      .update({ payment_status: 'paid' }) // Keep paid, but no policy_url
      .eq('id', orderId)

    return NextResponse.json({ error: `Generierung fehlgeschlagen: ${message}` }, { status: 500 })
  }
}

async function generatePDF(markdown: string, order: { company_name: string; tier: string; questionnaire: Record<string, unknown> }): Promise<Buffer> {
  // Dynamic import for Puppeteer (only available server-side)
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
  // Convert markdown to HTML (basic conversion)
  let html = markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '<p>')
    .replace(/<p><\/p>/g, '')

  // Color-code tables (erlaubt/eingeschränkt/verboten)
  html = html
    .replace(/\| Erlaubt /g, '<td class="td-green">Erlaubt ')
    .replace(/\| Eingeschränkt /g, '<td class="td-yellow">Eingeschränkt ')
    .replace(/\| Verboten /g, '<td class="td-red">Verboten ')

  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1B2A4A; line-height: 1.6; }

  /* Cover page */
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

  /* Content */
  h1 { font-size: 18pt; font-weight: 300; color: #1B2A4A; border-bottom: 1px solid rgba(27,42,74,0.1); padding-bottom: 8px; margin: 32px 0 16px; page-break-after: avoid; }
  h2 { font-size: 13pt; font-weight: 600; color: #1B2A4A; margin: 24px 0 10px; page-break-after: avoid; }
  h3 { font-size: 11pt; font-weight: 600; color: #1B2A4A; margin: 16px 0 8px; }
  p { margin-bottom: 10px; }
  ul, ol { margin: 10px 0 10px 20px; }
  li { margin-bottom: 4px; }
  strong { font-weight: 600; }

  /* Summary boxes */
  .summary-box {
    background: #E8F0FE;
    border-left: 3px solid #1B2A4A;
    padding: 12px 16px;
    margin: 16px 0;
    font-size: 9.5pt;
    color: rgba(27,42,74,0.8);
    border-radius: 0 2px 2px 0;
  }
  .summary-box strong { color: #1B2A4A; }

  /* Warning boxes */
  .warning-box {
    background: #FFF3E0;
    border-left: 3px solid #E65100;
    padding: 12px 16px;
    margin: 16px 0;
    font-size: 9.5pt;
    color: rgba(27,42,74,0.8);
    border-radius: 0 2px 2px 0;
  }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 9.5pt; }
  th { background: #1B2A4A; color: #F7F4EF; padding: 8px 12px; text-align: left; font-weight: 600; font-size: 9pt; }
  td { padding: 8px 12px; border-bottom: 1px solid rgba(27,42,74,0.08); vertical-align: top; }
  tr:nth-child(even) td { background: rgba(27,42,74,0.02); }
  .td-green { background: #E8F5E9 !important; color: #2E7D32; font-weight: 600; }
  .td-yellow { background: #FFF8E1 !important; color: #F57F17; font-weight: 600; }
  .td-red { background: #FFEBEE !important; color: #C62828; font-weight: 600; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- Cover Page -->
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

<!-- Policy Content -->
<div class="content">
${html}
</div>

</body>
</html>`
}
