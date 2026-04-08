const steps = [
  {
    num: '01',
    title: 'Fragebogen ausfüllen',
    desc: '13 gezielte Fragen zu Ihrem Unternehmen, Ihrer KI-Nutzung und Ihren Datenschutzanforderungen. Dauert ca. 8–10 Minuten.',
    icon: '📋',
  },
  {
    num: '02',
    title: 'Paket wählen & bezahlen',
    desc: 'Wählen Sie zwischen Basis (€79), Professional (€149) oder Enterprise (€299). Sichere Zahlung via Stripe.',
    icon: '💳',
  },
  {
    num: '03',
    title: 'Richtlinie erhalten',
    desc: 'Unsere KI generiert Ihre maßgeschneiderte Policy. Sie erhalten sie sofort als PDF per E-Mail — und können jederzeit herunterladen.',
    icon: '📥',
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-3">
            So funktioniert es
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-navy leading-tight">
            Von null zur fertigen Richtlinie
            <br />
            <em className="italic font-light">in drei Schritten</em>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

          {steps.map((step, i) => (
            <div key={i} className="relative group">
              <div className="p-8 rounded-sm border border-navy/8 bg-cream/50 hover:border-gold/30 hover:bg-white transition-all duration-300">
                {/* Number */}
                <div className="flex items-start justify-between mb-6">
                  <span
                    className="font-display text-7xl font-light leading-none"
                    style={{ color: 'rgba(201,168,76,0.15)' }}
                  >
                    {step.num}
                  </span>
                  <span className="text-3xl">{step.icon}</span>
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-navy mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-navy/60 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
