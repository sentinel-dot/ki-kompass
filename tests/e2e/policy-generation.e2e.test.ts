/**
 * E2E-Tests: Policy-Generierung gegen Claude API
 *
 * ⚠️ Diese Tests rufen die echte Claude API auf!
 * - Benötigt ANTHROPIC_API_KEY als Umgebungsvariable
 * - Jeder Test kostet API-Credits (~$0.10-0.30 pro Szenario)
 * - Laufzeit: ~30-60 Sekunden pro Szenario
 *
 * Ausführung:
 *   npm run test:e2e                    # Alle Szenarien
 *   npm run test:e2e -- --grep "Schweiz" # Einzelnes Szenario
 *
 * Wird NICHT bei jedem Commit ausgeführt, sondern:
 * - Bei Prompt-Änderungen (lib/prompt.ts)
 * - Bei Validierungs-Änderungen (lib/validation.ts)
 * - Vor Releases
 * - Manuell via `npm run test:e2e`
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { TEST_SCENARIOS } from '../scenarios'
import {
  validatePolicy,
  formatValidationReport,
} from '../helpers/policy-assertions'
import { validateLegalReferences } from '@/lib/validation'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompt'

// ─── Setup ──────────────────────────────────────────────────────────────────

let Anthropic: typeof import('@anthropic-ai/sdk').default

beforeAll(async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      '\n⚠️  ANTHROPIC_API_KEY nicht gesetzt — E2E-Tests werden übersprungen.\n' +
      '   Setze die Variable und starte erneut: ANTHROPIC_API_KEY=sk-... npm run test:e2e\n'
    )
  }

  // Dynamischer Import, damit Unit-Tests ohne das SDK laufen
  const mod = await import('@anthropic-ai/sdk')
  Anthropic = mod.default
})

// ─── Hilfsfunktion: Policy generieren ───────────────────────────────────────

async function generatePolicyForTest(
  questionnaire: Record<string, unknown>
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(questionnaire),
      },
    ],
    system: SYSTEM_PROMPT,
  })

  const textBlock = message.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Keine Textantwort von Claude erhalten')
  }
  return textBlock.text
}

// ─── Test-Suite ─────────────────────────────────────────────────────────────

describe('Policy-Generierung E2E', () => {
  // Teste alle 15 Szenarien
  for (const scenario of TEST_SCENARIOS) {
    it(
      `${scenario.name}: ${scenario.description}`,
      async () => {
        // Skip wenn kein API-Key
        if (!process.env.ANTHROPIC_API_KEY) {
          return
        }

        // 1. Policy generieren
        console.log(`\n🔄 Generiere Policy für: ${scenario.name}...`)
        const startTime = Date.now()
        const policyText = await generatePolicyForTest(scenario.questionnaire as unknown as Record<string, unknown>)
        const duration = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`   ✅ Generiert in ${duration}s (${policyText.length} Zeichen)`)

        // 2. Rechtsreferenzen validieren (gleiche Logik wie in Produktion)
        const legalValidation = validateLegalReferences(policyText)
        if (!legalValidation.valid) {
          console.warn(
            `   ⚠️  Rechtsreferenz-Fehler:`,
            legalValidation.errors.map(e => e.message)
          )
        }
        expect(
          legalValidation.valid,
          `Rechtsreferenz-Validierung fehlgeschlagen:\n${legalValidation.errors.map(e => `  - ${e.message} ("${e.excerpt}")`).join('\n')}`
        ).toBe(true)

        // 3. Inhaltsvalidierung gegen Szenario-Erwartungen
        const contentValidation = validatePolicy(policyText, scenario.expected)
        const report = formatValidationReport(scenario.name, contentValidation)
        console.log(report)

        // Soft-Assertions: Wir loggen alle Fehler, aber die kritischen müssen bestehen
        const criticalFailures = contentValidation.failures.filter(
          f => f.category === 'forbidden' || f.category === 'article'
        )
        
        expect(
          criticalFailures.length,
          `Kritische Fehler:\n${criticalFailures.map(f => `  [${f.category}] ${f.message}`).join('\n')}`
        ).toBe(0)

        // Non-critical checks: mindestens 80% der Checks müssen bestehen
        const passRate = contentValidation.stats.passedChecks / contentValidation.stats.totalChecks
        expect(
          passRate,
          `Nur ${(passRate * 100).toFixed(0)}% der Checks bestanden (80% benötigt).\n` +
          `Fehlende Checks:\n${contentValidation.failures.map(f => `  [${f.category}] ${f.message}`).join('\n')}`
        ).toBeGreaterThanOrEqual(0.8)
      },
      // Timeout: 120 Sekunden pro Szenario (Claude kann langsam sein)
      120_000
    )
  }
})
