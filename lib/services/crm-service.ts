import { getConnection } from '@/lib/db/init'
import { getOrdersByCustomer } from '@/lib/services/order-service'
import { getRefundRequestsByCustomer, type Customer } from '@/lib/services/refund-service'

function rowToCustomer(row: Record<string, unknown>): Customer {
  return {
    customer_id: String(row.customer_id),
    name: String(row.name),
    email: String(row.email),
    join_date: String(row.join_date),
    total_orders: Number(row.total_orders),
    lifetime_spend: Number(row.lifetime_spend),
    previous_refunds: Number(row.previous_refunds),
  }
}

export function getCustomer(customerId: string): Customer | null {
  const row = getConnection()
    .prepare('SELECT * FROM customers WHERE customer_id = ?')
    .get(customerId.toUpperCase()) as Record<string, unknown> | undefined

  return row ? rowToCustomer(row) : null
}

export function getCustomerByEmail(email: string): Customer | null {
  const row = getConnection()
    .prepare('SELECT * FROM customers WHERE LOWER(email) = LOWER(?)')
    .get(email.trim()) as Record<string, unknown> | undefined

  return row ? rowToCustomer(row) : null
}

export function getCustomerHistory(customerId: string) {
  const customer = getCustomer(customerId)
  if (!customer) return null

  const orders = getOrdersByCustomer(customerId)
  const orderSummaries = orders.map((order) => ({
    order_id: order.order_id,
    status: order.status,
    order_date: order.order_date,
    order_total: order.order_total,
    refund_requested: order.refund_requested ?? false,
  }))

  const recentRefunds = getRefundRequestsByCustomer(customerId)

  return {
    customer: {
      customer_id: customer.customer_id,
      name: customer.name,
      email: customer.email,
      join_date: customer.join_date,
      total_orders: customer.total_orders,
      lifetime_spend: customer.lifetime_spend,
      previous_refunds: customer.previous_refunds,
    },
    orders: orderSummaries,
    recent_refunds: recentRefunds,
  }
}
