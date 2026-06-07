'use client'

import { useEffect } from 'react'
import { CloseIcon } from '@/components/Icons'

type Props = {
  isOpen: boolean
  onClose: () => void
  log: string[]
}

export function BackendLogDialog({ isOpen, onClose, log }: Props) {
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hasLog = log.length > 0

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="dialog-panel"
        role="dialog"
        aria-labelledby="backend-log-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="backend-log-title">Backend Execution Log</h2>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>

        <div className="dialog-body">
          {hasLog ? (
            <pre className="dialog-log">{log.join('\n')}</pre>
          ) : (
            <p className="dialog-empty">
              Send a message to see how the backend processes your request.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
