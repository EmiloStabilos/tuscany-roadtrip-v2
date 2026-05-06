import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Stop = {
  id: string
  position: number
  name: string
  note: string
  type: 'city' | 'accommodation' | 'sight' | 'beach' | 'winery'
  lat: number
  lng: number
  google_maps_url: string | null
  day_label: string | null
  created_at: string
}

export type Wine = {
  id: string
  name: string
  producer: string | null
  type: 'red' | 'white' | 'rosé' | 'orange' | 'sparkling'
  vintage: number | null
  rating: number | null
  notes: string | null
  location: string | null
  created_at: string
}

export type Expense = {
  id: string
  category: 'lodging' | 'food' | 'wine' | 'transport' | 'activities' | 'misc'
  amount: number
  note: string
  created_at: string
}
