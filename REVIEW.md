# KI-Kompass — Projekt-Review & MVP-Fokus

> Stand: 10. April 2026 · Entscheidung: Enterprise-Tier wird entfernt, Fokus auf MVP (Basis + Professional)

---

## Entscheidung: Enterprise-Tier entfernen

Der Enterprise-Tier (€299, vierteljährliche Updates, Law-Change-Alerts) wird gestrichen.

**Begründung:**

- Der EU AI Act ändert sich nicht alle 3 Monate — vierteljährliche Updates liefern kaum echten Mehrwert
- Risiko: Kunden erhalten 4 nahezu identische Policies und fühlen sich über den Tisch gezogen
- Enormer technischer Aufwand (Subscription-Management, Update-Generierung, Change-Summaries, Law-Change-Alerts) für nur €150 Aufpreis gegenüber Professional
- Dieser Aufwand bindet Kapazität, die vor dem ersten zahlenden Kunden in Validierung fließen sollte

**Zu entfernen:**

- `lib/quarterly-updater.ts` — komplett
- `lib/subscription.ts` — komplett
- `lib/update-prompt.ts` — komplett
- `lib/email-updates.ts` — komplett
- `app/api/quarterly-updates/route.ts` — komplett
- `app/api/law-change-alerts/route.ts` — komplett
- `supabase/migrations/20260409_add_subscriptions.sql` — komplett (Tabellen: `subscriptions`, `subscription_updates`, `law_change_alerts`)
- `vercel.json` — Cron für `/api/quarterly-updates` entfernen
- `config/pricing.ts` — Enterprise-Tier entfernen
- Alle Komponenten: Enterprise-Referenzen aus Landing Page, Preisseite, Fragebogen, FAQ entfernen
- `lib/policy-generator.ts` — Enterprise-Subscription-Erstellung nach Kauf entfernen

---

## Offene Risiken & Maßnahmen

### 1. Kernprodukt ist eine Black Box

**Problem:** Der gesamte Produktwert hängt an der Claude-Output-Qualität. Die Rechtsreferenz-Validierung prüft nur Artikelnummern gegen eine Whitelist — nicht ob inhaltliche Aussagen korrekt sind, Handlungsanweisungen rechtlich haltbar sind oder branchenspezifische Sonderregeln (MaRisk, SGB V, etc.) richtig angewendet werden. Der Claim "juristisch geprüft" bezieht sich auf eine einmalige Prüfung vor Go-Live, aber jede generierte Policy ist individuell und damit ungeprüft.

**Maßnahmen:**

- [ ] Grenzfall-Testing: "Gesundheitswesen + KI-Triage + Shadow AI + restriktiv" — ist das Ergebnis wirklich einsatzfähig?
- [ ] Stichproben-Audits durch Fachanwalt einplanen (z.B. monatlich 2–3 zufällige Policies prüfen)
- [ ] Inhaltliche Validierung erweitern: nicht nur Artikelnummern, sondern auch Kontext-Checks (z.B. "Art. 9 DSGVO" darf nur erscheinen wenn Gesundheitsdaten ausgewählt)
- [ ] Disclaimer reicht nicht als alleinige Absicherung — Haftungsrisiko mit Anwalt besprechen

### 2. Fehlende Differenzierung gegenüber manuellem Prompt

**Problem:** Ein versierter Nutzer könnte den Fragebogen selbst in Claude eingeben und ein ähnliches Ergebnis bekommen. "10 Minuten statt 10 Wochen" stimmt nur, wenn die Alternative wirklich 10 Wochen ist. Für die meisten KMUs ist die Alternative "gar nichts tun" oder "Google-Vorlage anpassen".

**Maßnahmen:**

- [ ] Differenzierung konkretisieren: "Basierend auf 12 Compliance-Anforderungen, die 87% der KMUs nicht kennen" (oder ähnliche belegbare Zahl)
- [ ] Mehrwert klar kommunizieren: validierte Rechtsreferenzen, professionelles Layout, PDF/DOCX-Export, keine Prompt-Kenntnisse nötig
- [ ] Landing Page: weniger "schnell" verkaufen, mehr "korrekt und vollständig" — das ist der echte Schmerzpunkt

### 3. Impressum & Datenschutz fehlen

**Problem:** Links im Footer verweisen auf `#`. Ein DSGVO-Compliance-Produkt ohne funktionierende Datenschutzerklärung untergräbt die Glaubwürdigkeit fundamental.

**Maßnahmen:**

- [ ] Impressum erstellen (Pflichtangaben nach § 5 TMG / DDG)
- [ ] Datenschutzerklärung erstellen (Stripe, Supabase, Brevo, Claude API als Auftragsverarbeiter)
- [ ] AGB / Nutzungsbedingungen (Haftungsausschluss, Widerrufsrecht)
- [ ] **Priorität: Blocker für Go-Live** — ohne diese Seiten nicht launchen

### 4. Puppeteer auf Vercel Serverless ist fragil

**Problem:** `@sparticuz/chromium` funktioniert, aber Vercel Serverless hat harte Limits (Bundlegröße ~50MB, Cold-Start-Zeiten). Bei parallelen Generierungen drohen Timeouts und Memory-Limits. 5 Minuten `maxDuration` ist knapp wenn Claude + Validierung + Puppeteer + Upload sequenziell laufen.

**Maßnahmen:**

- [ ] Monitoring: Puppeteer-Laufzeiten in Sentry tracken (ist bereits teilweise vorhanden)
- [ ] Fallback evaluieren: `react-pdf` oder externer PDF-Service (z.B. Gotenberg, DocRaptor)
- [ ] Kurzfristig akzeptabel für MVP — aber bei >10 Orders/Tag reevaluieren

---

## MVP-Scope (Basis + Professional)

### Was bleibt

| Feature | Tier |
|---|---|
| 13-Fragen-Fragebogen | Beide |
| Claude Policy-Generierung mit Validierungs-Retry | Beide |
| PDF + DOCX Export | Beide |
| Stripe Checkout (Einmalzahlung) | Beide |
| Download-E-Mail via Brevo | Beide |
| EU AI Act Compliance-Checkliste (Anhang B) | Professional |
| Mitarbeiter-Schulungsvorlage (Anhang C) | Professional |

### Was weg kann (neben Enterprise)

- Quarterly-Update-Infrastruktur (komplett)
- Law-Change-Alert-System (komplett)
- Subscription-Management (komplett)
- Zugehörige DB-Tabellen und Migrationen

### Pricing nach Bereinigung

| Tier | Preis | Inhalt |
|---|---|---|
| Basis | €79 | KI-Richtlinie (12 Kapitel, PDF + DOCX) |
| Professional | €149 | Basis + EU AI Act Checkliste + Schulungsvorlage |

---

## Nächste Schritte (Priorität)

1. ~~**Enterprise-Code entfernen** — technische Schulden vermeiden~~ ✅ Erledigt (10. April 2026)
2. ~~**Impressum + Datenschutz + AGB** — Go-Live-Blocker~~ ✅ Erledigt (10. April 2026) — Platzhalter [Name, Adresse, E-Mail] müssen noch befüllt werden!
3. **5 Beta-Kunden finden** — validieren ob generierte Policies tatsächlich eingesetzt werden
4. **Grenzfall-Testing** — 3–5 extreme Szenarien manuell prüfen und Ergebnisse vom Anwalt bewerten lassen
5. **Landing Page Differenzierung schärfen** — weg von "schnell", hin zu "korrekt und vollständig"
