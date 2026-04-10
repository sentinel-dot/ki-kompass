/**
 * Unit-Tests: Schemas (schemas.ts)
 *
 * Stellt sicher, dass alle Zod-Schemas die Test-Szenarien akzeptieren.
 * Wenn ein Szenario vom Schema abgelehnt wird, ist entweder
 * das Szenario oder das Schema fehlerhaft.
 */

import { describe, it, expect } from 'vitest'
import { questionnaireSchema } from '@/lib/schemas'
import { TEST_SCENARIOS } from '../scenarios'

describe('questionnaireSchema', () => {
  describe('akzeptiert alle Test-Szenarien', () => {
    for (const scenario of TEST_SCENARIOS) {
      it(`Szenario: ${scenario.name}`, () => {
        const result = questionnaireSchema.safeParse(scenario.questionnaire)
        if (!result.success) {
          console.error(
            `Schema-Fehler für "${scenario.name}":`,
            result.error.issues.map((i: { path: (string | number)[]; message: string }) => `${i.path.join('.')}: ${i.message}`)
          )
        }
        expect(result.success).toBe(true)
      })
    }
  })

  describe('lehnt ungültige Daten ab', () => {
    it('lehnt fehlenden Firmennamen ab', () => {
      const result = questionnaireSchema.safeParse({
        ...TEST_SCENARIOS[0].questionnaire,
        firmenname: '',
      })
      expect(result.success).toBe(false)
    })

    it('lehnt ungültige Branche ab', () => {
      const result = questionnaireSchema.safeParse({
        ...TEST_SCENARIOS[0].questionnaire,
        branche: 'ungueltig',
      })
      expect(result.success).toBe(false)
    })

    it('lehnt ungültigen Tier ab', () => {
      const result = questionnaireSchema.safeParse({
        ...TEST_SCENARIOS[0].questionnaire,
        tier: 'premium',
      })
      expect(result.success).toBe(false)
    })

    it('lehnt leere Länder-Array ab', () => {
      const result = questionnaireSchema.safeParse({
        ...TEST_SCENARIOS[0].questionnaire,
        laender: [],
      })
      expect(result.success).toBe(false)
    })

    it('lehnt ungültige E-Mail ab', () => {
      const result = questionnaireSchema.safeParse({
        ...TEST_SCENARIOS[0].questionnaire,
        email: 'nicht-eine-email',
      })
      expect(result.success).toBe(false)
    })
  })
})
