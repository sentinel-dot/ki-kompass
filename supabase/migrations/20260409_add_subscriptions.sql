-- ============================================================================
-- Migration: Enterprise-Subscription-Verwaltung
-- Datum: 2026-04-09
-- Bezug: FINDINGS.md Punkt 3.2 — Enterprise-Paket Backend
-- ============================================================================
--
-- Neue Tabellen:
--   subscriptions         — Enterprise-Abo-Verwaltung (vierteljährliche Updates)
--   subscription_updates  — Versionierte Policy-Updates pro Subscription
--   law_change_alerts     — Gesetzesänderungs-Benachrichtigungen
--
-- ============================================================================

-- ─── Subscriptions: Enterprise-Abo-Verwaltung ──────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  email         text NOT NULL,
  company_name  text NOT NULL,
  tier          text NOT NULL DEFAULT 'enterprise',

  -- Subscription-Zeitraum (12 Monate ab Kauf)
  starts_at     timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '12 months'),

  -- Status: active, expired, cancelled
  status        text NOT NULL DEFAULT 'active',

  -- Tracking: Wann wurde das letzte Update generiert?
  last_update_at      timestamptz DEFAULT NULL,
  next_update_due_at  timestamptz NOT NULL DEFAULT (now() + interval '3 months'),
  update_count        integer NOT NULL DEFAULT 0,

  -- Originale Fragebogen-Daten (für Regenerierung)
  questionnaire jsonb NOT NULL DEFAULT '{}',

  -- Letzte generierte Policy (Markdown) für Delta-Vergleich
  current_policy_markdown text DEFAULT NULL,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index: Fällige Updates effizient finden
CREATE INDEX IF NOT EXISTS idx_subscriptions_due_updates
ON subscriptions (next_update_due_at, status)
WHERE status = 'active';

-- Index: Subscription per Order finden
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_order_id
ON subscriptions (order_id);

COMMENT ON TABLE subscriptions IS 'Enterprise-Abonnements für vierteljährliche Policy-Updates.';
COMMENT ON COLUMN subscriptions.status IS 'active = laufend, expired = abgelaufen (nach 12 Monaten), cancelled = manuell storniert.';
COMMENT ON COLUMN subscriptions.next_update_due_at IS 'Nächster Fälligkeitszeitpunkt für ein vierteljährliches Update.';
COMMENT ON COLUMN subscriptions.current_policy_markdown IS 'Letzte Policy-Version als Markdown für Claude-Vergleich bei Updates.';

-- ─── Subscription Updates: Versionierte Policy-Updates ──────────────────────

CREATE TABLE IF NOT EXISTS subscription_updates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Versionierung
  version         integer NOT NULL,
  
  -- Generierte Artefakte
  policy_markdown text NOT NULL,
  change_summary  text DEFAULT NULL,
  pdf_url         text DEFAULT NULL,
  docx_url        text DEFAULT NULL,

  -- Status: pending, generating, completed, failed
  status          text NOT NULL DEFAULT 'pending',
  error_message   text DEFAULT NULL,
  retry_count     integer NOT NULL DEFAULT 0,

  -- E-Mail-Versand
  email_sent_at   timestamptz DEFAULT NULL,

  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index: Updates pro Subscription (neueste zuerst)
CREATE INDEX IF NOT EXISTS idx_subscription_updates_sub_id
ON subscription_updates (subscription_id, version DESC);

-- Unique: Nur eine Version pro Subscription+Version
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_updates_unique_version
ON subscription_updates (subscription_id, version);

COMMENT ON TABLE subscription_updates IS 'Versionierte vierteljährliche Policy-Updates für Enterprise-Kunden.';
COMMENT ON COLUMN subscription_updates.version IS 'Fortlaufende Versionsnummer (1 = erstes Update, 2 = zweites, etc.)';
COMMENT ON COLUMN subscription_updates.change_summary IS 'KI-generierte Zusammenfassung der Änderungen für die Kunden-E-Mail.';

-- ─── Law Change Alerts: Gesetzesänderungs-Benachrichtigungen ────────────────

CREATE TABLE IF NOT EXISTS law_change_alerts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Gesetzesänderung
  title         text NOT NULL,
  description   text NOT NULL,
  law_reference text NOT NULL,          -- z.B. "EU AI Act Art. 6", "DSGVO Art. 35"
  effective_date date DEFAULT NULL,      -- Wann tritt die Änderung in Kraft?
  severity      text NOT NULL DEFAULT 'info', -- info, warning, critical

  -- Verwaltung
  status        text NOT NULL DEFAULT 'draft', -- draft, sending, sent
  created_by    text DEFAULT 'system',
  
  -- Tracking
  total_recipients  integer NOT NULL DEFAULT 0,
  emails_sent       integer NOT NULL DEFAULT 0,
  
  created_at    timestamptz NOT NULL DEFAULT now(),
  sent_at       timestamptz DEFAULT NULL
);

COMMENT ON TABLE law_change_alerts IS 'Gesetzesänderungs-Alerts die an Enterprise-Kunden gesendet werden.';
COMMENT ON COLUMN law_change_alerts.severity IS 'info = informativ, warning = Handlungsbedarf, critical = sofortiger Handlungsbedarf.';

-- ─── Trigger: updated_at automatisch setzen ─────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RPC: update_count sicher inkrementieren (Concurrency-safe)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_update_count(sub_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET update_count = update_count + 1
  WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql;
