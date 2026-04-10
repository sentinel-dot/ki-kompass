/**
 * Rate-Limiting Modul
 *
 * Verwendet @upstash/ratelimit mit Redis für produktionsfähiges,
 * verteiltes Rate-Limiting auf Vercel Serverless Functions.
 *
 * Konfiguration:
 *   - UPSTASH_REDIS_REST_URL  — Upstash Redis REST-URL
 *   - UPSTASH_REDIS_REST_TOKEN — Upstash Redis REST-Token
 *   - RATE_LIMIT_DISABLED=true — Deaktiviert Rate-Limiting (für Tests)
 *
 * Architektur:
 *   - Verschiedene Limiter für verschiedene Route-Typen
 *   - IP-basierte Identifikation für öffentliche Endpoints
 *   - Standardmäßige Response-Headers (RateLimit-*, Retry-After)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// ─── Redis-Client (Singleton) ───────────────────────────────────────────────

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

// ─── Limiter-Presets ────────────────────────────────────────────────────────

/**
 * Vordefinierte Rate-Limit-Profile für verschiedene Route-Typen.
 *
 * - checkout: Öffentlich, streng limitiert (Missbrauchsschutz)
 * - webhook:  Stripe-Webhooks, moderat (Stripe hat eigene Retry-Logik)
 * - internal: Interne/Test-Endpoints, moderat
 * - cron:     Cron-Jobs/Admin-Endpoints, großzügig
 */
export type RateLimitPreset = 'checkout' | 'webhook' | 'internal' | 'cron'

const PRESETS: Record<RateLimitPreset, { requests: number; window: string }> = {
  checkout: { requests: 5, window: '1 m' },   // 5 Requests pro Minute pro IP
  webhook:  { requests: 30, window: '1 m' },  // 30/min — Stripe kann Batches senden
  internal: { requests: 10, window: '1 m' },  // 10/min — interne Test-Endpoints
  cron:     { requests: 20, window: '1 m' },  // 20/min — Admin/Cron-Aufrufe
}

// Cache für Limiter-Instanzen (eine pro Preset)
const limiters = new Map<RateLimitPreset, Ratelimit>()

function getLimiter(preset: RateLimitPreset): Ratelimit {
  if (!limiters.has(preset)) {
    const config = PRESETS[preset]
    limiters.set(
      preset,
      new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(config.requests, config.window as `${number} ${'s' | 'ms' | 'm' | 'h' | 'd'}`),
        analytics: true,
        prefix: `ki-kompass:ratelimit:${preset}`,
      })
    )
  }
  return limiters.get(preset)!
}

// ─── IP-Extraktion ──────────────────────────────────────────────────────────

/**
 * Extrahiert die Client-IP aus dem Request.
 * Auf Vercel wird die echte Client-IP via x-forwarded-for geliefert.
 * Fallback auf x-real-ip oder 'unknown'.
 */
export function getClientIp(req: NextRequest): string {
  // Vercel setzt diesen Header automatisch
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for kann mehrere IPs enthalten: "client, proxy1, proxy2"
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

// ─── Haupt-API ──────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix-Timestamp in ms
}

/**
 * Prüft Rate-Limit für einen Request.
 *
 * @param req       — Der eingehende Request
 * @param preset    — Das Rate-Limit-Profil (checkout, webhook, cron, internal)
 * @param identifier — Optionaler custom Identifier (Standard: Client-IP)
 *
 * @returns RateLimitResult mit success=true wenn erlaubt
 */
export async function checkRateLimit(
  req: NextRequest,
  preset: RateLimitPreset,
  identifier?: string,
): Promise<RateLimitResult> {
  // Bypass für Tests
  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    return { success: true, limit: 999, remaining: 999, reset: Date.now() + 60_000 }
  }

  const id = identifier ?? getClientIp(req)
  const limiter = getLimiter(preset)

  try {
    const result = await limiter.limit(id)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    // Bei Redis-Ausfall: Request durchlassen (fail-open),
    // aber Fehler an Sentry melden
    Sentry.captureException(error, {
      tags: { flow: 'rate-limit', preset },
      level: 'warning',
    })
    console.warn(`[Rate-Limit] Redis-Fehler (fail-open):`, error)
    return { success: true, limit: 0, remaining: 0, reset: Date.now() }
  }
}

// ─── Response-Helper ────────────────────────────────────────────────────────

/**
 * Erzeugt standardkonforme Rate-Limit-Response-Headers.
 * Folgt dem draft-ietf-httpapi-ratelimit-headers Standard.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(Math.ceil((result.reset - Date.now()) / 1000)),
  }
}

/**
 * Erzeugt eine 429 Too Many Requests Response.
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

  return NextResponse.json(
    {
      error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        ...rateLimitHeaders(result),
        'Retry-After': String(retryAfter),
      },
    },
  )
}

// ─── Convenience Wrapper ────────────────────────────────────────────────────

/**
 * All-in-one Rate-Limit-Check mit automatischer 429-Response.
 *
 * Verwendung in Route-Handlern:
 *
 * ```ts
 * const rateLimitResponse = await applyRateLimit(req, 'checkout')
 * if (rateLimitResponse) return rateLimitResponse  // 429
 * // ... normaler Handler-Code
 * ```
 *
 * @returns NextResponse (429) wenn limitiert, null wenn erlaubt
 */
export async function applyRateLimit(
  req: NextRequest,
  preset: RateLimitPreset,
  identifier?: string,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(req, preset, identifier)

  if (!result.success) {
    const ip = identifier ?? getClientIp(req)
    console.warn(`[Rate-Limit] ${preset}: Limit erreicht für ${ip}`)
    Sentry.addBreadcrumb({
      category: 'rate-limit',
      message: `Rate limit exceeded: ${preset} for ${ip}`,
      level: 'warning',
    })
    return rateLimitExceededResponse(result)
  }

  return null
}
