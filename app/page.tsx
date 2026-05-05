'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import dynamicImport from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { Stop, Expense } from '@/lib/supabase'
import StopList from '@/components/StopList'
import BudgetForm from '@/components/BudgetForm'
import BudgetSummary from '@/components/BudgetSummary'
import SyncStatus from '@/components/SyncStatus'

const TripMap = dynamicImport(() => import('@/components/TripMap'), { ssr: false })

type Tab = 'overview' | 'budget'

export default function Page() {
  const [tab, setTab] = useState<Tab>('overview')
  const [stops, setStops] = useState<Stop[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgetTotal, setBudgetTotal] = useState(5000)
  const [highlightedStopId, setHighlightedStopId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('stops').select('*').order('position'),
      supabase.from('expenses').select('*').order('created_at'),
      supabase.from('config').select('budget_total').eq('id', 1).single(),
    ]).then(([stopsRes, expensesRes, configRes]) => {
      if (stopsRes.data) setStops(stopsRes.data as Stop[])
      if (expensesRes.data) setExpenses(expensesRes.data as Expense[])
      if (configRes.data) setBudgetTotal(configRes.data.budget_total)
    })
  }, [])

  const withSave = async (fn: () => Promise<void>) => {
    setSaving(true)
    setSaveError(null)
    try {
      await fn()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save changes'
      setSaveError(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  const addStop = (stop: Omit<Stop, 'id' | 'created_at'>) =>
    withSave(async () => {
      const { data, error } = await supabase.from('stops').insert(stop).select().single()
      if (error) throw error
      if (data) setStops((prev) => [...prev, data as Stop].sort((a, b) => a.position - b.position))
    })

  const deleteStop = (id: string) =>
    withSave(async () => {
      const { error } = await supabase.from('stops').delete().eq('id', id)
      if (error) throw error
      setStops((prev) => prev.filter((s) => s.id !== id))
    })

  const addExpense = (expense: Omit<Expense, 'id' | 'created_at'>) =>
    withSave(async () => {
      const { data, error } = await supabase.from('expenses').insert(expense).select().single()
      if (error) throw error
      if (data) setExpenses((prev) => [...prev, data as Expense])
    })

  const deleteExpense = (id: string) =>
    withSave(async () => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    })

  const updateBudget = (total: number) =>
    withSave(async () => {
      const { error } = await supabase.from('config').update({ budget_total: total }).eq('id', 1)
      if (error) throw error
      setBudgetTotal(total)
    })

  return (
    <div className="min-h-screen bg-parchment text-ink font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-parchment/95 backdrop-blur-sm border-b border-warm-border">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="shrink-0">
            <h1 className="font-playfair text-xl font-bold text-ink tracking-tight leading-none">
              Tuscany
            </h1>
            <p className="text-muted text-[10px] tracking-[0.12em] uppercase mt-0.5">
              6 – 12 July 2026
            </p>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-8">
            {(['overview', 'budget'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-sm font-medium pb-0.5 border-b-2 transition-colors ${
                  tab === t
                    ? 'border-terracotta text-terracotta'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {t === 'overview' ? 'Trip Overview' : 'Budget'}
              </button>
            ))}
          </nav>

          <SyncStatus saving={saving} error={saveError} />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-[1100px] mx-auto px-6 pb-28 md:pb-12">
        {tab === 'overview' ? (
          <>
            {/* Map */}
            <div
              className="mt-6 rounded-2xl overflow-hidden border border-warm-border shadow-sm"
              style={{ height: '55vh', minHeight: 320 }}
            >
              <TripMap stops={stops} highlightedStopId={highlightedStopId} />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 mb-5 px-1">
              {[
                { type: 'city',          label: 'Town / City',     color: '#c85a3a' },
                { type: 'accommodation', label: 'Accommodation',   color: '#6b2737' },
                { type: 'winery',        label: 'Winery',          color: '#8a5a8c' },
                { type: 'sight',         label: 'Sight',           color: '#7a8c55' },
                { type: 'beach',         label: 'Beach',           color: '#5a8a8c' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-muted">{label}</span>
                </div>
              ))}
            </div>

            {/* Stop list */}
            <StopList
              stops={stops}
              highlightedStopId={highlightedStopId}
              onHover={setHighlightedStopId}
              onDelete={deleteStop}
              onAdd={addStop}
            />
          </>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <BudgetForm onAdd={addExpense} />
            <BudgetSummary
              expenses={expenses}
              budgetTotal={budgetTotal}
              onDelete={deleteExpense}
              onUpdateBudget={updateBudget}
            />
          </div>
        )}
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-parchment/95 backdrop-blur-sm border-t border-warm-border">
        <div className="flex">
          {(['overview', 'budget'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                tab === t ? 'text-terracotta' : 'text-muted'
              }`}
            >
              {t === 'overview' ? 'Trip Overview' : 'Budget'}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
