'use client'

import { useEffect, useState } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(): TimeLeft {
  const deadline = new Date('2026-08-02T00:00:00Z').getTime()
  const now = Date.now()
  const diff = Math.max(0, deadline - now)

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  }
}

function DigitBlock({ value, label }: { value: number; label: string }) {
  const [prev, setPrev] = useState(value)
  const [flipping, setFlipping] = useState(false)

  useEffect(() => {
    if (value !== prev) {
      setFlipping(true)
      const t = setTimeout(() => {
        setPrev(value)
        setFlipping(false)
      }, 150)
      return () => clearTimeout(t)
    }
  }, [value, prev])

  const display = String(value).padStart(2, '0')

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative digit-wrap">
        <div
          className={`
            w-20 h-24 md:w-28 md:h-32 rounded-sm flex items-center justify-center
            bg-navy-dark border border-gold/20 relative overflow-hidden
            ${flipping ? 'scale-y-95' : ''}
            transition-transform duration-150
          `}
          style={{ background: 'linear-gradient(180deg, #1a2a45 0%, #111D33 100%)' }}
        >
          {/* Top shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          {/* Center line */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-black/40" />
          {/* Number */}
          <span
            className={`font-display text-5xl md:text-6xl font-light tabular-nums transition-opacity duration-150 ${flipping ? 'opacity-0' : 'opacity-100'}`}
            style={{ color: '#E8C87A', letterSpacing: '-0.02em' }}
          >
            {display}
          </span>
          {/* Reflection */}
          <div
            className="absolute inset-0 opacity-5"
            style={{ background: 'linear-gradient(135deg, white 0%, transparent 60%)' }}
          />
        </div>
        {/* Screw corners */}
        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-navy border border-gold/20" />
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-navy border border-gold/20" />
        <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-navy border border-gold/20" />
        <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-navy border border-gold/20" />
      </div>
      <span className="text-xs uppercase tracking-[0.2em] text-slate font-body font-medium">
        {label}
      </span>
    </div>
  )
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-4 md:gap-6">
        {['--', '--', '--', '--'].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-20 h-24 md:w-28 md:h-32 rounded-sm bg-navy-dark border border-gold/20 animate-pulse" />
            <div className="w-12 h-3 bg-navy-light/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 md:gap-5">
      <DigitBlock value={timeLeft.days} label="Tage" />
      <div className="self-center mb-8 text-gold/60 text-4xl font-display font-light leading-none">:</div>
      <DigitBlock value={timeLeft.hours} label="Stunden" />
      <div className="self-center mb-8 text-gold/60 text-4xl font-display font-light leading-none">:</div>
      <DigitBlock value={timeLeft.minutes} label="Minuten" />
      <div className="self-center mb-8 text-gold/60 text-4xl font-display font-light leading-none">:</div>
      <DigitBlock value={timeLeft.seconds} label="Sekunden" />
    </div>
  )
}
