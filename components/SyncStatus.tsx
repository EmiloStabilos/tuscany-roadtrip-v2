'use client'

import { useEffect, useRef, useState } from 'react'

export default function SyncStatus({ saving, error }: { saving: boolean; error: string | null }) {
  const [showSaved, setShowSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSaving = useRef(false)

  useEffect(() => {
    if (prevSaving.current && !saving && !error) {
      setShowSaved(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setShowSaved(false), 2000)
    }
    prevSaving.current = saving
  }, [saving, error])

  if (saving) return <span className="text-xs text-muted opacity-60">Saving…</span>
  if (error) return <span className="text-xs text-terracotta" title={error}>Save failed</span>
  if (showSaved) return <span className="text-xs text-muted opacity-40">Saved</span>
  return null
}
