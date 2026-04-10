/**
 * Test-Szenarien für die Policy-Generierung
 *
 * 15 realistische Fragebogen-Kombinationen, die verschiedene Branchen,
 * Unternehmensgrößen, KI-Einsatzarten und Sonderfälle abdecken.
 *
 * Jedes Szenario enthält:
 * - name: Beschreibender Name für Test-Reports
 * - questionnaire: Vollständige Fragebogen-Daten (wie von Frontend)
 * - expected: Erwartete Inhalte im generierten Policy-Text
 */

import type { QuestionnaireData } from '@/components/questionnaire/types'

// ─── Erwartungstyp ──────────────────────────────────────────────────────────

export interface PolicyExpectation {
  /** Pflicht-Kapitel, die im Output vorkommen müssen (Regex oder String) */
  requiredSections: string[]
  /** Schlüsselwörter/Phrasen, die im Output vorkommen müssen */
  requiredKeywords: string[]
  /** Artikel-Referenzen, die korrekt vorkommen müssen */
  requiredArticles: string[]
  /** Inhalte, die NICHT vorkommen dürfen */
  forbiddenContent: string[]
  /** Mindestlänge in Wörtern */
  minWordCount: number
  /** Optionale Anhänge, die vorhanden sein müssen */
  requiredAppendices?: string[]
}

export interface TestScenario {
  name: string
  description: string
  questionnaire: QuestionnaireData
  expected: PolicyExpectation
}

// ─── Szenarien ──────────────────────────────────────────────────────────────

export const TEST_SCENARIOS: TestScenario[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Standard-KMU (Deutschland, IT-Branche, ausgewogen)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Standard IT-KMU Deutschland',
    description: 'Typisches mittelständisches IT-Unternehmen in Deutschland mit ChatGPT + GitHub Copilot',
    questionnaire: {
      firmenname: 'TechSolutions GmbH',
      branche: 'it',
      mitarbeiter: '51-250',
      laender: ['deutschland'],
      ki_status: 'teilweise',
      externe_tools: ['chatgpt', 'github_copilot'],
      use_cases: ['code', 'texte', 'datenanalyse'],
      interne_ki: 'nein',
      datenarten: ['kundendaten', 'geschaeftsgeheimnisse'],
      dsb: 'extern',
      cloud_ausserhalb_eu: 'teilweise',
      striktheit: 'ausgewogen',
      verantwortung: 'it',
      email: 'test@techsolutions.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Definitionen',
        'Erlaubte und verbotene Nutzung',
        'Freigegebene Tools',
        'Datenschutz',
        'Qualitätssicherung',
        'Geistiges Eigentum',
        'Transparenz',
        'Verantwortlichkeiten',
        'Schulung',
        'Verstöße',
        'Überprüfung',
      ],
      requiredKeywords: [
        'TechSolutions GmbH',
        'ChatGPT',
        'GitHub Copilot',
        'Code',
        'DSGVO',
        'EU AI Act',
        'Geschäftsgeheimnisse',
      ],
      requiredArticles: [
        'Art. 4',   // AI Literacy
        'Art. 5',   // Verbote
        'Art. 50',  // Transparenz
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',  // Häufiger LLM-Fehler
        'Schweizer Datenschutzgesetz', // Nur DE
      ],
      minWordCount: 5000,
      requiredAppendices: ['Compliance-Checkliste', 'Schulungsvorlage'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Gesundheitswesen (Hochrisiko, restriktiv)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Gesundheitswesen — Hochrisiko',
    description: 'Klinik mit Gesundheitsdaten, restriktive Policy, Hochrisiko-KI-Einsatz',
    questionnaire: {
      firmenname: 'MediCare Klinikgruppe AG',
      branche: 'gesundheit',
      mitarbeiter: '251-500',
      laender: ['deutschland', 'oesterreich'],
      ki_status: 'freigegeben',
      externe_tools: ['chatgpt', 'copilot'],
      use_cases: ['texte', 'datenanalyse', 'entscheidung'],
      interne_ki: 'ja',
      interne_ki_beschreibung: 'KI-gestütztes Triage-System für Notaufnahme und automatisierte Befundvorschläge',
      datenarten: ['gesundheitsdaten', 'kundendaten', 'personaldaten'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'nein',
      striktheit: 'restriktiv',
      verantwortung: 'komitee',
      email: 'compliance@medicare-kliniken.de',
      tier: 'enterprise',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Definitionen',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
        'Qualitätssicherung',
        'Verantwortlichkeiten',
        'Schulung',
      ],
      requiredKeywords: [
        'MediCare',
        'Patientendaten',
        'Gesundheitsdaten',
        'ärztliche Schweigepflicht',
        'Art. 9 DSGVO',
        'Hochrisiko',
        'Triage',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 9',   // Besondere Kategorien (Gesundheitsdaten)
        'Art. 22',  // Automatisierte Entscheidungen
        'Art. 35',  // DSFA
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Interne KI-Systeme', 'Compliance-Checkliste', 'Schulungsvorlage'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Schweizer Unternehmen (Sonderfall: kein EU AI Act direkt)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Schweiz — Nur CH, kein EU-Bezug',
    description: 'Rein Schweizer Unternehmen ohne EU-Tätigkeit. revDSG statt DSGVO, EU AI Act nur informativ.',
    questionnaire: {
      firmenname: 'AlpinTech SA',
      branche: 'beratung',
      mitarbeiter: '11-50',
      laender: ['schweiz'],
      ki_status: 'teilweise',
      externe_tools: ['chatgpt', 'claude'],
      use_cases: ['texte', 'uebersetzung', 'datenanalyse'],
      interne_ki: 'nein',
      datenarten: ['kundendaten', 'geschaeftsgeheimnisse'],
      dsb: 'nein',
      cloud_ausserhalb_eu: 'ja',
      striktheit: 'ausgewogen',
      verantwortung: 'geschaeftsfuehrung',
      email: 'info@alpintech.ch',
      tier: 'basis',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Definitionen',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
        'Qualitätssicherung',
      ],
      requiredKeywords: [
        'AlpinTech',
        'Schweiz',
        'revDSG',
      ],
      requiredArticles: [],
      forbiddenContent: [],
      minWordCount: 3000,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Finanzbranche (BaFin, MaRisk, KI-Kreditentscheidungen)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Finanzdienstleister mit KI-Kreditentscheidungen',
    description: 'Bank mit KI-gestützter Kreditvergabe — BaFin/MaRisk-Anforderungen',
    questionnaire: {
      firmenname: 'FinanzPlus Bank eG',
      branche: 'finanzen',
      mitarbeiter: '500+',
      laender: ['deutschland'],
      ki_status: 'freigegeben',
      externe_tools: ['copilot', 'branchenspezifisch'],
      use_cases: ['datenanalyse', 'entscheidung', 'kundenservice'],
      interne_ki: 'ja',
      interne_ki_beschreibung: 'KI-basiertes Scoring-System für Kreditvergabeentscheidungen und Betrugserkennung',
      datenarten: ['kundendaten', 'finanzdaten', 'personaldaten'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'nein',
      striktheit: 'restriktiv',
      verantwortung: 'komitee',
      email: 'compliance@finanzplus.de',
      tier: 'enterprise',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
        'Qualitätssicherung',
        'Verantwortlichkeiten',
      ],
      requiredKeywords: [
        'FinanzPlus',
        'BaFin',
        'MaRisk',
        'Kreditentscheidung',
        'Scoring',
        'menschliche Prüfung',
        'Finanzdaten',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 22',  // Automatisierte Einzelentscheidungen
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Interne KI-Systeme', 'Compliance-Checkliste'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Bauunternehmen (einfache Sprache)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Bauunternehmen — einfache Sprache',
    description: 'Kleines Bauunternehmen, Basis-Tier, innovationsfreundlich. Prompt verlangt einfache Sprache.',
    questionnaire: {
      firmenname: 'Müller Bau GmbH',
      branche: 'bau',
      mitarbeiter: '11-50',
      laender: ['deutschland'],
      ki_status: 'shadow',
      externe_tools: ['chatgpt', 'bildgenerierung'],
      use_cases: ['texte', 'bilder'],
      interne_ki: 'nein',
      datenarten: ['kundendaten', 'oeffentlich'],
      dsb: 'nein',
      cloud_ausserhalb_eu: 'weiss_nicht',
      striktheit: 'innovationsfreundlich',
      verantwortung: 'geschaeftsfuehrung',
      email: 'info@mueller-bau.de',
      tier: 'basis',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Definitionen',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
      ],
      requiredKeywords: [
        'Müller Bau',
        'ChatGPT',
        'Bildgenerierung',
        'Shadow AI',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 3000,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Gastronomie (einfache Sprache, kleine Firma)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Gastronomie — Kleinunternehmen',
    description: 'Kleines Restaurant mit nur ChatGPT für Speisekarten-Übersetzung',
    questionnaire: {
      firmenname: 'Gasthaus zum Goldenen Löwen',
      branche: 'gastronomie',
      mitarbeiter: '1-10',
      laender: ['deutschland'],
      ki_status: 'shadow',
      externe_tools: ['chatgpt'],
      use_cases: ['texte', 'uebersetzung'],
      interne_ki: 'nein',
      datenarten: ['oeffentlich'],
      dsb: 'nein',
      cloud_ausserhalb_eu: 'weiss_nicht',
      striktheit: 'innovationsfreundlich',
      verantwortung: 'geschaeftsfuehrung',
      email: 'info@goldener-loewe.de',
      tier: 'basis',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
      ],
      requiredKeywords: [
        'Gasthaus zum Goldenen Löwen',
        'ChatGPT',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
        'BaFin',
        'MaRisk',
        'Patientendaten',
      ],
      minWordCount: 3000,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Öffentlicher Dienst (erweiterte Transparenz)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Öffentliche Verwaltung',
    description: 'Stadtverwaltung mit KI für Bürgerservices — erweiterte Transparenzpflichten',
    questionnaire: {
      firmenname: 'Stadtverwaltung Musterstadt',
      branche: 'oeffentlich',
      mitarbeiter: '251-500',
      laender: ['deutschland'],
      ki_status: 'teilweise',
      externe_tools: ['copilot', 'chatgpt'],
      use_cases: ['texte', 'kundenservice', 'datenanalyse'],
      interne_ki: 'geplant',
      interne_ki_beschreibung: 'Geplantes KI-System für automatisierte Bürgeranfragen-Beantwortung',
      datenarten: ['kundendaten', 'personaldaten'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'nein',
      striktheit: 'ausgewogen',
      verantwortung: 'dsb',
      email: 'datenschutz@musterstadt.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Transparenz',
        'Verantwortlichkeiten',
      ],
      requiredKeywords: [
        'Stadtverwaltung Musterstadt',
        'Transparenz',
        'Bürger',
        'Vergaberecht',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Compliance-Checkliste'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Handel (Verbraucherschutz, Produkthaftung)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'E-Commerce Händler',
    description: 'Online-Händler mit KI-Kundenservice und Produktempfehlungen',
    questionnaire: {
      firmenname: 'ShopDirekt AG',
      branche: 'handel',
      mitarbeiter: '51-250',
      laender: ['deutschland', 'oesterreich'],
      ki_status: 'freigegeben',
      externe_tools: ['chatgpt', 'branchenspezifisch'],
      use_cases: ['kundenservice', 'texte', 'bilder', 'datenanalyse'],
      interne_ki: 'ja',
      interne_ki_beschreibung: 'KI-basiertes Produktempfehlungssystem und automatisierter Kunden-Chatbot',
      datenarten: ['kundendaten', 'geschaeftsgeheimnisse'],
      dsb: 'extern',
      cloud_ausserhalb_eu: 'teilweise',
      striktheit: 'ausgewogen',
      verantwortung: 'it',
      email: 'datenschutz@shopdirekt.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Erlaubte und verbotene Nutzung',
        'Freigegebene Tools',
        'Transparenz',
      ],
      requiredKeywords: [
        'ShopDirekt',
        'Verbraucherschutz',
        'Chatbot',
        'Produktempfehlung',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
        'BaFin',
        'Patientendaten',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Interne KI-Systeme', 'Compliance-Checkliste'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Bildungseinrichtung (Prüfungsintegrität, Minderjährige)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Bildungseinrichtung mit Minderjährigen',
    description: 'Schule/Hochschule mit KI im Unterricht — Minderjährigenschutz und Prüfungsintegrität',
    questionnaire: {
      firmenname: 'Akademie für Digitale Bildung',
      branche: 'bildung',
      mitarbeiter: '51-250',
      laender: ['deutschland'],
      ki_status: 'teilweise',
      externe_tools: ['chatgpt', 'copilot', 'gemini'],
      use_cases: ['texte', 'uebersetzung', 'datenanalyse'],
      interne_ki: 'nein',
      datenarten: ['kundendaten', 'personaldaten'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'teilweise',
      striktheit: 'ausgewogen',
      verantwortung: 'komitee',
      email: 'it@digitale-bildung.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
        'Schulung',
      ],
      requiredKeywords: [
        'Akademie für Digitale Bildung',
        'Prüfung',
        'Minderjährig',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
        'BaFin',
        'MaRisk',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Compliance-Checkliste'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Logistikunternehmen (Kundendaten + Sendungsdaten)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Logistik mit Sendungsdaten',
    description: 'Spedition mit KI für Routenoptimierung — Sendungs- und Kundendaten sind personenbezogen',
    questionnaire: {
      firmenname: 'SchnellFracht Logistik GmbH',
      branche: 'logistik',
      mitarbeiter: '51-250',
      laender: ['deutschland', 'oesterreich', 'schweiz'],
      ki_status: 'teilweise',
      externe_tools: ['copilot', 'branchenspezifisch'],
      use_cases: ['datenanalyse', 'texte'],
      interne_ki: 'geplant',
      datenarten: ['kundendaten', 'personaldaten'],
      dsb: 'extern',
      cloud_ausserhalb_eu: 'teilweise',
      striktheit: 'ausgewogen',
      verantwortung: 'it',
      email: 'it@schnellfracht.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Datenschutz',
        'Erlaubte und verbotene Nutzung',
      ],
      requiredKeywords: [
        'SchnellFracht',
        'Sendungsdaten',
        'personenbezogen',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 44', // Drittlandtransfer (CH + teilweise Cloud)
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 5000,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Reiner Chatbot-Einsatz (Transparenzpflichten Art. 50)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Chatbot-Einsatz — Transparenzpflichten',
    description: 'Unternehmen, das KI hauptsächlich für externen Kunden-Chatbot einsetzt — Art. 50 Kennzeichnung',
    questionnaire: {
      firmenname: 'ServiceBot GmbH',
      branche: 'it',
      mitarbeiter: '11-50',
      laender: ['deutschland'],
      ki_status: 'freigegeben',
      externe_tools: ['chatgpt', 'branchenspezifisch'],
      use_cases: ['kundenservice'],
      interne_ki: 'ja',
      interne_ki_beschreibung: 'Eigenentwickelter Kunden-Chatbot auf Basis von GPT-4, integriert in Website und App',
      datenarten: ['kundendaten'],
      dsb: 'nein',
      cloud_ausserhalb_eu: 'ja',
      striktheit: 'innovationsfreundlich',
      verantwortung: 'geschaeftsfuehrung',
      email: 'dev@servicebot.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Transparenz',
        'Freigegebene Tools',
      ],
      requiredKeywords: [
        'ServiceBot',
        'Chatbot',
        'Kennzeichnung',
        'Art. 50',
        'Kunden',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 50',
        'Art. 44', // Drittlandtransfer (Cloud außerhalb EU)
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Interne KI-Systeme', 'Compliance-Checkliste'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Personalwesen — KI-gestützte Einstellungsentscheidungen
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'HR mit KI-Entscheidungen',
    description: 'Beratung, die KI im Personalbereich einsetzt — Art. 22 DSGVO kritisch',
    questionnaire: {
      firmenname: 'HR-Consult Pro GmbH',
      branche: 'beratung',
      mitarbeiter: '51-250',
      laender: ['deutschland', 'oesterreich'],
      ki_status: 'freigegeben',
      externe_tools: ['chatgpt', 'copilot', 'branchenspezifisch'],
      use_cases: ['personal', 'entscheidung', 'texte'],
      interne_ki: 'nein',
      datenarten: ['personaldaten', 'kundendaten'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'teilweise',
      striktheit: 'restriktiv',
      verantwortung: 'dsb',
      email: 'datenschutz@hr-consult.de',
      tier: 'enterprise',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Erlaubte und verbotene Nutzung',
        'Qualitätssicherung',
        'Verantwortlichkeiten',
      ],
      requiredKeywords: [
        'HR-Consult',
        'Einstellung',
        'Bewerbung',
        'menschliche',
        'Personaldaten',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 22',  // Automatisierte Einzelentscheidungen
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Compliance-Checkliste', 'Schulungsvorlage'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Enterprise — Österreich + Deutschland
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Enterprise Fertigung AT+DE',
    description: 'Großes Fertigungsunternehmen in AT+DE mit internem KI-System, Enterprise-Tier',
    questionnaire: {
      firmenname: 'IndustrieTech Holding AG',
      branche: 'fertigung',
      mitarbeiter: '500+',
      laender: ['deutschland', 'oesterreich'],
      ki_status: 'freigegeben',
      externe_tools: ['copilot', 'chatgpt', 'github_copilot'],
      use_cases: ['code', 'datenanalyse', 'texte', 'bilder'],
      interne_ki: 'ja',
      interne_ki_beschreibung: 'KI-gestützte Qualitätskontrolle in der Produktion und vorausschauende Wartung (Predictive Maintenance)',
      datenarten: ['kundendaten', 'personaldaten', 'geschaeftsgeheimnisse'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'nein',
      striktheit: 'ausgewogen',
      verantwortung: 'komitee',
      email: 'compliance@industrietech.at',
      tier: 'enterprise',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Erlaubte und verbotene Nutzung',
        'Freigegebene Tools',
        'Verantwortlichkeiten',
        'Schulung',
      ],
      requiredKeywords: [
        'IndustrieTech',
        'Qualitätskontrolle',
        'Predictive Maintenance',
        'GitHub Copilot',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Interne KI-Systeme', 'Compliance-Checkliste', 'Schulungsvorlage'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 14. Micro-Unternehmen — KI noch nicht genutzt
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Micro — KI noch nicht genutzt',
    description: 'Sehr kleines Unternehmen, das KI einführen möchte aber noch nicht nutzt',
    questionnaire: {
      firmenname: 'Klein & Partner Steuerberatung',
      branche: 'beratung',
      mitarbeiter: '1-10',
      laender: ['deutschland'],
      ki_status: 'nicht_genutzt',
      externe_tools: ['keine'],
      use_cases: ['texte'],
      interne_ki: 'nein',
      datenarten: ['kundendaten', 'finanzdaten'],
      dsb: 'nein',
      cloud_ausserhalb_eu: 'weiss_nicht',
      striktheit: 'ausgewogen',
      verantwortung: 'geschaeftsfuehrung',
      email: 'info@klein-partner.de',
      tier: 'basis',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
      ],
      requiredKeywords: [
        'Klein & Partner',
        'Finanzdaten',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
        'Patientendaten',
      ],
      minWordCount: 3000,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 15. Multi-Land inkl. Nicht-EU
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Multi-Land inkl. Nicht-EU',
    description: 'IT-Firma in DE + Nicht-EU — Drittlandtransfer und extraterritoriale Wirkung',
    questionnaire: {
      firmenname: 'GlobalCode International GmbH',
      branche: 'it',
      mitarbeiter: '51-250',
      laender: ['deutschland', 'nicht_eu'],
      ki_status: 'freigegeben',
      externe_tools: ['chatgpt', 'github_copilot', 'claude'],
      use_cases: ['code', 'texte', 'datenanalyse', 'kundenservice'],
      interne_ki: 'geplant',
      interne_ki_beschreibung: 'Geplantes internes Code-Review-System auf Basis von LLMs',
      datenarten: ['kundendaten', 'personaldaten', 'geschaeftsgeheimnisse'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'ja',
      striktheit: 'ausgewogen',
      verantwortung: 'it',
      email: 'compliance@globalcode.io',
      tier: 'enterprise',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Datenschutz',
        'Freigegebene Tools',
        'Transparenz',
        'Verantwortlichkeiten',
      ],
      requiredKeywords: [
        'GlobalCode',
        'Drittland',
        'Cloud',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 44', // Drittlandtransfer
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Compliance-Checkliste', 'Schulungsvorlage'],
    },
  },
]
