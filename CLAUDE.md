# CLAUDE.md — KI-Kompass Projektkontext

## Projektübersicht

KI-Kompass ist ein SaaS-Produkt, das maßgeschneiderte KI-Nutzungsrichtlinien für Unternehmen im DACH-Raum generiert. Der Nutzer füllt einen Fragebogen aus (13 Fragen), bezahlt via Stripe, und erhält eine professionelle, sofort einsatzfähige KI-Policy als PDF. Das Produkt ist juristisch geprüft durch einen Fachanwalt für IT-Recht.

**Zielgruppe:** Geschäftsführer, HR-Leiter, Datenschutzbeauftragte, IT-Leiter von KMUs im DACH-Raum (10–500 Mitarbeiter)

## Tech-Stack

- **Framework:** Next.js (App Router) — Frontend und Backend in einem
- **Sprache:** TypeScript
- **Datenbank:** Supabase (PostgreSQL + Auth + File Storage)
- **Payment:** Stripe Checkout (Einmalzahlung)
- **KI:** Claude API (Sonnet) für Policy-Generierung
- **PDF:** Puppeteer (@sparticuz/chromium auf Vercel) — HTML → PDF
- **E-Mail:** Brevo (transaktionale E-Mails)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS

## Projektstruktur

```
ki-kompass/
├── app/
│   ├── page.tsx                        # Landing Page mit EU AI Act Countdown
│   ├── fragebogen/
│   │   └── page.tsx                    # Multi-Step-Formular (13 Fragen, 4 Schritte)
│   ├── preise/
│   │   └── page.tsx                    # Pricing (Basis €79 / Professional €149 / Enterprise €299)
│   ├── checkout/
│   │   └── page.tsx                    # Stripe Checkout Weiterleitung
│   ├── ergebnis/
│   │   └── [id]/page.tsx              # Download-Seite nach Zahlung
│   └── api/
│       ├── generate-policy/route.ts    # Claude API Call + PDF-Generierung
│       ├── create-checkout/route.ts    # Stripe Session erstellen
│       └── webhook/route.ts            # Stripe Webhook → Generierung triggern
├── lib/
│   ├── claude.ts                       # Claude API Client + Prompt-Builder
│   ├── prompt.ts                       # System Prompt (siehe unten)
│   ├── stripe.ts                       # Stripe Konfiguration
│   ├── supabase.ts                     # Supabase Client
│   ├── pdf.ts                          # Puppeteer HTML→PDF Generierung
│   └── email.ts                        # Brevo E-Mail-Versand
├── components/
│   ├── questionnaire/                  # Fragebogen-Komponenten pro Block
│   ├── landing/                        # Landing Page Sections
│   └── ui/                             # Shared UI-Komponenten
└── templates/
    └── policy.html                     # HTML-Template für PDF-Rendering
```

## Ablauf (End-to-End)

1. Nutzer landet auf `/` → sieht Landing Page mit EU AI Act Countdown (2. August 2026)
2. Klickt "Jetzt Richtlinie erstellen" → `/fragebogen`
3. Füllt 13 Fragen in 4 Schritten aus
4. Wählt Tier (Basis/Professional/Enterprise) → `/preise`
5. Bezahlt via Stripe Checkout
6. Stripe Webhook (`/api/webhook`) bestätigt Zahlung
7. Server baut User-Prompt aus Fragebogen-Antworten (`lib/claude.ts`)
8. Claude API (Sonnet) generiert Policy als strukturiertes Markdown
9. Server rendert Markdown → HTML (mit Template) → PDF (Puppeteer)
10. PDF wird in Supabase Storage gespeichert
11. Download-Link wird per Brevo E-Mail verschickt
12. Nutzer kann auch direkt auf `/ergebnis/[id]` downloaden

## Datenbank-Schema (Supabase)

```sql
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  company_name    TEXT NOT NULL,
  tier            TEXT NOT NULL CHECK (tier IN ('basis', 'professional', 'enterprise')),
  questionnaire   JSONB NOT NULL,
  stripe_session  TEXT,
  payment_status  TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  policy_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_at    TIMESTAMPTZ
);
```

## Fragebogen (13 Fragen)

Die Fragebogen-Antworten werden als JSON an die Claude API übergeben. Jede Frage beeinflusst spezifische Kapitel der Policy.

### Block 1: Unternehmensprofil

| # | Frage | Typ | Optionen | Steuert |
|---|-------|-----|----------|---------|
| F1 | Firmenname | Freitext | — | Wird in gesamter Policy eingesetzt |
| F2 | Branche | Dropdown | Logistik & Transport, Gesundheitswesen & Pharma, Finanzdienstleistungen & Versicherungen, Handel & E-Commerce, IT & Software, Fertigung & Industrie, Beratung & Dienstleistungen, Bildung & Forschung, Öffentlicher Sektor, Gastronomie & Hotellerie, Bau & Handwerk, Sonstige (Freitext) | Branchenspezifische Regeln und Risikoeinschätzung |
| F3 | Anzahl Mitarbeiter | Radio | 1–10 / 11–50 / 51–250 / 251–500 / 500+ | Governance-Struktur (einfach vs. Komitee) |
| F4 | Tätigkeitsländer | Checkboxen | Deutschland / Österreich / Schweiz / EU (andere) / Nicht-EU | DSGVO-Umfang, EU AI Act Anwendbarkeit. WICHTIG: Schweiz ist kein EU-Mitglied → EU AI Act gilt dort nicht direkt |

### Block 2: Aktuelle KI-Nutzung

| # | Frage | Typ | Optionen | Steuert |
|---|-------|-----|----------|---------|
| F5 | Aktueller Status der KI-Nutzung | Radio | Offiziell freigegeben / Teilweise freigegeben, ohne Regelung / Keine Regelung (Shadow AI) / Nicht genutzt / Weiß nicht | Ton der Policy, Shadow-AI-Abschnitt ja/nein. Bei "nicht genutzt" → präventive Formulierung |
| F6 | Genutzte externe KI-Tools | Checkboxen | ChatGPT, Microsoft Copilot, Google Gemini, Claude, GitHub Copilot, Midjourney/DALL-E, Branchenspezifische KI-Software, Keine, Sonstige (Freitext) | Kapitel 4: Freigegebene Tools. KEINE interne KI hier — das ist F8 |
| F7 | Einsatzzwecke | Checkboxen | Texte schreiben, Code-Generierung, Datenanalyse, Kundenservice/Chatbots, Übersetzungen, Bild-/Medienerstellung, Personalwesen, Entscheidungsunterstützung, Sonstige (Freitext) | Kapitel 3: Erlaubt/Eingeschränkt/Verboten Tabelle |
| F8 | Eigene interne KI-Lösung | Radio + Freitext | Ja / Nein / In Planung. Bei "Ja": Kurzbeschreibung | Trigger für Anhang A (Logging, Zugang, Dokumentation). Interne KI hat andere Compliance-Anforderungen als externe Tools |

### Block 3: Daten & Datenschutz

| # | Frage | Typ | Optionen | Steuert |
|---|-------|-----|----------|---------|
| F9 | Sensible Datenarten | Checkboxen | Kundendaten, Gesundheitsdaten, Finanzdaten, Personaldaten, Geschäftsgeheimnisse, Öffentlich verfügbare Daten | Kapitel 5: Datenklassifikation + Verbotsliste |
| F10 | Datenschutzbeauftragter | Radio | Ja intern / Ja extern / Nein | Kapitel 9: Verantwortlichkeiten + Ansprechpartner |
| F11 | Cloud-Daten außerhalb EU | Radio | Ja / Nein / Teilweise / Weiß nicht | Kapitel 5: DSGVO Drittlandtransfer-Abschnitt |

### Block 4: Gewünschter Umfang

| # | Frage | Typ | Optionen | Steuert |
|---|-------|-----|----------|---------|
| F12 | Striktheit der Richtlinie | Radio | Innovationsfreundlich / Ausgewogen / Restriktiv | Gesamter Ton: ermutigend vs. sachlich vs. formell-restriktiv |
| F13 | Verantwortliche Stelle | Radio | Geschäftsführung / IT-Abteilung / DSB / KI-Governance-Komitee / Noch unklar | Kapitel 9: Governance-Struktur |

## Generierte Policy — Kapitelstruktur

Jede Policy enthält diese 12 Pflichtkapitel + optionale Anhänge:

1. **Präambel & Zweck** — Geltungsbereich, Verweis auf DSGVO + EU AI Act
2. **Definitionen** — KI (Art. 3 Nr. 1 EU AI Act), Generative KI, Shadow AI, personenbezogene Daten (Art. 4 Nr. 1 DSGVO)
3. **Erlaubte und verbotene Nutzung** — Dreistufige Tabelle: Erlaubt (grün) / Eingeschränkt (gelb) / Verboten (rot)
4. **Freigegebene Tools & Zugangsregeln** — Tool-Liste, Account-Regeln, Antragsprozess
5. **Datenschutz & Datenklassifikation** — Vier Datenklassen, Verbote pro Klasse, Drittlandtransfer
6. **Qualitätssicherung & menschliche Kontrolle** — Prüfpflicht, Haftung beim Mitarbeiter
7. **Geistiges Eigentum & Urheberrecht** — Eigentumsfragen, Risiken
8. **Transparenz & Kennzeichnung** — Interne + externe Offenlegung, Art. 50 EU AI Act
9. **Verantwortlichkeiten & Governance** — Rollen, Eskalation, KI-Ansprechpartner
10. **Schulung & Awareness** — Art. 4 EU AI Act (GILT BEREITS SEIT 02/2025)
11. **Verstöße & Konsequenzen** — Abgestuft, Meldepflicht, DSGVO Art. 33
12. **Überprüfung & Aktualisierung** — Halbjährlich, Versionierung

**Anhang A: Interne KI-Systeme** — NUR wenn F8 = "Ja" (Systembeschreibung, Zugang, Logging, Dokumentation)
**Anhang B: EU AI Act Compliance-Checkliste** — NUR Professional/Enterprise (10-Punkte-Checkliste mit Deadlines)
**Anhang C: Mitarbeiter-Schulungsvorlage** — NUR Professional/Enterprise (5 goldene Regeln, Quiz, Unterschrift)

## Rechtsgrundlagen — VERIFIZIERT

DIESE INFORMATIONEN SIND VERIFIZIERT UND DÜRFEN NICHT VERÄNDERT WERDEN.

### DSGVO (Verordnung (EU) 2016/679)

| Artikel | Inhalt | Verwendung in Policy |
|---------|--------|---------------------|
| Art. 4 Nr. 1 | Definition personenbezogene Daten | Kapitel 2: Definitionen |
| Art. 5 | Grundsätze (Zweckbindung, Datenminimierung, Richtigkeit) | Kapitel 5: Datenschutz |
| Art. 6 | Rechtsgrundlagen für Verarbeitung | Kapitel 5: Datenschutz |
| Art. 13/14 | Informationspflichten | Kapitel 8: Transparenz |
| Art. 22 | Automatisierte Einzelentscheidungen — Betroffene haben das Recht, nicht einer ausschließlich auf automatisierter Verarbeitung beruhenden Entscheidung unterworfen zu werden, die rechtliche Wirkung oder ähnlich erhebliche Beeinträchtigung hat. AUSNAHMEN: Vertragserfüllung, gesetzliche Grundlage, ausdrückliche Einwilligung. Menschliche Überprüfung muss substantiell sein (nicht nur Rubber-Stamping). | Kapitel 3: Verbotene Nutzung (Personalentscheidungen) |
| Art. 25 | Privacy by Design und by Default | Kapitel 5: Datenschutz |
| Art. 33 | Meldepflicht an Aufsichtsbehörde innerhalb 72 Stunden bei Datenschutzverletzung | Kapitel 11: Verstöße |
| Art. 35 | Datenschutz-Folgenabschätzung (DSFA) bei hohem Risiko | Kapitel 5 / Anhang B |
| Art. 44–49 | Drittlandtransfers — relevant bei US-basierten KI-Anbietern (OpenAI, Google, Anthropic) | Kapitel 5: wenn F11 ≠ "Nein" |

### EU AI Act (Verordnung (EU) 2024/1689)

GESTAFFELTE ANWENDBARKEIT — NICHT VERWECHSELN:

| Datum | Was gilt | Status |
|-------|---------|--------|
| 2. Februar 2025 | Art. 4 (AI Literacy) + Art. 5 (Verbotene Praktiken) | BEREITS IN KRAFT |
| 2. August 2025 | Regeln für GPAI-Modelle + Governance-Strukturen | BEREITS IN KRAFT |
| 2. August 2026 | Hauptpflichten für High-Risk-KI-Systeme (Art. 6–51) | KOMMENDE DEADLINE |
| 2. August 2027 | High-Risk-KI in regulierten Produkten (Annex I) | ZUKÜNFTIG |

| Artikel | Inhalt | ACHTUNG |
|---------|--------|---------|
| Art. 3 Nr. 1 | Definition KI-System | Kapitel 2 |
| Art. 4 | AI Literacy — Pflicht zur KI-Kompetenz aller Mitarbeiter | GILT BEREITS SEIT 02/2025. Nicht erst ab 2026! |
| Art. 5 | 8 verbotene Praktiken: (a) Unterschwellige Manipulation, (b) Ausnutzung von Vulnerabilitäten, (c) Social Scoring, (d) Vorhersage von Straftaten via Profiling, (e) Ungezieltes Facial Scraping, (f) Emotionserkennung am Arbeitsplatz/Schule, (g) Biometrische Kategorisierung nach sensiblen Merkmalen, (h) Biometrische Echtzeit-Fernidentifikation | GILT BEREITS SEIT 02/2025. Es sind 8 Verbote, nicht 3! |
| Art. 6 + Annex III | High-Risk-Klassifikation | Ab 08/2026 |
| Art. 9 | Risikomanagementsystem | Ab 08/2026 |
| Art. 11 | Technische Dokumentation | Ab 08/2026 |
| Art. 12 | Aufzeichnungspflichten (Logging) | Ab 08/2026 |
| Art. 14 | Menschliche Aufsicht über High-Risk-Systeme | Ab 08/2026 |
| Art. 50 | Transparenzpflichten — ALLE Kennzeichnungspflichten stehen hier: (1) KI-Interaktion offenlegen (Chatbots), (2) Outputs maschinenlesbar als KI markieren, (3) Emotionserkennung/Biometrie: Betroffene informieren, (4) Deepfakes offenlegen, (5) KI-generierte Texte für Öffentlichkeit kennzeichnen | Ab 08/2026. NICHT mit Art. 52 verwechseln! |
| Art. 99 | Bußgelder: 35 Mio./7% (Art. 5), 15 Mio./3% (High-Risk), 7.5 Mio./1% (Falschinfos) | — |

**VERBOTEN ZU VERWENDEN:**
- ❌ Art. 52 ist KEIN Transparenz-Artikel. Er regelt das Verfahren zur GPAI-Klassifikation.
- ❌ NIEMALS schreiben, dass AI Literacy erst ab August 2026 gilt. Sie gilt seit Februar 2025.
- ❌ NIEMALS Art. 5 auf "Social Scoring und Manipulation" verkürzen. Es sind 8 Verbote.
- ❌ NIEMALS erfundene Artikel, Verordnungen oder Normen verwenden.

### Sonderfall Schweiz

Die Schweiz ist KEIN EU-Mitglied. Der EU AI Act gilt dort NICHT direkt. Wenn F4 "Schweiz" enthält:
- DSGVO gilt über das Schweizer Datenschutzgesetz (DSG, revDSG seit 1. September 2023) in weiten Teilen analog
- EU AI Act nur relevant, wenn das Unternehmen auch im EU-Markt tätig ist oder AI-Systeme in der EU bereitstellt
- Policy muss dies explizit erwähnen und differenzieren

### Branchenspezifische Regeln

| Branche (F2) | Zusätzliche Regeln in der Policy |
|--------------|----------------------------------|
| Gesundheitswesen & Pharma | Verbot Eingabe Patientendaten, ärztliche Schweigepflicht, Art. 9 DSGVO (besondere Kategorien) |
| Finanzdienstleistungen | BaFin-Anforderungen, MaRisk, Verbot KI-basierte Kreditentscheidungen ohne menschliche Prüfung |
| Logistik & Transport | Sendungsdaten mit Kundenbezug = personenbezogen, besondere Vorsicht |
| Öffentlicher Sektor | Erweiterte Transparenzpflichten, Vergaberecht, demokratische Kontrolle |
| Handel & E-Commerce | Verbraucherschutz, Produkthaftung bei KI-generierten Beschreibungen |
| Bildung & Forschung | Prüfungsintegrität, Urheberrecht bei Lehrmaterialien, Schutz Minderjähriger |
| Bau & Handwerk | Einfachere Sprache, weniger technische Tiefe, Fokus auf praktische Regeln |
| IT & Software | Höhere technische Tiefe, Code-Review-Pflichten, IP-Schutz für Quellcode |

## System Prompt für Claude API

Der System Prompt wird in `lib/prompt.ts` definiert. Die Fragebogen-Antworten werden als User-Prompt im JSON-Format übergeben.

```
Du bist ein erfahrener Experte für KI-Governance, Datenschutzrecht (DSGVO) und den EU AI Act, spezialisiert auf den DACH-Raum (Deutschland, Österreich, Schweiz). Du erstellst maßgeschneiderte KI-Nutzungsrichtlinien für Unternehmen.

## Deine Aufgabe
Erstelle eine vollständige, professionelle und sofort einsatzfähige KI-Nutzungsrichtlinie basierend auf den Unternehmensdaten im JSON-Block am Ende dieser Anweisung. Die Richtlinie muss so formuliert sein, dass ein Unternehmen sie mit minimalen Anpassungen direkt einführen kann.

## Stil & Ton
- Schreibe auf Deutsch in professioneller, aber verständlicher Sprache.
- Vermeide unnötigen Juristenjargon — die Richtlinie muss für alle Mitarbeiter verständlich sein, nicht nur für Juristen.
- Passe den Ton an die gewählte Risikotoleranz an:
  - "Innovationsfreundlich": Ermutigend, positiv, Chancen betonen, klare Leitplanken setzen. Formulierungen wie "Wir ermutigen...", "Mitarbeiter sind eingeladen..."
  - "Ausgewogen": Sachlich, neutral, sowohl Chancen als auch Risiken benennen. Formulierungen wie "Mitarbeiter dürfen...", "Es wird erwartet..."
  - "Restriktiv": Formell, pflichtbetont, Sicherheit und Compliance im Vordergrund. Formulierungen wie "Es ist untersagt...", "Mitarbeiter sind verpflichtet..."
- Verwende direkte Anweisungen statt vager Empfehlungen.
- Bei Branche "Bau & Handwerk" oder "Gastronomie & Hotellerie": Einfachere Sprache, kürzere Sätze, mehr praktische Beispiele.

## Struktur
Folge exakt dieser Kapitelstruktur. Jedes Kapitel beginnt mit einem kurzen Einleitungssatz und endet mit einem Kasten "Zusammenfassung für Mitarbeiter" — ein bis zwei Sätze, die die Kernregel in einfacher Sprache zusammenfassen.

1. **Präambel & Zweck** — Warum die Richtlinie existiert, Geltungsbereich, Datum. Verweis auf DSGVO und EU AI Act.
2. **Definitionen** — KI (Art. 3 Nr. 1 EU AI Act), Generative KI, Shadow AI, personenbezogene Daten (Art. 4 Nr. 1 DSGVO), KI-System, Prompt
3. **Erlaubte und verbotene Nutzung** — Dreistufig: Erlaubt / Eingeschränkt (mit Genehmigung) / Verboten. Basierend auf den angegebenen Use Cases und der Risikotoleranz. Dargestellt als Tabelle.
4. **Freigegebene Tools & Zugangsregeln** — Liste der genehmigten Tools aus dem Fragebogen, Account-Regeln (nur Firmen-Accounts), Antragsprozess für neue Tools
5. **Datenschutz & Datenklassifikation** — Vier Datenklassen (Öffentlich/Intern/Vertraulich/Streng Vertraulich), Regeln pro Klasse, Verbotsliste basierend auf den angegebenen Datenarten, DSGVO Art. 5+6, Drittlandtransfer Art. 44-49 wenn Cloud außerhalb EU
6. **Qualitätssicherung & menschliche Kontrolle** — Prüfpflicht für alle KI-Outputs, Verbot ungeprüfter Weitergabe, Haftung liegt beim Mitarbeiter
7. **Geistiges Eigentum & Urheberrecht** — KI-Ergebnisse = Firmeneigentum, Eingabeverbot für geschütztes Material, Risiko durch KI-Output
8. **Transparenz & Kennzeichnung** — Interne Kennzeichnung (KI-generiert markieren), externe Pflichten nach Art. 50 EU AI Act (Chatbot-Hinweis, Deepfake-Offenlegung, KI-Text-Kennzeichnung)
9. **Verantwortlichkeiten & Governance** — Zuständige Stelle aus Fragebogen, Rollen (GF, DSB, IT, Abteilungsleiter), KI-Ansprechpartner pro Abteilung empfehlen
10. **Schulung & Awareness** — WICHTIG: Art. 4 EU AI Act (AI Literacy) gilt bereits seit 2. Februar 2025. Pflichtschulung innerhalb 3 Monate, jährliche Auffrischung, Onboarding-Integration, Teilnahme dokumentieren
11. **Verstöße & Konsequenzen** — Abgestuft: Erstverstoß (Nachschulung) → Wiederholung (Einschränkung) → Schwer (Arbeitsrechtlich). Meldepflicht auch für eigene Fehler. DSGVO Art. 33 bei Datenpannen (72h).
12. **Überprüfung & Aktualisierung** — Halbjährliche Überprüfung, anlassbezogen bei Gesetzesänderungen, Versionstabelle am Ende

Falls interne_ki = "Ja":
→ **Anhang A: Interne KI-Systeme** — Systembeschreibung aus Fragebogen, Zugangsberechtigungen, Logging/Nachvollziehbarkeit, Dokumentationspflichten

Falls tier = "professional" oder "enterprise":
→ **Anhang B: EU AI Act Compliance-Checkliste** — 10-Punkte-Checkliste. BEACHTE: Art. 4 + Art. 5 unter "bereits fällig" führen, High-Risk-Pflichten unter "Deadline 2. August 2026"
→ **Anhang C: Mitarbeiter-Schulungsvorlage** — "5 goldene Regeln für KI am Arbeitsplatz", 5-Fragen-Quiz, Unterschriftenfeld

## Rechtliche Präzision

### DSGVO — korrekte Artikel verwenden
- Art. 5: Grundsätze (Zweckbindung, Datenminimierung)
- Art. 6: Rechtsgrundlagen
- Art. 13/14: Informationspflichten
- Art. 22: Automatisierte Einzelentscheidungen — Betroffene haben das Recht, NICHT einer ausschließlich auf automatisierter Verarbeitung beruhenden Entscheidung unterworfen zu werden, die rechtliche Wirkung oder ähnlich erhebliche Beeinträchtigung hat. Es gibt drei Ausnahmen (Vertragserfüllung, gesetzliche Grundlage, ausdrückliche Einwilligung), aber menschliche Überprüfung muss dabei substantiell sein. In der Policy formulieren als: "Entscheidungen, die rechtliche Wirkung auf Personen haben (z. B. Einstellungen, Kündigungen, Kreditvergabe), dürfen nicht ausschließlich auf Basis von KI-Output getroffen werden. Eine qualifizierte menschliche Überprüfung ist zwingend erforderlich."
- Art. 25: Privacy by Design
- Art. 33: Meldepflicht (72 Stunden)
- Art. 35: DSFA bei hohem Risiko
- Art. 44–49: Drittlandtransfers

### EU AI Act — KORREKTE Deadlines und Artikel
- Art. 4 (AI Literacy): GILT BEREITS SEIT 2. FEBRUAR 2025
- Art. 5 (8 Verbote): GILT BEREITS SEIT 2. FEBRUAR 2025
- Art. 6–51 (High-Risk): AB 2. AUGUST 2026
- Art. 50: Transparenzpflichten — ALLE Kennzeichnungspflichten stehen in Art. 50
- Art. 99: Bußgelder (35 Mio./7% für Art. 5, 15 Mio./3% für High-Risk, 7.5 Mio./1% für Falschinfos)

### NIEMALS VERWENDEN
- Art. 52 ist KEIN Transparenz-Artikel (er regelt GPAI-Klassifikation)
- AI Literacy gilt NICHT erst ab 2026 (seit Feb 2025)
- Art. 5 hat 8 Verbote, NICHT 3

### Sonderfall Schweiz
Wenn das Unternehmen NUR in der Schweiz tätig ist: EU AI Act gilt NICHT direkt. Stattdessen das Schweizer Datenschutzgesetz (revDSG, seit 1.9.2023) referenzieren. EU AI Act nur erwähnen als "Best Practice" und für den Fall, dass das Unternehmen auch im EU-Markt agiert.

## Branchenspezifische Anpassungen
- Gesundheitswesen: Patientendaten-Verbot, ärztliche Schweigepflicht, Art. 9 DSGVO
- Finanzen: BaFin, MaRisk, KI-Kreditentscheidungen nur mit menschlicher Prüfung
- Logistik: Sendungsdaten + Kundendaten = personenbezogen
- Öffentlicher Sektor: Erweiterte Transparenz, Vergaberecht
- Handel/E-Commerce: Verbraucherschutz, Produkthaftung
- Bildung: Prüfungsintegrität, Minderjährigenschutz
- Bau/Handwerk: Einfache Sprache, praktische Beispiele
- IT/Software: Technische Tiefe, Code-Review, IP-Schutz

## Formatierung
- Nummerierte Kapitel und Unterkapitel (1., 1.1, 1.2)
- Jedes Kapitel mit Einleitungssatz + "Zusammenfassung für Mitarbeiter" am Ende
- Aufzählungen nur wo sie Lesbarkeit verbessern
- Länge: 3.000–5.000 Wörter (Basis) / 5.000–8.000 Wörter (Professional/Enterprise)

## Qualitätskriterien
- SOFORT einsatzfähig — keine Platzhalter außer Datum und Logo
- Alle Fragebogen-Angaben müssen eingebaut sein
- Muss sich maßgeschneidert anfühlen, nicht generisch
- Alle Rechtsverweise MÜSSEN korrekt sein
- KEINE erfundenen Gesetze oder Normen
- Ausgabe als sauberes Markdown mit klarer Kapitelstruktur
```

## PDF-Design

Die PDF wird über Puppeteer aus einem HTML-Template generiert. Design-Anforderungen:

- **Deckblatt:** Dunkles Navy-Design (#1B2A4A), Firmenname prominent, EU AI Act Deadline-Hinweis, Metadaten (Version, Datum, Verantwortlich)
- **Header:** Firmenname + "KI-Nutzungsrichtlinie" + "VERTRAULICH"
- **Footer:** "Erstellt mit KI-Kompass" + Seitenzahl
- **Inhaltsverzeichnis:** Auf Seite 2
- **Tabellen:** Farbcodiert — grün (#E8F5E9) für erlaubt, gelb (#FFF8E1) für eingeschränkt, rot (#FFEBEE) für verboten
- **Info-Boxen:** Hellblau (#E8F0FE) mit blauem Rand für "Zusammenfassung für Mitarbeiter"
- **Warning-Boxen:** Orange (#FFF3E0) mit orangem Rand für EU AI Act Deadlines
- **Typografie:** Helvetica/Arial, 10pt Body, 18pt Kapitelüberschriften
- **Versionstabelle:** Am Ende von Kapitel 12

## Konventionen

- Alle Texte auf Deutsch
- TypeScript strict mode
- Supabase Row Level Security (RLS) aktivieren
- Stripe Webhook-Signatur immer verifizieren
- Umgebungsvariablen: ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, BREVO_API_KEY
- Error Handling: Alle API-Calls in try/catch, Fehler an Nutzer als "Generierung fehlgeschlagen, bitte Support kontaktieren"
- Kein console.log in Production, nur structured logging
