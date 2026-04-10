/**
 * Unit-Tests: Prompt-Erstellung (prompt.ts)
 *
 * Testet, dass Prompts korrekt aus Fragebogen-Daten erstellt werden.
 */

import { describe, it, expect } from 'vitest'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompt'

describe('SYSTEM_PROMPT', () => {
  it('enthält alle 12 Pflichtkapitel', () => {
    const chapters = [
      'Präambel & Zweck',
      'Definitionen',
      'Erlaubte und verbotene Nutzung',
      'Freigegebene Tools & Zugangsregeln',
      'Datenschutz & Datenklassifikation',
      'Qualitätssicherung & menschliche Kontrolle',
      'Geistiges Eigentum & Urheberrecht',
      'Transparenz & Kennzeichnung',
      'Verantwortlichkeiten & Governance',
      'Schulung & Awareness',
      'Verstöße & Konsequenzen',
      'Überprüfung & Aktualisierung',
    ]
    for (const chapter of chapters) {
      expect(SYSTEM_PROMPT).toContain(chapter)
    }
  })

  it('enthält korrekte EU AI Act Deadlines', () => {
    expect(SYSTEM_PROMPT).toContain('2. FEBRUAR 2025')
    expect(SYSTEM_PROMPT).toContain('2. AUGUST 2026')
  })

  it('verbietet Art. 52 als Transparenz-Artikel', () => {
    expect(SYSTEM_PROMPT).toContain('Art. 52 ist KEIN Transparenz-Artikel')
  })

  it('enthält alle Branchen-spezifischen Anpassungen', () => {
    const branches = ['gesundheit', 'finanzen', 'logistik', 'oeffentlich', 'handel', 'bildung', 'bau', 'it']
    for (const branch of branches) {
      expect(SYSTEM_PROMPT.toLowerCase()).toContain(branch)
    }
  })

  it('erwähnt korrekte DSGVO-Artikel', () => {
    expect(SYSTEM_PROMPT).toContain('Art. 5:')
    expect(SYSTEM_PROMPT).toContain('Art. 6:')
    expect(SYSTEM_PROMPT).toContain('Art. 22:')
    expect(SYSTEM_PROMPT).toContain('Art. 33:')
    expect(SYSTEM_PROMPT).toContain('Art. 35:')
    expect(SYSTEM_PROMPT).toContain('Art. 44–49:')
  })

  it('enthält Schweiz-Sonderfall', () => {
    expect(SYSTEM_PROMPT).toContain('Schweiz')
    expect(SYSTEM_PROMPT).toContain('revDSG')
  })

  it('enthält Anweisungen für Risikotoleranz-Stufen', () => {
    expect(SYSTEM_PROMPT).toContain('innovationsfreundlich')
    expect(SYSTEM_PROMPT).toContain('ausgewogen')
    expect(SYSTEM_PROMPT).toContain('restriktiv')
  })
})

describe('buildUserPrompt', () => {
  it('enthält JSON-formatierte Fragebogen-Daten', () => {
    const data = { firmenname: 'Test GmbH', branche: 'it' }
    const prompt = buildUserPrompt(data)
    expect(prompt).toContain('Test GmbH')
    expect(prompt).toContain('"branche": "it"')
    expect(prompt).toContain('```json')
  })

  it('enthält alle übergebenen Felder', () => {
    const data = {
      firmenname: 'Acme Corp',
      branche: 'finanzen',
      mitarbeiter: '500+',
      laender: ['deutschland', 'oesterreich'],
      tier: 'professional',
    }
    const prompt = buildUserPrompt(data)
    expect(prompt).toContain('Acme Corp')
    expect(prompt).toContain('finanzen')
    expect(prompt).toContain('500+')
    expect(prompt).toContain('deutschland')
    expect(prompt).toContain('professional')
  })

  it('escaped Sonderzeichen in JSON korrekt', () => {
    const data = { firmenname: 'Test "Firma" GmbH & Co. KG' }
    const prompt = buildUserPrompt(data)
    // JSON.stringify escapes quotes
    expect(prompt).toContain('Test \\"Firma\\" GmbH & Co. KG')
  })
})
