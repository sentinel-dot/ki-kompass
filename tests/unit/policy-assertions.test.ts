/**
 * Unit-Tests: Policy-Assertions (Validierungs-Helpers)
 *
 * Testet die Testinfrastruktur selbst — stellt sicher, dass die
 * Prüffunktionen korrekt arbeiten.
 */

import { describe, it, expect } from 'vitest'
import {
  extractArticleReferences,
  countWords,
  countSummaryBoxes,
  containsMarkdownTable,
  validatePolicy,
} from '../helpers/policy-assertions'
import type { PolicyExpectation } from '../scenarios'

describe('extractArticleReferences', () => {
  it('extrahiert einzelne Artikel', () => {
    const refs = extractArticleReferences('Art. 5 EU AI Act und Art. 22 DSGVO')
    expect(refs).toContain('Art. 5')
    expect(refs).toContain('Art. 22')
  })

  it('extrahiert Artikelranges', () => {
    const refs = extractArticleReferences('Art. 44–49 DSGVO')
    expect(refs).toContain('Art. 44')
    expect(refs).toContain('Art. 45')
    expect(refs).toContain('Art. 49')
  })

  it('extrahiert Artikel mit Absätzen', () => {
    const refs = extractArticleReferences('Art. 6 Abs. 1 DSGVO')
    expect(refs).toContain('Art. 6')
  })

  it('dedupliziert Referenzen', () => {
    const refs = extractArticleReferences('Art. 5 EU AI Act. Nochmal Art. 5 EU AI Act.')
    const count = refs.filter(r => r === 'Art. 5').length
    expect(count).toBe(1)
  })

  it('sortiert numerisch', () => {
    const refs = extractArticleReferences('Art. 50, Art. 4, Art. 99, Art. 5')
    const nums = refs.map(r => parseInt(r.replace('Art. ', ''), 10))
    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).toBeGreaterThan(nums[i - 1])
    }
  })
})

describe('countWords', () => {
  it('zählt Wörter korrekt', () => {
    expect(countWords('Eins zwei drei vier fünf')).toBe(5)
  })

  it('ignoriert Markdown-Formatierung', () => {
    const text = '## **Kapitel** 1: _Einleitung_'
    expect(countWords(text)).toBeGreaterThanOrEqual(3)
  })

  it('gibt 0 für leeren String', () => {
    expect(countWords('')).toBe(0)
  })
})

describe('countSummaryBoxes', () => {
  it('zählt Zusammenfassungen', () => {
    const text = `
      Zusammenfassung für Mitarbeiter: Eins.
      Zusammenfassung für Mitarbeiter: Zwei.
      Zusammenfassung für Mitarbeiter: Drei.
    `
    expect(countSummaryBoxes(text)).toBe(3)
  })

  it('gibt 0 wenn keine vorhanden', () => {
    expect(countSummaryBoxes('Kein Summary hier.')).toBe(0)
  })
})

describe('containsMarkdownTable', () => {
  it('erkennt eine Markdown-Tabelle', () => {
    const table = `
| Kategorie | Erlaubt | Verboten |
|-----------|---------|----------|
| Texte     | Ja      | Nein     |
    `
    expect(containsMarkdownTable(table)).toBe(true)
  })

  it('erkennt fehlende Tabelle', () => {
    expect(containsMarkdownTable('Kein Table hier.')).toBe(false)
  })
})

describe('validatePolicy', () => {
  const minimalExpectation: PolicyExpectation = {
    requiredSections: ['Präambel'],
    requiredKeywords: ['TestFirma'],
    requiredArticles: ['Art. 5'],
    forbiddenContent: ['FALSCH'],
    minWordCount: 10,
  }

  it('bestätigt gültige Policy', () => {
    const text = `
# 1. Präambel & Zweck
Diese KI-Nutzungsrichtlinie gilt für TestFirma und basiert auf dem EU AI Act.
Art. 5 EU AI Act definiert die Verbote.
Zusammenfassung für Mitarbeiter: KI nur gemäß Richtlinie nutzen.
Zusammenfassung für Mitarbeiter: 2
Zusammenfassung für Mitarbeiter: 3
Zusammenfassung für Mitarbeiter: 4
Zusammenfassung für Mitarbeiter: 5

| Kategorie | Erlaubt |
|-----------|---------|
| Texte     | Ja      |
    `
    const result = validatePolicy(text, minimalExpectation)
    expect(result.passed).toBe(true)
    expect(result.failures).toHaveLength(0)
  })

  it('erkennt fehlendes Kapitel', () => {
    const text = 'TestFirma Art. 5 EU AI Act ' + 'wort '.repeat(20)
    const result = validatePolicy(text, minimalExpectation)
    expect(result.passed).toBe(false)
    expect(result.failures.some(f => f.category === 'section')).toBe(true)
  })

  it('erkennt fehlendes Schlüsselwort', () => {
    const text = `
# 1. Präambel
Art. 5 EU AI Act ${'wort '.repeat(20)}
| a | b |
|---|---|
| c | d |
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
    `
    const result = validatePolicy(text, minimalExpectation)
    expect(result.failures.some(f => f.category === 'keyword')).toBe(true)
  })

  it('erkennt verbotenen Inhalt', () => {
    const text = `
# 1. Präambel
TestFirma Art. 5 EU AI Act FALSCH ${'wort '.repeat(20)}
| a | b |
|---|---|
| c | d |
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
    `
    const result = validatePolicy(text, minimalExpectation)
    expect(result.failures.some(f => f.category === 'forbidden')).toBe(true)
  })

  it('erkennt zu wenig Wörter', () => {
    const tooShort: PolicyExpectation = {
      ...minimalExpectation,
      minWordCount: 5000,
    }
    const text = '# 1. Präambel\nTestFirma Art. 5 EU AI Act kurz.'
    const result = validatePolicy(text, tooShort)
    expect(result.failures.some(f => f.category === 'word-count')).toBe(true)
  })

  it('gibt stats korrekt zurück', () => {
    const text = `
# 1. Präambel
TestFirma nutzt Art. 5 EU AI Act und Art. 50 EU AI Act.
${'wort '.repeat(20)}
| a | b |
|---|---|
| c | d |
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
Zusammenfassung für Mitarbeiter: x
    `
    const result = validatePolicy(text, minimalExpectation)
    expect(result.stats.wordCount).toBeGreaterThan(0)
    expect(result.stats.articleReferencesFound).toContain('Art. 5')
    expect(result.stats.totalChecks).toBeGreaterThan(0)
  })
})
