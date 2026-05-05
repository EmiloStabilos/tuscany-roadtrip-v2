'use client'

export default function SyncStatus({ saving, error }: { saving: boolean; error: string | null }) {
  return (
    <span
      className="text-xs text-muted tabular-nums transition-opacity duration-300"
      title={error ?? undefined}
      role={error ? 'status' : undefined}
    >
      {saving ? (
        <span className="opacity-60">Saving…</span>
      ) : error ? (
        <span className="text-terracotta">Save failed</span>
      ) : (
        <span className="opacity-40">Saved</span>
      )}
    </span>
  )
}
