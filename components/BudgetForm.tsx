'use client'

import { useState } from 'react'
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
  onAdd: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>
}

export default function BudgetForm({ onAdd }: Props) {
  const [category, setCategory] = useState<Category>('food')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) return
    setLoading(true)
    await onAdd({ category, amount: parsed, note })
    setAmount('')
    setNote('')
    setLoading(false)
  }

  return (
    <div className="bg-card border border-warm-border rounded-2xl p-6 shadow-sm">
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
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all duration-150 ${
                  category === cat.id
                    ? 'border-terracotta bg-terracotta/10 text-terracotta'
                    : 'border-warm-border text-muted hover:border-ink hover:text-ink'
                }`}
              >
                <span className="text-xl leading-none">{cat.emoji}</span>
                <span className="text-[11px] font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-1.5">
            Amount (€)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-parchment border border-warm-border rounded-xl px-4 py-2.5 text-ink text-sm outline-none focus:border-terracotta transition-colors placeholder:text-muted"
          />
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
            className="w-full bg-parchment border border-warm-border rounded-xl px-4 py-2.5 text-ink text-sm outline-none focus:border-terracotta transition-colors placeholder:text-muted"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !amount}
          className="w-full bg-terracotta text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding…' : 'Add Expense'}
        </button>
      </form>
    </div>
  )
}
