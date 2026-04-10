/**
 * Subscription-Verwaltung für Enterprise-Kunden
 *
 * Erstellt und verwaltet Subscriptions für vierteljährliche Policy-Updates.
 * Wird von policy-generator.ts aufgerufen, wenn eine Enterprise-Order
 * erfolgreich verarbeitet wurde.
 */

import { createSupabaseServiceClient } from './supabase'
import * as Sentry from '@sentry/nextjs'

// ─── Typen ──────────────────────────────────────────────────────────────────

export interface Subscription {
  id: string
  order_id: string
  email: string
  company_name: string
  tier: string
  starts_at: string
  expires_at: string
  status: 'active' | 'expired' | 'cancelled'
  last_update_at: string | null
  next_update_due_at: string
  update_count: number
  questionnaire: Record<string, unknown>
  current_policy_markdown: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionUpdate {
  id: string
  subscription_id: string
  order_id: string
  version: number
  policy_markdown: string
  change_summary: string | null
  pdf_url: string | null
  docx_url: string | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  error_message: string | null
  retry_count: number
  email_sent_at: string | null
  created_at: string
}

interface CreateSubscriptionParams {
  id: string          // order_id
  email: string
  company_name: string
  tier: string
  policyMarkdown?: string  // Originale Policy für spätere Updates
}

// ─── Subscription erstellen ─────────────────────────────────────────────────

/**
 * Erstellt eine Enterprise-Subscription für eine fertig verarbeitete Order.
 * Wird von processOrder() in policy-generator.ts aufgerufen.
 *
 * Idempotent: Wenn bereits eine Subscription für die Order existiert, wird
 * keine neue erstellt.
 */
export async function createSubscriptionForOrder(params: CreateSubscriptionParams): Promise<string | null> {
  const { id: orderId, email, company_name, tier, policyMarkdown } = params

  if (tier !== 'enterprise') {
    return null
  }

  const supabase = createSupabaseServiceClient()

  // Idempotenz: Prüfen ob bereits eine Subscription existiert
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) {
    console.log(`[Subscription] Subscription für Order ${orderId} existiert bereits (${existing.id}).`)
    return existing.id
  }

  // Fragebogen-Daten und aktuelle Policy aus der Order laden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('questionnaire, policy_url')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error(`Order ${orderId} nicht gefunden: ${orderError?.message}`)
  }

  // Policy-Markdown laden (aus Supabase Storage, falls vorhanden)
  // Hinweis: Wir speichern das Markdown bei der nächsten Generierung
  // Initial ist current_policy_markdown NULL — der erste Update-Cycle
  // wird den Claude-Output speichern.

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + 12)

  const nextUpdateDue = new Date(now)
  nextUpdateDue.setMonth(nextUpdateDue.getMonth() + 3)

  const { data: subscription, error: insertError } = await supabase
    .from('subscriptions')
    .insert({
      order_id: orderId,
      email,
      company_name,
      tier,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active',
      next_update_due_at: nextUpdateDue.toISOString(),
      update_count: 0,
      questionnaire: order.questionnaire,
      current_policy_markdown: policyMarkdown ?? null,
    })
    .select('id')
    .single()

  if (insertError || !subscription) {
    throw new Error(`Subscription konnte nicht erstellt werden: ${insertError?.message}`)
  }

  console.log(`[Subscription] ✅ Enterprise-Subscription ${subscription.id} für Order ${orderId} erstellt.`)
  console.log(`[Subscription]    Läuft bis: ${expiresAt.toISOString()}, nächstes Update: ${nextUpdateDue.toISOString()}`)

  return subscription.id
}

// ─── Fällige Subscriptions laden ────────────────────────────────────────────

/**
 * Findet alle aktiven Subscriptions, deren vierteljährliches Update fällig ist.
 */
export async function getDueSubscriptions(): Promise<Subscription[]> {
  const supabase = createSupabaseServiceClient()
  const now = new Date().toISOString()

  // Zuerst: Abgelaufene Subscriptions auf 'expired' setzen
  await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', now)

  // Dann: Fällige aktive Subscriptions laden
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .lte('next_update_due_at', now)
    .order('next_update_due_at', { ascending: true })
    .limit(10) // Batch-Größe begrenzen

  if (error) {
    Sentry.captureException(new Error(`Fehler beim Laden fälliger Subscriptions: ${error.message}`), {
      tags: { flow: 'quarterly-updates', step: 'load-due' },
    })
    throw error
  }

  return (data ?? []) as Subscription[]
}

// ─── Subscription-Update erstellen ──────────────────────────────────────────

/**
 * Erstellt einen neuen Update-Eintrag für eine Subscription.
 * Status: 'generating' → wird von der Update-Logik auf 'completed' oder 'failed' gesetzt.
 */
export async function createSubscriptionUpdate(
  subscription: Subscription,
  policyMarkdown: string,
): Promise<SubscriptionUpdate> {
  const supabase = createSupabaseServiceClient()
  const newVersion = subscription.update_count + 1

  const { data, error } = await supabase
    .from('subscription_updates')
    .insert({
      subscription_id: subscription.id,
      order_id: subscription.order_id,
      version: newVersion,
      policy_markdown: policyMarkdown,
      status: 'generating',
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Update-Eintrag konnte nicht erstellt werden: ${error?.message}`)
  }

  return data as SubscriptionUpdate
}

// ─── Subscription nach Update aktualisieren ─────────────────────────────────

/**
 * Markiert eine Subscription als aktualisiert und setzt den nächsten Fälligkeitszeitpunkt.
 */
export async function markSubscriptionUpdated(
  subscriptionId: string,
  policyMarkdown: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient()

  const now = new Date()
  const nextDue = new Date(now)
  nextDue.setMonth(nextDue.getMonth() + 3)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      last_update_at: now.toISOString(),
      next_update_due_at: nextDue.toISOString(),
      update_count: supabase.rpc ? undefined : undefined, // Wird via SQL increment gemacht
      current_policy_markdown: policyMarkdown,
    })
    .eq('id', subscriptionId)

  if (error) {
    throw new Error(`Subscription ${subscriptionId} konnte nicht aktualisiert werden: ${error.message}`)
  }

  // update_count inkrementieren
  await supabase.rpc('increment_update_count', { sub_id: subscriptionId }).catch(() => {
    // Fallback: Manuell inkrementieren wenn RPC nicht existiert
    return supabase
      .from('subscriptions')
      .select('update_count')
      .eq('id', subscriptionId)
      .single()
      .then(({ data }: { data: { update_count: number } | null }) => {
        if (data) {
          return supabase
            .from('subscriptions')
            .update({ update_count: (data.update_count ?? 0) + 1 })
            .eq('id', subscriptionId)
        }
      })
  })
}

// ─── Update-Status setzen ───────────────────────────────────────────────────

/**
 * Markiert einen Update-Eintrag als abgeschlossen.
 */
export async function completeSubscriptionUpdate(
  updateId: string,
  params: {
    changeSummary: string
    pdfUrl: string
    docxUrl: string
  }
): Promise<void> {
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('subscription_updates')
    .update({
      status: 'completed',
      change_summary: params.changeSummary,
      pdf_url: params.pdfUrl,
      docx_url: params.docxUrl,
    })
    .eq('id', updateId)

  if (error) {
    throw new Error(`Update ${updateId} konnte nicht als abgeschlossen markiert werden: ${error.message}`)
  }
}

/**
 * Markiert einen Update-Eintrag als fehlgeschlagen.
 */
export async function failSubscriptionUpdate(
  updateId: string,
  errorMessage: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('subscription_updates')
    .update({
      status: 'failed',
      error_message: errorMessage,
      retry_count: supabase.rpc ? undefined : undefined,
    })
    .eq('id', updateId)

  if (error) {
    console.error(`[Subscription] Update ${updateId} konnte nicht als fehlgeschlagen markiert werden:`, error.message)
  }
}

/**
 * Markiert, dass die E-Mail für ein Update gesendet wurde.
 */
export async function markUpdateEmailSent(updateId: string): Promise<void> {
  const supabase = createSupabaseServiceClient()

  await supabase
    .from('subscription_updates')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', updateId)
}

// ─── Aktive Enterprise-Subscriptions laden ──────────────────────────────────

/**
 * Lädt alle aktiven Enterprise-Subscriptions (für Law-Change-Alerts).
 */
export async function getActiveSubscriptions(): Promise<Subscription[]> {
  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .order('company_name', { ascending: true })

  if (error) {
    throw new Error(`Fehler beim Laden aktiver Subscriptions: ${error.message}`)
  }

  return (data ?? []) as Subscription[]
}
