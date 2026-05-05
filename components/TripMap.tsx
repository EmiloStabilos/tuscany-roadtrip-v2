'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from 'react-leaflet'
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
}

export default function TripMap({ stops, highlightedStopId }: Props) {
  const routePoints = stops.map((s) => [s.lat, s.lng] as [number, number])

  return (
    <div className="w-full h-full" style={{ filter: 'sepia(12%) saturate(85%) brightness(1.01)' }}>
      <MapContainer
        center={[43.2, 11.1]}
        zoom={8}
        style={{ width: '100%', height: '100%' }}
        zoomControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#6b2737', weight: 2, opacity: 0.45, dashArray: '5 7' }}
          />
        )}

        {stops.map((stop) => {
          const highlighted = stop.id === highlightedStopId
          return (
            <CircleMarker
              key={stop.id}
              center={[stop.lat, stop.lng]}
              radius={highlighted ? 11 : 7}
              pathOptions={{
                fillColor: TYPE_COLORS[stop.type] ?? '#c85a3a',
                color: 'white',
                weight: highlighted ? 2.5 : 2,
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span style={{ fontFamily: 'system-ui', fontSize: 12 }}>{stop.name}</span>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
