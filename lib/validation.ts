/**
 * Post-Generation-Validierung für Rechtsreferenzen
 *
 * Prüft Claude-Output auf korrekte Zitierung von EU AI Act und DSGVO Artikeln.
 * Verhindert, dass Policies mit nicht-existierenden oder falsch zitierten
 * Artikeln an Kunden ausgeliefert werden.
 */

// ─── Erlaubte Artikel — Whitelists ──────────────────────────────────────────

/** Gültige Artikelnummern des EU AI Act (Verordnung (EU) 2024/1689) */
const VALID_EU_AI_ACT_ARTICLES = new Set([
  // Kapitel I — Allgemeine Bestimmungen
  1, 2, 3, 4,
  // Kapitel II — Verbotene Praktiken
  5,
  // Kapitel III — Hochrisiko-KI-Systeme
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  // Kapitel IV — Transparenzpflichten
  50,
  // Kapitel V — GPAI-Modelle
  51, 52, 53, 54, 55, 56,
  // Kapitel VI — Governance
  57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74,
  // Kapitel VII — Datenbank
  75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86,
  // Kapitel VIII — Überwachung & Durchsetzung
  87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98,
  // Kapitel IX — Bußgelder
  99,
  // Kapitel X-XIII — Schlussbestimmungen
  100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
])

/** Gültige Artikelnummern der DSGVO (Verordnung (EU) 2016/679) — Art. 1–99 */
const VALID_DSGVO_ARTICLES = new Set(
  Array.from({ length: 99 }, (_, i) => i + 1)
)

// ─── Bekannte falsche Zuordnungen ───────────────────────────────────────────

/**
 * Patterns, die auf häufige Fehler von LLMs hinweisen.
 * Jeder Eintrag hat ein Regex-Pattern und eine Fehlerbeschreibung.
 */
const KNOWN_ERRORS: Array<{ pattern: RegExp; description: string }> = [
  {
    // Art. 52 ist KEIN Transparenz-Artikel (er regelt GPAI-Klassifikation)
    pattern: /Art(?:ikel)?\.?\s*52\b[^)]*?(?:Transparenz|Kennzeichnung|Offenlegung)/gi,
    description: 'Art. 52 EU AI Act wird fälschlich als Transparenz-Artikel zitiert. Transparenzpflichten stehen in Art. 50.',
  },
  {
    // AI Literacy gilt seit Feb 2025, NICHT seit 2026
    pattern: /Art(?:ikel)?\.?\s*4\b[^.]*?(?:ab\s+(?:2026|August\s+2026|2\.\s*August\s*2026))/gi,
    description: 'Art. 4 (AI Literacy) wird fälschlich auf 2026 datiert. Er gilt bereits seit 2. Februar 2025.',
  },
  {
    // Art. 5 hat 8 Verbote, nicht 3
    pattern: /Art(?:ikel)?\.?\s*5\b[^.]*?(?:drei|3)\s+Verbote/gi,
    description: 'Art. 5 EU AI Act hat 8 Verbote, nicht 3.',
  },
]

// ─── Extraktion & Matching ──────────────────────────────────────────────────

/**
 * Regex zur Extraktion von Artikelreferenzen im Policy-Text.
 * Matcht Formate wie:
 * - Art. 5
 * - Artikel 22
 * - Art. 5 EU AI Act
 * - Art. 44–49 DSGVO
 * - Art. 6 Abs. 1
 * - Art. 3 Nr. 1
 */
const ARTICLE_REFERENCE_REGEX =
  /Art(?:ikel)?\.?\s*(\d+)(?:\s*[-–]\s*(\d+))?(?:\s*(?:Abs|Nr|Buchst|lit|UAbs)\.?\s*\d+[a-z]?)?(?:\s+(?:EU\s*AI\s*Act|DSGVO|KI[- ]?(?:Verordnung|VO)))?/gi

interface ExtractedReference {
  /** Rohtext des Matches */
  raw: string
  /** Artikelnummer(n) */
  articles: number[]
  /** Identifizierte Rechtsquelle */
  source: 'eu-ai-act' | 'dsgvo' | 'unknown'
  /** Position im Text */
  position: number
}

/** Schlüsselwörter zur Bestimmung der Rechtsquelle */
const EU_AI_ACT_KEYWORDS = /EU\s*AI\s*Act|KI[- ]?(?:Verordnung|VO)|AI\s*Act/i
const DSGVO_KEYWORDS = /DSGVO|Datenschutz[- ]?Grundverordnung|DS-GVO/i

/**
 * Extrahiert alle Artikelreferenzen aus dem Policy-Text
 * und versucht, die zugehörige Rechtsquelle zu identifizieren.
 */
function extractReferences(text: string): ExtractedReference[] {
  const references: ExtractedReference[] = []
  let match: RegExpExecArray | null

  // Reset regex
  ARTICLE_REFERENCE_REGEX.lastIndex = 0

  while ((match = ARTICLE_REFERENCE_REGEX.exec(text)) !== null) {
    const startArticle = parseInt(match[1], 10)
    const endArticle = match[2] ? parseInt(match[2], 10) : startArticle
    const raw = match[0]
    const position = match.index

    // Artikelrange expandieren (z.B. Art. 44–49 → [44,45,46,47,48,49])
    const articles: number[] = []
    for (let i = startArticle; i <= endArticle; i++) {
      articles.push(i)
    }

    // Rechtsquelle bestimmen: erst im Match selbst, dann im Kontext (±150 Zeichen)
    let source: ExtractedReference['source'] = 'unknown'
    const context = text.slice(Math.max(0, position - 150), position + raw.length + 150)

    if (EU_AI_ACT_KEYWORDS.test(raw)) {
      source = 'eu-ai-act'
    } else if (DSGVO_KEYWORDS.test(raw)) {
      source = 'dsgvo'
    } else if (EU_AI_ACT_KEYWORDS.test(context)) {
      source = 'eu-ai-act'
    } else if (DSGVO_KEYWORDS.test(context)) {
      source = 'dsgvo'
    }

    references.push({ raw, articles, source, position })
  }

  return references
}

// ─── Validierungslogik ──────────────────────────────────────────────────────

export interface ValidationError {
  type: 'invalid-article' | 'known-error' | 'suspicious-reference'
  message: string
  /** Betroffener Text-Ausschnitt */
  excerpt: string
  /** Position im Text */
  position?: number
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  /** Anzahl geprüfter Referenzen */
  totalReferences: number
}

/**
 * Validiert den Claude-Output auf korrekte Rechtsreferenzen.
 *
 * Prüft:
 * 1. Alle referenzierten EU AI Act Artikel existieren (Whitelist)
 * 2. Alle referenzierten DSGVO Artikel existieren (Whitelist)
 * 3. Keine bekannten LLM-Fehler (Art. 52 als Transparenz, etc.)
 * 4. Keine offensichtlich falschen Artikelnummern (>113 für EU AI Act, >99 für DSGVO)
 */
export function validateLegalReferences(policyText: string): ValidationResult {
  const errors: ValidationError[] = []
  const references = extractReferences(policyText)

  // 1. Prüfe jeden referenzierten Artikel gegen die Whitelist
  for (const ref of references) {
    for (const articleNum of ref.articles) {
      if (ref.source === 'eu-ai-act' && !VALID_EU_AI_ACT_ARTICLES.has(articleNum)) {
        errors.push({
          type: 'invalid-article',
          message: `Nicht-existierender EU AI Act Artikel: Art. ${articleNum}`,
          excerpt: ref.raw,
          position: ref.position,
        })
      } else if (ref.source === 'dsgvo' && !VALID_DSGVO_ARTICLES.has(articleNum)) {
        errors.push({
          type: 'invalid-article',
          message: `Nicht-existierender DSGVO Artikel: Art. ${articleNum}`,
          excerpt: ref.raw,
          position: ref.position,
        })
      } else if (ref.source === 'unknown') {
        // Wenn die Quelle unklar ist, prüfen ob die Nummer in irgendeiner Whitelist ist
        const inEU = VALID_EU_AI_ACT_ARTICLES.has(articleNum)
        const inDSGVO = VALID_DSGVO_ARTICLES.has(articleNum)
        if (!inEU && !inDSGVO) {
          errors.push({
            type: 'suspicious-reference',
            message: `Artikel ${articleNum} konnte keiner Rechtsquelle zugeordnet werden und ist in keiner Whitelist enthalten`,
            excerpt: ref.raw,
            position: ref.position,
          })
        }
      }
    }
  }

  // 2. Prüfe auf bekannte LLM-Fehler
  for (const knownError of KNOWN_ERRORS) {
    // Reset regex
    knownError.pattern.lastIndex = 0
    const errorMatch = knownError.pattern.exec(policyText)
    if (errorMatch) {
      errors.push({
        type: 'known-error',
        message: knownError.description,
        excerpt: errorMatch[0],
        position: errorMatch.index,
      })
    }
  }

  // 3. Prüfe auf erfundene Gesetze/Verordnungen
  const FAKE_LAW_PATTERNS = [
    /(?:EU[- ])?(?:KI[- ]?Gesetz|AI[- ]?Gesetz)/gi,
    /Verordnung\s+\(EU\)\s+\d{4}\/\d+/gi, // echte Nummern prüfen
  ]

  // Prüfe EU-Verordnungsnummern
  const EU_REGULATION_REGEX = /Verordnung\s+\(EU\)\s+(\d{4})\/(\d+)/gi
  let regMatch: RegExpExecArray | null
  const VALID_REGULATION_NUMBERS = new Set([
    '2024/1689', // EU AI Act
    '2016/679',  // DSGVO
  ])

  while ((regMatch = EU_REGULATION_REGEX.exec(policyText)) !== null) {
    const regNumber = `${regMatch[1]}/${regMatch[2]}`
    if (!VALID_REGULATION_NUMBERS.has(regNumber)) {
      errors.push({
        type: 'suspicious-reference',
        message: `Unbekannte EU-Verordnungsnummer: ${regNumber}. Bitte prüfen.`,
        excerpt: regMatch[0],
        position: regMatch.index,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    totalReferences: references.length,
  }
}

// ─── Kontextuelle Konsistenzprüfung ─────────────────────────────────────────

/**
 * Prüft ob der Policy-Inhalt zum Fragebogen-Kontext passt.
 *
 * Ergänzt die Whitelist-Prüfung um inhaltliche Plausibilitätschecks:
 * Branchenspezifische Inhalte dürfen nur erscheinen, wenn die entsprechende
 * Branche/Datenkategorie im Fragebogen ausgewählt wurde.
 */
export function validateContextualConsistency(
  policyText: string,
  questionnaire: Record<string, unknown>
): ValidationResult {
  const errors: ValidationError[] = []

  const branche = questionnaire.branche as string
  const laender = (questionnaire.laender as string[]) ?? []
  const datenarten = (questionnaire.datenarten as string[]) ?? []
  const interne_ki = questionnaire.interne_ki as string

  // BaFin/MaRisk nur für Finanzbranche
  if (branche !== 'finanzen') {
    const match = /BaFin|MaRisk/i.exec(policyText)
    if (match) {
      errors.push({
        type: 'suspicious-reference',
        message: 'BaFin/MaRisk-Referenz in Policy, obwohl Branche nicht "Finanzdienstleistungen" — entfernen oder ersetzen.',
        excerpt: match[0],
        position: match.index,
      })
    }
  }

  // Gesundheitsbranche-spezifische Inhalte
  if (branche !== 'gesundheit') {
    const match = /ärztliche Schweigepflicht|SGB\s+V|Patientendaten/i.exec(policyText)
    if (match) {
      errors.push({
        type: 'suspicious-reference',
        message: 'Gesundheitsspezifische Inhalte (Schweigepflicht/SGB V/Patientendaten) in Policy, obwohl Branche nicht "Gesundheitswesen" — entfernen.',
        excerpt: match[0],
        position: match.index,
      })
    }
  }

  // revDSG (Schweiz) nur wenn CH in Tätigkeitsländern
  if (!laender.includes('schweiz')) {
    const match = /revDSG|Schweizer\s+Datenschutzgesetz/i.exec(policyText)
    if (match) {
      errors.push({
        type: 'suspicious-reference',
        message: 'Schweizer Datenschutzgesetz (revDSG) in Policy, obwohl keine Schweizer Aktivität gewählt — entfernen.',
        excerpt: match[0],
        position: match.index,
      })
    }
  }

  // Art. 9 DSGVO (besondere Kategorien) nur bei sensitiven Datenarten
  const sensitiveDataSelected = datenarten.some(d =>
    ['gesundheitsdaten', 'personaldaten'].includes(d)
  )
  if (!sensitiveDataSelected) {
    const match = /Art(?:ikel)?\.?\s*9\s+DSGVO/i.exec(policyText)
    if (match) {
      errors.push({
        type: 'suspicious-reference',
        message: 'Art. 9 DSGVO (besondere Kategorien personenbezogener Daten) in Policy, obwohl keine Gesundheits- oder Personaldaten gewählt — entfernen.',
        excerpt: match[0],
        position: match.index,
      })
    }
  }

  // Anhang A (Interne KI-Systeme) nur wenn interne_ki = 'ja'
  if (interne_ki !== 'ja') {
    const match = /#+\s*Anhang\s+A\b/i.exec(policyText)
    if (match) {
      errors.push({
        type: 'suspicious-reference',
        message: 'Anhang A (Interne KI-Systeme) in Policy, obwohl keine interne KI-Lösung angegeben — entfernen.',
        excerpt: match[0],
        position: match.index,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    totalReferences: 0,
  }
}

// ─── Retry-Prompt ───────────────────────────────────────────────────────────

/**
 * Erstellt einen Korrektur-Prompt für Claude, wenn die Validierung fehlschlägt.
 */
export function buildCorrectionPrompt(
  originalPolicy: string,
  validationErrors: ValidationError[]
): string {
  const errorList = validationErrors
    .map((e, i) => `${i + 1}. ${e.message} (gefunden: "${e.excerpt}")`)
    .join('\n')

  return `Die folgende KI-Nutzungsrichtlinie enthält fehlerhafte Rechtsreferenzen, die korrigiert werden müssen.

## Gefundene Fehler
${errorList}

## Regeln
- Korrigiere NUR die fehlerhaften Referenzen.
- Ersetze nicht-existierende Artikel durch korrekte oder entferne sie.
- Art. 50 EU AI Act = Transparenzpflichten (NICHT Art. 52).
- Art. 4 EU AI Act (AI Literacy) gilt seit 2. Februar 2025.
- Art. 5 EU AI Act hat 8 Verbote.
- Erfinde KEINE Gesetze oder Verordnungen.
- Behalte die gesamte restliche Struktur und Formatierung exakt bei.

## Zu korrigierende Richtlinie
${originalPolicy}`
}
