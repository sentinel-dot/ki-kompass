interface TextInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  required?: boolean
}

export function TextInput({ label, value, onChange, placeholder, hint, required }: TextInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block font-body text-sm font-medium text-navy">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      {hint && <p className="text-xs text-navy/50 font-body">{hint}</p>}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-sm border border-navy/15 bg-white font-body text-sm text-navy placeholder-navy/30 focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all"
      />
    </div>
  )
}

interface EmailInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}

export function EmailInput({ label, value, onChange, placeholder, hint }: EmailInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block font-body text-sm font-medium text-navy">
        {label} <span className="text-gold">*</span>
      </label>
      {hint && <p className="text-xs text-navy/50 font-body">{hint}</p>}
      <input
        type="email"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-sm border border-navy/15 bg-white font-body text-sm text-navy placeholder-navy/30 focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all"
      />
    </div>
  )
}

interface SelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  hint?: string
  required?: boolean
}

export function Select({ label, value, onChange, options, hint, required }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="block font-body text-sm font-medium text-navy">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      {hint && <p className="text-xs text-navy/50 font-body">{hint}</p>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-sm border border-navy/15 bg-white font-body text-sm text-navy focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231B2A4A' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '40px' }}
      >
        <option value="">Bitte wählen…</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

interface RadioGroupProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; desc?: string }[]
  hint?: string
  required?: boolean
}

export function RadioGroup({ label, value, onChange, options, hint, required }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <label className="block font-body text-sm font-medium text-navy">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      {hint && <p className="text-xs text-navy/50 font-body mb-2">{hint}</p>}
      <div className="space-y-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-4 rounded-sm border cursor-pointer transition-all duration-150 ${
              value === opt.value
                ? 'border-gold/60 bg-gold/5'
                : 'border-navy/10 hover:border-navy/25 bg-white'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
              value === opt.value ? 'border-gold' : 'border-navy/25'
            }`}>
              {value === opt.value && (
                <div className="w-2 h-2 rounded-full bg-gold" />
              )}
            </div>
            <input
              type="radio"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <div>
              <div className="font-body text-sm font-medium text-navy">{opt.label}</div>
              {opt.desc && <div className="font-body text-xs text-navy/50 mt-0.5 leading-snug">{opt.desc}</div>}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

interface CheckboxGroupProps {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  options: { value: string; label: string }[]
  hint?: string
  required?: boolean
}

export function CheckboxGroup({ label, value, onChange, options, hint, required }: CheckboxGroupProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter(x => x !== v))
    } else {
      onChange([...value, v])
    }
  }

  return (
    <div className="space-y-2">
      <label className="block font-body text-sm font-medium text-navy">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      {hint && <p className="text-xs text-navy/50 font-body mb-2">{hint}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-3.5 rounded-sm border cursor-pointer transition-all duration-150 ${
              value.includes(opt.value)
                ? 'border-gold/60 bg-gold/5'
                : 'border-navy/10 hover:border-navy/25 bg-white'
            }`}
          >
            <div className={`w-4 h-4 rounded-sm border-2 flex-shrink-0 flex items-center justify-center transition-all ${
              value.includes(opt.value) ? 'border-gold bg-gold' : 'border-navy/25'
            }`}>
              {value.includes(opt.value) && (
                <svg className="w-2.5 h-2.5 text-navy-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              value={opt.value}
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="sr-only"
            />
            <span className="font-body text-sm text-navy">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
