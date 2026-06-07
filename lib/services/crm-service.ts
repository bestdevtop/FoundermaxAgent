import {
  getCustomer,
  getCustomerByEmail,
  type Customer,
} from '@/lib/services/customer-service'
import { getOrdersByCustomer } from '@/lib/services/order-service'
import { getRefundRequestsByCustomer } from '@/lib/services/refund-service'

export { getCustomer, getCustomerByEmail, type Customer }

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
