import { getOrder } from '@/lib/services/order-service'

const STATUS_TO_STAGE: Record<string, string> = {
  delivered: 'delivered',
  shipped: 'in_transit',
  'in transit': 'in_transit',
  processing: 'processing',
  pending: 'processing',
  cancelled: 'cancelled',
}

const CARRIER = 'NovaMart Logistics'

export function trackShipment(orderId: string) {
  const order = getOrder(orderId)
  if (!order) return null

  const status = order.status ?? 'Unknown'
  const shipmentStage = STATUS_TO_STAGE[status.toLowerCase()] ?? status.toLowerCase()

  return {
    order_id: order.order_id,
    status,
    shipment_stage: shipmentStage,
    tracking_number: order.tracking_number,
    order_date: order.order_date,
    delivery_date: order.delivery_date,
    carrier: CARRIER,
  }
}
