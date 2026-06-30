'use client'

import { useEffect, useRef, useState } from 'react'

function Spinner() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M4 12l6 6L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l10 18H2L12 3z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="12" y1="10" x2="12" y2="14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

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

  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted bg-warm-border/40 rounded-full px-2.5 py-1 animate-pop-in">
        <Spinner />
        Saving…
      </span>
    )
  }

  if (error) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-full px-2.5 py-1 animate-pop-in"
        title={error}
      >
        <WarnIcon />
        Save failed
      </span>
    )
  }

  if (showSaved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-olive bg-olive/10 rounded-full px-2.5 py-1 animate-pop-in">
        <CheckIcon />
        Saved
      </span>
    )
  }

  return null
}
