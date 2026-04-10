# CLAUDE.md — KI-Kompass Projektkontext

> **Lebendiges Dokument:** Diese Datei wird bei jeder signifikanten Codeänderung aktualisiert und wächst mit dem Projekt mit.

## Projektübersicht

KI-Kompass ist ein SaaS-Produkt, das maßgeschneiderte KI-Nutzungsrichtlinien für Unternehmen im DACH-Raum generiert. Der Nutzer füllt einen Fragebogen aus (13 Fragen), bezahlt via Stripe, und erhält eine professionelle, sofort einsatzfähige KI-Policy als PDF und DOCX. Das Produkt ist juristisch geprüft durch einen Fachanwalt für IT-Recht.

**Zielgruppe:** Geschäftsführer, HR-Leiter, Datenschutzbeauftragte, IT-Leiter von KMUs im DACH-Raum (10–500 Mitarbeiter)

## Tech-Stack

- **Framework:** Next.js (App Router) — Frontend und Backend in einem
- **Sprache:** TypeScript (strict mode)
- **Datenbank:** Supabase (PostgreSQL + Auth + File Storage)
- **Payment:** Stripe Checkout (Einmalzahlung)
- **KI:** Claude API (@anthropic-ai/sdk ^0.86.1) — Policy-Generierung + Update-Generierung + Law Change Alerts
- **PDF:** Puppeteer-core + @sparticuz/chromium (auf Vercel serverless)
- **DOCX:** docx library (^9.5.0) — parallele Generierung mit PDF
- **Markdown:** marked.js (^15.0.0) mit custom Renderer (farbkodierte Tabellen)
- **E-Mail:** Brevo (transaktionale E-Mails)
- **Rate Limiting:** @upstash/ratelimit + @upstash/redis (Upstash Redis)
- **Error Tracking:** Sentry (@sentry/nextjs ^9.27.0)
- **Validierung:** Zod (Schemas für Fragebogen + API-Requests)
- **Testing:** Vitest + @vitest/coverage-v8
- **Hosting:** Vercel (Serverless + Cron Jobs)
- **Styling:** Tailwind CSS (^4.2.2)
- **Fonts:** Cormorant Garamond (display), DM Sans (body), DM Mono (mono)

## Projektstruktur

```
ki-kompass/
├── app/
│   ├── layout.tsx                        # Root Layout (Google Fonts: Cormorant, DM Sans, DM Mono)
│   ├── page.tsx                          # Landing Page (Hero, EU AI Act Countdown, TrustBar)
│   ├── globals.css                       # Global Styles
│   ├── global-error.tsx                  # Sentry Error Boundary
│   ├── fragebogen/
│   │   └── page.tsx                      # 5-stufiges Multi-Step-Formular (Blocks 1-4 + Final)
│   ├── preise/
│   │   └── page.tsx                      # Pricing (Basis €79 / Professional €149 / Enterprise €299)
│   ├── checkout/
│   │   └── page.tsx                      # Stripe Checkout Weiterleitung
│   ├── ergebnis/
│   │   └── [id]/page.tsx                 # Download-Seite (PDF + DOCX Buttons, Disclaimer-Gate)
│   └── api/
│       ├── generate-policy/route.ts      # POST: Interner Test-Endpoint (Bearer INTERNAL_API_KEY)
│       ├── create-checkout/route.ts      # POST: Stripe Session erstellen (Rate Limit: 5/min)
│       ├── webhook/route.ts              # POST: Stripe Webhook (Signatur-Verifikation, 30/min)
│       ├── process-orders/route.ts       # GET: Cron Worker — verarbeitet offene Orders (*/2 min)
│       ├── quarterly-updates/route.ts    # GET: Cron — Enterprise Quarterly Updates (tägl. 6 Uhr)
│       └── law-change-alerts/route.ts    # POST: Cron — Law Change Alerts an Enterprise (CRON_SECRET)
│
├── lib/
│   ├── claude.ts                         # Claude API Client + Validation-Retry-Loop (max 2 Retries)
│   ├── prompt.ts                         # SYSTEM_PROMPT + buildUserPrompt()
│   ├── update-prompt.ts                  # UPDATE_SYSTEM_PROMPT + buildUpdateUserPrompt()
│   ├── validation.ts                     # Rechtsreferenz-Validierung (DSGVO/EU AI Act Whitelist)
│   ├── schemas.ts                        # Zod Schemas (Fragebogen, Checkout, API Requests)
│   ├── stripe.ts                         # Stripe Client + Pricing-Mapping
│   ├── supabase.ts                       # Supabase Client (Service Role)
│   ├── email.ts                          # Brevo: sendDownloadEmail()
│   ├── email-updates.ts                  # Brevo: sendUpdateEmail() + sendLawChangeAlertEmail()
│   ├── policy-generator.ts               # processOpenOrders() + processOrder() (Worker-Logik)
│   ├── markdown-to-html.ts               # marked.js Custom Renderer (farbkodierte Tabellen)
│   ├── docx-generator.ts                 # DOCX-Export (color-coded tables, Header/Footer)
│   ├── subscription.ts                   # Enterprise Subscription Management
│   ├── law-change-notifier.ts            # Alert-Erstellung + -Verteilung an Enterprise-Kunden
│   ├── quarterly-updater.ts              # Quarterly Update Generierung für Subscriptions
│   ├── rate-limit.ts                     # Upstash Redis Rate Limiter (sliding window)
│   └── admin-alert.ts                    # Admin-Benachrichtigung bei failed Orders
│
├── components/
│   ├── questionnaire/
│   │   ├── Block1.tsx                    # Unternehmensprofil (F1-F4)
│   │   ├── Block2.tsx                    # Aktuelle KI-Nutzung (F5-F8)
│   │   ├── Block3.tsx                    # Daten & Datenschutz (F9-F11)
│   │   ├── Block4.tsx                    # Gewünschter Umfang (F12-F13)
│   │   ├── BlockFinal.tsx                # E-Mail, Tier-Auswahl, Disclaimer-Checkbox
│   │   ├── FormField.tsx                 # Shared Input (text, select, radio, checkbox)
│   │   ├── ProgressBar.tsx               # Step Indicator (Schritte 1-5)
│   │   └── types.ts                      # QuestionnaireData, FormStep Types
│   ├── landing/
│   │   ├── CountdownTimer.tsx            # EU AI Act Countdown (2. August 2026)
│   │   ├── TrustBar.tsx                  # Trust-Indikatoren
│   │   ├── HowItWorks.tsx                # 4-Schritt-Prozess-Erklärung
│   │   ├── WhatYouGet.tsx                # Tier-Features Übersicht
│   │   └── FAQ.tsx                       # FAQ-Sektion
│   ├── LegalDisclaimer.tsx               # "Keine Rechtsberatung"-Hinweis (Checkbox-Variante)
│   └── DownloadSection.tsx               # Download-Buttons (PDF + DOCX) + Disclaimer-Gate
│
├── config/
│   └── pricing.ts                        # TIER_IDS, TIERS, Formatierungsfunktionen
│
├── supabase/
│   └── migrations/
│       ├── 20260409_add_docx_url.sql     # docx_url Spalte in orders
│       ├── 20260409_add_retry_columns.sql # retry_count, processing_started_at, last_error, admin_alerted_at
│       └── 20260409_add_subscriptions.sql # subscriptions, subscription_updates, law_change_alerts
│
├── tests/
│   ├── unit/
│   │   ├── validation.test.ts            # Rechtsreferenz-Validierung
│   │   ├── prompt.test.ts                # Prompt-Aufbau
│   │   ├── schemas.test.ts               # Zod-Schema-Validierung
│   │   ├── rate-limit.test.ts            # Rate Limiting
│   │   └── policy-assertions.test.ts    # Policy-Inhalts-Assertions
│   ├── e2e/
│   │   └── policy-generation.e2e.test.ts # Vollständiger Workflow-Test
│   ├── helpers/
│   │   └── policy-assertions.ts          # Assertion-Helpers
│   └── scenarios.ts                      # 15 Test-Szenarien (Branchen/Größen/Regionen)
│
├── .agents/skills/                       # Claude Skills (supabase, postgres, frontend-design)
├── package.json
├── tsconfig.json                         # strict mode, @/* Pfad-Alias
├── tailwind.config.ts                    # Custom Colors (navy, gold, cream, slate)
├── next.config.ts                        # Sentry, puppeteer-core externals
├── vercel.json                           # Cron-Schedules
└── .env.local.example                    # Alle benötigten Umgebungsvariablen
```

## Ablauf (End-to-End)

### Kauf-Flow (synchron)

1. Nutzer landet auf `/` → Landing Page mit EU AI Act Countdown (2. August 2026)
2. Klickt "Jetzt Richtlinie erstellen" → `/fragebogen` (5 Schritte)
3. Füllt 13 Fragen + E-Mail + Tier-Auswahl aus, akzeptiert Disclaimer
4. Weiterleitung zu Stripe Checkout via `/api/create-checkout`
5. Stripe Webhook (`/api/webhook`) setzt `payment_status = 'paid'`
6. Nutzer landet auf `/ergebnis/[id]` (Warteanzeige, pollt Status)

### Generierungs-Flow (asynchron via Cron)

7. Cron Job `/api/process-orders` läuft alle **2 Minuten**
8. Findet offene Orders (`payment_status='paid'`, nicht gesperrt)
9. Setzt `processing_started_at` als Lock (verhindert Parallel-Verarbeitung)
10. `processOrder()` in `lib/policy-generator.ts`:
    - Baut User-Prompt aus Fragebogen-Antworten (`lib/prompt.ts`)
    - Claude API generiert Policy als Markdown
    - **Validierungs-Retry-Loop** (max 2 Retries): Prüft Rechtsreferenzen
    - Bei Validierungsfehler: Claude wird mit Korrektur-Prompt erneut aufgerufen
    - Markdown → HTML (marked.js custom Renderer in `lib/markdown-to-html.ts`)
    - **Parallel:** PDF (Puppeteer) + DOCX (docx library) generieren
    - Beide Dateien in Supabase Storage hochladen → `policy_url` + `docx_url` setzen
    - Download-E-Mail via Brevo senden
    - Bei Enterprise-Tier: Subscription erstellen (`lib/subscription.ts`)
11. Bei max. Retries überschritten: Admin-Alert senden, Order markieren
12. Nutzer kann auf `/ergebnis/[id]` PDF + DOCX herunterladen

### Enterprise Subscription-Flow

- **Quarterly Updates** (`/api/quarterly-updates`, täglich 6 Uhr):
  - Findet Subscriptions mit fälligen Updates (`next_update_due_at <= now()`)
  - Regeneriert Policy mit `UPDATE_SYSTEM_PROMPT` (diff-fokussiert)
  - Speichert Version in `subscription_updates` mit Change Summary
  - Sendet Update-E-Mail mit neuer PDF/DOCX

- **Law Change Alerts** (`/api/law-change-alerts`):
  - Admin erstellt Alert (Titel, Beschreibung, Rechtsreferenz, Schweregrad)
  - Claude generiert personalisierte Relevanz-Einschätzung pro Kunde
  - Massenversand an alle aktiven Enterprise-Subscriber

## Datenbank-Schema (Supabase)

### orders

```sql
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT NOT NULL,
  company_name          TEXT NOT NULL,
  tier                  TEXT NOT NULL CHECK (tier IN ('basis', 'professional', 'enterprise')),
  questionnaire         JSONB NOT NULL,
  stripe_session        TEXT,
  payment_status        TEXT NOT NULL DEFAULT 'pending'
                        CHECK (payment_status IN ('pending', 'paid', 'failed')),
  policy_url            TEXT,                    -- Supabase Storage URL (PDF)
  docx_url              TEXT,                    -- Supabase Storage URL (DOCX)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_at          TIMESTAMPTZ,
  -- Retry/Locking (Migration 20260409_add_retry_columns)
  retry_count           INT DEFAULT 0,
  processing_started_at TIMESTAMPTZ,             -- Lock-Timestamp
  last_error            TEXT,                    -- Debugging
  admin_alerted_at      TIMESTAMPTZ              -- Verhindert doppelte Alerts
);
```

### subscriptions (Enterprise only)

```sql
CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID REFERENCES orders(id),
  email               TEXT NOT NULL,
  company_name        TEXT NOT NULL,
  tier                TEXT NOT NULL,
  starts_at           TIMESTAMPTZ NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  last_update_at      TIMESTAMPTZ,
  next_update_due_at  TIMESTAMPTZ,
  update_count        INT DEFAULT 0,
  questionnaire       JSONB NOT NULL,
  current_policy_markdown TEXT
);
```

### subscription_updates

```sql
CREATE TABLE subscription_updates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  order_id        UUID REFERENCES orders(id),
  version         INT NOT NULL,
  policy_markdown TEXT,
  change_summary  TEXT,
  pdf_url         TEXT,
  docx_url        TEXT,
  status          TEXT NOT NULL CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  email_sent_at   TIMESTAMPTZ
);
```

### law_change_alerts

```sql
CREATE TABLE law_change_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  law_reference    TEXT NOT NULL,
  effective_date   DATE,
  severity         TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  status           TEXT NOT NULL CHECK (status IN ('draft', 'sending', 'sent')),
  created_by       TEXT,
  total_recipients INT DEFAULT 0,
  emails_sent      INT DEFAULT 0
);
```

## Fragebogen (13 Fragen, 5 Schritte)

Block 1–4 im Fragebogen, Schritt 5 = BlockFinal (E-Mail, Tier, Disclaimer).

### Block 1: Unternehmensprofil (F1–F4)

| # | Frage | Typ | Steuert |
|---|-------|-----|---------|
| F1 | Firmenname | Freitext | Wird in gesamter Policy eingesetzt |
| F2 | Branche | Dropdown | Branchenspezifische Regeln und Risikoeinschätzung |
| F3 | Anzahl Mitarbeiter | Radio (1–10 / 11–50 / 51–250 / 251–500 / 500+) | Governance-Struktur |
| F4 | Tätigkeitsländer | Checkboxen (DE/AT/CH/EU andere/Nicht-EU) | DSGVO-Umfang, EU AI Act Anwendbarkeit |

### Block 2: Aktuelle KI-Nutzung (F5–F8)

| # | Frage | Typ | Steuert |
|---|-------|-----|---------|
| F5 | Status der KI-Nutzung | Radio | Ton der Policy, Shadow-AI-Abschnitt |
| F6 | Genutzte externe KI-Tools | Checkboxen (ChatGPT, Copilot, Gemini, Claude, GitHub Copilot, Midjourney/DALL-E, Branchenspezifisch, Keine, Sonstige) | Kapitel 4: Freigegebene Tools |
| F7 | Einsatzzwecke | Checkboxen (Texte, Code, Datenanalyse, Kundenservice, Übersetzung, Bild, HR, Entscheidung, Sonstige) | Kapitel 3: Erlaubt/Eingeschränkt/Verboten |
| F8 | Interne KI-Lösung | Radio + Freitext (Ja/Nein/In Planung) | Trigger für Anhang A |

### Block 3: Daten & Datenschutz (F9–F11)

| # | Frage | Typ | Steuert |
|---|-------|-----|---------|
| F9 | Sensible Datenarten | Checkboxen (Kundendaten, Gesundheit, Finanzen, Personal, Geschäftsgeheimnisse, Öffentlich) | Kapitel 5: Datenklassifikation |
| F10 | Datenschutzbeauftragter | Radio (intern/extern/Nein) | Kapitel 9: Verantwortlichkeiten |
| F11 | Cloud-Daten außerhalb EU | Radio (Ja/Nein/Teilweise/Weiß nicht) | Kapitel 5: DSGVO Drittlandtransfer |

### Block 4: Gewünschter Umfang (F12–F13)

| # | Frage | Typ | Steuert |
|---|-------|-----|---------|
| F12 | Striktheit der Richtlinie | Radio (Innovationsfreundlich/Ausgewogen/Restriktiv) | Gesamter Ton |
| F13 | Verantwortliche Stelle | Radio (GF/IT/DSB/KI-Komitee/Unklar) | Kapitel 9: Governance-Struktur |

## Generierte Policy — Kapitelstruktur

Jede Policy enthält diese 12 Pflichtkapitel + optionale Anhänge:

1. **Präambel & Zweck** — Geltungsbereich, DSGVO + EU AI Act
2. **Definitionen** — KI (Art. 3 Nr. 1 EU AI Act), Generative KI, Shadow AI, personenbezogene Daten (Art. 4 Nr. 1 DSGVO), Prompt
3. **Erlaubte und verbotene Nutzung** — Dreistufige Tabelle: Erlaubt (grün) / Eingeschränkt (gelb) / Verboten (rot)
4. **Freigegebene Tools & Zugangsregeln** — Tool-Liste, Firmen-Accounts, Antragsprozess
5. **Datenschutz & Datenklassifikation** — Vier Datenklassen, Verbotsliste, Drittlandtransfer
6. **Qualitätssicherung & menschliche Kontrolle** — Prüfpflicht, Haftung beim Mitarbeiter
7. **Geistiges Eigentum & Urheberrecht** — Eigentumsfragen, IP-Risiken
8. **Transparenz & Kennzeichnung** — Art. 50 EU AI Act (Chatbot-Hinweis, Deepfakes, KI-Texte)
9. **Verantwortlichkeiten & Governance** — Rollen, KI-Ansprechpartner
10. **Schulung & Awareness** — Art. 4 EU AI Act (GILT SEIT 02/2025)
11. **Verstöße & Konsequenzen** — Abgestuft, DSGVO Art. 33 (72h Meldepflicht)
12. **Überprüfung & Aktualisierung** — Halbjährlich, Versionstabelle

**Anhang A: Interne KI-Systeme** — NUR wenn F8 = "Ja"
**Anhang B: EU AI Act Compliance-Checkliste** — NUR Professional/Enterprise
**Anhang C: Mitarbeiter-Schulungsvorlage** — NUR Professional/Enterprise

## Validierungs-Retry-Loop

**Kritisches Feature:** Claude-Output wird immer auf Rechtsreferenzen geprüft (`lib/validation.ts`).

**Validierte Fehler:**
- `Art. 52` als Transparenz-Artikel zitiert (falsch — regelt GPAI-Klassifikation)
- AI Literacy (Art. 4) mit Datum 2026 verknüpft (falsch — gilt seit 02/2025)
- Art. 5 als "3 Verbote" oder "Social Scoring und Manipulation" zusammengefasst (falsch — 8 Verbote)
- Erfundene Artikel außerhalb der Whitelist (EU AI Act Art. 1–113, DSGVO Art. 1–99)

**Ablauf:**
1. Claude generiert Policy-Markdown
2. Validator extrahiert alle "Art. X"-Referenzen und prüft gegen Whitelist
3. Bei Fehler: Korrektur-Prompt an Claude (max. 2 Retries)
4. Nach max. Retries: Hard Fail — Kunde erhält keine fehlerhafte Policy
5. Admin-Alert wird ausgelöst

## Rate Limiting

Alle API-Endpunkte via `lib/rate-limit.ts` (Upstash Redis, sliding window):

| Endpunkt | Limit | Auth |
|----------|-------|------|
| `/api/generate-policy` | 10/min | Bearer `INTERNAL_API_KEY` |
| `/api/create-checkout` | 5/min | IP-basiert |
| `/api/webhook` | 30/min | Stripe-Signatur |
| `/api/process-orders` | 20/min | `CRON_SECRET` Header |
| `/api/quarterly-updates` | 20/min | `CRON_SECRET` Header |
| `/api/law-change-alerts` | 20/min | `CRON_SECRET` Header |

Deaktivierung für Tests: `RATE_LIMIT_DISABLED=true`

## Cron Jobs (vercel.json)

```json
{
  "crons": [
    { "path": "/api/process-orders",     "schedule": "*/2 * * * *" },
    { "path": "/api/quarterly-updates",  "schedule": "0 6 * * *"   }
  ]
}
```

`maxDuration = 300` (5 Minuten) für `/api/process-orders`.

## PDF & DOCX Design

**PDF (Puppeteer + marked.js):**
- **Deckblatt:** Navy (#1B2A4A), Firmenname, EU AI Act Deadline, Metadaten
- **Header:** Firmenname + "KI-Nutzungsrichtlinie" + "VERTRAULICH"
- **Footer:** "Erstellt mit KI-Kompass" + Seitenzahl
- **Inhaltsverzeichnis:** Seite 2
- **Tabellen:** grün (#E8F5E9) erlaubt / gelb (#FFF8E1) eingeschränkt / rot (#FFEBEE) verboten
- **Info-Boxen:** hellblau (#E8F0FE) für "Zusammenfassung für Mitarbeiter"
- **Warning-Boxen:** orange (#FFF3E0) für EU AI Act Deadlines
- **Typografie:** Cormorant Garamond/Arial, 10pt Body, 18pt Kapitelüberschriften

**DOCX (docx library):**
- Gleiche Farbcodierung wie PDF
- Deckblatt + Inhaltsverzeichnis (built-in)
- Header/Footer analog zu PDF
- Wird parallel zum PDF generiert (kein blocking)

## Testing

```bash
npm run test          # Unit Tests (Vitest)
npm run test:watch    # Watch Mode
npm run test:coverage # Coverage Report
npm run test:e2e      # E2E Tests
npm run test:all      # Alle Tests
```

**15 Test-Szenarien** in `tests/scenarios.ts` (Branchen, Unternehmensgrößen, Länder-Kombinationen)

**Test-Abdeckung:**
- Zod-Schema-Validierung
- Prompt-Aufbau
- Rechtsreferenz-Validierung (inkl. bekannte LLM-Fehler)
- Rate Limiting Logik
- Policy-Inhalts-Assertions
- E2E: kompletter Generierungs-Workflow

## Rechtsgrundlagen — VERIFIZIERT

**DIESE INFORMATIONEN SIND JURISTISCH GEPRÜFT UND DÜRFEN NICHT VERÄNDERT WERDEN.**

### DSGVO (Verordnung (EU) 2016/679)

| Artikel | Inhalt | Verwendung in Policy |
|---------|--------|---------------------|
| Art. 4 Nr. 1 | Definition personenbezogene Daten | Kapitel 2: Definitionen |
| Art. 5 | Grundsätze (Zweckbindung, Datenminimierung, Richtigkeit) | Kapitel 5: Datenschutz |
| Art. 6 | Rechtsgrundlagen für Verarbeitung | Kapitel 5: Datenschutz |
| Art. 13/14 | Informationspflichten | Kapitel 8: Transparenz |
| Art. 22 | Automatisierte Einzelentscheidungen — Recht, nicht ausschließlich automatisierten Entscheidungen mit rechtlicher Wirkung unterworfen zu werden. 3 Ausnahmen (Vertragserfüllung, gesetzliche Grundlage, Einwilligung). Menschliche Überprüfung muss substantiell sein (kein Rubber-Stamping). | Kapitel 3: Verbotene Nutzung |
| Art. 25 | Privacy by Design und by Default | Kapitel 5: Datenschutz |
| Art. 33 | Meldepflicht an Aufsichtsbehörde innerhalb 72 Stunden | Kapitel 11: Verstöße |
| Art. 35 | Datenschutz-Folgenabschätzung (DSFA) bei hohem Risiko | Kapitel 5 / Anhang B |
| Art. 44–49 | Drittlandtransfers (relevant: OpenAI/Google/Anthropic = US-Anbieter) | Kapitel 5: wenn F11 ≠ "Nein" |

### EU AI Act (Verordnung (EU) 2024/1689)

**GESTAFFELTE ANWENDBARKEIT — NICHT VERWECHSELN:**

| Datum | Was gilt | Status |
|-------|---------|--------|
| 2. Februar 2025 | Art. 4 (AI Literacy) + Art. 5 (Verbotene Praktiken) | **BEREITS IN KRAFT** |
| 2. August 2025 | GPAI-Modelle + Governance-Strukturen | **BEREITS IN KRAFT** |
| 2. August 2026 | Hauptpflichten High-Risk-KI (Art. 6–51) | Kommende Deadline |
| 2. August 2027 | High-Risk-KI in regulierten Produkten (Annex I) | Zukünftig |

| Artikel | Inhalt | Achtung |
|---------|--------|---------|
| Art. 3 Nr. 1 | Definition KI-System | Kapitel 2 |
| Art. 4 | AI Literacy — Pflicht zur KI-Kompetenz aller Mitarbeiter | **GILT SEIT 02/2025** |
| Art. 5 | **8** verbotene Praktiken: (a) Unterschwellige Manipulation, (b) Ausnutzung von Vulnerabilitäten, (c) Social Scoring, (d) Straftaten-Vorhersage via Profiling, (e) Ungezieltes Facial Scraping, (f) Emotionserkennung am Arbeitsplatz/Schule, (g) Biometrische Kategorisierung nach sensiblen Merkmalen, (h) Biometrische Echtzeit-Fernidentifikation | **GILT SEIT 02/2025. 8 Verbote, nicht 3!** |
| Art. 6 + Annex III | High-Risk-Klassifikation | Ab 08/2026 |
| Art. 9 | Risikomanagementsystem | Ab 08/2026 |
| Art. 11 | Technische Dokumentation | Ab 08/2026 |
| Art. 12 | Aufzeichnungspflichten (Logging) | Ab 08/2026 |
| Art. 14 | Menschliche Aufsicht über High-Risk-Systeme | Ab 08/2026 |
| Art. 50 | Transparenzpflichten: (1) KI-Interaktion offenlegen, (2) Outputs als KI markieren, (3) Emotionserkennung/Biometrie: Betroffene informieren, (4) Deepfakes offenlegen, (5) KI-Texte kennzeichnen | Ab 08/2026 |
| Art. 99 | Bußgelder: 35 Mio./7% (Art. 5), 15 Mio./3% (High-Risk), 7,5 Mio./1% (Falschinfos) | — |

**VERBOTEN ZU VERWENDEN:**
- ❌ `Art. 52` — ist KEIN Transparenz-Artikel (regelt GPAI-Klassifikation)
- ❌ AI Literacy erst ab 2026 — **gilt seit Februar 2025**
- ❌ Art. 5 auf "Social Scoring und Manipulation" verkürzen — **8 Verbote**
- ❌ Erfundene Artikel, Verordnungen oder Normen

### Sonderfall Schweiz

Die Schweiz ist **KEIN EU-Mitglied**. EU AI Act gilt dort **NICHT direkt**.
- DSGVO gilt über revDSG (Schweizer Datenschutzgesetz, seit 1. September 2023) analog
- EU AI Act nur relevant, wenn Unternehmen auch im EU-Markt tätig ist
- Policy muss dies explizit erwähnen und differenzieren

### Branchenspezifische Regeln

| Branche (F2) | Zusätzliche Regeln |
|--------------|-------------------|
| Gesundheitswesen & Pharma | Patientendaten-Verbot, ärztliche Schweigepflicht, Art. 9 DSGVO |
| Finanzdienstleistungen | BaFin, MaRisk, KI-Kreditentscheidungen nur mit menschlicher Prüfung |
| Logistik & Transport | Sendungsdaten + Kundendaten = personenbezogen |
| Öffentlicher Sektor | Erweiterte Transparenz, Vergaberecht, demokratische Kontrolle |
| Handel & E-Commerce | Verbraucherschutz, Produkthaftung bei KI-generierten Beschreibungen |
| Bildung & Forschung | Prüfungsintegrität, Urheberrecht, Schutz Minderjähriger |
| Bau & Handwerk | Einfache Sprache, kurze Sätze, praktische Beispiele |
| IT & Software | Technische Tiefe, Code-Review-Pflichten, IP-Schutz für Quellcode |

## System Prompt für Claude API

Definiert in `lib/prompt.ts` (SYSTEM_PROMPT). Fragebogen-Antworten werden als User-Prompt im JSON-Format übergeben. Update-Generierung in `lib/update-prompt.ts` (UPDATE_SYSTEM_PROMPT).

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

## Konventionen

- Alle Texte auf Deutsch
- TypeScript strict mode, `@/*` Pfad-Alias
- Supabase Row Level Security (RLS) aktivieren
- Stripe Webhook-Signatur **immer** verifizieren
- Error Handling: Alle API-Calls in try/catch, Fehler an Nutzer als "Generierung fehlgeschlagen, bitte Support kontaktieren"
- Kein `console.log` in Production — structured logging über Sentry
- Sentry für Error Tracking + Performance Monitoring (`sentry.client.config.ts`, `sentry.server.config.ts`)

## Umgebungsvariablen

Vollständige Liste in `.env.local.example`:

```
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIS
STRIPE_PRICE_PROFESSIONAL
STRIPE_PRICE_ENTERPRISE
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
BREVO_API_KEY
NEXT_PUBLIC_BASE_URL
INTERNAL_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RATE_LIMIT_DISABLED          # optional, "true" zum Deaktivieren in Tests
CRON_SECRET
SENTRY_DSN                   # optional, für Error Tracking
```
