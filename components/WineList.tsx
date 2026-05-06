'use client'

import type { Wine } from '@/lib/supabase'

const TYPE_STYLES: Record<string, { color: string; label: string }> = {
  red:      { color: '#6b2737', label: 'Red' },
  white:    { color: '#b8973a', label: 'White' },
  rosé:     { color: '#c87a8c', label: 'Rosé' },
  orange:   { color: '#c85a3a', label: 'Orange' },
  sparkling:{ color: '#7a8c55', label: 'Sparkling' },
}

const RATING_LABEL = ['', 'Poor', 'Fair', 'Good', 'Great', 'Outstanding']

interface Props {
  wines: Wine[]
  onDelete: (id: string) => Promise<boolean>
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: rating >= s ? '#c85a3a' : '#e0d5c5' }} className="text-base leading-none">
          ★
        </span>
      ))}
      <span className="text-[11px] text-muted ml-1.5">{RATING_LABEL[rating]}</span>
    </div>
  )
}

export default function WineList({ wines, onDelete }: Props) {
  if (wines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl mb-3">🍷</p>
        <p className="font-playfair text-lg text-ink">No wines logged yet</p>
        <p className="text-muted text-sm mt-1">Your Tuscan tasting notes will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {wines.map((wine) => {
        const typeStyle = TYPE_STYLES[wine.type] ?? TYPE_STYLES.red
        return (
          <div
            key={wine.id}
            className="group bg-card border border-warm-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {/* Colour dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0 mt-1.5"
                  style={{ backgroundColor: typeStyle.color }}
                />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-playfair text-base font-bold text-ink leading-snug">
                      {wine.name}
                    </h3>
                    {wine.vintage && (
                      <span className="text-xs text-muted font-medium">{wine.vintage}</span>
                    )}
                  </div>
                  {wine.producer && (
                    <p className="text-xs text-muted mt-0.5">{wine.producer}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Type badge */}
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white shrink-0"
                  style={{ backgroundColor: typeStyle.color }}
                >
                  {typeStyle.label}
                </span>
                <button
                  onClick={() => onDelete(wine.id)}
                  className="opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 -m-1.5 text-muted hover:text-terracotta"
                  aria-label="Delete wine"
                >
                  <XIcon />
                </button>
              </div>
            </div>

            {/* Rating */}
            {wine.rating && (
              <div className="mt-3">
                <Stars rating={wine.rating} />
              </div>
            )}

            {/* Notes */}
            {wine.notes && (
              <p className="text-sm text-muted mt-2.5 leading-relaxed italic">
                &ldquo;{wine.notes}&rdquo;
              </p>
            )}

            {/* Location */}
            {wine.location && (
              <p className="text-[11px] text-muted/60 mt-2.5 uppercase tracking-wider">
                📍 {wine.location}
              </p>
            )}

            {/* Quick lookup */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-warm-border">
              <span className="text-[10px] uppercase tracking-widest text-muted/50 font-medium">Look up</span>
              <a
                href={`https://www.vivino.com/search/wines?q=${encodeURIComponent([wine.name, wine.producer].filter(Boolean).join(' '))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-muted hover:text-terracotta transition-colors"
              >
                Vivino ↗
              </a>
              <a
                href={`https://www.wine-searcher.com/find/${encodeURIComponent([wine.name, wine.producer].filter(Boolean).join('+'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-muted hover:text-terracotta transition-colors"
              >
                Wine Searcher ↗
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
