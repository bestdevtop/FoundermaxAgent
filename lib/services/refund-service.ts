import { randomBytes } from 'crypto'
import type { Customer } from '@/lib/services/customer-service'
import type { Order } from '@/lib/services/order-service'
import { markOrderRefundRequested } from '@/lib/services/order-service'

export type { Customer }

const NON_REFUNDABLE_KEYWORDS = [
  'final sale',
  'clearance',
  'gift card',
  'digital gift card',
  'digital download',
  'subscription',
  'customized',
  'personalized',
  'hygiene',
  'software license',
]

const APPROVED_REASONS = [
  'damaged',
  'defective',
  'wrong item',
  'wrong item shipped',
  'lost in transit',
  'lost package',
  'fewer items',
  'unused',
  'not received',
  'item not received',
]

type RefundEvaluation = {
  decision: 'APPROVED' | 'DENIED' | 'ESCALATED'
  reasons: string[]
  policy_reference?: string
}

type RefundRequest = {
  request_id: string
  order_id: string
  customer_id: string
  reason: string
  decision: string
  reasons: string[]
  policy_reference: string | null
  created_at: string
}

const refundRequests: RefundRequest[] = []

function parseDate(value: string | undefined): Date | null {
  if (!value) return null
  return new Date(`${value}T00:00:00`)
}

function containsNonRefundable(order: Order): string[] {
  const matches: string[] = []
  for (const item of order.items ?? []) {
    const product = item.product.toLowerCase()
    for (const keyword of NON_REFUNDABLE_KEYWORDS) {
      if (product.includes(keyword)) {
        matches.push(item.product)
        break
      }
    }
  }
  return matches
}

function normalizeReason(reason: string): string {
  return reason.trim().toLowerCase()
}

function reasonMatchesApproved(reason: string): boolean {
  const normalized = normalizeReason(reason)
  return APPROVED_REASONS.some((key) => normalized.includes(key))
}

export function checkFraudRisk(
  customer: Customer,
  order: Order,
  reason: string,
): string[] {
  const reasons: string[] = []
  const orderTotal = Number(order.order_total ?? 0)

  if (orderTotal > 1000) {
    reasons.push('Order value exceeds $1,000 and requires senior manager approval')
  } else if (orderTotal > 500) {
    reasons.push('Order value exceeds $500 and requires human review')
  }

  if ((customer.previous_refunds ?? 0) > 3) {
    reasons.push('Customer has more than 3 refunds in the last 12 months')
  }

  if (orderTotal > 500 && ['not received', 'item not received'].includes(normalizeReason(reason))) {
    reasons.push("High-value 'item not received' claim requires review")
  }

  return reasons
}

export function evaluateRefund(
  order: Order,
  customer: Customer,
  reason: string,
  today: Date = new Date(),
): RefundEvaluation {
  const nonRefundable = containsNonRefundable(order)
  if (nonRefundable.length > 0) {
    return {
      decision: 'DENIED',
      reasons: [`Order contains non-refundable items: ${nonRefundable.join(', ')}`],
      policy_reference: 'Section 3: Non-Refundable Items',
    }
  }

  const deliveryDate = parseDate(order.delivery_date)
  if (deliveryDate) {
    const daysSinceDelivery = Math.floor(
      (today.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysSinceDelivery > 30) {
      return {
        decision: 'DENIED',
        reasons: ['Refund request is outside the 30-day return window'],
        policy_reference: 'Section 1: Standard Return Window',
      }
    }
  }

  const fraudReasons = checkFraudRisk(customer, order, reason)
  if (fraudReasons.length > 0) {
    return {
      decision: 'ESCALATED',
      reasons: fraudReasons,
      policy_reference: 'Sections 5-6: Refund Amount and Fraud Detection Rules',
    }
  }

  if (reasonMatchesApproved(reason)) {
    return {
      decision: 'APPROVED',
      reasons: [`Refund approved for reason: ${reason}`],
      policy_reference: 'Section 2: Eligible Refund Conditions',
    }
  }

  return {
    decision: 'DENIED',
    reasons: [`Refund reason '${reason}' does not meet eligible refund conditions`],
    policy_reference: 'Section 2: Eligible Refund Conditions',
  }
}

export function checkEligibility(
  order: Order,
  customer: Customer,
  reason: string,
  today?: Date,
) {
  const result = evaluateRefund(order, customer, reason, today)
  return {
    eligible: result.decision === 'APPROVED',
    ...result,
  }
}

export function getRefundRequestByOrder(orderId: string) {
  const normalized = orderId.toUpperCase()
  const matches = refundRequests.filter((r) => r.order_id === normalized)
  matches.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return matches[0] ?? null
}

export function getRefundRequestsByCustomer(customerId: string) {
  const normalized = customerId.toUpperCase()
  return refundRequests
    .filter((r) => r.customer_id === normalized)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getRefundRequestedOrderIds(): Set<string> {
  return new Set(refundRequests.map((r) => r.order_id))
}

export function createRefundRequest(order: Order, customer: Customer, reason: string) {
  const orderId = order.order_id
  const customerId = customer.customer_id

  if (order.refund_requested) {
    return {
      error: `A refund has already been requested for order ${orderId}`,
      order_id: orderId,
    }
  }

  const existing = getRefundRequestByOrder(orderId)
  if (existing) {
    return {
      error: `A refund request already exists for order ${orderId}`,
      existing_request: existing,
    }
  }

  const evaluation = evaluateRefund(order, customer, reason)
  if (evaluation.decision === 'DENIED') {
    return {
      order_id: orderId,
      customer_id: customerId,
      reason,
      decision: 'DENIED',
      reasons: evaluation.reasons,
      policy_reference: evaluation.policy_reference,
      message: 'Refund request denied based on policy. No request was created.',
    }
  }

  const requestId = `RR-${randomBytes(4).toString('hex').toUpperCase()}`
  const createdAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

  const request: RefundRequest = {
    request_id: requestId,
    order_id: orderId.toUpperCase(),
    customer_id: customerId.toUpperCase(),
    reason,
    decision: evaluation.decision,
    reasons: evaluation.reasons,
    policy_reference: evaluation.policy_reference ?? null,
    created_at: createdAt,
  }
  refundRequests.push(request)
  markOrderRefundRequested(orderId)

  const messages = {
    APPROVED: 'Refund request approved and submitted for processing.',
    DENIED: 'Refund request denied based on policy.',
    ESCALATED: 'Refund request escalated for human review.',
  }

  return {
    request_id: requestId,
    order_id: orderId,
    customer_id: customerId,
    reason,
    decision: evaluation.decision,
    reasons: evaluation.reasons,
    policy_reference: evaluation.policy_reference,
    message: messages[evaluation.decision],
    created_at: createdAt,
  }
}
