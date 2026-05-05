'use client'

import { useState } from 'react'
import type { Expense } from '@/lib/supabase'

const CATEGORY_LABELS: Record<string, string> = {
  lodging:    '🏨 Lodging',
  food:       '🍝 Food',
  wine:       '🍷 Wine',
  transport:  '🚗 Transport',
  activities: '🎨 Activities',
  misc:       '✦ Misc',
}

const CATEGORY_ORDER = ['lodging', 'food', 'wine', 'transport', 'activities', 'misc']
const CURRENCY = 'DKK'

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

interface Props {
  expenses: Expense[]
  budgetTotal: number
  onDelete: (id: string) => Promise<boolean>
  onUpdateBudget: (total: number) => Promise<boolean>
}

export default function BudgetSummary({ expenses, budgetTotal, onDelete, onUpdateBudget }: Props) {
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState(String(budgetTotal))

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const remaining = budgetTotal - totalSpent
  const pct = budgetTotal > 0 ? Math.min(totalSpent / budgetTotal, 1) : 0
  const barColor = pct < 0.6 ? '#7a8c55' : pct < 0.85 ? '#c8943a' : '#c85a3a'

  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = []
    acc[e.category].push(e)
    return acc
  }, {})

  const orderedCategories = CATEGORY_ORDER.filter((c) => grouped[c])

  const fmt = (n: number) =>
    n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const fmtDecimal = (n: number) =>
    Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleBudgetSave = async () => {
    const val = parseFloat(budgetInput.replace(',', '.'))
    if (isNaN(val) || val <= 0) {
      setEditingBudget(false)
      return
    }
    const saved = await onUpdateBudget(val)
    if (saved) setEditingBudget(false)
  }

  return (
    <div className="bg-card border border-warm-border rounded-2xl p-6 shadow-sm">
      {/* Remaining balance */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest font-medium text-muted mb-1">Remaining</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`font-playfair text-5xl font-bold ${remaining < 0 ? 'text-terracotta' : 'text-ink'}`}>
            <span className="align-baseline font-sans text-sm font-semibold uppercase tracking-widest text-muted mr-1.5">
              {CURRENCY}
            </span>
            {fmt(remaining)}
          </span>
          {editingBudget ? (
            <div className="flex items-center gap-1">
              <span className="text-muted text-sm">of {CURRENCY}</span>
              <input
                autoFocus
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={handleBudgetSave}
                onKeyDown={(e) => { if (e.key === 'Enter') handleBudgetSave(); if (e.key === 'Escape') setEditingBudget(false) }}
                className="w-24 text-sm border-b border-terracotta bg-transparent outline-none text-ink"
              />
            </div>
          ) : (
            <button
              onClick={() => { setEditingBudget(true); setBudgetInput(String(budgetTotal)) }}
              className="text-muted text-sm hover:text-ink transition-colors"
              title="Click to edit budget"
            >
              of {CURRENCY} {fmt(budgetTotal)}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-warm-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct * 100}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-muted">{CURRENCY} {fmt(totalSpent)} spent</span>
          <span className="text-xs text-muted">{Math.round(pct * 100)}%</span>
        </div>
      </div>

      {/* Expense list */}
      {orderedCategories.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-muted text-sm">No expenses yet</p>
          <p className="text-muted/60 text-xs mt-1">Add your first expense on the left</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orderedCategories.map((category) => {
            const items = grouped[category]
            const catTotal = items.reduce((s, e) => s + Number(e.amount), 0)
            return (
              <div key={category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-medium text-muted uppercase tracking-widest">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-xs font-semibold text-ink">{CURRENCY} {fmt(catTotal)}</span>
                </div>
                <div className="space-y-0.5">
                  {items.map((expense) => (
                    <div
                      key={expense.id}
                      className="group flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-parchment transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-ink truncate block">
                          {expense.note || <span className="text-muted italic">No note</span>}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-ink shrink-0 tabular-nums">
                        {CURRENCY} {fmtDecimal(expense.amount)}
                      </span>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-terracotta"
                        aria-label="Delete expense"
                      >
                        <XIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
