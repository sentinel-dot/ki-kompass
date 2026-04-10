-- ============================================================================
-- Migration: Retry-Logik für Policy-Generierung
-- Datum: 2026-04-09
-- Bezug: FINDINGS.md Punkt 1.2 — Webhook/Worker Entkopplung
-- ============================================================================
--
-- Neue Spalten auf der 'orders'-Tabelle:
--   retry_count           — Zählt fehlgeschlagene Generierungsversuche (0-3)
--   processing_started_at — Lock-Timestamp, verhindert parallele Verarbeitung
--   last_error            — Letzte Fehlermeldung für Debugging
--   admin_alerted_at      — Wann der Admin über das Scheitern benachrichtigt wurde
--
-- WICHTIG: Vor dem Ausführen prüfen, ob die Spalten bereits existieren!
-- ============================================================================

-- Retry-Count: Wie oft die Generierung bereits fehlgeschlagen ist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;

-- Processing-Lock: Verhindert, dass zwei Worker dieselbe Order gleichzeitig verarbeiten
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS processing_started_at timestamptz DEFAULT NULL;

-- Letzte Fehlermeldung für Diagnose
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS last_error text DEFAULT NULL;

-- Timestamp: Wann wurde der Admin über eine fehlgeschlagene Order benachrichtigt?
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS admin_alerted_at timestamptz DEFAULT NULL;

-- ============================================================================
-- Index für den Worker-Query (offene Orders effizient finden)
-- ============================================================================

-- Index für die häufigste Worker-Abfrage:
-- WHERE payment_status = 'paid' AND policy_url IS NULL AND retry_count < 3
CREATE INDEX IF NOT EXISTS idx_orders_pending_policy
ON orders (payment_status, retry_count)
WHERE policy_url IS NULL;

-- ============================================================================
-- Kommentar für Dokumentation
-- ============================================================================

COMMENT ON COLUMN orders.retry_count IS 'Anzahl fehlgeschlagener Policy-Generierungsversuche. Max 3, danach Admin-Alert.';
COMMENT ON COLUMN orders.processing_started_at IS 'Lock-Timestamp für Worker-Idempotenz. NULL = nicht in Bearbeitung. Wird nach 10 Min als stale betrachtet.';
COMMENT ON COLUMN orders.last_error IS 'Letzte Fehlermeldung bei fehlgeschlagener Generierung.';
COMMENT ON COLUMN orders.admin_alerted_at IS 'Timestamp des Admin-Alerts nach erschöpften Retries. NULL = noch kein Alert gesendet.';
