'use client'

import { useState, useEffect } from 'react'
import type { Expense } from '@/lib/supabase'

type Category = Expense['category']

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'lodging',    label: 'Lodging',    emoji: '🏨' },
  { id: 'food',       label: 'Food',       emoji: '🍝' },
  { id: 'wine',       label: 'Wine',       emoji: '🍷' },
  { id: 'transport',  label: 'Transport',  emoji: '🚗' },
  { id: 'activities', label: 'Activities', emoji: '🎨' },
  { id: 'misc',       label: 'Misc',       emoji: '✦'  },
]

interface Props {
  onAdd: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<boolean>
}

export default function BudgetForm({ onAdd }: Props) {
  const [category, setCategory] = useState<Category>('food')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState<'DKK' | 'EUR'>('DKK')
  const [eurRate, setEurRate] = useState<number>(7.46)

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/EUR')
      .then((r) => r.json())
      .then((data) => { if (data?.rates?.DKK) setEurRate(data.rates.DKK) })
      .catch(() => {})
  }, [])

  const parsed = parseFloat(amount.replace(',', '.'))
  const dkkAmount = !isNaN(parsed) && parsed > 0
    ? (currency === 'EUR' ? parsed * eurRate : parsed)
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dkkAmount) return
    setLoading(true)
    try {
      const saved = await onAdd({ category, amount: Math.round(dkkAmount * 100) / 100, note })
      if (saved) {
        setAmount('')
        setNote('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-warm-border rounded-2xl p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <h2 className="font-playfair text-xl font-semibold text-ink mb-5">Add Expense</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-3">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all duration-150 cursor-pointer active:scale-95 ${
                  category === cat.id
                    ? 'border-terracotta bg-terracotta/10 text-terracotta scale-[1.03] shadow-sm'
                    : 'border-warm-border text-muted hover:border-ink hover:text-ink hover:-translate-y-0.5'
                }`}
              >
                <span className="text-xl leading-none">{cat.emoji}</span>
                <span className="text-[11px] font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-widest font-medium text-muted">
              Amount
            </label>
            <div className="flex items-center bg-parchment border border-warm-border rounded-lg overflow-hidden text-[11px] font-medium">
              {(['DKK', 'EUR'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCurrency(c); setAmount('') }}
                  className={`px-2.5 py-1 transition-colors duration-150 cursor-pointer ${
                    currency === c
                      ? 'bg-terracotta text-white'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">
              {currency === 'EUR' ? '€' : 'kr'}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-parchment border border-warm-border rounded-xl pl-9 pr-4 py-2.5 text-ink text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15 transition-all duration-150 placeholder:text-muted"
            />
          </div>
          {currency === 'EUR' && dkkAmount !== null && (
            <p className="text-[11px] text-muted mt-1.5 animate-fade-in">
              ≈ {dkkAmount.toLocaleString('de-DE', { maximumFractionDigits: 0 })} DKK · 1 € = {eurRate.toFixed(2)} DKK
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-1.5">
            Note
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional description…"
            className="w-full bg-parchment border border-warm-border rounded-xl px-4 py-2.5 text-ink text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15 transition-all duration-150 placeholder:text-muted"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !amount}
          className="w-full bg-terracotta text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 hover:shadow-md transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="animate-spin">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {loading ? 'Adding…' : 'Add Expense'}
        </button>
      </form>
    </div>
  )
}
