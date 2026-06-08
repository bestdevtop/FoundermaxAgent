'use client'

import { useEffect, useState } from 'react'
import { CloseIcon } from '@/components/Icons'

type Customer = {
  customer_id: string
  name: string
  email: string
  join_date: string
  total_orders: number
  lifetime_spend: number
  previous_refunds: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}

export function CustomerTableDialog({ isOpen, onClose }: Props) {
  const [customers, setCustomers] = useState<Customer[] | null>(null)
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

    fetch('/api/customers')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load customers')
        const data = (await res.json()) as { customers: Customer[] }
        if (!cancelled) setCustomers(data.customers)
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
        className="dialog-panel dialog-panel-data"
        role="dialog"
        aria-labelledby="customer-table-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="customer-table-title">Customer Table</h2>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>

        <div className="dialog-body">
          {loading && <p className="dialog-empty">Loading customers…</p>}
          {error && <p className="dialog-error">{error}</p>}
          {!loading && !error && customers && (
            <div className="dialog-data-table-wrap">
              <table className="dialog-data-table">
                <colgroup>
                  <col className="col-id" />
                  <col className="col-name" />
                  <col className="col-email" />
                  <col className="col-date" />
                  <col className="col-num" />
                  <col className="col-money" />
                  <col className="col-num" />
                </colgroup>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Join Date</th>
                    <th>Orders</th>
                    <th>Lifetime Spend</th>
                    <th>Refunds</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.customer_id}>
                      <td className="dialog-data-cell-compact">{customer.customer_id}</td>
                      <td className="dialog-data-cell-wrap">{customer.name}</td>
                      <td className="dialog-data-cell-wrap">{customer.email}</td>
                      <td className="dialog-data-cell-compact">{customer.join_date}</td>
                      <td className="dialog-data-cell-compact">{customer.total_orders}</td>
                      <td className="dialog-data-cell-compact">{formatCurrency(customer.lifetime_spend)}</td>
                      <td className="dialog-data-cell-compact">{customer.previous_refunds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
