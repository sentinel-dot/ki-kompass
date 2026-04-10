# KI-Kompass — Findings & Priorisierte Action Items

## Übersicht

Bewertung vom 09.04.2026. Gesamtstatus: **~70% fertig**. Starke Idee, gutes Frontend, aber Backend-Robustheit und fehlende Validierung blockieren einen sicheren Launch.

---

## Priorität 1 — Launch-Blocker

### 1.1 Post-Generation-Validierung für Rechtsreferenzen

- **Problem:** Claude-Output wird unvalidiert als PDF ausgeliefert. Falsche Artikelzitate (EU AI Act) erzeugen Haftungsrisiko.
- **Dateien:** `app/api/webhook/route.ts` (nach Claude-API-Call)
- **Lösung:**
  - Validierungsschicht nach Claude-Response einbauen
  - Prüfen: Werden alle referenzierten Artikel (Art. 5, 6, 9, 52 etc.) korrekt zitiert?
  - Whitelist erlaubter Artikelnummern + Regex-Check auf korrekte Formate
  - Bei Validierungsfehler: Retry mit angepasstem Prompt, nicht ausliefern
- **Akzeptanzkriterium:** Kein PDF wird ausgeliefert, das nicht-existierende EU AI Act Artikel zitiert.

### 1.2 Retry-Logik — Policy-Generierung vom Webhook entkoppeln

- **Problem:** Stripe-Webhook generiert Policy synchron. Bei Fehler (Claude-Timeout, Puppeteer-Crash, Supabase-Storage-Fehler) hat Kunde bezahlt, aber keine Policy. Kein Retry.
- **Dateien:** `app/api/webhook/route.ts`
- **Lösung:**
  - Webhook nur: Status auf `paid` setzen, Job in Queue schreiben
  - Separater Worker/Cron: Unbeantwortete Orders (status=`paid`, kein `policy_url`) abarbeiten
  - Idempotenz: Doppelte Webhook-Calls dürfen keine doppelte Generierung auslösen
  - Max 3 Retries, danach Alert an Admin
- **Akzeptanzkriterium:** Jede bezahlte Order bekommt innerhalb von 15 Minuten eine Policy oder ein Admin wird benachrichtigt.

### 1.3 Markdown-Parser ersetzen

- **Problem:** `buildPDFHTML()` nutzt Regex für Markdown-zu-HTML. Bricht bei verschachtelten Elementen, Listen in Listen, Code-Blöcken etc.
- **Dateien:** `app/api/webhook/route.ts` → `buildPDFHTML()`
- **Lösung:**
  - `marked` oder `remark` als Dependency hinzufügen
  - Custom Renderer für die Farbcodierung der Tabellen (Deadline-Ampel)
  - Alle Regex-Replacements durch Parser ersetzen
- **Akzeptanzkriterium:** 10 verschiedene Claude-Outputs werden korrekt in HTML konvertiert, inkl. verschachtelter Listen und Tabellen.

---

## Priorität 2 — Vor Launch fixen

### 2.1 Error-Monitoring einrichten

- **Problem:** Kein Sentry, kein Logging-Service, kein Alerting. Fehler werden erst durch Kunden-Beschwerden sichtbar.
- **Lösung:**
  - Sentry (oder Vergleichbares) integrieren
  - Kritische Pfade instrumentieren: Webhook, Claude-Call, PDF-Generierung, Supabase-Upload, E-Mail-Versand
  - Alert-Regeln: Sofort bei Payment ohne Policy-Generierung
- **Akzeptanzkriterium:** Jeder Fehler im Payment-to-Delivery-Flow löst innerhalb von 5 Minuten einen Alert aus.

### 2.2 DOCX-Export implementieren oder entfernen

- **Problem:** Landing Page verspricht "PDF + DOCX Export". DOCX-Generierung existiert nicht im Code.
- **Dateien:** Landing Page (`WhatYouGet.tsx` o.ä.), `app/api/webhook/route.ts`
- **Lösung (Option A — implementieren):**
  - `docx`-Library (z.B. `docx` npm-Paket) einbinden
  - Markdown → DOCX-Konvertierung parallel zur PDF-Generierung
  - Beide Dateien in Supabase Storage, beide Links in Delivery-Mail
- **Lösung (Option B — entfernen):**
  - DOCX-Versprechen von Landing Page entfernen
  - Ggf. als "Coming Soon" markieren
- **Akzeptanzkriterium:** Entweder funktioniert DOCX-Download, oder die Seite verspricht es nicht mehr.

### 2.3 API-Input-Validierung

- **Problem:** `create-checkout`-Route validiert Request-Body nicht. Beliebige Payloads werden akzeptiert.
- **Dateien:** `app/api/create-checkout/route.ts`
- **Lösung:**
  - Zod-Schema für alle API-Routes definieren
  - Fragebogen-Antworten validieren (erwartete Felder, Typen, erlaubte Werte)
  - Ungültige Requests mit 400 ablehnen
- **Akzeptanzkriterium:** Kein API-Endpoint akzeptiert unvalidierte Eingaben.

---

## Priorität 3 — Nach Launch, vor Skalierung

### 3.1 Test-Suite für Policy-Generierung

- **Problem:** Kein systematischer Test, ob verschiedene Fragebogen-Kombinationen korrekte Policies erzeugen.
- **Lösung:**
  - 10-15 Fragebogen-Szenarien definieren (verschiedene Branchen, Unternehmensgrößen, KI-Einsatzarten)
  - Automatisierte Tests: Claude-Output gegen erwartete Inhalte prüfen
  - Regression-Tests bei Prompt-Änderungen
  - Sonderfälle testen: Schweiz, reine Chatbot-Nutzung, Hochrisiko-KI
- **Akzeptanzkriterium:** Jede Prompt-Änderung durchläuft die Test-Suite bevor sie live geht.

### 3.2 Enterprise-Paket Backend

- **Problem:** Enterprise verspricht "vierteljährliche Updates" und "E-Mail bei Gesetzesänderungen". Keine Infrastruktur dafür.
- **Lösung:**
  - Subscription-Verwaltung in Supabase (Tabelle `subscriptions`)
  - Cron-Job oder manueller Trigger für Update-Generierung
  - E-Mail-Template + Versandlogik für Gesetzesänderungs-Alerts
  - Alternativ: Enterprise-Paket erst anbieten, wenn Infrastruktur steht
- **Akzeptanzkriterium:** Enterprise-Kunden erhalten tatsächlich vierteljährliche Updates.

### 3.3 Rate-Limiting auf API-Routes

- **Problem:** Kein Rate-Limiting. API kann missbraucht oder überlastet werden.
- **Dateien:** Alle Routes unter `app/api/`
- **Lösung:**
  - Rate-Limiter (z.B. `@upstash/ratelimit` mit Redis oder Vercel KV)
  - Limits: z.B. 5 Checkout-Requests pro IP/Minute
- **Akzeptanzkriterium:** Kein einzelner Client kann mehr als X Requests pro Zeitfenster senden.

### 3.4 Disclaimer sichtbarer machen

- **Problem:** "Keine Rechtsberatung"-Disclaimer ist in FAQ versteckt. Bei einem Rechtsprodukt reicht das nicht.
- **Lösung:**
  - Disclaimer auf Checkout-Seite vor Kaufabschluss anzeigen
  - Disclaimer auf erste Seite der generierten Policy setzen
  - Checkbox "Ich verstehe, dass dies keine Rechtsberatung ersetzt" vor Download
- **Akzeptanzkriterium:** Kein Kunde kann eine Policy kaufen/herunterladen, ohne den Disclaimer gesehen zu haben.

### 3.5 Pricing-Redundanz bereinigen

- **Problem:** Preise werden auf `/preise` und in `WhatYouGet.tsx` separat gepflegt. Wartungslast und Inkonsistenz-Risiko.
- **Lösung:**
  - Zentrale Pricing-Config (z.B. `config/pricing.ts`)
  - Beide Komponenten lesen aus derselben Quelle
- **Akzeptanzkriterium:** Preise werden an genau einer Stelle definiert.

---

## Checkliste für Agent

```
[x] 1.1 Post-Generation-Validierung
[x] 1.2 Retry-Logik (Webhook entkoppeln)
[x] 1.3 Markdown-Parser ersetzen
[x] 2.1 Error-Monitoring (Sentry)
[x] 2.2 DOCX-Export implementieren oder entfernen
[x] 2.3 API-Input-Validierung (Zod)
[x] 3.1 Test-Suite für Policy-Generierung
[x] 3.2 Enterprise-Paket Backend
[x] 3.3 Rate-Limiting
[x] 3.4 Disclaimer sichtbarer machen
[x] 3.5 Pricing-Redundanz bereinigen
```
