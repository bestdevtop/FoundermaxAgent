'use client'

import { useEffect, useState } from 'react'
import { CloseIcon } from '@/components/Icons'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function RefundPolicyDialog({ isOpen, onClose }: Props) {
  const [policy, setPolicy] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/policy')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load refund policy')
        const data = (await res.json()) as { policy: string }
        if (!cancelled) setPolicy(data.policy)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="dialog-panel dialog-panel-wide"
        role="dialog"
        aria-labelledby="refund-policy-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="refund-policy-title">Refund & Return Policy</h2>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>

        <div className="dialog-body">
          {loading && <p className="dialog-empty">Loading policy…</p>}
          {error && <p className="dialog-error">{error}</p>}
          {!loading && !error && policy && <pre className="dialog-policy">{policy}</pre>}
        </div>
      </div>
    </div>
  )
}
