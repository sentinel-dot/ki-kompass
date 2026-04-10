export interface QuestionnaireData {
  // Block 1: Unternehmensprofil
  firmenname: string
  branche: string
  branche_sonstige?: string
  mitarbeiter: string
  laender: string[]

  // Block 2: KI-Nutzung
  ki_status: string
  externe_tools: string[]
  externe_tools_sonstige?: string
  use_cases: string[]
  use_cases_sonstige?: string
  interne_ki: string
  interne_ki_beschreibung?: string

  // Block 3: Datenschutz
  datenarten: string[]
  dsb: string
  cloud_ausserhalb_eu: string

  // Block 4: Umfang
  striktheit: string
  verantwortung: string

  // Meta
  email: string
  tier: 'basis' | 'professional'

  // Disclaimer
  disclaimerAccepted: boolean
}

export type FormStep = 1 | 2 | 3 | 4 | 5 // 4 blocks + 1 email/tier step
