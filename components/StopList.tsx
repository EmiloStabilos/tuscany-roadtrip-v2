'use client'

import type { Stop } from '@/lib/supabase'

const TYPE_COLORS: Record<string, string> = {
  city: '#c85a3a',
  accommodation: '#6b2737',
  sight: '#7a8c55',
  beach: '#5a8a8c',
  winery: '#8a5a8c',
}

interface Props {
  stops: Stop[]
  highlightedStopId: string | null
  onHover: (id: string | null) => void
  onDelete: (id: string) => Promise<boolean>
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

type StopGroup = {
  dayLabel: string | null
  accommodation: Stop | null
  before: Stop[]  // en-route stops arriving at accommodation
  after: Stop[]   // day trips departing from accommodation
}

// Parse "Day 4 · Jul 9" → [4,4], "Days 5–6 · Jul 10–11" → [5,6]
function dayRange(label: string | null): [number, number] {
  if (!label) return [0, 0]
  const single = label.match(/^Day (\d+)/)
  if (single) { const d = parseInt(single[1]); return [d, d] }
  const range = label.match(/^Days (\d+)[–\-](\d+)/)
  if (range) return [parseInt(range[1]), parseInt(range[2])]
  return [0, 0]
}

function dayFitsInAccommodation(stopLabel: string | null, accLabel: string | null) {
  const [d] = dayRange(stopLabel)
  const [s, e] = dayRange(accLabel)
  return s > 0 && d >= s && d <= e
}

function buildGroups(stops: Stop[]): StopGroup[] {
  const groups: StopGroup[] = []
  let current: StopGroup | null = null

  for (const stop of stops) {
    if (stop.type === 'accommodation') {
      // Any stops we were tentatively collecting as "after" the previous
      // accommodation are actually en-route to this one — steal them back.
      const stolen = current?.after ?? []
      if (current) current.after = []

      current = { dayLabel: stop.day_label, accommodation: stop, before: stolen, after: [] }
      groups.push(current)
    } else {
      if (current) {
        current.after.push(stop)
      }
      // Stops before the first accommodation are ignored (none in this itinerary)
    }
  }

  // After the last accommodation, split trailing stops:
  // those within the accommodation's day range are true day trips (stay in after),
  // those outside form a standalone final group.
  if (current && current.after.length > 0) {
    const dayTrips: Stop[] = []
    const standalone: Stop[] = []
    for (const s of current.after) {
      if (dayFitsInAccommodation(s.day_label, current.dayLabel)) {
        dayTrips.push(s)
      } else {
        standalone.push(s)
      }
    }
    current.after = dayTrips
    if (standalone.length > 0) {
      groups.push({ dayLabel: standalone[0].day_label, accommodation: null, before: standalone, after: [] })
    }
  }

  return groups
}

function StopRow({
  stop,
  highlighted,
  onHover,
  onDelete,
}: {
  stop: Stop
  highlighted: boolean
  onHover: (id: string | null) => void
  onDelete: (id: string) => Promise<boolean>
}) {
  return (
    <div
      onMouseEnter={() => onHover(stop.id)}
      onMouseLeave={() => onHover(null)}
      className={`group flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-150 ${
        highlighted
          ? 'bg-card border-warm-border shadow-sm'
          : 'border-transparent hover:bg-card hover:border-warm-border'
      }`}
    >
      <div className="mt-[7px] shrink-0">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[stop.type] ?? '#c85a3a' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-playfair text-sm font-semibold text-ink leading-snug">{stop.name}</p>
        {stop.note && <p className="text-muted text-xs mt-0.5 leading-relaxed">{stop.note}</p>}
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
  )
}

export default function StopList({ stops, highlightedStopId, onHover, onDelete }: Props) {
  const groups = buildGroups(stops)

  return (
    <div className="space-y-8">
      {groups.map((group, gi) => (
        <div key={gi}>
          {/* Day / period label */}
          {group.dayLabel && (
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-terracotta whitespace-nowrap">
                {group.dayLabel}
              </span>
              <div className="flex-1 h-px bg-warm-border" />
            </div>
          )}

          <div className="space-y-1">
            {/* En-route stops — shown above accommodation */}
            {group.before.map((stop) => (
              <StopRow
                key={stop.id}
                stop={stop}
                highlighted={highlightedStopId === stop.id}
                onHover={onHover}
                onDelete={onDelete}
              />
            ))}

            {/* Accommodation — prominent card */}
            {group.accommodation && (
              <div className="bg-card border border-warm-border rounded-2xl shadow-sm">
                <StopRow
                  stop={group.accommodation}
                  highlighted={highlightedStopId === group.accommodation.id}
                  onHover={onHover}
                  onDelete={onDelete}
                />
              </div>
            )}

            {/* Day-trip stops — shown below accommodation, indented */}
            {group.after.length > 0 && (
              <div className="ml-5 pl-4 border-l-2 border-warm-border space-y-0.5 pt-0.5">
                {group.after.map((stop) => (
                  <StopRow
                    key={stop.id}
                    stop={stop}
                    highlighted={highlightedStopId === stop.id}
                    onHover={onHover}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
