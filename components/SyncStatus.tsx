'use client'

export default function SyncStatus({ saving }: { saving: boolean }) {
  return (
    <span className="text-xs text-muted tabular-nums transition-opacity duration-300">
      {saving ? (
        <span className="opacity-60">Saving…</span>
      ) : (
        <span className="opacity-40">Saved</span>
      )}
    </span>
  )
}
