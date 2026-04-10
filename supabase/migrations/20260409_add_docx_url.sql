-- Migration: DOCX-Export Support
-- Fügt docx_url Spalte zur orders-Tabelle hinzu
-- Datum: 2026-04-09

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS docx_url TEXT DEFAULT NULL;

-- Kommentar für Dokumentation
COMMENT ON COLUMN orders.docx_url IS 'Public URL des generierten DOCX-Dokuments in Supabase Storage';
