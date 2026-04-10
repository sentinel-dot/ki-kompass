/**
 * Markdown → HTML Konvertierung für Policy-PDFs
 *
 * Ersetzt die bisherige Regex-basierte Konvertierung durch den `marked`-Parser.
 * Custom Renderer für:
 * - Farbcodierte Tabellenzellen (Erlaubt/Eingeschränkt/Verboten → grün/gelb/rot)
 * - Summary-Boxen (> **Zusammenfassung:** …)
 * - Warning-Boxen (> ⚠ …)
 *
 * @module lib/markdown-to-html
 */

import { marked, Renderer, type Tokens } from 'marked'

// ─── Custom Renderer ────────────────────────────────────────────────────────

/**
 * Erstellt einen Custom Renderer, der die speziellen Anforderungen
 * der KI-Richtlinien-PDFs abdeckt:
 *
 * 1. Tabellenzellen mit Farbcodierung (Ampel-System)
 * 2. Blockquotes als Summary-/Warning-Boxen
 */
function createPolicyRenderer(): Renderer {
  const renderer = new Renderer()

  // ── Tabellenzellen: Farbcodierung für Ampel-System ──────────────────────

  renderer.tablecell = function ({ text, header }: Tokens.TableCell): string {
    if (header) {
      return `<th>${text}</th>\n`
    }

    const plainText = typeof text === 'string' ? text : ''

    // Ampel-Farbcodierung: Erlaubt → grün, Eingeschränkt → gelb, Verboten → rot
    if (/^Erlaubt\b/i.test(plainText)) {
      return `<td class="td-green">${plainText}</td>\n`
    }
    if (/^Eingeschränkt\b/i.test(plainText)) {
      return `<td class="td-yellow">${plainText}</td>\n`
    }
    if (/^Verboten\b/i.test(plainText)) {
      return `<td class="td-red">${plainText}</td>\n`
    }

    return `<td>${plainText}</td>\n`
  }

  // ── Blockquotes: Summary-Box & Warning-Box ──────────────────────────────

  renderer.blockquote = function ({ text }: Tokens.Blockquote): string {
    const inner = typeof text === 'string' ? text : ''

    // Warning-Box: Beginnt mit ⚠ oder enthält "Achtung"/"Warnung"
    if (/^<p>\s*⚠/i.test(inner) || /^<p>\s*<strong>\s*(Achtung|Warnung|Wichtig)/i.test(inner)) {
      return `<div class="warning-box">${inner}</div>\n`
    }

    // Summary-Box: Beginnt mit "Zusammenfassung" oder "Hinweis"
    if (/^<p>\s*<strong>\s*(Zusammenfassung|Hinweis|Überblick|Empfehlung)/i.test(inner)) {
      return `<div class="summary-box">${inner}</div>\n`
    }

    // Fallback: Normale Summary-Box (alle Blockquotes werden hervorgehoben)
    return `<div class="summary-box">${inner}</div>\n`
  }

  return renderer
}

// ─── Konfiguration ──────────────────────────────────────────────────────────

/**
 * Konfigurierte marked-Instanz mit Custom Renderer.
 * GFM (GitHub Flavored Markdown) ist aktiviert für Tabellen-Support.
 */
function getConfiguredMarked(): typeof marked {
  const instance = new marked.Marked()

  instance.setOptions({
    renderer: createPolicyRenderer(),
    gfm: true,       // GitHub Flavored Markdown: Tabellen, Strikethrough, etc.
    breaks: false,    // Keine <br> bei einfachen Zeilenumbrüchen
  })

  return instance as unknown as typeof marked
}

// ─── Öffentliche API ────────────────────────────────────────────────────────

/**
 * Konvertiert Markdown-Output von Claude in HTML für die PDF-Generierung.
 *
 * Features:
 * - Vollständiges Markdown-Parsing (Headings, Listen, verschachtelte Listen, Tabellen, etc.)
 * - Farbcodierte Tabellenzellen für Ampel-System (Erlaubt/Eingeschränkt/Verboten)
 * - Summary- und Warning-Boxen aus Blockquotes
 * - GFM-Tabellen-Support
 *
 * @param markdown — Roh-Markdown aus dem Claude-Response
 * @returns HTML-String, bereit zum Einbetten in das PDF-Template
 */
export function markdownToHTML(markdown: string): string {
  const instance = getConfiguredMarked()
  const result = instance.parse(markdown)

  // marked.parse() kann synchron oder async sein — wir erzwingen sync
  if (typeof result === 'string') {
    return result
  }

  // Falls async Promise returned (sollte bei unserer Config nicht passieren),
  // Fallback auf sync parsing
  throw new Error('markdownToHTML: Unerwartetes async-Ergebnis von marked.parse()')
}
