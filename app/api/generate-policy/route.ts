import { NextRequest, NextResponse } from 'next/server'
import { generatePolicy } from '@/lib/claude'
import { generatePolicyRequestSchema, formatZodErrors } from '@/lib/schemas'
import { applyRateLimit } from '@/lib/rate-limit'

// This route is for internal testing only — not exposed publicly
export async function POST(req: NextRequest) {
  // ── Rate-Limiting (10 Requests/Minute — interner Endpoint) ──────────
  const rateLimitResponse = await applyRateLimit(req, 'internal')
  if (rateLimitResponse) return rateLimitResponse

  // Simple auth check for testing
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody = await req.json()

    // ── Zod-Validierung ──────────────────────────────────────────────
    const parsed = generatePolicyRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Validierungsfehler: ${formatZodErrors(parsed.error)}` },
        { status: 400 }
      )
    }

    const { questionnaire } = parsed.data
    const policy = await generatePolicy(questionnaire)
    return NextResponse.json({ policy })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: `Generierung fehlgeschlagen: ${message}` }, { status: 500 })
  }
}
