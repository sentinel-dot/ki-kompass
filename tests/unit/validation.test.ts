/**
 * Unit-Tests: Validierung (validation.ts)
 *
 * Testet die Post-Generation-Validierung isoliert — ohne Claude API.
 * Stellt sicher, dass:
 * - Korrekte Policies als valide erkannt werden
 * - Falsche Artikelreferenzen erkannt werden
 * - Bekannte LLM-Fehler gefangen werden
 * - Edge-Cases korrekt behandelt werden
 */

import { describe, it, expect } from 'vitest'
import { validateLegalReferences, buildCorrectionPrompt } from '@/lib/validation'

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

/** Erzeugt einen minimalen Policy-Text mit bestimmten Artikelreferenzen */
function policyWith(references: string): string {
  return `
# KI-Nutzungsrichtlinie

## 1. Präambel
Diese Richtlinie basiert auf den Anforderungen der DSGVO und des EU AI Act.

${references}

## 2. Definitionen
KI-System gemäß Art. 3 Nr. 1 EU AI Act.
  `.trim()
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('validateLegalReferences', () => {
  describe('Gültige Referenzen', () => {
    it('akzeptiert korrekte EU AI Act Artikel', () => {
      const text = policyWith(`
        Gemäß Art. 4 EU AI Act (AI Literacy) müssen Mitarbeiter geschult werden.
        Art. 5 EU AI Act definiert 8 Verbote.
        Art. 50 EU AI Act regelt die Transparenzpflichten.
        Art. 99 EU AI Act definiert die Bußgelder.
      `)
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.totalReferences).toBeGreaterThan(0)
    })

    it('akzeptiert korrekte DSGVO Artikel', () => {
      const text = policyWith(`
        Art. 5 DSGVO regelt die Grundsätze der Datenverarbeitung.
        Art. 6 DSGVO definiert die Rechtsgrundlagen.
        Art. 22 DSGVO betrifft automatisierte Einzelentscheidungen.
        Art. 33 DSGVO setzt die 72-Stunden Meldepflicht.
        Art. 35 DSGVO fordert eine DSFA bei hohem Risiko.
        Art. 44–49 DSGVO regeln Drittlandtransfers.
      `)
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('akzeptiert Artikelranges (Art. 44–49)', () => {
      const text = policyWith('Art. 44–49 DSGVO regeln Drittlandtransfers.')
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(true)
    })

    it('akzeptiert Artikel mit Absatz-Nummern (Art. 6 Abs. 1)', () => {
      const text = policyWith('Art. 6 Abs. 1 DSGVO ist die Rechtsgrundlage.')
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(true)
    })
  })

  describe('Ungültige Referenzen', () => {
    it('erkennt nicht-existierende EU AI Act Artikel', () => {
      const text = policyWith('Art. 200 EU AI Act ist relevant.')
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'invalid-article')).toBe(true)
      expect(result.errors[0].message).toContain('200')
    })

    it('erkennt nicht-existierende DSGVO Artikel', () => {
      const text = policyWith('Art. 150 DSGVO ist wichtig.')
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'invalid-article')).toBe(true)
    })
  })

  describe('Bekannte LLM-Fehler', () => {
    it('erkennt Art. 52 als falschen Transparenz-Artikel', () => {
      const text = policyWith(
        'Gemäß Art. 52 EU AI Act bestehen Transparenzpflichten für alle KI-Systeme.'
      )
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e =>
        e.type === 'known-error' && e.message.includes('Art. 52')
      )).toBe(true)
    })

    it('erkennt falsche Datierung von Art. 4 auf 2026', () => {
      const text = policyWith(
        'Art. 4 EU AI Act gilt ab 2026 und verpflichtet zur AI Literacy.'
      )
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e =>
        e.type === 'known-error' && e.message.includes('2025')
      )).toBe(true)
    })

    it('erkennt "3 Verbote" statt 8 für Art. 5', () => {
      const text = policyWith(
        'Art. 5 EU AI Act definiert drei Verbote für KI-Systeme.'
      )
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e =>
        e.type === 'known-error' && e.message.includes('8 Verbote')
      )).toBe(true)
    })
  })

  describe('EU-Verordnungsnummern', () => {
    it('akzeptiert korrekte Verordnungsnummern', () => {
      const text = policyWith(`
        Verordnung (EU) 2024/1689 (EU AI Act) und
        Verordnung (EU) 2016/679 (DSGVO).
      `)
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(true)
    })

    it('erkennt erfundene Verordnungsnummern', () => {
      const text = policyWith('Verordnung (EU) 2023/999 regelt KI-Einsätze.')
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e =>
        e.type === 'suspicious-reference' && e.message.includes('2023/999')
      )).toBe(true)
    })
  })

  describe('Edge-Cases', () => {
    it('behandelt leeren Text ohne Fehler', () => {
      const result = validateLegalReferences('')
      expect(result.valid).toBe(true)
      expect(result.totalReferences).toBe(0)
    })

    it('behandelt Text ohne Artikelreferenzen', () => {
      const result = validateLegalReferences('Dies ist ein normaler Text ohne Rechtsreferenzen.')
      expect(result.valid).toBe(true)
      expect(result.totalReferences).toBe(0)
    })

    it('behandelt mehrere Fehler in einem Text', () => {
      const text = policyWith(`
        Art. 52 EU AI Act regelt die Transparenzpflichten.
        Art. 200 EU AI Act ist relevant.
        Verordnung (EU) 2023/999 ist wichtig.
      `)
      const result = validateLegalReferences(text)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('buildCorrectionPrompt', () => {
  it('enthält die gefundenen Fehler', () => {
    const prompt = buildCorrectionPrompt('Test-Policy', [
      {
        type: 'known-error',
        message: 'Art. 52 wird fälschlich als Transparenz-Artikel zitiert.',
        excerpt: 'Art. 52 EU AI Act',
      },
    ])
    expect(prompt).toContain('Art. 52')
    expect(prompt).toContain('Test-Policy')
    expect(prompt).toContain('Transparenz')
  })

  it('enthält die Korrekturregeln', () => {
    const prompt = buildCorrectionPrompt('Policy', [
      {
        type: 'invalid-article',
        message: 'Test-Fehler',
        excerpt: 'Test',
      },
    ])
    expect(prompt).toContain('Art. 50')
    expect(prompt).toContain('2. Februar 2025')
    expect(prompt).toContain('8 Verbote')
  })
})
