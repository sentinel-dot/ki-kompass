# FINDINGS — Output-Qualität & Validierung

> Erstellungsdatum: 2026-04-10  
> Status: Offen — noch nicht priorisiert/abgearbeitet

---

## Kontext

KI-Kompass generiert KI-Nutzungsrichtlinien für €79–€149. Die Qualitätssicherung hat zwei bestehende Ebenen:

1. **Validierungs-Retry in `lib/claude.ts`**: Rechtsreferenz-Whitelist + kontextuelle Konsistenz, max. 2 Korrekturversuche pro Generierung.
2. **Worker-Retry in `lib/policy-generator.ts`**: `MAX_RETRIES = 3` — wenn `generatePolicy()` wirft, greift der Cron nach 2 Minuten erneut.

Wenn alle 3 Worker-Versuche scheitern → Admin-Alert → manueller Eingriff erforderlich. Der Kunde bekommt keine Policy.

**Was fehlt:** Die Validierung prüft nur die Korrektheit von Rechtsreferenzen und branchenfremde Inhalte — aber nicht die strukturelle Vollständigkeit, Länge oder Personalisierung des Dokuments.

---

## Gefundene Lücken

### F-01 — Kein Platzhalter-Check
**Problem:** Claude könnte `[Firmenname]`, `[Datum]`, `[TODO]`, `[einfügen]`, `[MUSTER]` o.ä. im Output hinterlassen. Das liefern wir direkt aus.  
**Impact:** Kunde sieht einen unfertigen Text — sofort sichtbar, maximaler Vertrauensverlust.  
**Betroffene Datei:** `lib/validation.ts` (fehlender Check), `lib/claude.ts` (nicht gefangen)

---

### F-02 — `max_tokens = 8192` kann Professional-Policies abschneiden
**Problem:** Ein Professional-Dokument soll 5.000–8.000 deutsche Wörter haben. Grobe Schätzung: 1 deutsches Wort ≈ 1,3 Tokens → 8.000 Wörter ≈ ~10.400 Tokens. Die aktuelle Grenze von 8.192 Tokens **schneidet Professional-Policies mitten im Text ab**.  
**Impact:** Policy endet abrupt, letztes Kapitel fehlt — Kunde zahlt €149 für ein kaputtes Dokument.  
**Betroffene Datei:** `lib/claude.ts:44–54` (`max_tokens: 8192`)  
**Fix:** Für Professional `max_tokens: 16000`, für Basis `max_tokens: 8192`

---

### F-03 — Kein Mindest-Längen-Check
**Problem:** Eine 600-Wort-Policy würde alle Validierungen bestehen — sie ist einfach kurz, hat aber syntaktisch korrekte Rechtsreferenzen.  
**Impact:** Qualitativ wertloses Dokument wird ausgeliefert.  
**Schwellenwerte:** Basis ≥ 2.500 Wörter, Professional ≥ 4.500 Wörter  
**Betroffene Datei:** `lib/validation.ts` (fehlender Check)

---

### F-04 — Kein Kapitel-Vollständigkeits-Check
**Problem:** Die 12 Pflichtkapitel werden nicht verifiziert. Claude könnte Kapitel zusammenführen, auslassen oder umbenennen.  
**Impact:** Strukturell unvollständige Policy — fehlende Kapitel können rechtlich relevante Lücken hinterlassen.  
**Zu prüfen:** Alle 12 Kapitelüberschriften (Präambel, Definitionen, Erlaubte Nutzung, ... Überprüfung)  
**Betroffene Datei:** `lib/validation.ts` (fehlender Check)

---

### F-05 — Firmenname wird nicht im Output verifiziert
**Problem:** F1 (Firmenname) ist das wichtigste Personalisierungsmerkmal. Wir prüfen nicht, ob er in der generierten Policy vorkommt.  
**Impact:** Policy wirkt generisch — Kunde zahlt für "Maßschneiderung" und bekommt eine Vorlage mit Platzhalter.  
**Betroffene Datei:** `lib/validation.ts` (fehlender Check), `lib/claude.ts`

---

### F-06 — Professional-Anhänge B + C werden nicht auf Präsenz geprüft
**Problem:** Bei `tier = 'professional'` müssen Anhang B (EU AI Act Compliance-Checkliste) und Anhang C (Schulungsvorlage) vorhanden sein. Aktuell prüfen wir nur, dass Anhang A **nicht** erscheint wenn nicht bestellt. Die umgekehrte Richtung (pflichtende Inhalte vorhanden?) fehlt.  
**Impact:** Professional-Kunde zahlt €149 und bekommt unter Umständen ein Basis-ähnliches Dokument.  
**Betroffene Datei:** `lib/validation.ts` (fehlender Check)

---

### F-07 — "Juristisch geprüft" im PDF-Cover noch vorhanden
**Problem:** `lib/policy-generator.ts:449` enthält `"Erstellt mit KI-Kompass · Juristisch geprüft"` — widerspricht dem Beschluss aus Commit `8aa838d`, der alle "juristisch geprüft"-Claims entfernt hat.  
**Impact:** Widerspruch zwischen Marketing-Versprechen und Dokument-Footer → potenzielle Haftungsfrage.  
**Fix:** Ersetzen durch `"Erstellt mit KI-Kompass · Rechtsreferenzen validiert"`  
**Betroffene Datei:** `lib/policy-generator.ts:449`

---

### F-08 — Bekannte LLM-Fehler-Patterns zu eng gefasst
**Problem:** `KNOWN_ERRORS` enthält nur 3 spezifische Regex-Patterns. Weitere bekannte Halluzinationen werden nicht gefangen, z.B.:
- Art. 13 EU AI Act (existiert, aber mit anderem Inhalt als oft angenommen)
- Verwechslung DSGVO/EU AI Act Artikel-Nummern ohne explizite Nennung der Verordnung
- Falsche Bußgeldhöhen (Art. 99)  
**Impact:** Fehlerhafte Inhalte passieren die Validierung.  
**Betroffene Datei:** `lib/validation.ts` (`KNOWN_ERRORS` Array)

---

### F-09 — Kein Abbruch bei abgeschnittenem Output (Stop-Reason-Check)
**Problem:** Die Claude API gibt `stop_reason` zurück (`'end_turn'` = vollständig, `'max_tokens'` = abgeschnitten). Wir prüfen dieses Feld nicht. Ein abgeschnittener Output wird wie ein vollständiger behandelt.  
**Impact:** Direkt verbunden mit F-02 — stille Truncation ohne Fehler.  
**Fix:** `if (message.stop_reason === 'max_tokens') throw new Error('Output abgeschnitten — max_tokens erhöhen')`  
**Betroffene Datei:** `lib/claude.ts` (`extractText()` Funktion)

---

## Priorisierungs-Matrix (noch offen)

| ID | Severity | Aufwand | Prio |
|----|----------|---------|------|
| F-07 | Kritisch (Haftung) | Trivial (1 Zeile) | TBD |
| F-09 | Kritisch (silent truncation) | Klein | TBD |
| F-02 | Kritisch (kaputtes Dokument) | Klein | TBD |
| F-01 | Kritisch (sichtbarer Fehler) | Klein | TBD |
| F-03 | Hoch | Klein | TBD |
| F-06 | Hoch | Klein | TBD |
| F-04 | Mittel | Mittel | TBD |
| F-05 | Mittel | Klein | TBD |
| F-08 | Niedrig | Mittel | TBD |

---

## Offene Fragen

- Soll die Validierung bei F-03/F-04/F-05 direkt zum Retry führen (wie bei Rechtsreferenzen), oder als separater "Quality Gate" mit eigenem Fehlertyp?
- Für F-09: Soll `max_tokens` tier-abhängig werden, oder generell auf 16.000 erhöht?
- Sind weitere branchenspezifische Kontextchecks nötig (z.B. öffentlicher Sektor, Bildung)?
