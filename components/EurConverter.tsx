'use client'

import { useState, useEffect } from 'react'

const FALLBACK_RATE = 7.46

export default function EurConverter() {
  const [rate, setRate] = useState<number>(FALLBACK_RATE)
  const [eur, setEur] = useState('')

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/EUR')
      .then((r) => r.json())
      .then((data) => { if (data?.rates?.DKK) setRate(data.rates.DKK) })
      .catch(() => {})
  }, [])

  const value = parseFloat(eur.replace(',', '.'))
  const dkk = !isNaN(value) && value > 0 ? value * rate : null
  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div className="bg-card border border-warm-border rounded-2xl p-5 shadow-sm">
      <p className="text-[11px] uppercase tracking-widest font-medium text-muted mb-3">EUR → DKK</p>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
          <input
            type="number"
            min="0"
            value={eur}
            onChange={(e) => setEur(e.target.value)}
            placeholder="0"
            className="w-full pl-7 pr-3 py-2 bg-parchment border border-warm-border rounded-lg text-sm text-ink outline-none focus:border-terracotta transition-colors"
          />
        </div>
        <span className="text-muted text-sm shrink-0">=</span>
        <div className="flex-1 text-right">
          <span className="font-playfair text-xl font-bold text-ink">
            {dkk !== null ? fmt(dkk) : '—'}
          </span>
          {dkk !== null && <span className="text-muted text-xs ml-1">DKK</span>}
        </div>
      </div>
      <p className="text-[10px] text-muted/50 mt-2.5">1 € = {rate.toFixed(2)} DKK · live rate</p>
    </div>
  )
}
