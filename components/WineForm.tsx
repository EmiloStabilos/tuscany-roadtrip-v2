'use client'

import { useState } from 'react'
import type { Wine } from '@/lib/supabase'

type WineType = Wine['type']

const TYPES: { id: WineType; label: string; color: string }[] = [
  { id: 'red',      label: 'Red',      color: '#6b2737' },
  { id: 'white',    label: 'White',    color: '#b8973a' },
  { id: 'rosé',     label: 'Rosé',     color: '#c87a8c' },
  { id: 'orange',   label: 'Orange',   color: '#c85a3a' },
  { id: 'sparkling',label: 'Sparkling',color: '#7a8c55' },
]

const RATING_LABEL: Record<number, string> = {
  0.5: 'Poor', 1: 'Poor',
  1.5: 'Fair', 2: 'Fair',
  2.5: 'Good', 3: 'Good',
  3.5: 'Great', 4: 'Great',
  4.5: 'Outstanding', 5: 'Outstanding',
}

interface Props {
  onAdd: (wine: Omit<Wine, 'id' | 'created_at'>) => Promise<boolean>
}

function StarIcon({ fill }: { fill: 'full' | 'half' | 'empty' }) {
  if (fill === 'full') return <span style={{ color: '#c85a3a' }}>★</span>
  if (fill === 'empty') return <span style={{ color: '#e0d5c5' }}>★</span>
  return (
    <span style={{ position: 'relative', display: 'inline-block', color: '#e0d5c5' }}>
      ★
      <span style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', width: '50%', color: '#c85a3a' }}>★</span>
    </span>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)

  const getFill = (star: number, display: number): 'full' | 'half' | 'empty' => {
    if (display >= star) return 'full'
    if (display >= star - 0.5) return 'half'
    return 'empty'
  }

  const resolveValue = (e: React.MouseEvent<HTMLButtonElement>, star: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return e.clientX - rect.left < rect.width / 2 ? star - 0.5 : star
  }

  const display = hovered || value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseMove={(e) => setHovered(resolveValue(e, star))}
          onMouseLeave={() => setHovered(0)}
          onClick={(e) => onChange(resolveValue(e, star))}
          className="text-2xl leading-none transition-transform hover:scale-110"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <StarIcon fill={getFill(star, display)} />
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-muted ml-1">{RATING_LABEL[value] ?? ''}</span>
      )}
    </div>
  )
}

export default function WineForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [producer, setProducer] = useState('')
  const [type, setType] = useState<WineType>('red')
  const [vintage, setVintage] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || rating === 0) return
    setLoading(true)
    try {
      const saved = await onAdd({
        name: name.trim(),
        producer: producer.trim() || null,
        type,
        vintage: vintage ? parseInt(vintage) : null,
        rating,
        notes: notes.trim() || null,
        location: location.trim() || null,
      })
      if (saved) {
        setName('')
        setProducer('')
        setType('red')
        setVintage('')
        setRating(0)
        setNotes('')
        setLocation('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-2">
          Type
        </label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                type === t.id ? 'text-white border-transparent' : 'text-muted border-warm-border hover:border-ink hover:text-ink'
              }`}
              style={type === t.id ? { backgroundColor: t.color } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name + Producer */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-1.5">
            Wine name <span className="text-terracotta">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Brunello di Montalcino…"
            className="w-full bg-parchment border border-warm-border rounded-xl px-3 py-2.5 text-ink text-sm outline-none focus:border-terracotta transition-colors placeholder:text-muted"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-1.5">
            Producer
          </label>
          <input
            type="text"
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
            placeholder="Biondi-Santi…"
            className="w-full bg-parchment border border-warm-border rounded-xl px-3 py-2.5 text-ink text-sm outline-none focus:border-terracotta transition-colors placeholder:text-muted"
          />
        </div>
      </div>

      {/* Vintage + Location */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-1.5">
            Vintage
          </label>
          <input
            type="number"
            value={vintage}
            onChange={(e) => setVintage(e.target.value)}
            placeholder="2021"
            min="1900"
            max="2026"
            className="w-full bg-parchment border border-warm-border rounded-xl px-3 py-2.5 text-ink text-sm outline-none focus:border-terracotta transition-colors placeholder:text-muted"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-1.5">
            Where
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Podere Terreno…"
            className="w-full bg-parchment border border-warm-border rounded-xl px-3 py-2.5 text-ink text-sm outline-none focus:border-terracotta transition-colors placeholder:text-muted"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-2">
          Rating <span className="text-terracotta">*</span>
        </label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest font-medium text-muted mb-1.5">
          Tasting notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Dark cherries, tobacco, long finish…"
          rows={3}
          className="w-full bg-parchment border border-warm-border rounded-xl px-3 py-2.5 text-ink text-sm outline-none focus:border-terracotta transition-colors placeholder:text-muted resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim() || rating === 0}
        className="w-full bg-wine text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving…' : 'Log Wine'}
      </button>
    </form>
  )
}
