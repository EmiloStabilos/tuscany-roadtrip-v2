'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
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

const TRIP_START = new Date('2026-07-06T00:00:00')
const TRIP_END = new Date('2026-07-13T00:00:00')

function useCountdown() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const msPerDay = 86400000
      if (now < TRIP_START) {
        const days = Math.ceil((TRIP_START.getTime() - now.getTime()) / msPerDay)
        setLabel(days === 0 ? "Today's the day" : days === 1 ? '1 day to go' : `${days} days to go`)
      } else if (now < TRIP_END) {
        const day = Math.floor((now.getTime() - TRIP_START.getTime()) / msPerDay) + 1
        setLabel(`On the road · Day ${day}`)
      } else {
        setLabel(null)
      }
    }
    update()
    const id = setInterval(update, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return label
}

function WineGlass({ flip }: { flip?: boolean }) {
  const gId = flip ? 'wg-r' : 'wg-l'
  const cId = flip ? 'wc-r' : 'wc-l'
  return (
    <svg viewBox="0 0 13 20" width="13" height="20" fill="none" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: `rotate(${flip ? 8 : -8}deg)`, transformOrigin: '50% 100%' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b2737" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#6b2737" stopOpacity="0.22" />
        </linearGradient>
        <clipPath id={cId}>
          <path d="M2 2.5 C-0.5 6 0 11 2.5 13.5 C4 15 5.5 15.5 6.5 15.5 C7.5 15.5 9 15 10.5 13.5 C13 11 13.5 6 11 2.5 Z" />
        </clipPath>
      </defs>
      <rect x="-2" y="0" width="17" height="17" fill={`url(#${gId})`} clipPath={`url(#${cId})`} />
      <path d="M3.5 5 Q4.2 3.4 5.2 4.2" stroke="white" strokeOpacity="0.45" strokeWidth="0.75" fill="none" />
      <line x1="2" y1="2.5" x2="11" y2="2.5" stroke="#c85a3a" strokeWidth="1.2" />
      <path d="M2 2.5 C-0.5 6 0 11 2.5 13.5 C4 15 5.5 15.5 6.5 15.5" stroke="#c85a3a" strokeWidth="1.2" fill="none" />
      <path d="M11 2.5 C13.5 6 13 11 10.5 13.5 C9 15 7.5 15.5 6.5 15.5" stroke="#c85a3a" strokeWidth="1.2" fill="none" />
      <line x1="6.5" y1="15.5" x2="6.5" y2="18.5" stroke="#c85a3a" strokeWidth="0.9" />
      <line x1="3" y1="18.5" x2="10" y2="18.5" stroke="#c85a3a" strokeWidth="1.2" />
    </svg>
  )
}

type Tab = 'overview' | 'budget' | 'wines'

const TABS: Tab[] = ['overview', 'budget', 'wines']

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Trip Overview',
  budget: 'Budget',
  wines: 'Wine Journal',
}

const MOBILE_TAB_LABELS: Record<Tab, string> = {
  overview: 'Map',
  budget: 'Budget',
  wines: 'Wines',
}

function SkeletonOverview() {
  return (
    <div className="mt-6 animate-fade-in">
      <div className="rounded-2xl skeleton border border-warm-border" style={{ height: '55vh', minHeight: 320 }} />
      <div className="space-y-2 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl skeleton" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  )
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
  const [loading, setLoading] = useState(true)

  const countdown = useCountdown()

  const desktopRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  const [desktopIndicator, setDesktopIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const update = () => {
      const el = desktopRefs.current[tab]
      if (el) setDesktopIndicator({ left: el.offsetLeft, width: el.offsetWidth })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [tab])

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
      setLoading(false)
    }).catch(() => setLoading(false))
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
      <header className="sticky top-0 z-40 bg-parchment/90 backdrop-blur-md border-b border-warm-border animate-fade-in">
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
              <span className="text-terracotta mx-1 inline-block animate-pulse">♥</span>
              <span className="text-terracotta font-medium">Sarah</span>
            </p>
          </div>

          {/* Desktop tabs with sliding underline */}
          <nav className="hidden md:flex items-center gap-8 relative">
            {TABS.map((t) => (
              <button
                key={t}
                ref={(el) => { desktopRefs.current[t] = el }}
                onClick={() => setTab(t)}
                className={`text-sm font-medium pb-2 transition-colors duration-200 cursor-pointer ${
                  tab === t ? 'text-terracotta' : 'text-muted hover:text-ink'
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
            <span
              className="absolute bottom-0 h-[2px] bg-terracotta rounded-full transition-all duration-300 ease-out"
              style={{ left: desktopIndicator.left, width: desktopIndicator.width }}
            />
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {countdown && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-full px-3 py-1 animate-pop-in">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
                {countdown}
              </span>
            )}
            {/* Wine glasses — decorative, mobile only */}
            <div className="md:hidden flex items-start shrink-0" aria-hidden>
              <WineGlass />
              <span className="text-terracotta text-[8px] animate-pulse" style={{ marginTop: '1px' }}>♥</span>
              <WineGlass flip />
            </div>
            <div className="hidden md:block">
              <SyncStatus saving={saving} error={saveError} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-[1100px] mx-auto px-6 pb-28 md:pb-12">
        {tab === 'overview' && (
          loading ? (
            <SkeletonOverview />
          ) : (
            <div key="overview" className="animate-fade-in-up">
              <div
                className="mt-6 rounded-2xl overflow-hidden border border-warm-border shadow-sm transition-shadow duration-300 hover:shadow-md"
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
            </div>
          )
        )}

        {tab === 'budget' && (
          <div key="budget" className="mt-8 grid md:grid-cols-2 gap-6 animate-fade-in-up">
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
          <div key="wines" className="mt-8 animate-fade-in-up">
            <div className="mb-6">
              <h2 className="font-playfair text-3xl font-bold text-ink">Wine Journal</h2>
              <p className="text-muted text-sm mt-1">Every bottle worth remembering from Tuscany</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border border-warm-border rounded-2xl p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-parchment/90 backdrop-blur-md border-t border-warm-border">
        <div className="relative flex">
          <span
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-terracotta/10 transition-all duration-300 ease-out"
            style={{ left: `calc(${TABS.indexOf(tab)} * 100% / 3 + 6px)`, width: `calc(100% / 3 - 12px)` }}
          />
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex-1 py-3.5 text-xs font-medium transition-colors duration-200 active:scale-95 ${
                tab === t ? 'text-terracotta' : 'text-muted'
              }`}
            >
              {MOBILE_TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
