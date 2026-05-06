'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import dynamicImport from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { Stop, Expense, Wine } from '@/lib/supabase'
import StopList from '@/components/StopList'
import BudgetForm from '@/components/BudgetForm'
import BudgetSummary from '@/components/BudgetSummary'
import WineForm from '@/components/WineForm'
import WineList from '@/components/WineList'
import SyncStatus from '@/components/SyncStatus'

const TripMap = dynamicImport(() => import('@/components/TripMap'), { ssr: false })

type Tab = 'overview' | 'budget' | 'wines'

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Trip Overview',
  budget: 'Budget',
  wines: 'Wine Journal',
}

export default function Page() {
  const [tab, setTab] = useState<Tab>('overview')
  const [stops, setStops] = useState<Stop[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [wines, setWines] = useState<Wine[]>([])
  const [budgetTotal, setBudgetTotal] = useState(5000)
  const [highlightedStopId, setHighlightedStopId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('stops').select('*').order('position'),
      supabase.from('expenses').select('*').order('created_at'),
      supabase.from('config').select('budget_total').eq('id', 1).single(),
      supabase.from('wines').select('*').order('created_at', { ascending: false }),
    ]).then(([stopsRes, expensesRes, configRes, winesRes]) => {
      if (stopsRes.data) setStops(stopsRes.data as Stop[])
      if (expensesRes.data) setExpenses(expensesRes.data as Expense[])
      if (configRes.data) setBudgetTotal(configRes.data.budget_total)
      if (winesRes.data) setWines(winesRes.data as Wine[])
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

  const addWine = (wine: Omit<Wine, 'id' | 'created_at'>) =>
    withSave(async () => {
      const { data, error } = await supabase.from('wines').insert(wine).select().single()
      if (error) throw error
      if (data) setWines((prev) => [data as Wine, ...prev])
    })

  const deleteWine = (id: string) =>
    withSave(async () => {
      const { error } = await supabase.from('wines').delete().eq('id', id)
      if (error) throw error
      setWines((prev) => prev.filter((w) => w.id !== id))
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
            <p className="text-[10px] mt-0.5 tracking-wide">
              <span className="text-terracotta font-medium">Emil</span>
              <span className="text-terracotta mx-1">♥</span>
              <span className="text-terracotta font-medium">Sarah</span>
            </p>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-8">
            {(['overview', 'budget', 'wines'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-sm font-medium pb-0.5 border-b-2 transition-colors ${
                  tab === t
                    ? 'border-terracotta text-terracotta'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </nav>

          {/* Clinking wine glasses — decorative, mobile only */}
          <div className="md:hidden flex items-end gap-1 shrink-0" aria-hidden>
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#c85a3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-12deg)', transformOrigin: 'bottom center' }}>
              <path d="M8 3h8c0 0 2 5 2 8 0 4-3 6-6 6s-6-2-6-6c0-3 2-8 2-8z"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
              <line x1="9" y1="21" x2="15" y2="21"/>
            </svg>
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#c85a3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(12deg)', transformOrigin: 'bottom center' }}>
              <path d="M8 3h8c0 0 2 5 2 8 0 4-3 6-6 6s-6-2-6-6c0-3 2-8 2-8z"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
              <line x1="9" y1="21" x2="15" y2="21"/>
            </svg>
          </div>
          <div className="hidden md:block">
            <SyncStatus saving={saving} error={saveError} />
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-[1100px] mx-auto px-6 pb-28 md:pb-12">
        {tab === 'overview' && (
          <>
            <div
              className="mt-6 rounded-2xl overflow-hidden border border-warm-border shadow-sm"
              style={{ height: '55vh', minHeight: 320 }}
            >
              <TripMap stops={stops} highlightedStopId={highlightedStopId} />
            </div>

            <div className="flex flex-wrap gap-4 mt-3 mb-5 px-1">
              {[
                { label: 'Town / City',   color: '#c85a3a' },
                { label: 'Accommodation', color: '#6b2737' },
                { label: 'Winery',        color: '#8a5a8c' },
                { label: 'Sight',         color: '#7a8c55' },
                { label: 'Beach',         color: '#5a8a8c' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-muted">{label}</span>
                </div>
              ))}
            </div>

            <StopList
              stops={stops}
              highlightedStopId={highlightedStopId}
              onHover={setHighlightedStopId}
              onDelete={deleteStop}
            />
          </>
        )}

        {tab === 'budget' && (
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

        {tab === 'wines' && (
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="font-playfair text-3xl font-bold text-ink">Wine Journal</h2>
              <p className="text-muted text-sm mt-1">Every bottle worth remembering from Tuscany</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border border-warm-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-playfair text-xl font-semibold text-ink mb-5">Log a Wine</h3>
                <WineForm onAdd={addWine} />
              </div>
              <div>
                <WineList wines={wines} onDelete={deleteWine} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-parchment/95 backdrop-blur-sm border-t border-warm-border">
        <div className="flex">
          {(['overview', 'budget', 'wines'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-xs font-medium transition-colors ${
                tab === t ? 'text-terracotta' : 'text-muted'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
