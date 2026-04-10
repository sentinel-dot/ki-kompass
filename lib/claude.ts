import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt'
import {
  validateLegalReferences,
  buildCorrectionPrompt,
  type ValidationResult,
} from './validation'
import * as Sentry from '@sentry/nextjs'

const MAX_VALIDATION_RETRIES = 2

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY ist nicht gesetzt.')
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

/**
 * Extrahiert den Textinhalt aus einer Claude-Antwort.
 */
function extractText(message: Anthropic.Message): string {
  const textBlock = message.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Keine Textantwort von Claude erhalten')
  }
  return textBlock.text
}

/**
 * Generiert eine KI-Nutzungsrichtlinie und validiert alle Rechtsreferenzen.
 *
 * Ablauf:
 * 1. Erstgenerierung mit dem normalen Prompt
 * 2. Validierung aller EU AI Act & DSGVO Referenzen
 * 3. Bei Fehlern: Retry mit Korrektur-Prompt (max. 2 Versuche)
 * 4. Wenn nach allen Retries noch Fehler: Error werfen (nicht ausliefern)
 */
export async function generatePolicy(questionnaire: Record<string, unknown>): Promise<string> {
  const client = getClient()

  // Erstgenerierung
  const initialMessage = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(questionnaire),
      },
    ],
    system: SYSTEM_PROMPT,
  })

  let policyText = extractText(initialMessage)
  let validation: ValidationResult = validateLegalReferences(policyText)

  // Retry-Loop bei Validierungsfehlern
  for (let attempt = 1; attempt <= MAX_VALIDATION_RETRIES && !validation.valid; attempt++) {
    console.warn(
      `[Validierung] Versuch ${attempt}/${MAX_VALIDATION_RETRIES} — ${validation.errors.length} Fehler gefunden:`,
      validation.errors.map(e => e.message)
    )

    Sentry.addBreadcrumb({
      category: 'validation',
      message: `Validierungskorrektur Versuch ${attempt}/${MAX_VALIDATION_RETRIES}`,
      level: 'warning',
      data: {
        error_count: validation.errors.length,
        errors: validation.errors.map(e => e.message),
      },
    })

    const correctionPrompt = buildCorrectionPrompt(policyText, validation.errors)

    const correctionMessage = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: correctionPrompt,
        },
      ],
      system: SYSTEM_PROMPT,
    })

    policyText = extractText(correctionMessage)
    validation = validateLegalReferences(policyText)
  }

  // Finale Prüfung — wenn immer noch Fehler, NICHT ausliefern
  if (!validation.valid) {
    const errorSummary = validation.errors
      .map(e => `- ${e.message} ("${e.excerpt}")`)
      .join('\n')

    const error = new Error(
      `Policy-Validierung fehlgeschlagen nach ${MAX_VALIDATION_RETRIES} Korrekturversuchen.\n` +
        `${validation.errors.length} Fehler:\n${errorSummary}`
    )

    Sentry.captureException(error, {
      tags: {
        service: 'claude',
        step: 'legal-validation',
        flow: 'payment-to-delivery',
      },
      level: 'error',
      contexts: {
        validation: {
          total_references: validation.totalReferences,
          error_count: validation.errors.length,
          errors: validation.errors.map(e => e.message),
        },
      },
    })

    throw error
  }

  console.log(
    `[Validierung] Erfolgreich — ${validation.totalReferences} Referenzen geprüft, keine Fehler.`
  )

  return policyText
}
