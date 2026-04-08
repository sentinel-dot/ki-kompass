import { NextRequest, NextResponse } from 'next/server'
import { generatePolicy } from '@/lib/claude'

// This route is for internal testing only — not exposed publicly
export async function POST(req: NextRequest) {
  // Simple auth check for testing
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { questionnaire } = await req.json()
    const policy = await generatePolicy(questionnaire)
    return NextResponse.json({ policy })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: `Generierung fehlgeschlagen: ${message}` }, { status: 500 })
  }
}
