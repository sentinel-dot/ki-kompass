/**
 * Unit-Tests: Rate-Limiting (lib/rate-limit.ts)
 *
 * Testet:
 *  - IP-Extraktion aus verschiedenen Header-Konstellationen
 *  - Test-Bypass via RATE_LIMIT_DISABLED
 *  - 429-Response-Format (JSON, Headers, Retry-After)
 *  - rateLimitHeaders() Helper
 *  - Fail-open bei Redis-Fehler
 *  - applyRateLimit() Integration
 *
 * Strategie:
 *  - @upstash/ratelimit und @upstash/redis werden gemockt
 *  - Kein echtes Redis nötig für Unit-Tests
 *  - E2E-Tests nutzen RATE_LIMIT_DISABLED=true
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock @upstash/redis
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}))

// Mock @sentry/nextjs
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}))

// Variablen für den Ratelimit-Mock
let mockLimitFn: ReturnType<typeof vi.fn>

vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: vi.fn().mockImplementation(() => ({
      limit: (...args: unknown[]) => mockLimitFn(...args),
    })),
  }
})

// ─── Helper: Fake NextRequest erzeugen ──────────────────────────────────────

function createMockRequest(headers: Record<string, string> = {}): {
  headers: { get: (name: string) => string | null }
  nextUrl: { searchParams: URLSearchParams }
} {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    nextUrl: {
      searchParams: new URLSearchParams(),
    },
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('rate-limit', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    mockLimitFn = vi.fn()
    // Stelle sicher, dass RATE_LIMIT_DISABLED nicht gesetzt ist
    delete process.env.RATE_LIMIT_DISABLED
    // Setze Upstash-Env-Variablen für Tests
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  // ─── getClientIp ────────────────────────────────────────────────────

  describe('getClientIp', () => {
    it('extrahiert IP aus x-forwarded-for (erste IP)', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      const req = createMockRequest({
        'x-forwarded-for': '1.2.3.4, 10.0.0.1, 172.16.0.1',
      })
      expect(getClientIp(req as any)).toBe('1.2.3.4')
    })

    it('extrahiert IP aus x-forwarded-for (einzelne IP)', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      const req = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
      })
      expect(getClientIp(req as any)).toBe('192.168.1.1')
    })

    it('nutzt x-real-ip als Fallback', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      const req = createMockRequest({
        'x-real-ip': '10.20.30.40',
      })
      expect(getClientIp(req as any)).toBe('10.20.30.40')
    })

    it('gibt "unknown" zurück wenn keine IP-Header vorhanden', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      const req = createMockRequest({})
      expect(getClientIp(req as any)).toBe('unknown')
    })

    it('bevorzugt x-forwarded-for über x-real-ip', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      const req = createMockRequest({
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      })
      expect(getClientIp(req as any)).toBe('1.1.1.1')
    })

    it('trimmt Whitespace aus IP-Adressen', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      const req = createMockRequest({
        'x-forwarded-for': '  3.3.3.3  ,  4.4.4.4  ',
      })
      expect(getClientIp(req as any)).toBe('3.3.3.3')
    })
  })

  // ─── RATE_LIMIT_DISABLED Bypass ─────────────────────────────────────

  describe('RATE_LIMIT_DISABLED Bypass', () => {
    it('gibt success=true zurück wenn RATE_LIMIT_DISABLED=true', async () => {
      process.env.RATE_LIMIT_DISABLED = 'true'
      const { checkRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })

      const result = await checkRateLimit(req as any, 'checkout')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(999)
      expect(result.remaining).toBe(999)
      // Stellt sicher, dass Redis NICHT aufgerufen wird
      expect(mockLimitFn).not.toHaveBeenCalled()
    })

    it('lässt Rate-Limiting aktiv wenn RATE_LIMIT_DISABLED nicht gesetzt', async () => {
      mockLimitFn.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      })

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })

      await checkRateLimit(req as any, 'checkout')

      expect(mockLimitFn).toHaveBeenCalledWith('1.2.3.4')
    })

    it('lässt Rate-Limiting aktiv wenn RATE_LIMIT_DISABLED=false', async () => {
      process.env.RATE_LIMIT_DISABLED = 'false'
      mockLimitFn.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      })

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })

      await checkRateLimit(req as any, 'checkout')

      expect(mockLimitFn).toHaveBeenCalled()
    })
  })

  // ─── rateLimitHeaders ──────────────────────────────────────────────

  describe('rateLimitHeaders', () => {
    it('erzeugt korrekte Headers', async () => {
      const { rateLimitHeaders } = await import('@/lib/rate-limit')
      const now = Date.now()
      const result = {
        success: true,
        limit: 5,
        remaining: 3,
        reset: now + 30_000,
      }

      const headers = rateLimitHeaders(result)

      expect(headers['RateLimit-Limit']).toBe('5')
      expect(headers['RateLimit-Remaining']).toBe('3')
      // Reset sollte ~30 Sekunden sein
      const resetSeconds = parseInt(headers['RateLimit-Reset'])
      expect(resetSeconds).toBeGreaterThanOrEqual(29)
      expect(resetSeconds).toBeLessThanOrEqual(31)
    })
  })

  // ─── rateLimitExceededResponse ────────────────────────────────────

  describe('rateLimitExceededResponse', () => {
    it('erzeugt 429-Response mit korrektem Body und Headers', async () => {
      const { rateLimitExceededResponse } = await import('@/lib/rate-limit')
      const now = Date.now()
      const result = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: now + 45_000,
      }

      const response = rateLimitExceededResponse(result)

      expect(response.status).toBe(429)

      const body = await response.json()
      expect(body.error).toContain('Zu viele Anfragen')
      expect(body.retryAfter).toBeGreaterThan(0)

      // Standardkonforme Headers
      expect(response.headers.get('RateLimit-Limit')).toBe('5')
      expect(response.headers.get('RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('Retry-After')).toBeTruthy()
    })
  })

  // ─── Fail-Open bei Redis-Fehler ──────────────────────────────────

  describe('Fail-Open bei Redis-Fehler', () => {
    it('lässt Request durch wenn Redis nicht erreichbar', async () => {
      mockLimitFn.mockRejectedValue(new Error('Redis connection timeout'))

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })

      const result = await checkRateLimit(req as any, 'checkout')

      expect(result.success).toBe(true)
    })

    it('meldet Redis-Fehler an Sentry', async () => {
      mockLimitFn.mockRejectedValue(new Error('Redis connection timeout'))
      const Sentry = await import('@sentry/nextjs')

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })

      await checkRateLimit(req as any, 'checkout')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: { flow: 'rate-limit', preset: 'checkout' },
        })
      )
    })
  })

  // ─── applyRateLimit (Integration) ─────────────────────────────────

  describe('applyRateLimit', () => {
    it('gibt null zurück wenn Limit nicht erreicht', async () => {
      mockLimitFn.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60_000,
      })

      const { applyRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })

      const response = await applyRateLimit(req as any, 'checkout')

      expect(response).toBeNull()
    })

    it('gibt 429-Response zurück wenn Limit erreicht', async () => {
      mockLimitFn.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60_000,
      })

      const { applyRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })

      const response = await applyRateLimit(req as any, 'checkout')

      expect(response).not.toBeNull()
      expect(response!.status).toBe(429)
    })

    it('nutzt Custom-Identifier wenn angegeben', async () => {
      mockLimitFn.mockResolvedValue({
        success: true,
        limit: 30,
        remaining: 29,
        reset: Date.now() + 60_000,
      })

      const { applyRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })

      await applyRateLimit(req as any, 'webhook', 'stripe-webhook')

      expect(mockLimitFn).toHaveBeenCalledWith('stripe-webhook')
    })

    it('gibt null zurück bei RATE_LIMIT_DISABLED=true (Test-Bypass)', async () => {
      process.env.RATE_LIMIT_DISABLED = 'true'

      const { applyRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })

      const response = await applyRateLimit(req as any, 'checkout')

      expect(response).toBeNull()
      expect(mockLimitFn).not.toHaveBeenCalled()
    })
  })

  // ─── Presets ──────────────────────────────────────────────────────

  describe('Presets', () => {
    it.each([
      ['checkout', '1.2.3.4'],
      ['webhook', '5.6.7.8'],
      ['internal', '10.0.0.1'],
      ['cron', '172.16.0.1'],
    ] as const)('unterstützt Preset "%s"', async (preset, ip) => {
      mockLimitFn.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60_000,
      })

      const { checkRateLimit } = await import('@/lib/rate-limit')
      const req = createMockRequest({ 'x-forwarded-for': ip })

      const result = await checkRateLimit(req as any, preset as any)

      expect(result.success).toBe(true)
      expect(mockLimitFn).toHaveBeenCalledWith(ip)
    })
  })
})
