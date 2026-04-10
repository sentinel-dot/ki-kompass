/**
 * Grenzfall-Szenarien — Edge Case Testing
 *
 * 8 extreme Szenarien, die die kritischsten Rechtsbereiche und
 * häufigsten Fehlerquellen abdecken. Diese Tests sind kein normales
 * Qualitäts-Screening — sie prüfen, ob der Output in den gefährlichsten
 * Fällen wirklich korrekt ist.
 *
 * Jeder Fall hat:
 * - rationale:        Warum dieser Fall kritisch ist (Haftungsrisiko)
 * - criticalChecks:   Assertions, die ALLE bestehen müssen (kein 80%-Kompromiss)
 *   - mustMatch:      Regex muss im Output vorhanden sein
 *   - mustNotMatch:   Regex darf NICHT im Output vorhanden sein
 *
 * Unterschied zu scenarios.ts:
 * - scenarios.ts = Normalfälle, 80% Bestehensquote reicht
 * - edge-cases.ts = Grenzfälle, criticalChecks müssen 100% bestehen
 */

import type { QuestionnaireData } from '@/components/questionnaire/types'
import type { PolicyExpectation } from './scenarios'

// ─── Erweiterter Erwartungstyp ───────────────────────────────────────────────

export interface CriticalCheck {
  /** Regex, die im Policy-Text vorhanden sein MUSS */
  mustMatch?: RegExp
  /** Regex, die im Policy-Text NICHT vorhanden sein darf */
  mustNotMatch?: RegExp
  /** Beschreibung was geprüft wird — erscheint im Fehlerreport */
  description: string
}

export interface EdgeCaseExpectation extends PolicyExpectation {
  /**
   * Checks, die 100% bestehen müssen — kein 80%-Kompromiss.
   * Jeder fehlgeschlagene Check ist ein Hard-Fail der gesamten Testsuite.
   */
  criticalChecks: CriticalCheck[]
}

export interface EdgeCaseScenario {
  name: string
  /** Kurze Beschreibung für den Test-Report */
  description: string
  /**
   * Warum dieser Fall kritisch ist.
   * Erklärt das konkrete Haftungs- oder Compliance-Risiko.
   */
  rationale: string
  questionnaire: QuestionnaireData
  expected: EdgeCaseExpectation
}

// ─── Grenzfall-Szenarien ─────────────────────────────────────────────────────

export const EDGE_CASE_SCENARIOS: EdgeCaseScenario[] = [

  // ──────────────────────────────────────────────────────────────────────────
  // EC-1: Klinik — KI-Triage mit Shadow AI
  //
  // Das in REVIEW.md explizit genannte Szenario.
  // Kombination aus: Hochrisiko-Branche + lebenskritische KI-Entscheidungen
  // + nicht-autorisierte Shadow-Nutzung + max. Striktheit.
  // Höchstes denkbares Haftungsrisiko im gesamten Produktportfolio.
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'EC-1: Klinik — KI-Triage + Shadow AI (Höchstrisiko)',
    description:
      'Universitätsklinikum mit nicht-dokumentierter KI-Nutzung durch Ärzte für Triage-Empfehlungen. ' +
      'Gleichzeitig intern ein KI-Triage-System im Aufbau. Restriktive Policy gewünscht.',
    rationale:
      'KI in lebenskritischen Entscheidungen ohne menschliche Überprüfung ist der gefährlichste ' +
      'Anwendungsfall. Shadow AI in der Notaufnahme kann Menschenleben kosten und verstößt gleichzeitig ' +
      'gegen Art. 9 DSGVO, Art. 22 DSGVO und den EU AI Act (High-Risk-System). ' +
      'Die Policy muss Shadow AI als sofort zu unterbinden klassifizieren und klare Verbote für ' +
      'vollautomatische klinische Entscheidungen formulieren — nicht nur "eingeschränkt".',
    questionnaire: {
      firmenname: 'Universitätsklinikum Nordbaden gGmbH',
      branche: 'gesundheit',
      mitarbeiter: '500+',
      laender: ['deutschland', 'oesterreich'],
      ki_status: 'shadow',
      externe_tools: ['chatgpt', 'copilot', 'sonstige'],
      externe_tools_sonstige: 'Nicht dokumentierte KI-Assistenten durch Ärzte und Pflegepersonal im klinischen Alltag',
      use_cases: ['texte', 'datenanalyse', 'entscheidung', 'sonstige'],
      use_cases_sonstige: 'Diagnostische Unterstützung, Triage-Empfehlungen, automatisierte Befundvorschläge',
      interne_ki: 'ja',
      interne_ki_beschreibung: 'KI-gestütztes Triage-System in der Notaufnahme mit automatisierten Priorisierungsempfehlungen für Patienten; befindet sich im Pilotbetrieb',
      datenarten: ['gesundheitsdaten', 'kundendaten', 'personaldaten'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'weiss_nicht',
      striktheit: 'restriktiv',
      verantwortung: 'komitee',
      email: 'datenschutz@ukn.de',
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
        'Universitätsklinikum Nordbaden',
        'Patientendaten',
        'Gesundheitsdaten',
        'ärztliche Schweigepflicht',
        'Shadow AI',
        'Triage',
        'menschliche',
        'Art. 9 DSGVO',
        'Hochrisiko',
      ],
      requiredArticles: [
        'Art. 4',   // AI Literacy
        'Art. 5',   // Verbotene Praktiken
        'Art. 9',   // Besondere Datenkategorien (Gesundheit)
        'Art. 22',  // Automatisierte Einzelentscheidungen
        'Art. 35',  // DSFA
        'Art. 50',  // Transparenzpflichten
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',  // Häufiger LLM-Fehler
        'BaFin',              // Finanzbranche-Spill-over
        'MaRisk',
        'revDSG',             // Schweiz-Spill-over
      ],
      minWordCount: 5000,
      requiredAppendices: ['Interne KI-Systeme', 'Compliance-Checkliste', 'Schulungsvorlage'],
      criticalChecks: [
        {
          // Shadow AI muss als akutes Problem addressiert werden
          mustMatch: /Shadow\s*AI.{0,300}(?:sofort|unverzüglich|verboten|untersagt|eingestellt)/is,
          description: 'Shadow AI muss als sofort zu beendende Praxis formuliert sein, nicht als "mittelfristig zu regeln"',
        },
        {
          // Vollautomatische klinische Entscheidungen müssen verboten oder streng eingeschränkt sein
          mustMatch: /(?:Triage|klinisch|Diagnose|Befund).{0,400}(?:menschliche|ärztliche).{0,200}(?:Kontrolle|Überprüfung|Entscheidung|Verantwortung)/is,
          description: 'Klinische KI-Entscheidungen müssen zwingend an menschliche/ärztliche Kontrolle geknüpft sein',
        },
        {
          // Gesundheitsdaten + DSGVO Art. 9 müssen zusammen auftreten
          mustMatch: /Art\.?\s*9\s+DSGVO.{0,500}(?:Gesundheit|Patientendaten|besondere Kategorien)/is,
          description: 'Art. 9 DSGVO (besondere Kategorien) muss im Kontext von Gesundheitsdaten zitiert werden',
        },
        {
          // DSFA muss für KI-Triage erwähnt werden (Hochrisiko-Verarbeitung)
          mustMatch: /(?:Datenschutz-Folgenabschätzung|DSFA|Art\.?\s*35\s+DSGVO)/i,
          description: 'Datenschutz-Folgenabschätzung (Art. 35 DSGVO) muss für Hochrisiko-Verarbeitung in der Klinik erwähnt werden',
        },
        {
          // Art. 22 muss im Kontext von Entscheidungen zitiert werden
          mustMatch: /Art\.?\s*22\s+DSGVO.{0,300}(?:automatisiert|Entscheidung|Triage|klinisch)/is,
          description: 'Art. 22 DSGVO muss im Kontext automatisierter klinischer Entscheidungen zitiert werden',
        },
        {
          // Der Anhang A für interne KI-Systeme muss das Triage-System beschreiben
          mustMatch: /(?:Anhang|Anlage)\s*A.{0,2000}Triage/is,
          description: 'Anhang A (Interne KI-Systeme) muss das Triage-System konkret beschreiben',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EC-2: Bank — Vollautomatische Kreditvergabe ohne menschliche Kontrolle
  //
  // Art. 22 DSGVO: Verbot ausschließlich automatisierter Entscheidungen
  // mit rechtlicher Wirkung. Kreditvergabe = klassischer Anwendungsfall.
  // Testet ob Claude das Recht auf menschliche Überprüfung korrekt einbaut.
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'EC-2: Bank — Vollautomatisches Kredit-Scoring (Art. 22 DSGVO)',
    description:
      'Genossenschaftsbank mit vollautomatisiertem KI-Scoring für Kreditvergabe. ' +
      'Kein menschlicher Review vorgesehen. Testet ob Art. 22 DSGVO korrekt eingebaut wird.',
    rationale:
      'Vollautomatische Kreditentscheidungen ohne menschliche Überprüfung verstoßen direkt gegen ' +
      'Art. 22 DSGVO. Die Policy muss das explizit benennen und eine substantielle menschliche Prüfung ' +
      '(kein Rubber-Stamping) als Pflicht formulieren. Auch BaFin/MaRisk verlangen dies. ' +
      'Fehler hier sind sofort abmahnfähig.',
    questionnaire: {
      firmenname: 'Volksbank Rheintal eG',
      branche: 'finanzen',
      mitarbeiter: '51-250',
      laender: ['deutschland'],
      ki_status: 'freigegeben',
      externe_tools: ['copilot', 'branchenspezifisch'],
      use_cases: ['datenanalyse', 'entscheidung', 'kundenservice'],
      interne_ki: 'ja',
      interne_ki_beschreibung: 'Vollautomatisches KI-Scoring-System für Kreditvergabeentscheidungen bis 50.000 EUR — keine menschliche Überprüfung vorgesehen, direkter API-Output an das Kernbankensystem',
      datenarten: ['kundendaten', 'finanzdaten', 'personaldaten'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'nein',
      striktheit: 'restriktiv',
      verantwortung: 'komitee',
      email: 'compliance@volksbank-rheintal.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
        'Qualitätssicherung',
        'Verantwortlichkeiten',
        'Verstöße',
      ],
      requiredKeywords: [
        'Volksbank Rheintal',
        'BaFin',
        'MaRisk',
        'Kreditentscheidung',
        'menschliche',
        'Finanzdaten',
        'Scoring',
        'Art. 22',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 22',  // Automatisierte Einzelentscheidungen — der Kernpunkt
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
        'Patientendaten',
        'revDSG',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Interne KI-Systeme', 'Compliance-Checkliste'],
      criticalChecks: [
        {
          // Art. 22 muss Kreditentscheidungen explizit abdecken
          mustMatch: /Art\.?\s*22\s+DSGVO.{0,500}(?:Kredit|Scoring|Entscheidung|automatisiert)/is,
          description: 'Art. 22 DSGVO muss explizit für Kreditentscheidungen zitiert werden',
        },
        {
          // Menschliche Überprüfung muss als PFLICHT formuliert sein
          mustMatch: /(?:Kredit|Scoring).{0,400}(?:menschliche|qualifizierte).{0,200}(?:Überprüfung|Prüfung|Kontrolle|verpflichtend|muss|ist erforderlich)/is,
          description: 'Menschliche Überprüfung von Kreditentscheidungen muss als Pflicht formuliert sein',
        },
        {
          // Rubber-Stamping darf nicht der implizierte Standard sein — Überprüfung muss substantiell sein
          mustMatch: /(?:substantiell|qualifiziert|nicht\s+nur\s+formal|echte?\s+Prüfung|inhaltlich)/i,
          description: 'Die Überprüfung muss als substantiell (nicht nur formell) beschrieben werden — kein Rubber-Stamping',
        },
        {
          // BaFin-Anforderungen müssen für Kreditentscheidungen erwähnt werden
          mustMatch: /(?:BaFin|MaRisk).{0,300}(?:Kredit|KI|Entscheidung|Dokumentation)/is,
          description: 'BaFin/MaRisk müssen im Kontext von KI-Kreditentscheidungen erwähnt werden',
        },
        {
          // Die vollautomatische Variante ohne Überprüfung muss als unzulässig markiert sein
          mustMatch: /(?:vollautomatisch|ausschließlich\s+automatisiert).{0,300}(?:unzulässig|verboten|nicht\s+(?:zulässig|erlaubt)|verstößt|darf\s+nicht)/is,
          description: 'Vollautomatische Kreditvergabe ohne Überprüfung muss explizit als unzulässig gekennzeichnet sein',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EC-3: Öffentlicher Sektor — Biometrische Echtzeit-Fernidentifikation
  //
  // Art. 5(1)(h) EU AI Act: Biometrische Echtzeit-Fernidentifikation im
  // öffentlichen Raum ist eine VERBOTENE PRAKTIK (seit 02/2025).
  // Testet ob Claude das als hartes Verbot einordnet, nicht als "eingeschränkt".
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'EC-3: Behörde — Biometrische Echtzeit-Fernidentifikation (Art. 5 EU AI Act)',
    description:
      'Stadtpolizei plant KI-gestützte Echtzeit-Gesichtserkennung auf öffentlichen Plätzen. ' +
      'Art. 5(1)(h) EU AI Act: Eine der 8 verbotenen Praktiken. Testet ob Claude das absolut korrekt einordnet.',
    rationale:
      'Art. 5(1)(h) EU AI Act verbietet biometrische Echtzeit-Fernidentifikation im öffentlichen Raum ' +
      'seit dem 2. Februar 2025 (mit engen Ausnahmen für Behörden). ' +
      'Ein LLM, das das als "eingeschränkt erlaubt" einordnet, produziert eine gefährlich falsche Policy. ' +
      'Dies ist der härteste Test für die korrekte Klassifikation verbotener Praktiken.',
    questionnaire: {
      firmenname: 'Polizeipräsidium Rheinstadt',
      branche: 'oeffentlich',
      mitarbeiter: '500+',
      laender: ['deutschland'],
      ki_status: 'geplant',
      externe_tools: ['branchenspezifisch'],
      use_cases: ['datenanalyse', 'entscheidung', 'sonstige'],
      use_cases_sonstige: 'Automatische Identifikation von Verdächtigen über Echtzeit-Videoüberwachung, Gesichtserkennung auf Bahnhöfen und öffentlichen Plätzen, biometrische Fernidentifikation',
      interne_ki: 'geplant',
      interne_ki_beschreibung: 'Geplantes System zur automatisierten Echtzeit-Gesichtserkennung in der öffentlichen Videoüberwachung zur Identifikation von Verdächtigen und vermissten Personen',
      datenarten: ['kundendaten', 'personaldaten'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'nein',
      striktheit: 'restriktiv',
      verantwortung: 'komitee',
      email: 'it@polizei-rheinstadt.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
        'Verantwortlichkeiten',
        'Transparenz',
        'Schulung',
      ],
      requiredKeywords: [
        'Polizeipräsidium Rheinstadt',
        'Art. 5',
        'verboten',
        'biometrisch',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',   // Die 8 verbotenen Praktiken — besonders (1)(h)
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
        'BaFin',
        'MaRisk',
        'Patientendaten',
        'revDSG',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Compliance-Checkliste'],
      criticalChecks: [
        {
          // Biometrische Echtzeit-Fernidentifikation MUSS als verboten eingeordnet werden
          mustMatch: /(?:biometrisch|Gesichtserkennung|Echtzeit.{0,30}Identifikation).{0,500}(?:verboten|unzulässig|Art\.?\s*5)/is,
          description: 'Biometrische Echtzeit-Fernidentifikation muss als verboten (Art. 5 EU AI Act) eingeordnet werden',
        },
        {
          // Art. 5(1)(h) oder äquivalente Beschreibung muss erscheinen
          mustMatch: /Art\.?\s*5.{0,300}(?:biometrisch|Fernidentifikation|Echtzeit)/is,
          description: 'Art. 5 EU AI Act muss im Kontext biometrischer Identifikation zitiert werden',
        },
        {
          // Die verbotene Praktik darf NICHT nur als "eingeschränkt erlaubt" klassifiziert sein
          mustNotMatch: /(?:biometrisch|Gesichtserkennung).{0,300}eingeschränkt\s+erlaubt/is,
          description: 'Biometrische Echtzeit-Identifikation darf NICHT als "eingeschränkt erlaubt" klassifiziert werden — sie ist verboten',
        },
        {
          // Die 8 Verbote müssen korrekt dargestellt sein (nicht nur 3)
          mustMatch: /(?:acht|8)\s*(?:Verbote|verbotene\s+Praktiken)|Art\.?\s*5.{0,200}(?:acht|8)\s*(?:Verbote|Praktiken)/is,
          description: 'Art. 5 EU AI Act hat 8 verbotene Praktiken — das muss korrekt dargestellt sein',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EC-4: Schweiz-only — Kein EU AI Act, nur revDSG
  //
  // Sonderfall: Unternehmen ausschließlich in der Schweiz tätig, keine EU-Aktivität.
  // EU AI Act gilt NICHT direkt. Nur revDSG. Testet ob Claude diese Grenze kennt
  // und nicht fälschlich EU-Recht anwendet.
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'EC-4: Schweiz ONLY — Kein EU AI Act (nur revDSG)',
    description:
      'Rein Schweizer Rechtsanwaltskanzlei ohne jede EU-Tätigkeit. ' +
      'EU AI Act gilt nicht direkt. Testet ob Claude das korrekt differenziert ' +
      'und nicht fälschlich EU-Recht anwendet.',
    rationale:
      'Die Schweiz ist kein EU-Mitglied. Der EU AI Act gilt dort nicht direkt. ' +
      'Eine Policy, die ein rein Schweizer Unternehmen an EU AI Act Fristen und Bußgelder bindet, ' +
      'ist rechtlich falsch und untergräbt das Vertrauen. ' +
      'Gleichzeitig gilt das revDSG (seit 01.09.2023) als DSGVO-ähnliches Recht.',
    questionnaire: {
      firmenname: 'Kanzlei Studer & Partner AG',
      branche: 'beratung',
      mitarbeiter: '11-50',
      laender: ['schweiz'],   // NUR Schweiz — kein EU-Bezug
      ki_status: 'teilweise',
      externe_tools: ['chatgpt', 'copilot'],
      use_cases: ['texte', 'uebersetzung', 'datenanalyse'],
      interne_ki: 'nein',
      datenarten: ['kundendaten', 'geschaeftsgeheimnisse', 'personaldaten'],
      dsb: 'nein',
      cloud_ausserhalb_eu: 'ja',
      striktheit: 'ausgewogen',
      verantwortung: 'geschaeftsfuehrung',
      email: 'info@studer-partner.ch',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Definitionen',
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
        'Qualitätssicherung',
        'Schulung',
      ],
      requiredKeywords: [
        'Kanzlei Studer & Partner',
        'Schweiz',
        'revDSG',
      ],
      requiredArticles: [],   // Keine EU-Artikel als Pflicht
      forbiddenContent: [
        'Art. 52 EU AI Act',
        'BaFin',
        'MaRisk',
        'Patientendaten',
      ],
      minWordCount: 3000,
      requiredAppendices: ['Compliance-Checkliste'],
      criticalChecks: [
        {
          // revDSG muss als primäre Rechtsgrundlage erscheinen
          mustMatch: /revDSG|Schweizer\s+Datenschutzgesetz/i,
          description: 'revDSG muss als primäre Datenschutzgrundlage erscheinen',
        },
        {
          // EU AI Act darf NICHT als direkt bindend dargestellt werden
          mustNotMatch: /EU\s*AI\s*Act.{0,200}(?:gilt\s+(?:für\s+Sie|direkt|bindend|verpflichtend)|sind\s+Sie\s+verpflichtet)/is,
          description: 'EU AI Act darf nicht als direkt bindendes Recht für ein rein Schweizer Unternehmen dargestellt werden',
        },
        {
          // EU AI Act nur als Best Practice / informativ erlaubt
          mustMatch: /EU\s*AI\s*Act.{0,300}(?:Best\s*Practice|empfohlen|orientier|informativ|soweit.*EU.*Markt|falls.*EU)/is,
          description: 'EU AI Act sollte nur als Best Practice oder für den Fall EU-Marktaktivität erwähnt werden',
        },
        {
          // Drittlandtransfer unter Schweizer Recht (cloud_ausserhalb_eu = ja)
          mustMatch: /(?:Drittland|Cloud.{0,50}außerhalb|Datentransfer).{0,300}(?:revDSG|Schweiz|angemessenes\s+Schutzniveau)/is,
          description: 'Drittlandtransfer muss unter Schweizer Recht (revDSG) behandelt werden, nicht nur DSGVO',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EC-5: Maximale Komplexität — Alle Dimensionen auf Maximum
  //
  // Alle 5 Länder, alle sensiblen Datenarten, alle Tools, alle Use Cases,
  // interne KI, restriktiv. Testet ob der Output kohärent bleibt wenn
  // alle Parameter gleichzeitig auf Maximum stehen.
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'EC-5: Maximale Komplexität — Alle Dimensionen auf Maximum',
    description:
      'Internationaler Konzern mit allen Ländern (DE+AT+CH+EU+non-EU), allen sensiblen Datenarten, ' +
      'internem KI-System, allen Tools, restriktiv. Testet Kohärenz bei maximalem Scope.',
    rationale:
      'Wenn alle Parameter gleichzeitig auf Maximum stehen, kann Claude in Widersprüche geraten: ' +
      'Schweizer Sonderbehandlung vs. EU AI Act für Deutschland, alle sensiblen Daten gleichzeitig, ' +
      'Drittlandtransfer + interne KI + alle Tools. ' +
      'Die Policy darf nicht inkohärent werden oder wichtige Kapitel weglassen.',
    questionnaire: {
      firmenname: 'Nexus Global Consulting AG',
      branche: 'it',
      mitarbeiter: '500+',
      laender: ['deutschland', 'oesterreich', 'schweiz', 'eu_andere', 'nicht_eu'],
      ki_status: 'freigegeben',
      externe_tools: ['chatgpt', 'copilot', 'gemini', 'claude', 'github_copilot', 'bildgenerierung', 'branchenspezifisch'],
      use_cases: ['texte', 'code', 'datenanalyse', 'kundenservice', 'uebersetzung', 'bilder', 'personal', 'entscheidung'],
      interne_ki: 'ja',
      interne_ki_beschreibung: 'Eigenentwickeltes KI-System zur Analyse von Kundendaten, automatisierten Entscheidungen und Mitarbeiterbewertungen; international eingesetzt',
      datenarten: ['kundendaten', 'gesundheitsdaten', 'finanzdaten', 'personaldaten', 'geschaeftsgeheimnisse'],
      dsb: 'intern',
      cloud_ausserhalb_eu: 'ja',
      striktheit: 'restriktiv',
      verantwortung: 'komitee',
      email: 'global-compliance@nexus.com',
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
        'Nexus Global Consulting',
        'Gesundheitsdaten',
        'Finanzdaten',
        'Drittland',
        'menschliche',
        'Art. 9 DSGVO',
        'Art. 22',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',
        'Art. 9',   // Gesundheitsdaten
        'Art. 22',  // Automatisierte Entscheidungen (Mitarbeiterbewertung)
        'Art. 35',  // DSFA (Hochrisiko-Verarbeitung)
        'Art. 44',  // Drittlandtransfer
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
      ],
      minWordCount: 6000,   // Höhere Mindestlänge wegen maximaler Komplexität
      requiredAppendices: ['Interne KI-Systeme', 'Compliance-Checkliste', 'Schulungsvorlage'],
      criticalChecks: [
        {
          // Schweizer Sonderbehandlung muss trotz anderer Länder erscheinen
          mustMatch: /(?:Schweiz|revDSG).{0,300}(?:EU\s*AI\s*Act.*nicht\s+direkt|revDSG|Sonderregelung)/is,
          description: 'Schweizer Sonderstellung (kein direkter EU AI Act) muss trotz anderer Länder erwähnt werden',
        },
        {
          // Art. 9 DSGVO für Gesundheitsdaten muss erscheinen
          mustMatch: /Art\.?\s*9\s+DSGVO.{0,300}(?:Gesundheit|besondere\s+Kategorien)/is,
          description: 'Art. 9 DSGVO muss für die Gesundheitsdaten-Komponente erwähnt werden',
        },
        {
          // Mitarbeiterbewertungen per KI müssen Art. 22 triggern
          mustMatch: /(?:Mitarbeiter.{0,50}(?:Bewertung|Beurteilung|Entscheidung)|personal).{0,400}Art\.?\s*22/is,
          description: 'Automatisierte Mitarbeiterbewertungen müssen Art. 22 DSGVO triggern',
        },
        {
          // Drittlandtransfer muss für cloud_ausserhalb_eu = ja adressiert werden
          mustMatch: /Art\.?\s*4[4-9]\s+DSGVO|Drittland(?:transfer|übermittlung)/i,
          description: 'Drittlandtransfer (Art. 44-49 DSGVO) muss für Cloud außerhalb EU adressiert werden',
        },
        {
          // Alle 12 Tools müssen nicht unbedingt einzeln, aber Tools müssen strukturiert sein
          mustMatch: /(?:ChatGPT|Copilot|Gemini|Claude|GitHub\s+Copilot)/i,
          description: 'Mindestens eines der spezifisch genannten Tools muss in der Policy erscheinen',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EC-6: Gesamtunternehmen nutzt Shadow AI — Keine offizielle Freigabe
  //
  // Nicht eine Abteilung, sondern das gesamte Unternehmen nutzt KI ohne
  // Genehmigung, ohne Dokumentation, ohne Kontrolle. Status quo = shadow.
  // Testet ob die Policy einen realistischen Übergangsplan formuliert
  // statt nur ein hartes Verbot (das ignoriert würde).
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'EC-6: Shadow AI im Gesamtunternehmen — Realistic Transition',
    description:
      'Mittelständische Unternehmensberatung: Alle 80 Mitarbeiter nutzen KI-Tools, ' +
      'aber nichts ist offiziell freigegeben oder dokumentiert. ' +
      'Testet ob die Policy einen realistischen Übergang formuliert, nicht nur ein Verbot.',
    rationale:
      'Ein reines Verbot von bereits weit verbreitetem Shadow AI führt zu Compliance-Theater. ' +
      'Die Policy muss einen strukturierten Übergang von Shadow zu regulierter Nutzung ermöglichen: ' +
      'Meldepflicht für genutzte Tools, Übergangsfrist, Genehmigungsverfahren. ' +
      'Gleichzeitig darf sie nicht zu lasch sein — unkontrollierter Umgang mit Kundendaten muss sofort enden.',
    questionnaire: {
      firmenname: 'Strategos Unternehmensberatung GmbH',
      branche: 'beratung',
      mitarbeiter: '51-250',
      laender: ['deutschland', 'oesterreich'],
      ki_status: 'shadow',
      externe_tools: ['chatgpt', 'copilot', 'gemini', 'claude', 'bildgenerierung', 'sonstige'],
      externe_tools_sonstige: 'Diverse nicht dokumentierte Tools (Perplexity, Mistral, lokale Modelle)',
      use_cases: ['texte', 'code', 'datenanalyse', 'uebersetzung', 'bilder', 'sonstige'],
      use_cases_sonstige: 'Erstellung von Kundenpräsentationen, Analyse vertraulicher Unternehmensdaten, Strategiepapiere',
      interne_ki: 'nein',
      datenarten: ['kundendaten', 'geschaeftsgeheimnisse', 'personaldaten'],
      dsb: 'nein',
      cloud_ausserhalb_eu: 'weiss_nicht',
      striktheit: 'ausgewogen',
      verantwortung: 'geschaeftsfuehrung',
      email: 'management@strategos.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Präambel',
        'Erlaubte und verbotene Nutzung',
        'Freigegebene Tools',
        'Datenschutz',
        'Qualitätssicherung',
        'Schulung',
        'Verstöße',
      ],
      requiredKeywords: [
        'Strategos',
        'Shadow AI',
        'Geschäftsgeheimnisse',
        'Kundendaten',
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
        'Patientendaten',
        'revDSG',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Compliance-Checkliste', 'Schulungsvorlage'],
      criticalChecks: [
        {
          // Shadow AI muss adressiert werden
          mustMatch: /Shadow\s*AI.{0,200}(?:Meldepflicht|Übergang|Genehmigung|registrieren|bekanntgeben|dokumentieren)/is,
          description: 'Shadow AI muss mit einem Übergangsmechanismus (Meldepflicht, Genehmigung) adressiert werden',
        },
        {
          // Geschäftsgeheimnisse dürfen nicht in externe KI eingegeben werden — sofortige Regel
          mustMatch: /(?:Geschäftsgeheimnisse|vertraulich|konfidentiell).{0,300}(?:verboten|nicht\s+(?:erlaubt|zulässig|gestattet)|untersagt|darf\s+nicht)/is,
          description: 'Eingabe von Geschäftsgeheimnissen in externe KI-Tools muss explizit verboten sein',
        },
        {
          // Ein Genehmigungsprozess für bestehende Tools muss erwähnt werden
          mustMatch: /(?:Genehmigung|Freigabe|Antrag|Whitelist|freigegebene\s+Tools).{0,300}(?:Prozess|beantragen|Liste|Verfahren)/is,
          description: 'Ein Genehmigungsprozess für KI-Tools muss in der Policy beschrieben sein',
        },
        {
          // Übergangsfrist oder sofortige Wirkung muss klar sein
          mustMatch: /(?:ab\s+(?:Inkrafttreten|sofort|Unterzeichnung)|Übergangsfrist|innerhalb\s+von)/i,
          description: 'Der Zeitpunkt des Inkrafttretens oder eine Übergangsfrist muss klar definiert sein',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EC-7: HR-KI mit Bewerberprofiling — Art. 22 + Art. 5(1)(g)
  //
  // Personaldienstleister nutzt KI zur automatischen Bewerberauswahl
  // inkl. biometrischer Kategorisierung. Doppelt problematisch:
  // Art. 22 DSGVO (automatisierte Entscheidungen) UND
  // Art. 5(1)(g) EU AI Act (biometrische Kategorisierung = verboten).
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'EC-7: Personaldienstleister — Biometrisches Bewerberprofiling (Art. 22 + Art. 5(1)(g))',
    description:
      'Headhunter-Firma nutzt KI zur automatischen Vorauswahl von Bewerbern ' +
      'inkl. Analyse von Fotos und biometrischen Merkmalen. ' +
      'Testet korrekte Einordnung: Art. 22 DSGVO UND Art. 5(1)(g) EU AI Act (verbotene Praktik).',
    rationale:
      'Art. 5(1)(g) EU AI Act verbietet KI-Systeme, die natürliche Personen anhand biometrischer Daten ' +
      'nach Rasse, politischer Meinung, Gewerkschaftszugehörigkeit, Religion, Sexualität etc. kategorisieren. ' +
      'KI-Tools, die Bewerber-Fotos zur Persönlichkeitsanalyse nutzen, fallen darunter. ' +
      'Gleichzeitig verbietet Art. 22 DSGVO ausschließlich automatisierte Einstellungsentscheidungen. ' +
      'Beide müssen in der Policy als harte Verbote erscheinen.',
    questionnaire: {
      firmenname: 'TalentMatch Executive Search GmbH',
      branche: 'beratung',
      mitarbeiter: '11-50',
      laender: ['deutschland'],
      ki_status: 'freigegeben',
      externe_tools: ['branchenspezifisch', 'chatgpt'],
      use_cases: ['personal', 'entscheidung', 'datenanalyse', 'sonstige'],
      use_cases_sonstige: 'Automatische Vorauswahl von Bewerbern, Analyse von Lebensläufen und Bewerbungsfotos, Persönlichkeitsprofiling, Einstellungsempfehlungen',
      interne_ki: 'ja',
      interne_ki_beschreibung: 'KI-Plattform zur automatisierten Bewerberanalyse: Lebenslauf-Screening, Foto-Analyse zur Persönlichkeitsbewertung, automatische Rankinglisten ohne manuelle Sichtung',
      datenarten: ['personaldaten', 'kundendaten'],
      dsb: 'nein',
      cloud_ausserhalb_eu: 'ja',
      striktheit: 'restriktiv',
      verantwortung: 'geschaeftsfuehrung',
      email: 'compliance@talentmatch.de',
      tier: 'professional',
      disclaimerAccepted: true,
    },
    expected: {
      requiredSections: [
        'Erlaubte und verbotene Nutzung',
        'Datenschutz',
        'Qualitätssicherung',
        'Verantwortlichkeiten',
      ],
      requiredKeywords: [
        'TalentMatch',
        'Bewerbung',
        'menschliche',
        'Art. 22',
        'biometrisch',
        'verboten',
      ],
      requiredArticles: [
        'Art. 4',
        'Art. 5',   // Verbotene Praktiken inkl. (1)(g)
        'Art. 22',  // Automatisierte Einstellungsentscheidungen
        'Art. 44',  // Drittlandtransfer (cloud außerhalb EU)
        'Art. 50',
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
        'BaFin',
        'MaRisk',
        'Patientendaten',
        'revDSG',
      ],
      minWordCount: 5000,
      requiredAppendices: ['Interne KI-Systeme', 'Compliance-Checkliste'],
      criticalChecks: [
        {
          // Biometrische Kategorisierung muss als verbotene Praktik eingeordnet werden
          mustMatch: /(?:biometrisch|Foto.{0,50}Analyse|Persönlichkeit.{0,50}(?:Analyse|Profil)).{0,500}(?:verboten|unzulässig|Art\.?\s*5)/is,
          description: 'Biometrische Kategorisierung/Foto-Analyse für Bewerberprofiling muss als verbotene Praktik (Art. 5 EU AI Act) eingeordnet werden',
        },
        {
          // Art. 22 muss für Einstellungsentscheidungen explizit genannt werden
          mustMatch: /Art\.?\s*22\s+DSGVO.{0,400}(?:Einstellung|Bewerb|Personalentscheidung|Ablehnung)/is,
          description: 'Art. 22 DSGVO muss explizit für Einstellungsentscheidungen zitiert werden',
        },
        {
          // Vollautomatische Einstellungsentscheidungen müssen verboten sein
          mustMatch: /(?:automatisch|vollautomatisch).{0,300}(?:Einstellung|Ablehnung|Bewerb).{0,200}(?:verboten|nicht\s+(?:erlaubt|zulässig)|unzulässig)/is,
          description: 'Vollautomatische Einstellungsentscheidungen ohne menschliche Prüfung müssen verboten sein',
        },
        {
          // Menschliche Überprüfung jeder Einstellungsentscheidung muss gefordert sein
          mustMatch: /(?:Einstellung|Bewerb).{0,300}(?:menschliche|qualifizierte|persönliche).{0,200}(?:Überprüfung|Entscheidung|Prüfung|Sichtung)/is,
          description: 'Jede Einstellungsentscheidung muss menschliche Überprüfung erfordern',
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EC-8: Kleinstunternehmen — Maximale Unsicherheit (weiss_nicht überall)
  //
  // Kleinunternehmen (3 Mitarbeiter), das KI nutzen möchte aber bei allem
  // unsicher ist: weiss_nicht bei Cloud, DSB nein, keine klaren Use Cases.
  // Testet ob Claude trotzdem eine praktisch nutzbare Policy produziert
  // statt eines rechtstheoretischen Dokuments.
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'EC-8: Kleinstunternehmen — Maximale Unsicherheit (Praxistest)',
    description:
      '3-Personen-Handwerksbetrieb. Unsicher über Cloud-Nutzung, Tools, Daten. ' +
      'Testet ob die Policy praktisch verständlich und für Nicht-Juristen umsetzbar ist.',
    rationale:
      'Der häufigste reale Käufer-Typ: KMU unter 10 Mitarbeitern, das KI einführen möchte, ' +
      'aber wenig technisches und juristisches Wissen hat. ' +
      'Das Produkt versagt, wenn die generierte Policy so komplex ist, dass ein Handwerksmeister ' +
      'sie nicht versteht oder umsetzen kann. ' +
      'Gleichzeitig müssen die Mindestpflichten (Art. 4 seit Feb 2025) korrekt adressiert sein.',
    questionnaire: {
      firmenname: 'Elektro Bergmann & Söhne',
      branche: 'bau',
      mitarbeiter: '1-10',
      laender: ['deutschland'],
      ki_status: 'weiss_nicht',
      externe_tools: ['chatgpt', 'sonstige'],
      externe_tools_sonstige: 'Wir nutzen wahrscheinlich verschiedene KI-Tools, wissen aber nicht genau welche',
      use_cases: ['texte', 'sonstige'],
      use_cases_sonstige: 'Angebotserstellung, vielleicht Kundenkommunikation',
      interne_ki: 'nein',
      datenarten: ['kundendaten', 'oeffentlich'],
      dsb: 'nein',
      cloud_ausserhalb_eu: 'weiss_nicht',
      striktheit: 'innovationsfreundlich',
      verantwortung: 'geschaeftsfuehrung',
      email: 'info@elektro-bergmann.de',
      tier: 'basis',
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
        'Elektro Bergmann & Söhne',
        'ChatGPT',
        'Kundendaten',
      ],
      requiredArticles: [
        'Art. 4',  // AI Literacy — gilt seit Feb 2025, auch für Kleinstbetriebe
        'Art. 5',  // Verbote
      ],
      forbiddenContent: [
        'Art. 52 EU AI Act',
        'BaFin',
        'MaRisk',
        'Patientendaten',
        'revDSG',
        'DSFA',   // Nicht relevant für einen 3-Personen-Betrieb ohne Hochrisiko-KI
      ],
      minWordCount: 2000,   // Kleineres Unternehmen = kürzere Policy
      criticalChecks: [
        {
          // Art. 4 (AI Literacy) muss trotz Kleinstbetrieb erwähnt werden
          mustMatch: /Art\.?\s*4\s+(?:EU\s*AI\s*Act|KI.{0,20}Verordnung)|AI\s*Literacy/i,
          description: 'Art. 4 EU AI Act (AI Literacy) gilt auch für Kleinstbetriebe — muss erscheinen',
        },
        {
          // Keine übermäßig komplexe Governance (Komitees, DSFA-Pflicht etc.) für 3-Personen-Betrieb
          mustNotMatch: /KI-Komitee|(?:Datenschutz-Folgenabschätzung|DSFA)\s+(?:ist\s+)?(?:erforderlich|verpflichtend|durchzuführen)/i,
          description: 'Für einen 3-Personen-Betrieb ohne Hochrisiko-KI sollte keine DSFA oder KI-Komitee gefordert werden',
        },
        {
          // Die Policy muss konkrete, einfache Handlungsanweisungen enthalten
          mustMatch: /(?:Keine|Nie|Nicht)\s+(?:eingeben|übertragen|teilen).{0,100}(?:Kundendaten|vertraulich|persönlich)/i,
          description: 'Die Policy muss einfache, konkrete Verbote für Kundendaten enthalten (verständlich für Nicht-Juristen)',
        },
        {
          // Unsicherheit über Cloud-Nutzung muss als Handlungsaufforderung behandelt werden
          mustMatch: /(?:Cloud|externe\s+Dienste|Drittanbieter).{0,300}(?:prüfen|klären|herausfinden|feststellen|informieren)/is,
          description: 'Unsicherheit über Cloud-Nutzung muss als konkrete Aufgabe/Handlungsaufforderung formuliert sein',
        },
      ],
    },
  },
]
