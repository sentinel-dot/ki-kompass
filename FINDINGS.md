# FINDINGS — Output-Qualität & Validierung

> Erstellungsdatum: 2026-04-10
> Status: **Priorisiert — Implementierungsplan steht**

---

## Kontext

KI-Kompass generiert KI-Nutzungsrichtlinien für €79–€149. Die Qualitätssicherung hat zwei bestehende Ebenen:

1. **Validierungs-Retry in `lib/claude.ts`**: Rechtsreferenz-Whitelist + kontextuelle Konsistenz, max. 2 Korrekturversuche pro Generierung.
2. **Worker-Retry in `lib/policy-generator.ts`**: `MAX_RETRIES = 3` — wenn `generatePolicy()` wirft, greift der Cron nach 2 Minuten erneut.

Wenn alle 3 Worker-Versuche scheitern → Admin-Alert → manueller Eingriff erforderlich. Der Kunde bekommt keine Policy.

**Was fehlt:** Die Validierung prüft nur die Korrektheit von Rechtsreferenzen und branchenfremde Inhalte — aber nicht die strukturelle Vollständigkeit, Länge oder Personalisierung des Dokuments.

---

## Architekturentscheidung: 3-Stufen-Quality-Pipeline

### Das Problem mit dem Status quo

Aktuell gibt es genau **eine** Validierungsebene: Rechtsreferenzen. Alles andere (Länge, Struktur, Platzhalter, Personalisierung) geht ungeprüft durch. Wenn wir die neuen Checks einfach in den bestehenden Retry-Loop packen, passiert Folgendes:

- Retry-Rate steigt massiv (mehr Gründe zum Scheitern)
- Jeder Retry = voller Claude API Call = ~$0.10–0.30 + 30–60s Wartezeit
- Strukturelle Probleme (zu kurz, Kapitel fehlen) lassen sich durch Correction-Prompts schlecht fixen — das ist ein Prompt-Problem, kein Korrekturproblem
- Wir verwischen die Unterscheidung zwischen "Rechtsreferenz falsch" (korrigierbar) und "Output grundsätzlich kaputt" (Neugenerierung nötig)

### Die Lösung: 3-Stufen-Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                     generatePolicy() — Ablauf                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Claude API Call                                                    │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────┐                │
│  │  GATE 0 — Integrität (Sofort-Abbruch)           │                │
│  │                                                  │                │
│  │  • stop_reason === 'max_tokens'? → THROW         │                │
│  │  • Textblock vorhanden?          → THROW         │                │
│  │                                                  │                │
│  │  Kosten: 0 (kein API Call)                       │                │
│  │  Bei Fehler: Neugenerierung (Worker-Retry)       │                │
│  └──────────────────────┬──────────────────────────┘                │
│                         │ ✓                                         │
│                         ▼                                           │
│  ┌─────────────────────────────────────────────────┐                │
│  │  GATE 1 — Struktur & Vollständigkeit            │                │
│  │  (Deterministisch, kein LLM nötig)              │                │
│  │                                                  │                │
│  │  • Platzhalter-Check (F-01)                      │                │
│  │  • Mindestlänge tier-abhängig (F-03)             │                │
│  │  • Kapitel-Vollständigkeit (F-04)                │                │
│  │  • Firmenname im Output (F-05)                   │                │
│  │  • Anhänge B+C bei Professional (F-06)           │                │
│  │                                                  │                │
│  │  Kosten: 0 (reine Regex/String-Checks)           │                │
│  │  Bei Fehler: THROW → Neugenerierung              │                │
│  │  KEIN Correction-Retry (Prompt-Problem,          │                │
│  │  nicht per Korrektur lösbar)                     │                │
│  └──────────────────────┬──────────────────────────┘                │
│                         │ ✓                                         │
│                         ▼                                           │
│  ┌─────────────────────────────────────────────────┐                │
│  │  GATE 2 — Rechtsreferenzen & Kontext            │                │
│  │  (Bestehende Logik, mit Correction-Retry)       │                │
│  │                                                  │                │
│  │  • Artikel-Whitelist EU AI Act / DSGVO           │                │
│  │  • Bekannte LLM-Fehler (F-08, erweitert)        │                │
│  │  • Kontextuelle Konsistenz (Branche, Land)      │                │
│  │                                                  │                │
│  │  Kosten: 0–2 API Calls (Correction-Retry)       │                │
│  │  Bei Fehler: Correction-Prompt (max 2x)         │                │
│  │  Nach 2 fehlgeschlagenen Korrekturen: THROW     │                │
│  └──────────────────────┬──────────────────────────┘                │
│                         │ ✓                                         │
│                         ▼                                           │
│                    ✅ Policy ausliefern                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Warum diese Reihenfolge?

**Gate 0 vor Gate 1:** Ein abgeschnittener Output (stop_reason = max_tokens) würde alle Gate-1-Checks verfälschen — die Policy wäre zu kurz, Kapitel würden "fehlen", etc. Gate 0 fängt das ab, bevor wir sinnlose Strukturchecks auf kaputtem Text ausführen.

**Gate 1 vor Gate 2:** Wenn die Policy nur 600 Wörter hat oder 4 Kapitel fehlen, ist es Verschwendung, die Rechtsreferenzen zu validieren. Der Output ist sowieso unbrauchbar. Gate 1 spart die teuren Gate-2-Retries für Fälle, wo die Grundstruktur stimmt.

**Gate 1 ohne Retry:** Strukturelle Mängel (zu kurz, Kapitel fehlen, kein Firmenname) entstehen durch ein fundamentales Prompt-Verständnisproblem bei Claude. Ein Correction-Prompt ("Bitte mach die Policy länger") produziert selten gute Ergebnisse — das wird eher ein zusammengestückelter Franken-Text. Besser: komplett neu generieren (Worker-Retry). Bei wiederholtem Scheitern → Admin-Alert → Prompt-Problem untersuchen.

**Gate 2 mit Retry:** Rechtsreferenz-Fehler (Art. 52 statt Art. 50) sind *chirurgisch korrigierbar*. Der Correction-Prompt sagt genau was falsch ist und wie es richtig heißt. Das funktioniert gut.

### Fail-Semantik

| Gate | Fehlertyp | Aktion | Wer handelt |
|------|-----------|--------|-------------|
| Gate 0 | Truncation / kein Text | `throw` → Worker-Retry | Automatisch |
| Gate 1 | Struktureller Mangel | `throw` → Worker-Retry | Automatisch (bei 3x Fail → Admin) |
| Gate 2 | Falsche Rechtsreferenz | Correction-Retry (inline) | Automatisch (bei 2x Fail → `throw` → Worker-Retry) |

### Worst Case: Wie viel kostet das Maximum?

```
Worker-Versuch 1:
  Generierung (1 API Call)
  Gate 0: ✓
  Gate 1: ✗ (zu kurz) → throw

Worker-Versuch 2:
  Generierung (1 API Call)
  Gate 0: ✓
  Gate 1: ✓
  Gate 2: ✗ → Correction 1 (1 API Call) → ✗ → Correction 2 (1 API Call) → ✗ → throw

Worker-Versuch 3:
  Generierung (1 API Call)
  Gate 0: ✓
  Gate 1: ✓
  Gate 2: ✓ → Auslieferung

Total: 5 API Calls ≈ $0.50–1.50
```

Das ist akzeptabel. Der aktuelle Worst Case (3 Worker × 1 Generierung × 2 Corrections = 9 API Calls) ist teurer.

---

## Gefundene Lücken — Priorisiert

### Implementierungsblock 1 — Kritisch (sofort)

> Alle Findings in Block 1 können einen Kunden betreffen, der JETZT bezahlt.
> Aufwand: ~2–3 Stunden gesamt.

---

#### F-07 — "Juristisch geprüft" im PDF-Cover noch vorhanden
**Problem:** `lib/policy-generator.ts:449` enthält `"Erstellt mit KI-Kompass · Juristisch geprüft"` — widerspricht dem Beschluss aus Commit `8aa838d`, der alle "juristisch geprüft"-Claims entfernt hat.
**Impact:** Haftungsfrage. Wir behaupten etwas, das nicht stimmt. Im schlimmsten Fall abmahnfähig.
**Aufwand:** Trivial (1 Zeile)
**Fix:** Ersetzen durch `"Erstellt mit KI-Kompass · Rechtsreferenzen validiert"`
**Betroffene Datei:** `lib/policy-generator.ts:449`
**Prio:** `P0` — heute.

---

#### F-09 — Kein Abbruch bei abgeschnittenem Output (Stop-Reason-Check)
**Problem:** Die Claude API gibt `stop_reason` zurück (`'end_turn'` = vollständig, `'max_tokens'` = abgeschnitten). Wir prüfen dieses Feld nicht. Ein abgeschnittener Output wird wie ein vollständiger behandelt.
**Impact:** Stille Truncation. Kunde bekommt ein Dokument, das mitten im Satz aufhört. Direkt verbunden mit F-02.
**Aufwand:** Klein (5 Zeilen in `extractText()`)
**Fix:**
```typescript
function extractText(message: Anthropic.Message): string {
  if (message.stop_reason === 'max_tokens') {
    throw new Error(
      `Output abgeschnitten (stop_reason: max_tokens). ` +
      `max_tokens erhöhen oder Prompt kürzen.`
    )
  }
  const textBlock = message.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Keine Textantwort von Claude erhalten')
  }
  return textBlock.text
}
```
**Betroffene Datei:** `lib/claude.ts` (`extractText()`)
**Einordnung:** Gate 0 der neuen Pipeline.
**Prio:** `P0`

---

#### F-02 — `max_tokens = 8192` kann Professional-Policies abschneiden
**Problem:** Professional soll 5.000–8.000 Wörter. Die Finding-Schätzung von 1,3 Tokens/Wort ist zu optimistisch. Juristischer Fachtext mit Zusammensetzungen, Markdown-Formatierung und Artikel-Referenzen liegt realistisch bei 1,5–1,8 Tokens/Wort. Bei 8.000 Wörtern = ~12.000–14.400 Tokens. `max_tokens: 8192` schneidet das ab.
**Impact:** Professional-Policy endet mitten im Text. Ohne F-09 wird das still ausgeliefert.
**Aufwand:** Klein
**Fix:** `max_tokens` tier-abhängig:
```typescript
const maxTokens = questionnaire.tier === 'professional' ? 16384 : 8192
```
**Warum 16384 und nicht 16000:** Claude-Token-Grenzen sind am effizientesten bei Zweierpotenzen. 16384 gibt ~14% Puffer über den geschätzten 14.400 Tokens. Trotzdem: F-09 ist der eigentliche Schutz — wenn selbst 16384 nicht reicht, wirft `extractText()` und der Worker retried.
**Betroffene Datei:** `lib/claude.ts` (`generatePolicy()`)
**Prio:** `P0` — gemeinsam mit F-09, da F-09 ohne F-02 nur das Symptom meldet, aber nicht löst.
**TODO vor Implementierung:** 5–10 bestehende Professional-Outputs durch `tiktoken` jagen und die tatsächliche Token-Zahl messen. Wenn der Durchschnitt über 14.000 liegt, auf 24576 erhöhen.

---

#### F-01 — Kein Platzhalter-Check
**Problem:** Claude könnte `[Firmenname]`, `[Datum]`, `[TODO]`, `[einfügen]`, `[MUSTER]`, `[XXX]`, `<FIRMENNAME>` o.ä. im Output hinterlassen.
**Impact:** Sofort sichtbar für den Kunden. Maximaler Vertrauensverlust. "Dafür habe ich €149 bezahlt?"
**Aufwand:** Klein
**Fix:**
```typescript
const PLACEHOLDER_PATTERNS = [
  /\[(?:Firmenname|Unternehmen|Firma|Name|Datum|TODO|einfügen|MUSTER|XXX|ergänzen|anpassen)\]/gi,
  /<(?:FIRMENNAME|UNTERNEHMEN|FIRMA|NAME|DATUM)>/gi,
  /\{(?:Firmenname|Unternehmen|company_name)\}/gi,
  /_{3,}/g,  // ___ als Lückentext
  /\.{4,}/g, // .... als Lückentext
]

export function checkPlaceholders(text: string): ValidationError[] {
  const errors: ValidationError[] = []
  for (const pattern of PLACEHOLDER_PATTERNS) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (match) {
      errors.push({
        type: 'placeholder',
        message: `Platzhalter im Output gefunden: "${match[0]}"`,
        excerpt: match[0],
        position: match.index,
      })
    }
  }
  return errors
}
```
**Betroffene Datei:** `lib/validation.ts` (neue Funktion), aufgerufen in Gate 1
**Einordnung:** Gate 1 der neuen Pipeline.
**Prio:** `P0`

---

### Implementierungsblock 2 — Hoch (diese Woche)

> Schützt vor "technisch korrekten aber wertlosen" Dokumenten.
> Aufwand: ~3–4 Stunden gesamt.

---

#### F-03 — Kein Mindest-Längen-Check
**Problem:** Eine 600-Wort-Policy besteht alle bisherigen Validierungen.
**Impact:** Kunde bekommt ein inhaltsloses Dokument.
**Aufwand:** Klein
**Schwellenwerte und ihre Herkunft:**

| Tier | Mindest-Wörter | Herkunft |
|------|---------------|----------|
| Basis | 2.000 | Prompt fordert 3.000–5.000. Minimum 2.000 gibt 33% Toleranz nach unten. |
| Professional | 4.000 | Prompt fordert 5.000–8.000. Minimum 4.000 gibt 20% Toleranz nach unten. |

**Warum nicht die Prompt-Untergrenze (3.000/5.000)?** Claude produziert gelegentlich leicht kürzere aber inhaltlich vollständige Policies. Ein zu straffer Cut erzeugt False Positives und unnötige Worker-Retries. Die Schwellenwerte sind **Safety Nets**, keine Qualitätsindikatoren — ein 2.500-Wort-Basis-Dokument kann gut sein, ein 4.000-Wort-Dokument kann schlecht sein. Qualität wird durch die anderen Gates geprüft.
**TODO:** Nach 20–30 Produktionsgenerierungen die tatsächliche Verteilung messen und Schwellenwerte anpassen.
**Fix:**
```typescript
export function checkMinLength(
  text: string,
  tier: 'basis' | 'professional'
): ValidationError[] {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
  const minWords = tier === 'professional' ? 4000 : 2000

  if (wordCount < minWords) {
    return [{
      type: 'structure',
      message: `Policy zu kurz: ${wordCount} Wörter (Minimum: ${minWords} für ${tier})`,
      excerpt: `Wortanzahl: ${wordCount}`,
    }]
  }
  return []
}
```
**Betroffene Datei:** `lib/validation.ts`, aufgerufen in Gate 1
**Einordnung:** Gate 1
**Prio:** `P1`

---

#### F-06 — Professional-Anhänge B + C werden nicht auf Präsenz geprüft
**Problem:** Professional-Kunden zahlen €70 mehr und erwarten Anhang B (EU AI Act Compliance-Checkliste) und Anhang C (Schulungsvorlage). Aktuell prüfen wir nur, dass Anhang A nicht fälschlich erscheint — nicht, dass die Pflicht-Anhänge da sind.
**Impact:** Professional-Kunde bekommt ein Basis-Dokument für €149.
**Aufwand:** Klein
**Fix:**
```typescript
export function checkRequiredAppendices(
  text: string,
  tier: 'basis' | 'professional'
): ValidationError[] {
  if (tier !== 'professional') return []

  const errors: ValidationError[] = []
  const appendixB = /(?:Anhang|Appendix|Anlage)\s*B\b.*?(?:Compliance|Checkliste|EU\s*AI\s*Act)/is
  const appendixC = /(?:Anhang|Appendix|Anlage)\s*C\b.*?(?:Schulung|goldene\s*Regeln|Quiz)/is

  if (!appendixB.test(text)) {
    errors.push({
      type: 'structure',
      message: 'Anhang B (EU AI Act Compliance-Checkliste) fehlt in Professional-Policy',
      excerpt: '',
    })
  }
  if (!appendixC.test(text)) {
    errors.push({
      type: 'structure',
      message: 'Anhang C (Schulungsvorlage) fehlt in Professional-Policy',
      excerpt: '',
    })
  }
  return errors
}
```
**Betroffene Datei:** `lib/validation.ts`, aufgerufen in Gate 1
**Einordnung:** Gate 1
**Prio:** `P1`

---

#### F-04 — Kein Kapitel-Vollständigkeits-Check
**Problem:** Die 12 Pflichtkapitel werden nicht verifiziert.
**Impact:** Rechtlich relevante Lücken.
**Aufwand:** Mittel
**Design-Entscheidung:** Semantische Gruppen statt exakte Überschriften. Claude benennt Kapitel kreativ um — "Haftung & Sanktionen" statt "Verstöße & Konsequenzen" ist dasselbe. Deshalb: Keyword-Cluster pro Kapitel, nicht exakte Matches.
**Fix:** Die Patterns aus `tests/helpers/policy-assertions.ts` (`REQUIRED_CHAPTER_PATTERNS`) übernehmen und in `lib/validation.ts` als Produktions-Check einbauen. Die Test-Patterns sind bereits breit genug und getestet.
```typescript
// Mindestens 10 von 12 Kapiteln müssen erkannt werden.
// Warum nicht 12/12: Claude fasst gelegentlich "Verstöße & Konsequenzen"
// mit "Verantwortlichkeiten & Governance" zusammen. Das ist inhaltlich
// akzeptabel, aber der Regex erkennt nur eines davon.
const MIN_CHAPTERS = 10
```
**Betroffene Datei:** `lib/validation.ts`, aufgerufen in Gate 1
**Einordnung:** Gate 1
**Prio:** `P1`

---

#### F-05 — Firmenname wird nicht im Output verifiziert
**Problem:** Firmenname ist das wichtigste Personalisierungsmerkmal.
**Impact:** Generisch wirkendes Dokument.
**Aufwand:** Klein
**Edge Cases die beachtet werden müssen:**

| Input | Akzeptable Varianten |
|-------|---------------------|
| `IT Solutions GmbH` | "IT Solutions GmbH", "IT Solutions" (ohne Rechtsform) |
| `Müller & Partner KG` | "Müller & Partner KG", "Müller & Partner" |
| `Ärztezentrum Süd e.V.` | "Ärztezentrum Süd e.V.", "Ärztezentrum Süd" |

**Fix:** Rechtsform-toleranter Check:
```typescript
export function checkCompanyName(
  text: string,
  companyName: string
): ValidationError[] {
  // Rechtsformen entfernen für flexiblen Match
  const LEGAL_FORMS = /\s*(GmbH|AG|KG|OHG|e\.?\s*V\.?|UG|SE|GbR|Inc\.?|Ltd\.?|Co\.?\s*KG)\s*$/i
  const baseName = companyName.replace(LEGAL_FORMS, '').trim()

  // Mindestens der Basisname muss im Text vorkommen
  if (baseName.length >= 3 && !text.includes(baseName)) {
    return [{
      type: 'personalization',
      message: `Firmenname "${companyName}" (bzw. "${baseName}") nicht im Output gefunden`,
      excerpt: '',
    }]
  }
  return []
}
```
**Betroffene Datei:** `lib/validation.ts`, aufgerufen in Gate 1
**Einordnung:** Gate 1
**Prio:** `P1`

---

### Implementierungsblock 3 — Mittel (nächste Woche)

> Erweitert die Fehler-Erkennung. Weniger dringend, weil die bestehende Validierung die häufigsten Fälle schon fängt.
> Aufwand: ~2–3 Stunden.

---

#### F-08 — Bekannte LLM-Fehler-Patterns zu eng gefasst
**Problem:** Nur 3 Patterns. Weitere bekannte Halluzinationen werden nicht gefangen.
**Impact:** Fehlerhafte Inhalte passieren die Validierung.
**Aufwand:** Mittel (Recherche + Patterns + Tests)
**Zu ergänzende Patterns:**
```typescript
// Art. 13 EU AI Act — existiert, wird aber oft falsch beschrieben
// (regelt High-Risk-System-Logging, NICHT Transparenz allgemein)
{
  pattern: /Art\.?\s*13\s+EU\s*AI\s*Act.{0,100}Transparenz(?!.*Log|.*Aufzeichnung)/gi,
  description: 'Art. 13 EU AI Act regelt Logging/Aufzeichnungspflichten für High-Risk-Systeme, NICHT allgemeine Transparenz.',
},
// Falsche Bußgeldhöhen
{
  pattern: /Art\.?\s*99.{0,50}(?:20|25|30|40|50)\s*(?:Mio|Million)/gi,
  description: 'Art. 99 EU AI Act: Bußgelder sind 35 Mio/7%, 15 Mio/3%, oder 7.5 Mio/1% — keine anderen Beträge.',
},
```
**Wartungsprozess:** Neue Patterns nach jedem E2E-Testlauf hinzufügen, wenn Claude-Output einen neuen Fehlertyp zeigt. KNOWN_ERRORS ist eine lebende Liste — nicht "einmal schreiben, nie anfassen".
**Betroffene Datei:** `lib/validation.ts` (`KNOWN_ERRORS` Array)
**Einordnung:** Gate 2
**Prio:** `P2`

---

## Priorisierungs-Matrix (ausgefüllt)

| ID | Severity | Aufwand | Gate | Prio | Block |
|----|----------|---------|------|------|-------|
| F-07 | Kritisch (Haftung) | Trivial (1 Zeile) | — | `P0` | 1 |
| F-09 | Kritisch (silent truncation) | Klein (5 Zeilen) | Gate 0 | `P0` | 1 |
| F-02 | Kritisch (kaputtes Dokument) | Klein (1 Zeile + Messung) | Gate 0 | `P0` | 1 |
| F-01 | Kritisch (sichtbarer Fehler) | Klein (~20 Zeilen) | Gate 1 | `P0` | 1 |
| F-03 | Hoch (wertloses Dokument) | Klein (~15 Zeilen) | Gate 1 | `P1` | 2 |
| F-06 | Hoch (Professional-Betrug) | Klein (~20 Zeilen) | Gate 1 | `P1` | 2 |
| F-04 | Hoch (Struktur unvollständig) | Mittel (~30 Zeilen) | Gate 1 | `P1` | 2 |
| F-05 | Mittel (generisch) | Klein (~15 Zeilen) | Gate 1 | `P1` | 2 |
| F-08 | Niedrig (erweiterte Erkennung) | Mittel (Recherche) | Gate 2 | `P2` | 3 |

---

## Implementierungsplan

### Datei-Änderungen

```
lib/claude.ts          — Gate 0 (extractText), max_tokens tier-abhängig
lib/validation.ts      — Gate 1 Funktionen (neu), Gate 2 KNOWN_ERRORS (erweitert)
lib/policy-generator.ts — F-07 Footer-Fix
```

### Ablauf in `generatePolicy()` nach Implementierung

```typescript
export async function generatePolicy(
  questionnaire: Record<string, unknown>
): Promise<string> {
  const client = getClient()
  const tier = (questionnaire.tier as string) || 'basis'
  const maxTokens = tier === 'professional' ? 16384 : 8192

  // ── Erstgenerierung ─────────────────────────────────────────────
  const initialMessage = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: buildUserPrompt(questionnaire) }],
    system: SYSTEM_PROMPT,
  })

  // ── GATE 0: Integrität ──────────────────────────────────────────
  // extractText() prüft stop_reason und wirft bei Truncation
  let policyText = extractText(initialMessage)

  // ── GATE 1: Struktur & Vollständigkeit ──────────────────────────
  const structureErrors = runStructureValidation(policyText, questionnaire)
  if (structureErrors.length > 0) {
    const summary = structureErrors.map(e => `- ${e.message}`).join('\n')
    throw new Error(
      `Strukturelle Validierung fehlgeschlagen (${structureErrors.length} Fehler):\n${summary}`
    )
    // → Worker-Retry (komplett neue Generierung)
  }

  // ── GATE 2: Rechtsreferenzen & Kontext (mit Correction-Retry) ──
  // Bestehende Logik, unverändert
  let validation = runFullValidation(policyText)

  for (let attempt = 1; attempt <= MAX_VALIDATION_RETRIES && !validation.valid; attempt++) {
    const correctionPrompt = buildCorrectionPrompt(policyText, validation.errors)
    const correctionMessage = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: correctionPrompt }],
      system: SYSTEM_PROMPT,
    })
    policyText = extractText(correctionMessage) // Gate 0 greift auch hier
    validation = runFullValidation(policyText)
  }

  if (!validation.valid) {
    throw new Error(`Rechtsreferenz-Validierung fehlgeschlagen nach ${MAX_VALIDATION_RETRIES} Korrekturen.`)
  }

  return policyText
}
```

### Neue Funktion: `runStructureValidation()`

```typescript
// lib/validation.ts — neue exportierte Funktion

export function runStructureValidation(
  text: string,
  questionnaire: Record<string, unknown>
): ValidationError[] {
  const tier = (questionnaire.tier as string) || 'basis'
  const companyName = (questionnaire.firmenname as string) || ''

  return [
    ...checkPlaceholders(text),
    ...checkMinLength(text, tier as 'basis' | 'professional'),
    ...checkChapterCompleteness(text),
    ...checkCompanyName(text, companyName),
    ...checkRequiredAppendices(text, tier as 'basis' | 'professional'),
  ]
}
```

---

## Offene Fragen — Beantwortet

### "Retry oder Quality Gate?"
→ **Beantwortet:** Getrennt. Gate 1 (Struktur) wirft direkt → Worker-Retry. Gate 2 (Rechtsreferenzen) nutzt Correction-Retry. Siehe Architekturentscheidung oben.

### "max_tokens tier-abhängig oder generell erhöhen?"
→ **Tier-abhängig.** Basis-Policies brauchen keine 16K Tokens. Das würde nur die Response-Time und Kosten erhöhen, ohne Nutzen.

### "Weitere branchenspezifische Kontextchecks nötig?"
→ **Nicht jetzt.** Die bestehende `validateContextualConsistency()` deckt die wichtigsten Fälle ab (Gesundheit, Schweiz, Art. 9, Anhang A). Weitere Checks erst wenn E2E-Tests systematische Lücken zeigen.

---

## Zusätzliche Empfehlungen (nicht in F-01 bis F-09)

### E-01 — First-Pass-Rate messen
**Problem:** Wir wissen nicht, wie oft Policies im ersten Versuch alle Gates bestehen. Wenn die Rate unter 80% liegt, ist das ein Prompt-Problem, kein Validierungsproblem.
**Fix:** Sentry-Counter oder DB-Feld: `validation_attempts` (wie oft wurde Gate 2 retried?) und `worker_attempts` (wie oft wurde Worker-Retry getriggert?). Dashboard bauen.
**Prio:** `P2` — nach Block 2, wenn die Gates produktiv laufen.

### E-02 — Temperature überprüfen
**Problem:** Nicht in den Findings erwähnt, aber relevant. Wenn `temperature` nicht explizit gesetzt ist, nutzt Claude den Default (1.0). Das erhöht die Varianz und damit die Retry-Rate. Für deterministische Dokumente wäre 0.3–0.5 besser.
**Fix:** `temperature: 0.4` in `client.messages.create()`.
**Prio:** `P2` — messen, ob sich die Retry-Rate verbessert.
