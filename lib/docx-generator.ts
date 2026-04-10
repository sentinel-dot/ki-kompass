/**
 * DOCX-Generator — Markdown → Word-Dokument
 *
 * Konvertiert den Markdown-Output von Claude in ein professionell gestyltes
 * Word-Dokument (.docx), parallel zur PDF-Generierung.
 *
 * Features:
 * - Deckblatt mit Firmenname, Paket-Info und EU AI Act Deadline
 * - Konsistentes Styling passend zum PDF (Navy/Gold-Farbschema)
 * - Farbcodierte Tabellen (Ampel: Erlaubt/Eingeschränkt/Verboten)
 * - Inhaltsverzeichnis
 * - Kopf- und Fußzeilen
 *
 * @module lib/docx-generator
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  ShadingType,
  TableOfContents,
  StyleLevel,
  PageBreak,
  type ITableCellOptions,
  type IParagraphOptions,
} from 'docx'

// ─── Farben (konsistent mit PDF-Template) ───────────────────────────────────

const COLORS = {
  navy: '1B2A4A',
  navyLight: '253660',
  gold: 'C9A84C',
  goldLight: 'E8C87A',
  cream: 'F7F4EF',
  white: 'FFFFFF',
  slate: '8B96A8',
  // Ampel-Farben
  greenBg: 'E8F5E9',
  greenText: '2E7D32',
  yellowBg: 'FFF8E1',
  yellowText: 'F57F17',
  redBg: 'FFEBEE',
  redText: 'C62828',
  // Boxen
  summaryBg: 'E8F0FE',
  warningBg: 'FFF3E0',
  warningBorder: 'E65100',
}

// ─── Typen ──────────────────────────────────────────────────────────────────

interface DocxOptions {
  companyName: string
  tier: string
  markdown: string
}

interface ParsedBlock {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bullet' | 'numbered' | 'table' | 'blockquote' | 'empty'
  content: string
  rows?: string[][]
  level?: number
  isWarning?: boolean
}

// ─── Öffentliche API ────────────────────────────────────────────────────────

/**
 * Generiert ein DOCX-Dokument aus Markdown-Content.
 *
 * @param options — Firmenname, Tier und Markdown-Content
 * @returns Buffer mit dem DOCX-Inhalt
 */
export async function generateDOCX(options: DocxOptions): Promise<Buffer> {
  const { companyName, tier, markdown } = options
  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)

  // Markdown in strukturierte Blöcke parsen
  const blocks = parseMarkdown(markdown)

  // Blöcke in docx-Elemente konvertieren
  const contentElements = blocksToDocx(blocks)

  const doc = new Document({
    creator: 'KI-Kompass',
    title: `KI-Nutzungsrichtlinie — ${companyName}`,
    description: `Maßgeschneiderte KI-Nutzungsrichtlinie für ${companyName}, erstellt mit KI-Kompass.`,
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 20, // 10pt
            color: COLORS.navy,
          },
          paragraph: {
            spacing: { after: 200, line: 312 }, // 1.3 Zeilenabstand
          },
        },
        heading1: {
          run: {
            font: 'Arial',
            size: 36, // 18pt
            color: COLORS.navy,
            bold: false,
          },
          paragraph: {
            spacing: { before: 480, after: 240 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
            },
          },
        },
        heading2: {
          run: {
            font: 'Arial',
            size: 26, // 13pt
            color: COLORS.navy,
            bold: true,
          },
          paragraph: {
            spacing: { before: 360, after: 160 },
          },
        },
        heading3: {
          run: {
            font: 'Arial',
            size: 22, // 11pt
            color: COLORS.navy,
            bold: true,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: 'ordered-list',
          levels: [
            {
              level: 0,
              format: NumberFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    features: {
      updateFields: true, // Inhaltsverzeichnis aktualisieren
    },
    sections: [
      // ── Deckblatt ────────────────────────────────────────────────────
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
          },
        },
        children: buildCoverPage(companyName, tierLabel, today),
      },
      // ── Inhaltsverzeichnis + Inhalt ──────────────────────────────────
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1800, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${companyName} — KI-Nutzungsrichtlinie — VERTRAULICH`,
                    font: 'Arial',
                    size: 16,
                    color: COLORS.slate,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Erstellt mit KI-Kompass  ·  ',
                    font: 'Arial',
                    size: 16,
                    color: COLORS.slate,
                  }),
                  new TextRun({
                    children: ['Seite ', PageNumber.CURRENT, ' von ', PageNumber.TOTAL_PAGES],
                    font: 'Arial',
                    size: 16,
                    color: COLORS.slate,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Inhaltsverzeichnis
          new Paragraph({
            children: [
              new TextRun({
                text: 'Inhaltsverzeichnis',
                bold: true,
                size: 28,
                color: COLORS.navy,
                font: 'Arial',
              }),
            ],
            spacing: { after: 300 },
          }),
          new TableOfContents('Inhaltsverzeichnis', {
            hyperlink: true,
            headingStyleRange: '1-3',
            stylesWithLevels: [
              new StyleLevel('Heading1', 1),
              new StyleLevel('Heading2', 2),
              new StyleLevel('Heading3', 3),
            ],
          }),
          new Paragraph({
            children: [new PageBreak()],
          }),

          // ── Hauptinhalt ──────────────────────────────────────────────
          ...contentElements,
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}

// ─── Deckblatt ──────────────────────────────────────────────────────────────

function buildCoverPage(companyName: string, tierLabel: string, today: string): Paragraph[] {
  return [
    // Spacer oben
    new Paragraph({ spacing: { before: 2000 } }),

    // Logo
    new Paragraph({
      children: [
        new TextRun({
          text: '[KI]',
          font: 'Courier New',
          size: 22,
          color: COLORS.gold,
          bold: true,
        }),
        new TextRun({
          text: '  KI-Kompass',
          font: 'Arial',
          size: 22,
          color: COLORS.slate,
        }),
      ],
      spacing: { after: 800 },
    }),

    // Tag
    new Paragraph({
      children: [
        new TextRun({
          text: 'KI-NUTZUNGSRICHTLINIE',
          font: 'Arial',
          size: 20,
          color: COLORS.gold,
          characterSpacing: 120,
        }),
      ],
      spacing: { after: 200 },
    }),

    // Titel
    new Paragraph({
      children: [
        new TextRun({
          text: 'KI-Richtlinie',
          font: 'Arial',
          size: 64,
          color: COLORS.navy,
          italics: true,
        }),
      ],
      spacing: { after: 100 },
    }),

    // Firmenname
    new Paragraph({
      children: [
        new TextRun({
          text: companyName,
          font: 'Arial',
          size: 40,
          color: COLORS.gold,
        }),
      ],
      spacing: { after: 600 },
    }),

    // EU AI Act Deadline Box
    new Paragraph({
      children: [
        new TextRun({
          text: '⚠ EU AI Act Deadline',
          font: 'Arial',
          size: 20,
          bold: true,
          color: COLORS.gold,
        }),
      ],
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.gold },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.gold },
        left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.gold },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.gold },
      },
      shading: { type: ShadingType.SOLID, color: 'FDF8EC' },
      spacing: { after: 40 },
      indent: { left: 200, right: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'High-Risk-Pflichten gelten ab 2. August 2026',
          font: 'Arial',
          size: 18,
          color: COLORS.navy,
        }),
      ],
      indent: { left: 200, right: 200 },
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Art. 4 + Art. 5 gelten bereits seit 2. Februar 2025',
          font: 'Arial',
          size: 18,
          color: COLORS.navy,
        }),
      ],
      indent: { left: 200, right: 200 },
      spacing: { after: 800 },
    }),

    // Meta-Informationen
    new Paragraph({
      children: [
        new TextRun({ text: 'Version: ', color: COLORS.slate, size: 18, font: 'Arial' }),
        new TextRun({ text: '1.0', color: COLORS.navy, size: 18, font: 'Arial' }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Erstellt: ', color: COLORS.slate, size: 18, font: 'Arial' }),
        new TextRun({ text: today, color: COLORS.navy, size: 18, font: 'Arial' }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Paket: ', color: COLORS.slate, size: 18, font: 'Arial' }),
        new TextRun({ text: tierLabel, color: COLORS.navy, size: 18, font: 'Arial' }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Erstellt mit KI-Kompass · Juristisch geprüft',
          color: COLORS.slate,
          size: 18,
          font: 'Arial',
        }),
      ],
    }),
  ]
}

// ─── Markdown Parser ────────────────────────────────────────────────────────

/**
 * Parst Markdown in strukturierte Blöcke.
 * Unterstützt: Headings, Paragraphen, Bullet-/Numbered-Listen,
 * Tabellen (GFM), Blockquotes (Summary/Warning).
 */
function parseMarkdown(markdown: string): ParsedBlock[] {
  const lines = markdown.split('\n')
  const blocks: ParsedBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Leere Zeilen überspringen
    if (line.trim() === '') {
      i++
      continue
    }

    // ── Headings ──────────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3
      const type = `heading${level}` as 'heading1' | 'heading2' | 'heading3'
      blocks.push({ type, content: headingMatch[2].trim() })
      i++
      continue
    }

    // ── Tabellen (GFM) ───────────────────────────────────────────────
    if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) {
      const tableRows: string[][] = []

      // Header-Zeile
      tableRows.push(parseTableRow(line))

      // Separator überspringen
      i += 2

      // Datenzeilen
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        tableRows.push(parseTableRow(lines[i]))
        i++
      }

      blocks.push({ type: 'table', content: '', rows: tableRows })
      continue
    }

    // ── Blockquotes ───────────────────────────────────────────────────
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('>') || (lines[i].trim() !== '' && quoteLines.length > 0 && !lines[i].startsWith('#')))) {
        if (lines[i].startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''))
        } else {
          break
        }
        i++
      }
      const quoteContent = quoteLines.join('\n').trim()
      const isWarning = /^⚠|^\*\*(Achtung|Warnung|Wichtig)\*\*/i.test(quoteContent)
      blocks.push({ type: 'blockquote', content: quoteContent, isWarning })
      continue
    }

    // ── Bullet-Listen ─────────────────────────────────────────────────
    if (/^\s*[-*+]\s+/.test(line)) {
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\s*[-*+]\s+/, '').trim()
        blocks.push({ type: 'bullet', content })
        i++
      }
      continue
    }

    // ── Nummerierte Listen ────────────────────────────────────────────
    if (/^\s*\d+\.\s+/.test(line)) {
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const content = lines[i].replace(/^\s*\d+\.\s+/, '').trim()
        blocks.push({ type: 'numbered', content })
        i++
      }
      continue
    }

    // ── Paragraph ─────────────────────────────────────────────────────
    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1]))
    ) {
      paragraphLines.push(lines[i])
      i++
    }
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paragraphLines.join(' ').trim() })
    }
  }

  return blocks
}

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell !== '')
}

// ─── Blöcke → docx-Elemente ────────────────────────────────────────────────

function blocksToDocx(blocks: ParsedBlock[]): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'heading1':
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: parseInlineFormatting(block.content),
          })
        )
        break

      case 'heading2':
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: parseInlineFormatting(block.content),
          })
        )
        break

      case 'heading3':
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: parseInlineFormatting(block.content),
          })
        )
        break

      case 'paragraph':
        elements.push(
          new Paragraph({
            children: parseInlineFormatting(block.content),
          })
        )
        break

      case 'bullet':
        elements.push(
          new Paragraph({
            bullet: { level: 0 },
            children: parseInlineFormatting(block.content),
            spacing: { after: 80 },
          })
        )
        break

      case 'numbered':
        elements.push(
          new Paragraph({
            numbering: { reference: 'ordered-list', level: 0 },
            children: parseInlineFormatting(block.content),
            spacing: { after: 80 },
          })
        )
        break

      case 'table':
        if (block.rows && block.rows.length > 0) {
          elements.push(buildTable(block.rows))
        }
        break

      case 'blockquote':
        elements.push(buildQuoteBox(block.content, block.isWarning ?? false))
        break
    }
  }

  return elements
}

// ─── Inline-Formatierung ────────────────────────────────────────────────────

/**
 * Parst Inline-Markdown-Formatierung: **bold**, *italic*, `code`
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = []
  // Regex: **bold**, *italic*, `code`, plain text
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|([^*`]+)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // **bold**
      runs.push(new TextRun({ text: match[2], bold: true }))
    } else if (match[4]) {
      // *italic*
      runs.push(new TextRun({ text: match[4], italics: true }))
    } else if (match[6]) {
      // `code`
      runs.push(
        new TextRun({
          text: match[6],
          font: 'Courier New',
          size: 18,
          shading: { type: ShadingType.SOLID, color: 'F0F0F0', fill: 'F0F0F0' },
        })
      )
    } else if (match[7]) {
      // plain text
      runs.push(new TextRun({ text: match[7] }))
    }
  }

  // Fallback: wenn nichts gematcht wurde
  if (runs.length === 0) {
    runs.push(new TextRun({ text }))
  }

  return runs
}

// ─── Tabellen ───────────────────────────────────────────────────────────────

function buildTable(rows: string[][]): Table {
  const colCount = Math.max(...rows.map(r => r.length))

  const tableRows = rows.map((row, rowIndex) => {
    const isHeader = rowIndex === 0
    const cells = Array.from({ length: colCount }, (_, colIndex) => {
      const cellText = row[colIndex] ?? ''
      return buildTableCell(cellText, isHeader)
    })

    return new TableRow({ children: cells })
  })

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}

function buildTableCell(text: string, isHeader: boolean): TableCell {
  const options: ITableCellOptions = {
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: isHeader,
            font: 'Arial',
            size: isHeader ? 18 : 19,
            color: isHeader ? COLORS.white : COLORS.navy,
          }),
        ],
        spacing: { before: 40, after: 40 },
      }),
    ],
    shading: isHeader
      ? { type: ShadingType.SOLID, color: COLORS.navy, fill: COLORS.navy }
      : getCellShading(text),
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  }

  return new TableCell(options)
}

/**
 * Ampel-Farbcodierung für Tabellenzellen
 */
function getCellShading(text: string): { type: typeof ShadingType.SOLID; color: string; fill: string } | undefined {
  if (/^Erlaubt\b/i.test(text)) {
    return { type: ShadingType.SOLID, color: COLORS.greenBg, fill: COLORS.greenBg }
  }
  if (/^Eingeschränkt\b/i.test(text)) {
    return { type: ShadingType.SOLID, color: COLORS.yellowBg, fill: COLORS.yellowBg }
  }
  if (/^Verboten\b/i.test(text)) {
    return { type: ShadingType.SOLID, color: COLORS.redBg, fill: COLORS.redBg }
  }
  return undefined
}

// ─── Blockquote-Boxen ───────────────────────────────────────────────────────

function buildQuoteBox(content: string, isWarning: boolean): Paragraph {
  const bgColor = isWarning ? COLORS.warningBg : COLORS.summaryBg
  const borderColor = isWarning ? COLORS.warningBorder : COLORS.navy

  return new Paragraph({
    children: parseInlineFormatting(content),
    shading: { type: ShadingType.SOLID, color: bgColor, fill: bgColor },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
    },
    indent: { left: 200, right: 200 },
    spacing: { before: 200, after: 200 },
  })
}
