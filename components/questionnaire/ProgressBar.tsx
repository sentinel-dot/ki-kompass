interface ProgressBarProps {
  current: number
  total: number
  labels: string[]
}

export function ProgressBar({ current, total, labels }: ProgressBarProps) {
  return (
    <div className="w-full">
      {/* Step labels */}
      <div className="flex items-center justify-between mb-3">
        {labels.map((label, i) => {
          const step = i + 1
          const done = step < current
          const active = step === current
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium transition-all duration-300 ${
                  done
                    ? 'bg-gold text-navy-dark'
                    : active
                    ? 'bg-navy text-cream ring-2 ring-gold/30 ring-offset-2 ring-offset-cream'
                    : 'bg-navy/10 text-navy/40'
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`hidden md:block text-xs font-body text-center leading-tight transition-colors ${
                  active ? 'text-navy font-medium' : done ? 'text-gold' : 'text-navy/30'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress track */}
      <div className="relative h-1 bg-navy/10 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-navy to-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}
