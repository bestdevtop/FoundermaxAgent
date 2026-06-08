'use client'

import { useEffect, useState } from 'react'
import { CloseIcon } from '@/components/Icons'

type Order = {
  order_id: string
  customer_id: string
  items: Array<{ product: string; price: number; quantity: number }>
  order_total: number
  order_date: string
  delivery_date: string
  status: string
  refund_requested: boolean
}

type Props = {
  isOpen: boolean
  onClose: () => void
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}

function formatOrderItems(items: Order['items']): string {
  return items.map((item) => `${item.product} (×${item.quantity})`).join(', ')
}

export function OrderHistoryDialog({ isOpen, onClose }: Props) {
  const [orders, setOrders] = useState<Order[] | null>(null)
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

    fetch('/api/orders')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load orders')
        const data = (await res.json()) as { orders: Order[] }
        if (!cancelled) setOrders(data.orders)
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
        aria-labelledby="order-history-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="order-history-title">Order History</h2>
          <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>

        <div className="dialog-body">
          {loading && <p className="dialog-empty">Loading orders…</p>}
          {error && <p className="dialog-error">{error}</p>}
          {!loading && !error && orders && (
            <div className="dialog-data-table-wrap">
              <table className="dialog-data-table">
                <colgroup>
                  <col className="col-id" />
                  <col className="col-id" />
                  <col className="col-items" />
                  <col className="col-money" />
                  <col className="col-date" />
                  <col className="col-date" />
                  <col className="col-status" />
                  <col className="col-num" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Order Date</th>
                    <th>Delivery</th>
                    <th>Status</th>
                    <th>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id}>
                      <td className="dialog-data-cell-compact">{order.order_id}</td>
                      <td className="dialog-data-cell-compact">{order.customer_id}</td>
                      <td className="dialog-data-cell-wrap">{formatOrderItems(order.items)}</td>
                      <td className="dialog-data-cell-compact">{formatCurrency(order.order_total)}</td>
                      <td className="dialog-data-cell-compact">{order.order_date}</td>
                      <td className="dialog-data-cell-compact">{order.delivery_date}</td>
                      <td className="dialog-data-cell-wrap">{order.status}</td>
                      <td className="dialog-data-cell-compact">{order.refund_requested ? 'Yes' : 'No'}</td>
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
