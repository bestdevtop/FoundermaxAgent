import fs from 'fs'
import { DATA_DIR } from '@/lib/paths'

const ORDERS_PATH = `${DATA_DIR}/orders.json`

export type Order = {
  order_id: string
  customer_id: string
  items: Array<{ product: string; price: number; quantity: number }>
  order_total: number
  order_date: string
  delivery_date: string
  status: string
  tracking_number: string
  payment_method: string
  refund_requested: boolean
}

let orders: Order[] | null = null

function loadOrders(): Order[] {
  if (orders === null) {
    orders = JSON.parse(fs.readFileSync(ORDERS_PATH, 'utf-8')) as Order[]
  }
  return orders
}

export function initOrders(): void {
  loadOrders()
}

export function getOrder(orderId: string): Order | null {
  const normalized = orderId.toUpperCase()
  return loadOrders().find((order) => order.order_id === normalized) ?? null
}

export function getOrdersByCustomer(customerId: string): Order[] {
  const normalized = customerId.toUpperCase()
  return loadOrders().filter((order) => order.customer_id === normalized)
}

export function getAllOrders(): Order[] {
  return [...loadOrders()].sort((a, b) => b.order_date.localeCompare(a.order_date))
}

export function markOrderRefundRequested(orderId: string): boolean {
  const normalized = orderId.toUpperCase()
  const order = loadOrders().find((o) => o.order_id === normalized)
  if (!order) return false
  order.refund_requested = true
  return true
}
