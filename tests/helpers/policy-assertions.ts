/**
 * Policy-Validierungs-Helpers für Tests
 *
 * Utility-Funktionen, die Claude-Output gegen erwartete Inhalte prüfen.
 * Werden sowohl in Unit-Tests als auch in E2E-Tests verwendet.
 */

import type { PolicyExpectation } from '../scenarios'

// ─── Ergebnis-Typen ─────────────────────────────────────────────────────────

export interface AssertionFailure {
  category: 'section' | 'keyword' | 'article' | 'forbidden' | 'word-count' | 'appendix' | 'structure'
  message: string
  expected?: string
  actual?: string
}

export interface PolicyValidationResult {
  passed: boolean
  failures: AssertionFailure[]
  stats: {
    wordCount: number
    sectionCount: number
    articleReferencesFound: string[]
    totalChecks: number
    passedChecks: number
  }
}

// ─── Kapitelstruktur-Erkennung ──────────────────────────────────────────────

/**
 * Alle 12 Pflichtkapitel aus dem System-Prompt.
 * Wird zum Prüfen der Vollständigkeit verwendet.
 */
export const REQUIRED_CHAPTER_PATTERNS: Record<string, RegExp> = {
  'Präambel & Zweck': /(?:^|\n)#+ *\d*\.?\d* *Präambel|(?:^|\n)#+ *\d*\.?\d* *Zweck/im,
  'Definitionen': /(?:^|\n)#+ *\d*\.?\d* *Definition/im,
  'Erlaubte und verbotene Nutzung': /(?:^|\n)#+ *\d*\.?\d* *(?:Erlaubte|Verbotene|Erlaubte und verbotene) Nutzung/im,
  'Freigegebene Tools & Zugangsregeln': /(?:^|\n)#+ *\d*\.?\d* *(?:Freigegebene|Genehmigte|Zugelassene) Tools/im,
  'Datenschutz & Datenklassifikation': /(?:^|\n)#+ *\d*\.?\d* *Datenschutz/im,
  'Qualitätssicherung & menschliche Kontrolle': /(?:^|\n)#+ *\d*\.?\d* *Qualitätssicherung/im,
  'Geistiges Eigentum & Urheberrecht': /(?:^|\n)#+ *\d*\.?\d* *(?:Geistiges Eigentum|Urheberrecht)/im,
  'Transparenz & Kennzeichnung': /(?:^|\n)#+ *\d*\.?\d* *Transparenz/im,
  'Verantwortlichkeiten & Governance': /(?:^|\n)#+ *\d*\.?\d* *(?:Verantwortlichkeiten|Governance)/im,
  'Schulung & Awareness': /(?:^|\n)#+ *\d*\.?\d* *Schulung/im,
  'Verstöße & Konsequenzen': /(?:^|\n)#+ *\d*\.?\d* *(?:Verstoß|Verstöße|Konsequenz)/im,
  'Überprüfung & Aktualisierung': /(?:^|\n)#+ *\d*\.?\d* *(?:Überprüfung|Aktualisierung)/im,
}

/**
 * Anhang-Patterns
 */
export const APPENDIX_PATTERNS: Record<string, RegExp> = {
  'Interne KI-Systeme': /(?:Anhang|Appendix|Anlage)\s*[A-C]?\s*[:\-—]?\s*Interne KI/im,
  'Compliance-Checkliste': /(?:Anhang|Appendix|Anlage)\s*[A-C]?\s*[:\-—]?\s*(?:EU AI Act )?Compliance|Checkliste/im,
  'Schulungsvorlage': /(?:Anhang|Appendix|Anlage)\s*[A-C]?\s*[:\-—]?\s*(?:Mitarbeiter[- ])?Schulung|5 goldene Regeln/im,
}

// ─── Artikel-Extraktion ─────────────────────────────────────────────────────

/**
 * Extrahiert alle referenzierten Artikelnummern aus dem Policy-Text.
 * Gibt ein Array von Strings wie "Art. 4", "Art. 22", "Art. 50" zurück.
 */
export function extractArticleReferences(text: string): string[] {
  const regex = /Art(?:ikel)?\.?\s*(\d+)(?:\s*[-–]\s*(\d+))?/gi
  const found = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : start
    for (let i = start; i <= end; i++) {
      found.add(`Art. ${i}`)
    }
  }

  return Array.from(found).sort((a, b) => {
    const numA = parseInt(a.replace('Art. ', ''), 10)
    const numB = parseInt(b.replace('Art. ', ''), 10)
    return numA - numB
  })
}

// ─── Wortanzahl ─────────────────────────────────────────────────────────────

export function countWords(text: string): number {
  return text
    .replace(/[#*_|`\-–—]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .length
}

// ─── Zusammenfassung-für-Mitarbeiter-Check ──────────────────────────────────

/**
 * Prüft, ob jedes Kapitel eine "Zusammenfassung für Mitarbeiter" enthält.
 * Der System-Prompt verlangt das.
 */
export function countSummaryBoxes(text: string): number {
  const matches = text.match(/Zusammenfassung für Mitarbeiter/gi)
  return matches ? matches.length : 0
}

// ─── Tabellen-Check ─────────────────────────────────────────────────────────

/**
 * Prüft ob der Policy-Text Markdown-Tabellen enthält.
 * Kapitel 3 (Erlaubte/Verbotene Nutzung) soll eine Tabelle haben.
 */
export function containsMarkdownTable(text: string): boolean {
  // Markdown-Tabelle: Zeile mit Pipes, gefolgt von Separator-Zeile
  return /\|[^|]+\|[^|]+\|[\s\S]*?\|[\s-:]+\|[\s-:]+\|/m.test(text)
}

// ─── Hauptvalidierung ───────────────────────────────────────────────────────

/**
 * Validiert einen Policy-Text vollständig gegen die Erwartungen eines Szenarios.
 *
 * Prüft:
 * 1. Pflichtkapitel vorhanden
 * 2. Schlüsselwörter enthalten
 * 3. Artikelreferenzen korrekt
 * 4. Verbotene Inhalte abwesend
 * 5. Mindestlänge erreicht
 * 6. Pflicht-Anhänge vorhanden (falls definiert)
 * 7. Strukturelle Anforderungen (Tabelle, Zusammenfassungen)
 */
export function validatePolicy(
  policyText: string,
  expected: PolicyExpectation
): PolicyValidationResult {
  const failures: AssertionFailure[] = []
  let totalChecks = 0

  const wordCount = countWords(policyText)
  const articleRefs = extractArticleReferences(policyText)

  // ── 1. Pflichtkapitel prüfen ──────────────────────────────────────────────

  for (const section of expected.requiredSections) {
    totalChecks++
    // Suche nach dem Kapitel-Namen in den bekannten Patterns oder als Substring
    const pattern = Object.entries(REQUIRED_CHAPTER_PATTERNS)
      .find(([key]) => key.toLowerCase().includes(section.toLowerCase()))
    
    if (pattern) {
      if (!pattern[1].test(policyText)) {
        failures.push({
          category: 'section',
          message: `Pflichtkapitel "${section}" fehlt im Policy-Text.`,
          expected: section,
        })
      }
    } else {
      // Fallback: direkter Substring-Check
      if (!policyText.toLowerCase().includes(section.toLowerCase())) {
        failures.push({
          category: 'section',
          message: `Pflichtkapitel "${section}" fehlt im Policy-Text.`,
          expected: section,
        })
      }
    }
  }

  // ── 2. Schlüsselwörter prüfen ─────────────────────────────────────────────

  for (const keyword of expected.requiredKeywords) {
    totalChecks++
    if (!policyText.includes(keyword)) {
      // Case-insensitive Fallback
      if (!policyText.toLowerCase().includes(keyword.toLowerCase())) {
        failures.push({
          category: 'keyword',
          message: `Schlüsselwort "${keyword}" fehlt im Policy-Text.`,
          expected: keyword,
        })
      }
    }
  }

  // ── 3. Artikelreferenzen prüfen ───────────────────────────────────────────

  for (const article of expected.requiredArticles) {
    totalChecks++
    if (!articleRefs.includes(article)) {
      failures.push({
        category: 'article',
        message: `Erwartete Artikelreferenz "${article}" fehlt im Policy-Text.`,
        expected: article,
        actual: `Gefundene Artikel: ${articleRefs.join(', ')}`,
      })
    }
  }

  // ── 4. Verbotene Inhalte prüfen ───────────────────────────────────────────

  for (const forbidden of expected.forbiddenContent) {
    totalChecks++
    if (policyText.includes(forbidden)) {
      // Kontext extrahieren für bessere Fehlermeldung
      const idx = policyText.indexOf(forbidden)
      const context = policyText.slice(Math.max(0, idx - 50), idx + forbidden.length + 50)
      failures.push({
        category: 'forbidden',
        message: `Verbotener Inhalt "${forbidden}" gefunden.`,
        expected: 'Nicht enthalten',
        actual: `...${context}...`,
      })
    }
  }

  // ── 5. Mindestlänge prüfen ────────────────────────────────────────────────

  totalChecks++
  if (wordCount < expected.minWordCount) {
    failures.push({
      category: 'word-count',
      message: `Policy hat nur ${wordCount} Wörter (Minimum: ${expected.minWordCount}).`,
      expected: `>= ${expected.minWordCount} Wörter`,
      actual: `${wordCount} Wörter`,
    })
  }

  // ── 6. Pflicht-Anhänge prüfen ─────────────────────────────────────────────

  if (expected.requiredAppendices) {
    for (const appendix of expected.requiredAppendices) {
      totalChecks++
      const pattern = APPENDIX_PATTERNS[appendix]
      if (pattern) {
        if (!pattern.test(policyText)) {
          failures.push({
            category: 'appendix',
            message: `Pflicht-Anhang "${appendix}" fehlt.`,
            expected: appendix,
          })
        }
      } else {
        // Fallback
        if (!policyText.toLowerCase().includes(appendix.toLowerCase())) {
          failures.push({
            category: 'appendix',
            message: `Pflicht-Anhang "${appendix}" fehlt.`,
            expected: appendix,
          })
        }
      }
    }
  }

  // ── 7. Strukturprüfung: Tabelle in Kapitel 3 ─────────────────────────────

  totalChecks++
  if (!containsMarkdownTable(policyText)) {
    failures.push({
      category: 'structure',
      message: 'Keine Markdown-Tabelle gefunden (Kapitel 3 sollte Erlaubt/Eingeschränkt/Verboten als Tabelle darstellen).',
    })
  }

  // ── 8. Zusammenfassungen prüfen ───────────────────────────────────────────

  totalChecks++
  const summaryCount = countSummaryBoxes(policyText)
  if (summaryCount < 5) {
    failures.push({
      category: 'structure',
      message: `Nur ${summaryCount} "Zusammenfassung für Mitarbeiter"-Boxen gefunden (mindestens 5 erwartet).`,
      expected: '>= 5',
      actual: `${summaryCount}`,
    })
  }

  // ── Ergebnis ──────────────────────────────────────────────────────────────

  // Zähle Kapitel via Regex
  const sectionCount = (policyText.match(/(?:^|\n)#+\s+\d+/gm) || []).length

  return {
    passed: failures.length === 0,
    failures,
    stats: {
      wordCount,
      sectionCount,
      articleReferencesFound: articleRefs,
      totalChecks,
      passedChecks: totalChecks - failures.length,
    },
  }
}

// ─── Report-Formatter ───────────────────────────────────────────────────────

/**
 * Formatiert ein Validierungsergebnis als lesbaren String (für CI-Logs).
 */
export function formatValidationReport(
  scenarioName: string,
  result: PolicyValidationResult
): string {
  const lines: string[] = [
    `\n${'═'.repeat(70)}`,
    `Szenario: ${scenarioName}`,
    `${'─'.repeat(70)}`,
    `Status: ${result.passed ? '✅ BESTANDEN' : '❌ FEHLGESCHLAGEN'}`,
    `Checks: ${result.stats.passedChecks}/${result.stats.totalChecks} bestanden`,
    `Wörter: ${result.stats.wordCount}`,
    `Kapitel: ${result.stats.sectionCount}`,
    `Artikel: ${result.stats.articleReferencesFound.join(', ')}`,
  ]

  if (result.failures.length > 0) {
    lines.push(`\nFehler (${result.failures.length}):`)
    for (const f of result.failures) {
      lines.push(`  [${f.category}] ${f.message}`)
      if (f.expected) lines.push(`    Erwartet: ${f.expected}`)
      if (f.actual) lines.push(`    Tatsächlich: ${f.actual}`)
    }
  }

  lines.push('═'.repeat(70))
  return lines.join('\n')
}
