'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
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
  const [roadRoute, setRoadRoute] = useState<[number, number][]>([])

  useEffect(() => {
    if (stops.length < 2) { setRoadRoute([]); return }

    const controller = new AbortController()
    const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';')
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        const coords = data?.routes?.[0]?.geometry?.coordinates
        if (coords) {
          setRoadRoute(coords.map(([lng, lat]: [number, number]) => [lat, lng]))
        } else {
          setRoadRoute(stops.map((s) => [s.lat, s.lng]))
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        // fall back to straight lines if OSRM is unavailable
        setRoadRoute(stops.map((s) => [s.lat, s.lng]))
      })

    return () => controller.abort()
  }, [stops])

  const fallbackRoute = stops.map((s) => [s.lat, s.lng] as [number, number])
  const displayRoute = roadRoute.length > 0 ? roadRoute : fallbackRoute

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

        {displayRoute.length > 1 && (
          <Polyline
            positions={displayRoute}
            pathOptions={{
              color: '#6b2737',
              weight: roadRoute.length > 0 ? 2.5 : 2,
              opacity: 0.55,
              dashArray: roadRoute.length > 0 ? undefined : '5 7',
            }}
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
