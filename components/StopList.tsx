'use client'

import { useState, useRef } from 'react'
import type { Stop } from '@/lib/supabase'

const TYPE_COLORS: Record<string, string> = {
  city: '#c85a3a',
  accommodation: '#6b2737',
  sight: '#7a8c55',
  beach: '#5a8a8c',
  winery: '#8a5a8c',
}

interface GeoResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface Props {
  stops: Stop[]
  highlightedStopId: string | null
  onHover: (id: string | null) => void
  onDelete: (id: string) => Promise<boolean>
  onAdd: (stop: Omit<Stop, 'id' | 'created_at'>) => Promise<boolean>
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.85"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function StopList({ stops, highlightedStopId, onHover, onDelete, onAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleQuery = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&countrycodes=it`,
          { headers: { 'Accept-Language': 'en' } }
        )
        setResults(await res.json())
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const handleSelect = async (result: GeoResult) => {
    const name = result.display_name.split(',')[0].trim()
    const nextPosition = stops.reduce((max, stop) => Math.max(max, stop.position), 0) + 1
    const saved = await onAdd({
      position: nextPosition,
      name,
      note: '',
      type: 'city',
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      google_maps_url: null,
    })
    if (!saved) return
    setAdding(false)
    setQuery('')
    setResults([])
  }

  const cancelAdding = () => {
    setAdding(false)
    setQuery('')
    setResults([])
  }

  return (
    <div className="space-y-1">
      {stops.map((stop) => (
        <div
          key={stop.id}
          onMouseEnter={() => onHover(stop.id)}
          onMouseLeave={() => onHover(null)}
          className={`group flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-150 ${
            highlightedStopId === stop.id
              ? 'bg-card border-warm-border shadow-sm'
              : 'border-transparent hover:bg-card hover:border-warm-border'
          }`}
        >
          <div className="mt-[7px] shrink-0">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[stop.type] ?? '#c85a3a' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-playfair text-sm font-semibold text-ink leading-snug">{stop.name}</p>
            {stop.note && (
              <p className="text-muted text-xs mt-0.5 leading-relaxed">{stop.note}</p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {stop.google_maps_url && (
              <a
                href={stop.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 -m-1.5 text-muted hover:text-olive transition-colors"
                aria-label={`Open ${stop.name} in Google Maps`}
                onClick={(e) => e.stopPropagation()}
              >
                <MapPinIcon />
              </a>
            )}
            <button
              onClick={() => onDelete(stop.id)}
              className="p-1.5 -m-1.5 text-muted hover:text-terracotta transition-colors"
              aria-label={`Remove ${stop.name}`}
            >
              <XIcon />
            </button>
          </div>
        </div>
      ))}

      {adding ? (
        <div className="relative px-4 py-3 rounded-xl border border-warm-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-muted shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && cancelAdding()}
              placeholder="Search for a place in Italy…"
              className="flex-1 text-sm bg-transparent outline-none text-ink placeholder:text-muted"
            />
            <button
              onClick={cancelAdding}
              className="text-xs text-muted hover:text-ink transition-colors shrink-0"
            >
              Cancel
            </button>
          </div>

          {searching && (
            <p className="text-xs text-muted mt-2 pl-[22px]">Searching…</p>
          )}

          {results.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 bg-card border border-warm-border rounded-xl shadow-lg z-20 overflow-hidden">
              {results.map((r) => {
                const parts = r.display_name.split(',')
                return (
                  <li key={r.place_id}>
                    <button
                      onClick={() => handleSelect(r)}
                      className="w-full text-left px-4 py-2.5 hover:bg-parchment transition-colors"
                    >
                      <span className="text-sm font-medium text-ink">{parts[0]}</span>
                      {parts.length > 1 && (
                        <span className="text-xs text-muted ml-1.5">{parts.slice(1, 3).join(',').trim()}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-warm-border text-muted hover:text-terracotta hover:border-terracotta transition-colors mt-1"
        >
          <PlusIcon />
          <span className="text-sm">Add a stop</span>
        </button>
      )}
    </div>
  )
}
