export function TrustBar() {
  const items = [
    { icon: '✓', text: 'Rechtsreferenzen validiert' },
    { icon: '🇩🇪', text: 'DSGVO-konform' },
    { icon: '🇪🇺', text: 'EU AI Act-ready' },
    { icon: '⚡', text: 'In 10 Minuten fertig' },
    { icon: '📄', text: 'PDF + DOCX Export' },
  ]

  return (
    <div className="border-y border-navy/10 bg-white/50 backdrop-blur-sm py-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm font-body font-medium text-navy/70 tracking-wide">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
