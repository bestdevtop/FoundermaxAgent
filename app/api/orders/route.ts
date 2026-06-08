import { NextResponse } from 'next/server'
import { getAllOrders } from '@/lib/services/order-service'
import { getRefundRequestedOrderIds } from '@/lib/services/refund-service'

export const runtime = 'nodejs'

export async function GET() {
  const refundOrderIds = getRefundRequestedOrderIds()
  const orders = getAllOrders().map((order) => ({
    ...order,
    refund_requested: order.refund_requested || refundOrderIds.has(order.order_id),
  }))

  return NextResponse.json({ orders })
}
