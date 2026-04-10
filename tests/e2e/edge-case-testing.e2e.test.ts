/**
 * Grenzfall-Tests — Edge Case E2E Testing
 *
 * ⚠️ Diese Tests rufen die echte Claude API auf!
 *    Kosten: ~$0.20–0.50 pro Szenario (länger als Normalfälle)
 *    Laufzeit: ~45–90 Sekunden pro Szenario
 *
 * Ausführung:
 *   npm run test:e2e -- --grep "EC-"              # Alle Edge Cases
 *   npm run test:e2e -- --grep "EC-1"             # Einzelner Edge Case
 *   npm run test:e2e -- --grep "Klinik"           # Nach Name filtern
 *
 * Unterschied zu policy-generation.e2e.test.ts:
 * - Normalfälle: 80% Bestehensquote reicht
 * - Edge Cases: criticalChecks müssen 100% bestehen
 *   Jeder fehlgeschlagene criticalCheck ist ein Hard-Fail.
 *
 * Wann ausführen:
 * - Vor jedem Release
 * - Nach Änderungen an lib/prompt.ts
 * - Nach Änderungen an lib/validation.ts
 * - Wenn ein Rechtsbereich erweitert wurde
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { EDGE_CASE_SCENARIOS, type CriticalCheck } from '../edge-cases'
import {
  validatePolicy,
  formatValidationReport,
  countWords,
} from '../helpers/policy-assertions'
import { validateLegalReferences, validateContextualConsistency } from '@/lib/validation'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompt'

// ─── Setup ──────────────────────────────────────────────────────────────────

let Anthropic: typeof import('@anthropic-ai/sdk').default

beforeAll(async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      '\n⚠️  ANTHROPIC_API_KEY nicht gesetzt — Edge Case Tests werden übersprungen.\n' +
      '   Setze die Variable: ANTHROPIC_API_KEY=sk-... npm run test:e2e\n'
    )
  }

  const mod = await import('@anthropic-ai/sdk')
  Anthropic = mod.default
})

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

async function generatePolicyForTest(
  questionnaire: Record<string, unknown>
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: buildUserPrompt(questionnaire) }],
    system: SYSTEM_PROMPT,
  })

  const textBlock = message.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Keine Textantwort von Claude erhalten')
  }
  return textBlock.text
}

/**
 * Prüft alle criticalChecks und gibt fehlgeschlagene zurück.
 * mustMatch: Regex muss matchen.
 * mustNotMatch: Regex darf nicht matchen.
 */
function runCriticalChecks(
  policyText: string,
  checks: CriticalCheck[]
): { passed: CriticalCheck[]; failed: Array<{ check: CriticalCheck; foundExcerpt?: string }> } {
  const passed: CriticalCheck[] = []
  const failed: Array<{ check: CriticalCheck; foundExcerpt?: string }> = []

  for (const check of checks) {
    if (check.mustMatch) {
      const match = check.mustMatch.exec(policyText)
      if (match) {
        passed.push(check)
      } else {
        failed.push({ check })
      }
    }

    if (check.mustNotMatch) {
      const match = check.mustNotMatch.exec(policyText)
      if (!match) {
        passed.push(check)
      } else {
        // Zeige wo der verbotene Inhalt gefunden wurde
        const excerpt = policyText.slice(
          Math.max(0, match.index - 60),
          match.index + match[0].length + 60
        )
        failed.push({ check, foundExcerpt: `...${excerpt}...` })
      }
    }
  }

  return { passed, failed }
}

/**
 * Formatiert den Edge-Case-Report für CI-Logs.
 * Detaillierter als der Standard-Report, mit Rationale und Critical-Check-Details.
 */
function formatEdgeCaseReport(
  scenarioName: string,
  rationale: string,
  policyText: string,
  criticalResult: ReturnType<typeof runCriticalChecks>,
  contentResult: ReturnType<typeof validatePolicy>
): string {
  const lines = [
    `\n${'═'.repeat(80)}`,
    `EDGE CASE: ${scenarioName}`,
    `Rationale: ${rationale}`,
    `${'─'.repeat(80)}`,
    `Wörter: ${countWords(policyText)} | Zeichen: ${policyText.length}`,
    `Critical Checks: ${criticalResult.passed.length}/${criticalResult.passed.length + criticalResult.failed.length} bestanden`,
    `Content Checks: ${contentResult.stats.passedChecks}/${contentResult.stats.totalChecks} bestanden`,
    `Artikel referenziert: ${contentResult.stats.articleReferencesFound.join(', ')}`,
  ]

  if (criticalResult.failed.length > 0) {
    lines.push(`\n❌ FEHLGESCHLAGENE CRITICAL CHECKS (${criticalResult.failed.length}):`)
    for (const { check, foundExcerpt } of criticalResult.failed) {
      lines.push(`  → ${check.description}`)
      if (check.mustMatch) {
        lines.push(`    Pattern: ${check.mustMatch}`)
        lines.push(`    Status: NICHT GEFUNDEN im Text`)
      }
      if (check.mustNotMatch) {
        lines.push(`    Pattern: ${check.mustNotMatch}`)
        lines.push(`    Status: GEFUNDEN (sollte nicht da sein)`)
        if (foundExcerpt) {
          lines.push(`    Fundstelle: "${foundExcerpt}"`)
        }
      }
    }
  } else {
    lines.push(`\n✅ Alle Critical Checks bestanden`)
  }

  if (contentResult.failures.length > 0) {
    const criticalContentFailures = contentResult.failures.filter(
      f => f.category === 'forbidden' || f.category === 'article'
    )
    const nonCriticalFailures = contentResult.failures.filter(
      f => f.category !== 'forbidden' && f.category !== 'article'
    )

    if (criticalContentFailures.length > 0) {
      lines.push(`\n❌ KRITISCHE CONTENT-FEHLER:`)
      for (const f of criticalContentFailures) {
        lines.push(`  [${f.category}] ${f.message}`)
        if (f.actual) lines.push(`    Tatsächlich: ${f.actual}`)
      }
    }

    if (nonCriticalFailures.length > 0) {
      lines.push(`\n⚠️  Nicht-kritische Content-Fehler (${nonCriticalFailures.length}):`)
      for (const f of nonCriticalFailures) {
        lines.push(`  [${f.category}] ${f.message}`)
      }
    }
  }

  lines.push('═'.repeat(80))
  return lines.join('\n')
}

// ─── Edge Case Test Suite ────────────────────────────────────────────────────

describe('Edge Case Testing — Grenzfälle', () => {
  for (const scenario of EDGE_CASE_SCENARIOS) {
    it(
      `${scenario.name}`,
      async () => {
        if (!process.env.ANTHROPIC_API_KEY) {
          return
        }

        // 1. Policy generieren
        console.log(`\n⚡ Generiere Edge Case: ${scenario.name}`)
        console.log(`   Rationale: ${scenario.rationale.slice(0, 120)}...`)
        const startTime = Date.now()

        const policyText = await generatePolicyForTest(
          scenario.questionnaire as unknown as Record<string, unknown>
        )

        const duration = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`   ✓ Generiert in ${duration}s (${policyText.length} Zeichen)`)

        // 2. Rechtliche Validierung (Whitelist + Kontext-Checks)
        const legalValidation = validateLegalReferences(policyText)
        const contextValidation = validateContextualConsistency(
          policyText,
          scenario.questionnaire as unknown as Record<string, unknown>
        )

        const allLegalErrors = [...legalValidation.errors, ...contextValidation.errors]
        if (allLegalErrors.length > 0) {
          console.warn(
            `   ⚠️  Rechtliche Validierungsfehler (${allLegalErrors.length}):`,
            allLegalErrors.map(e => `\n      - ${e.message}`)
          )
        }

        // Rechtliche Validierung ist ein Hard-Fail (kein 80%-Kompromiss)
        expect(
          legalValidation.valid,
          `Rechtsreferenz-Validierung fehlgeschlagen:\n` +
          legalValidation.errors.map(e => `  - ${e.message} ("${e.excerpt}")`).join('\n')
        ).toBe(true)

        expect(
          contextValidation.valid,
          `Kontext-Validierung fehlgeschlagen:\n` +
          contextValidation.errors.map(e => `  - ${e.message} ("${e.excerpt}")`).join('\n')
        ).toBe(true)

        // 3. Standard Content-Validierung
        const contentResult = validatePolicy(policyText, scenario.expected)

        // 4. Critical Checks — der Kern der Edge Case Tests
        const criticalResult = runCriticalChecks(policyText, scenario.expected.criticalChecks)

        // 5. Report ausgeben
        const report = formatEdgeCaseReport(
          scenario.name,
          scenario.rationale,
          policyText,
          criticalResult,
          contentResult
        )
        console.log(report)

        // 6. Assertions
        //
        // Critical Checks: 100% müssen bestehen — kein Kompromiss
        expect(
          criticalResult.failed.length,
          `${criticalResult.failed.length} Critical Check(s) fehlgeschlagen:\n` +
          criticalResult.failed.map(({ check, foundExcerpt }) => {
            const base = `  → ${check.description}`
            return foundExcerpt ? `${base}\n    Fundstelle: "${foundExcerpt}"` : base
          }).join('\n')
        ).toBe(0)

        // Verbotener Content: Hard-Fail
        const forbiddenFailures = contentResult.failures.filter(f => f.category === 'forbidden')
        expect(
          forbiddenFailures.length,
          `Verbotener Inhalt gefunden:\n` +
          forbiddenFailures.map(f => `  - ${f.message}`).join('\n')
        ).toBe(0)

        // Fehlende Pflicht-Artikel: Hard-Fail
        const articleFailures = contentResult.failures.filter(f => f.category === 'article')
        expect(
          articleFailures.length,
          `Erwartete Artikel fehlen:\n` +
          articleFailures.map(f => `  - ${f.message}`).join('\n')
        ).toBe(0)

        // Wortanzahl: Hard-Fail (Policy wäre zu kurz um brauchbar zu sein)
        const wordCountFailure = contentResult.failures.find(f => f.category === 'word-count')
        expect(
          wordCountFailure,
          wordCountFailure?.message ?? ''
        ).toBeUndefined()

        // Non-critical checks (sections, keywords, appendices): 75% reicht
        // (Edge Cases haben absichtlich extremere Kombinationen)
        const nonCriticalFailures = contentResult.failures.filter(
          f => !['forbidden', 'article', 'word-count'].includes(f.category)
        )
        const nonCriticalTotal = contentResult.stats.totalChecks -
          (scenario.expected.requiredArticles.length) -
          (scenario.expected.forbiddenContent.length) -
          1 // word count

        const nonCriticalPassed = nonCriticalTotal - nonCriticalFailures.length
        const passRate = nonCriticalTotal > 0
          ? nonCriticalPassed / nonCriticalTotal
          : 1

        expect(
          passRate,
          `Non-critical Bestehensquote: ${(passRate * 100).toFixed(0)}% (75% benötigt).\n` +
          `Fehlende Checks:\n` +
          nonCriticalFailures.map(f => `  [${f.category}] ${f.message}`).join('\n')
        ).toBeGreaterThanOrEqual(0.75)
      },
      // Großzügiges Timeout: Edge Cases sind komplexer und Claude braucht mehr Zeit
      150_000
    )
  }
})

// ─── Zusammenfassungs-Report ─────────────────────────────────────────────────

describe('Edge Case — Zusammenfassungs-Metriken', () => {
  it(
    'Alle Edge Cases: Gesamtübersicht (nur wenn API-Key vorhanden)',
    async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('\n⚠️  Kein ANTHROPIC_API_KEY — Zusammenfassungs-Test übersprungen.')
        return
      }

      console.log('\n' + '═'.repeat(80))
      console.log('EDGE CASE ÜBERSICHT')
      console.log('═'.repeat(80))
      console.log(`Szenarien: ${EDGE_CASE_SCENARIOS.length}`)
      console.log('')

      for (const scenario of EDGE_CASE_SCENARIOS) {
        console.log(`  ${scenario.name}`)
        console.log(`  Critical Checks: ${scenario.expected.criticalChecks.length}`)
        console.log(`  Pflicht-Artikel: ${scenario.expected.requiredArticles.length}`)
        console.log(`  Verbotener Content: ${scenario.expected.forbiddenContent.length} Patterns`)
        console.log(`  Min. Wörter: ${scenario.expected.minWordCount}`)
        console.log('')
      }

      // Dieser Test ist immer ein Pass — er ist nur ein Reporting-Test
      expect(EDGE_CASE_SCENARIOS.length).toBeGreaterThan(0)
    },
    5_000
  )
})
