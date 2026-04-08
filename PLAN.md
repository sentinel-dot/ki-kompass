# KI-Richtlinien Generator — Kompletter Produktplan (v3)

## 1. Produkt-Übersicht

**Name:** KI-Kompass (oder: AI-PolicyGen, KI-Regelwerk — final noch offen)
**Claim:** "Die KI-Nutzungsrichtlinie für Ihr Unternehmen — in 10 Minuten statt 10 Wochen."
**Zielgruppe:** Geschäftsführer, HR-Leiter, Datenschutzbeauftragte, IT-Leiter von KMUs im DACH-Raum (10–500 Mitarbeiter)
**Preismodell:**
- **Basis (€79):** AI-Nutzungsrichtlinie (DOCX + PDF), DSGVO-konform
- **Professional (€149):** Basis + EU AI Act Checkliste + Schulungsvorlage für Mitarbeiter
- **Enterprise (€299):** Professional + vierteljährliche Updates per E-Mail bei Gesetzesänderungen (12 Monate)

**Rechtliche Absicherung:** Das Produkt wird vor Go-Live von einem Fachanwalt für IT-Recht / Datenschutzrecht geprüft. Das Ergebnis wird als Verkaufsargument genutzt ("Juristisch geprüft").

---

## 2. Der Fragebogen (13 Fragen)

Der Fragebogen ist in 4 Blöcke aufgeteilt. Jeder Block hat eine eigene Seite im Multi-Step-Form.

### Block 1: Unternehmensprofil (4 Fragen)

**F1: Firmenname**
- Freitext
- Wird in der Policy als Platzhalter eingesetzt

**F2: Branche**
- Dropdown mit Optionen:
  - Logistik & Transport
  - Gesundheitswesen & Pharma
  - Finanzdienstleistungen & Versicherungen
  - Handel & E-Commerce
  - IT & Software
  - Fertigung & Industrie
  - Beratung & Dienstleistungen
  - Bildung & Forschung
  - Öffentlicher Sektor
  - Gastronomie & Hotellerie
  - Bau & Handwerk
  - Sonstige (Freitext)
- **Warum:** Branchenspezifische Risiken (z.B. Gesundheitsdaten, Finanzdaten) erfordern unterschiedliche Regeln

**F3: Anzahl Mitarbeiter**
- Radio Buttons: 1–10 / 11–50 / 51–250 / 251–500 / 500+
- **Warum:** Bestimmt Governance-Struktur (kleines Team vs. Komitee)

**F4: In welchen Ländern ist Ihr Unternehmen tätig?**
- Checkboxen: Deutschland / Österreich / Schweiz / EU (andere) / Nicht-EU
- **Warum:** Bestimmt DSGVO-Umfang und EU AI Act Anwendbarkeit

### Block 2: Aktuelle KI-Nutzung (4 Fragen)

**F5: Wie ist der aktuelle Status der KI-Nutzung in Ihrem Unternehmen?**
- Radio:
  - Offiziell freigegeben, mit klaren Regeln
  - Teilweise freigegeben, aber ohne formale Regelung
  - Keine offizielle Regelung — Mitarbeiter nutzen KI eigenständig (Shadow AI)
  - KI wird aktuell nicht genutzt
  - Weiß nicht
- **Warum:** Bestimmt Ton der Policy und ob Shadow-AI-Kapitel nötig ist
- **Logik:** Wenn "nicht genutzt" → Policy wird als präventive Richtlinie formuliert

**F6: Welche KI-Tools werden aktuell (oder zukünftig) von Mitarbeitern genutzt?**
- Checkboxen (Mehrfachauswahl):
  - ChatGPT / OpenAI
  - Microsoft Copilot (in Office 365)
  - Google Gemini
  - Claude (Anthropic)
  - GitHub Copilot
  - Midjourney / DALL-E (Bildgenerierung)
  - Branchenspezifische KI-Software
  - Keine / Nicht bekannt
  - Sonstige (Freitext)
- **Warum:** Bestimmt welche Tools in "erlaubt/verboten" aufgeführt werden
- **HINWEIS:** "Interne KI" ist hier NICHT als Option — das wird in F8 separat und detaillierter abgefragt, weil interne KI-Systeme zusätzliche Kapitel (Logging, Zugang, Dokumentation) triggern und eine eigene Beschreibung brauchen.

**F7: Für welche Aufgaben wird KI im Unternehmen eingesetzt?**
- Checkboxen:
  - Texte schreiben (E-Mails, Berichte, Zusammenfassungen)
  - Programmierung / Code-Generierung
  - Datenanalyse & Auswertungen
  - Kundenservice / Chatbots
  - Übersetzungen
  - Bild- und Medienerstellung
  - Personalwesen (Bewerbungs-Screening, Leistungsbeurteilung)
  - Entscheidungsunterstützung (Finanzen, Strategie)
  - Sonstige (Freitext)
- **Warum:** Bestimmt erlaubte/eingeschränkte Use Cases in der Policy

**F8: Betreibt Ihr Unternehmen eine eigene interne KI-Lösung (z.B. interner Chatbot, eigenes Sprachmodell)?**
- Radio: Ja / Nein / In Planung
- Wenn Ja: Freitext "Kurze Beschreibung (z.B. interner Chat, KI-gestütztes CRM, eigenes Modell)"
- **Warum:** Trigger für Anhang A (Interne KI-Systeme) mit Logging, Zugangsberechtigungen und Dokumentationspflichten nach EU AI Act. Externe Tools (F6) und interne KI-Systeme haben fundamental unterschiedliche Compliance-Anforderungen.

### Block 3: Daten & Datenschutz (3 Fragen)

**F9: Welche Art von sensiblen Daten verarbeiten Ihre Mitarbeiter regelmäßig?**
- Checkboxen:
  - Kundendaten (Namen, Adressen, Kontaktdaten)
  - Gesundheitsdaten
  - Finanzdaten (Gehälter, Kontonummern, Bilanzen)
  - Personaldaten (Bewerbungen, Leistungsbeurteilungen)
  - Geschäftsgeheimnisse / geistiges Eigentum
  - Öffentlich verfügbare Daten
- **Warum:** Bestimmt Datenklassifikationsregeln und Verbote in der Policy

**F10: Haben Sie einen Datenschutzbeauftragten (DSB)?**
- Radio: Ja, intern / Ja, extern / Nein
- **Warum:** Bestimmt Verantwortlichkeiten und Ansprechpartner in der Policy

**F11: Werden Daten in Cloud-Diensten außerhalb der EU gespeichert?**
- Radio: Ja / Nein / Teilweise / Weiß nicht
- **Warum:** DSGVO-Kapitel zu Drittlandtransfers und Angemessenheitsbeschlüssen

### Block 4: Gewünschter Umfang & Risikotoleranz (2 Fragen)

**F12: Wie strikt soll die KI-Richtlinie sein?**
- Radio Buttons mit Beschreibung:
  - **Innovationsfreundlich:** "Wir möchten KI-Nutzung ermöglichen und fördern, mit klaren Leitplanken."
  - **Ausgewogen:** "Produktivitätsgewinn und Risikominimierung sollen im Gleichgewicht stehen."
  - **Restriktiv:** "Sicherheit und Compliance haben oberste Priorität. Nur freigegebene Tools und Use Cases."
- **Warum:** Bestimmt den gesamten Ton der Policy — von "wir ermutigen" bis "es ist verboten"

**F13: Wer soll für die Einhaltung der KI-Richtlinie verantwortlich sein?**
- Radio:
  - Geschäftsführung
  - IT-Abteilung
  - Datenschutzbeauftragter
  - Eigenes KI-Governance-Komitee
  - Noch unklar
- **Warum:** Wird direkt im Kapitel "Verantwortlichkeiten" verwendet

### Fragebogen-Logik (Zusammenfassung)

| Frage | Beeinflusst |
|-------|-------------|
| F1 (Firmenname) | Wird in gesamter Policy eingesetzt |
| F2 (Branche) | Branchenspezifische Regeln, Risikoeinschätzung |
| F3 (Mitarbeiter) | Governance-Struktur (einfach vs. Komitee) |
| F4 (Länder) | DSGVO-Umfang, EU AI Act Anwendbarkeit |
| F5 (Status) | Ton der Policy, Shadow-AI-Kapitel ja/nein |
| F6 (Externe Tools) | Kapitel 4: Freigegebene Tools |
| F7 (Use Cases) | Kapitel 3: Erlaubt/Eingeschränkt/Verboten |
| F8 (Interne KI) | Anhang A ja/nein, zusätzliche Dokumentationspflichten |
| F9 (Datenarten) | Kapitel 5: Datenklassifikation, Verbotsliste |
| F10 (DSB) | Kapitel 9: Verantwortlichkeiten |
| F11 (Cloud/EU) | Kapitel 5: Drittlandtransfer-Abschnitt |
| F12 (Striktheit) | Gesamter Ton und Formulierung |
| F13 (Verantwortung) | Kapitel 9: Governance-Struktur |

---

## 3. Die generierte Policy — Kapitelstruktur

Die Policy wird als professionelles PDF mit Deckblatt, Inhaltsverzeichnis, Firmenname, Seitennummerierung und Versionstabelle ausgegeben.

### Kapitel 1: Präambel & Zweck
- Warum diese Richtlinie existiert
- Verweis auf DSGVO, EU AI Act, unternehmensinterne Werte
- Geltungsbereich (alle Mitarbeiter, Auftragnehmer, Praktikanten)
- Datum des Inkrafttretens

### Kapitel 2: Definitionen
- Was ist "Künstliche Intelligenz" im Sinne dieser Richtlinie? (EU AI Act Art. 3 Nr. 1)
- Was ist "Generative KI"?
- Was ist "Shadow AI"?
- Was bedeutet "personenbezogene Daten"? (DSGVO Art. 4 Nr. 1)
- Was ist ein "KI-System"? (EU AI Act Definition)

### Kapitel 3: Erlaubte und verbotene Nutzung
- **Erlaubt:** (basierend auf F7 + F12)
- **Eingeschränkt (mit Genehmigung):**
- **Verboten:**
- Dargestellt als farbcodierte Tabelle (grün/gelb/rot)

### Kapitel 4: Freigegebene Tools & Zugangsregeln
- Liste der genehmigten KI-Tools (basierend auf F6)
- Regelung zu Firmen-Accounts vs. private Accounts
- Prozess zur Beantragung neuer KI-Tools
- Verbot nicht genehmigter Tools / Browser-Extensions

### Kapitel 5: Datenschutz & Datenklassifikation
- Welche Daten NIEMALS in KI-Tools eingegeben werden dürfen (basierend auf F9)
- Datenklassifikation: Öffentlich / Intern / Vertraulich / Streng Vertraulich
- Regeln pro Datenklasse
- DSGVO-Konformität (Art. 5, 6, 44–49)
- Hinweis zu Drittlandtransfers (basierend auf F11)

### Kapitel 6: Qualitätssicherung & menschliche Kontrolle
- Prüfpflicht für alle KI-generierten Inhalte
- Verbot ungeprüfter Weitergabe
- Kennzeichnungspflicht
- Haftung liegt beim Mitarbeiter, nicht bei der KI

### Kapitel 7: Geistiges Eigentum & Urheberrecht
- KI-generierte Arbeitsergebnisse = Eigentum des Unternehmens
- Verbot der Eingabe von geschütztem Code, Patenten, Markenrechten
- Risiko: KI-Output kann urheberrechtlich geschütztes Material enthalten

### Kapitel 8: Transparenz & Kennzeichnung
- Interne Offenlegungspflichten
- Externe Kennzeichnungspflichten (EU AI Act Art. 50)
- Chatbot-Hinweispflicht, Deepfake-Kennzeichnung

### Kapitel 9: Verantwortlichkeiten & Governance
- Basierend auf F10 (DSB) und F13 (Verantwortung)
- Rolle Geschäftsführung, DSB, IT, Abteilungsleiter
- KI-Ansprechpartner pro Abteilung

### Kapitel 10: Schulung & Awareness
- EU AI Act Art. 4: AI Literacy gilt BEREITS seit 2. Februar 2025
- Pflichtschulung innerhalb 3 Monate
- Jährliche Auffrischung
- Onboarding-Integration
- Dokumentation der Teilnahme

### Kapitel 11: Verstöße & Konsequenzen
- Abgestufte Konsequenzen (Nachschulung → Einschränkung → Arbeitsrechtlich)
- Meldepflicht (auch Selbstmeldung)
- DSGVO Art. 33: Meldung an Aufsichtsbehörde innerhalb 72 Stunden

### Kapitel 12: Überprüfung & Aktualisierung
- Halbjährliche Überprüfung
- Anlassbezogene Überprüfung
- Versionierung und Änderungshistorie

### (NUR bei F8 = "Ja") Anhang A: Interne KI-Systeme
- Systembeschreibung (aus F8 Freitext)
- Zugangsberechtigungen
- Logging und Nachvollziehbarkeit
- Dokumentationspflichten nach EU AI Act

### (NUR Professional/Enterprise) Anhang B: EU AI Act Compliance-Checkliste
- Risikokategorisierung aller KI-Systeme
- 10-Punkte-Checkliste mit Deadlines
- Verweis: Art. 4 + Art. 5 gelten BEREITS, High-Risk ab 2. August 2026

### (NUR Professional/Enterprise) Anhang C: Mitarbeiter-Schulungsvorlage
- 1-Seiter: "5 goldene Regeln für KI am Arbeitsplatz"
- Kurz-Quiz (5 Fragen) zum Verständnis-Check
- Unterschriftenfeld zur Kenntnisnahme

---

## 4. Der System Prompt

```
Du bist ein erfahrener Experte für KI-Governance, Datenschutzrecht (DSGVO) und den EU AI Act, spezialisiert auf den DACH-Raum (Deutschland, Österreich, Schweiz). Du erstellst maßgeschneiderte KI-Nutzungsrichtlinien für Unternehmen.

## Deine Aufgabe
Erstelle eine vollständige, professionelle und sofort einsatzfähige KI-Nutzungsrichtlinie basierend auf den Unternehmensdaten, die dir übergeben werden. Die Richtlinie muss so formuliert sein, dass ein Unternehmen sie mit minimalen Anpassungen direkt einführen kann.

## Stil & Ton
- Schreibe auf Deutsch in professioneller, aber verständlicher Sprache.
- Vermeide unnötigen Juristenjargon — die Richtlinie muss für alle Mitarbeiter verständlich sein, nicht nur für Juristen.
- Passe den Ton an die gewählte Risikotoleranz an:
  - "Innovationsfreundlich": Ermutigend, positiv, Chancen betonen, klare Leitplanken setzen
  - "Ausgewogen": Sachlich, neutral, sowohl Chancen als auch Risiken benennen
  - "Restriktiv": Formell, pflichtbetont, Sicherheit und Compliance im Vordergrund
- Verwende direkte Anweisungen ("Mitarbeiter sind verpflichtet..." / "Es ist untersagt, ...") statt vager Empfehlungen.

## Struktur
Folge exakt dieser Kapitelstruktur:

1. **Präambel & Zweck** — Warum die Richtlinie existiert, Geltungsbereich, Datum
2. **Definitionen** — KI (Art. 3 Nr. 1 EU AI Act), Generative KI, Shadow AI, personenbezogene Daten (Art. 4 Nr. 1 DSGVO), KI-System
3. **Erlaubte und verbotene Nutzung** — Drei Kategorien: Erlaubt / Eingeschränkt / Verboten. Basierend auf den angegebenen Use Cases und der Risikotoleranz.
4. **Freigegebene Tools & Zugangsregeln** — Liste der Tools, Account-Regeln, Antragsprozess für neue Tools
5. **Datenschutz & Datenklassifikation** — Datenklassen definieren, Verbote pro Klasse, DSGVO-Bezug, Drittlandtransfer
6. **Qualitätssicherung & menschliche Kontrolle** — Prüfpflicht, Kennzeichnung, Haftung
7. **Geistiges Eigentum & Urheberrecht** — Eigentumsfragen, Risiken, Verbote
8. **Transparenz & Kennzeichnung** — Interne und externe Offenlegungspflichten, Art. 50 EU AI Act
9. **Verantwortlichkeiten & Governance** — Zuständigkeiten, Eskalation, KI-Ansprechpartner
10. **Schulung & Awareness** — Art. 4 EU AI Act (GILT BEREITS SEIT 02/2025), Pflichtschulungen, Onboarding
11. **Verstöße & Konsequenzen** — Abgestufte Maßnahmen, Meldepflicht, DSGVO Art. 33
12. **Überprüfung & Aktualisierung** — Review-Zyklus, Versionierung

Falls das Unternehmen eine eigene interne KI-Lösung betreibt:
→ Füge **Anhang A: Interne KI-Systeme** hinzu (Zugang, Logging, Dokumentation, Trainingsdaten-Regeln)

Falls der Nutzer das Professional- oder Enterprise-Paket gewählt hat:
→ Füge **Anhang B: EU AI Act Compliance-Checkliste** hinzu (Risikokategorisierung, Pflichten, gestaffelte Deadlines)
→ Füge **Anhang C: Mitarbeiter-Schulungsvorlage** hinzu (5 goldene Regeln, Quiz, Unterschriftenfeld)

## Wichtige inhaltliche Regeln

### DSGVO-Konformität (Verordnung (EU) 2016/679)
- Art. 5: Grundsätze der Verarbeitung (Zweckbindung, Datenminimierung)
- Art. 6: Rechtsgrundlage für die Verarbeitung
- Art. 13/14: Informationspflichten
- Art. 22: Automatisierte Einzelentscheidungen — Verbot ohne menschliche Beteiligung
- Art. 25: Datenschutz durch Technikgestaltung (Privacy by Design)
- Art. 33: Meldepflicht bei Datenschutzverletzungen (72 Stunden)
- Art. 35: Datenschutz-Folgenabschätzung bei hohem Risiko
- Art. 44–49: Drittlandtransfers (relevant bei US-basierten KI-Anbietern wie OpenAI)

### EU AI Act (Verordnung (EU) 2024/1689)
WICHTIG — Gestaffelte Anwendbarkeit:
- Seit 2. Februar 2025: Art. 5 (Verbotene Praktiken) + Art. 4 (AI Literacy) — BEREITS IN KRAFT
- Seit 2. August 2025: Regeln für GPAI-Modelle + Governance-Strukturen — BEREITS IN KRAFT
- Ab 2. August 2026: Hauptpflichten für High-Risk-KI-Systeme — KOMMENDE DEADLINE
- Ab 2. August 2027: High-Risk-KI in regulierten Produkten (Annex I)

Relevante Artikel:
- Art. 4: AI Literacy — GILT BEREITS. Unternehmen ohne Schulungsprogramm sind jetzt schon nicht compliant.
- Art. 5: Verbotene Praktiken — 8 Verbote, BEREITS DURCHSETZBAR:
  (a) Unterschwellige Manipulation/Täuschung
  (b) Ausnutzung von Vulnerabilitäten (Alter, Behinderung, soziale Lage)
  (c) Social Scoring durch Behörden
  (d) Vorhersage von Straftaten auf Basis von Profiling
  (e) Ungezieltes Scraping von Gesichtsbildern
  (f) Emotionserkennung am Arbeitsplatz und in Bildungseinrichtungen
  (g) Biometrische Kategorisierung nach sensiblen Merkmalen
  (h) Biometrische Echtzeit-Fernidentifikation im öffentlichen Raum
- Art. 6 + Annex III: High-Risk-Klassifikation
- Art. 9: Risikomanagementsystem für High-Risk-Systeme
- Art. 11: Technische Dokumentation
- Art. 12: Aufzeichnungspflichten (Logging)
- Art. 14: Menschliche Aufsicht über High-Risk-Systeme
- Art. 50: Transparenzpflichten (ALLE Kennzeichnungspflichten stehen hier):
  (1) Nutzer müssen informiert werden, wenn sie mit einem KI-System interagieren
  (2) Anbieter generativer KI müssen Outputs maschinenlesbar als KI-generiert kennzeichnen
  (3) Nutzer von Emotionserkennung/biometrischer Kategorisierung müssen Betroffene informieren
  (4) Deepfakes müssen als KI-generiert offengelegt werden
  (5) KI-generierte Texte zur Information der Öffentlichkeit müssen gekennzeichnet werden

ACHTUNG — NICHT VERWECHSELN:
- Art. 52 regelt NUR das Verfahren zur Klassifikation von GPAI-Modellen — NICHT die Kennzeichnungspflichten

Bußgelder (Art. 99):
- Verbotene Praktiken (Art. 5): bis zu 35 Mio. EUR oder 7% des weltweiten Jahresumsatzes
- Verstöße gegen High-Risk-Pflichten: bis zu 15 Mio. EUR oder 3%
- Falsche Angaben gegenüber Behörden: bis zu 7,5 Mio. EUR oder 1%

### Branchenspezifische Regeln
Passe die Richtlinie an die Branche an:
- **Gesundheitswesen:** Verbot der Eingabe von Patientendaten, ärztliche Schweigepflicht
- **Finanzdienstleistungen:** BaFin-Anforderungen, MaRisk, Verbot für KI-basierte Kreditentscheidungen ohne menschliche Prüfung
- **Logistik & Transport:** Besondere Vorsicht bei Sendungsdaten mit Kundenbezug
- **Öffentlicher Sektor:** Besondere Transparenzpflichten, Vergaberecht
- **Handel & E-Commerce:** Verbraucherschutz, Produkthaftung
- **Bildung:** Prüfungsintegrität, Urheberrecht bei Lehrmaterialien

## Formatierung
- Verwende nummerierte Kapitel und Unterkapitel (1., 1.1, 1.2 etc.)
- Jedes Kapitel beginnt mit einem kurzen Einleitungssatz
- Verwende Aufzählungen nur wo sie die Lesbarkeit verbessern
- Füge am Ende jedes Kapitels einen Kasten "Zusammenfassung für Mitarbeiter" ein
- Gesamtlänge: 3.000–5.000 Wörter (Basis) / 5.000–8.000 Wörter (Professional/Enterprise)

## Qualitätskriterien
- Die Richtlinie muss SOFORT einsatzfähig sein — keine Platzhalter wie "[hier einfügen]" außer für Datum und Logo
- Alle Unternehmensangaben aus dem Fragebogen müssen eingebaut sein
- Die Richtlinie muss sich wie ein maßgeschneidertes Dokument anfühlen, nicht wie ein generisches Template
- Verweise auf DSGVO-Artikel und EU AI Act-Artikel müssen korrekt sein
- Keine erfundenen Gesetze oder Normen
```

---

## 5. Tech-Stack & Architektur

### Frontend + Backend: Next.js (App Router)
Next.js ist gleichzeitig Frontend und Backend — kein separates Backend nötig.

```
/                     → Landing Page (Conversion-optimiert, EU AI Act Countdown)
/fragebogen           → Multi-Step-Formular (13 Fragen, 4 Schritte)
/preise               → Pricing Page (3 Tiers)
/checkout             → Stripe Checkout Session
/ergebnis/[id]        → Download-Seite (nach Payment)
/api/generate-policy  → Claude API → Policy generieren
/api/create-checkout  → Stripe Session erstellen
/api/webhook          → Stripe Webhook → Generierung triggern
```

### Ablauf nach Zahlung
1. Nutzer füllt Fragebogen aus → Antworten werden in Supabase gespeichert
2. Nutzer wählt Tier und bezahlt via Stripe Checkout
3. Stripe Webhook bestätigt Zahlung → triggert Generierung
4. API-Route baut den User-Prompt aus Fragebogen-Antworten zusammen
5. Claude API (Sonnet) generiert die Policy als Markdown
6. Server wandelt Markdown → HTML → PDF mit Puppeteer (headless Chrome)
7. PDF wird in Supabase Storage gespeichert
8. Download-Link wird per Brevo-E-Mail verschickt
9. Nutzer kann auch direkt auf /ergebnis/[id] downloaden

### Warum Puppeteer für die PDF-Generierung
- Puppeteer (headless Chrome) rendert HTML zu PDF — das gibt volle Kontrolle über Layout, Fonts, Farben und Tabellen
- Professionelles Ergebnis: sieht aus wie ein echtes Beratungsdokument, nicht wie ein generiertes Template
- Flexibel: CSS für Styling, kein Kampf mit Low-Level-PDF-Libraries
- Bewährt: wird von Unternehmen wie Stripe, Notion und Linear für PDF-Generierung eingesetzt

### Datenbank (Supabase)
```sql
-- Tabelle: orders
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           TEXT NOT NULL
company_name    TEXT NOT NULL
tier            TEXT NOT NULL CHECK (tier IN ('basis', 'professional', 'enterprise'))
questionnaire   JSONB NOT NULL
stripe_session  TEXT
payment_status  TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed'))
policy_url      TEXT
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
generated_at    TIMESTAMPTZ
```

### Externe Services
- **Claude API (Sonnet):** Policy-Generierung (~€0.05–0.15 pro Generierung)
- **Stripe:** Payment Processing (Checkout Sessions)
- **Supabase:** Auth + PostgreSQL-Datenbank + File Storage (für generierte PDFs)
- **Brevo:** Transaktionale E-Mails (Zahlungsbestätigung + Download-Link)
- **Vercel:** Hosting (Next.js, Serverless Functions, Puppeteer via @sparticuz/chromium)

### Kosten pro Verkauf
- Claude API: ~€0.10
- Stripe Fee: ~€2.50 (bei €79)
- Brevo: kostenlos (bis 300 E-Mails/Tag)
- Hosting: kostenlos (Vercel Free Tier reicht für den Start)
- **Gesamtkosten pro Verkauf: ~€2.60**
- **Marge bei €79: ~€76.40 (96.7%)**

---

## 6. Go-to-Market

### Phase 1: Validierung (Woche 1–2)
- Landing Page bauen mit E-Mail-Warteliste und EU AI Act Countdown
- 10–15 LinkedIn-Posts auf Deutsch über KI-Governance, Shadow AI, EU AI Act Deadline
- 5–10 DMs an HR-Leiter/Geschäftsführer: "Hat Ihr Unternehmen eine KI-Richtlinie?"
- Ziel: 20+ Wartelisten-Einträge

### Phase 2: MVP Launch (Woche 3–4)
- Fragebogen + Stripe + Claude API + PDF-Export live
- 5 Beta-Tester zum halben Preis (€39 statt €79)
- Feedback einarbeiten, Prompt verfeinern

### Phase 3: Wachstum (Monat 2–3)
- LinkedIn Content-Maschine (3x pro Woche)
- SEO-Artikel: "KI-Richtlinie Vorlage", "EU AI Act KMU", "DSGVO KI-Nutzung"
- Indie Hackers / Reddit Launch
- Erste Fallstudie veröffentlichen

### Umsatz-Ziel Thailand
- Monatliche Kosten Thailand: ~€1.500–2.500
- Benötigte Verkäufe bei €79: ~20–32 pro Monat
- Benötigte Verkäufe bei €149: ~10–17 pro Monat
- Realistisch erreichbar innerhalb von 3–6 Monaten

---

## 7. Interne Qualitätssicherung (NUR für Entwicklung, nicht im Produkt sichtbar)

### Verifizierte Rechtsgrundlagen (Stand: April 2026)

**DSGVO (Verordnung (EU) 2016/679) — Verifiziert ✅**
- Art. 5, 6, 13/14, 22, 25, 33, 35, 44–49: alle korrekt referenziert

**EU AI Act (Verordnung (EU) 2024/1689) — Verifiziert ✅**
- Art. 4: AI Literacy — gilt seit 2. Februar 2025 ✅
- Art. 5: 8 verbotene Praktiken — durchsetzbar seit 2. Februar 2025 ✅
- Art. 6 + Annex III: High-Risk-Klassifikation — anwendbar ab 2. August 2026 ✅
- Art. 9, 11, 12, 14: High-Risk-Pflichten ✅
- Art. 50: Transparenzpflichten (alle 5 Teilpflichten) ✅
- Art. 99: Bußgeldrahmen (35 Mio./7%, 15 Mio./3%, 7.5 Mio./1%) ✅

**Häufige Fehler vermeiden:**
- ❌ Art. 52 ist KEIN Transparenz-Artikel — er regelt das Verfahren für GPAI-Klassifikation
- ❌ AI Literacy gilt NICHT erst ab August 2026 — sie gilt bereits seit Februar 2025
- ❌ Art. 5 umfasst NICHT nur 3 Verbote — es sind 8 verbotene Praktiken

### Vor Go-Live
- [ ] Demo-Policy von Fachanwalt für IT-Recht / Datenschutzrecht prüfen lassen
- [ ] System Prompt mit 5 verschiedenen Branchen/Firmengrössen testen
- [ ] PDF-Output auf allen Geräten prüfen (Desktop, Tablet, Druck)
- [ ] Stripe Webhook End-to-End testen
- [ ] E-Mail-Zustellung über Brevo testen
