import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import * as crmService from '@/lib/services/crm-service'
import * as knowledgeService from '@/lib/services/knowledge-service'
import * as orderService from '@/lib/services/order-service'
import * as policyService from '@/lib/services/policy-service'
import * as productService from '@/lib/services/product-service'
import * as refundService from '@/lib/services/refund-service'
import * as shipmentService from '@/lib/services/shipment-service'

export const orderLookup = tool(
  async ({ order_id }) => {
    const order = orderService.getOrder(order_id.trim())
    if (!order) {
      return JSON.stringify({ error: `Order not found: ${order_id}` })
    }
    return JSON.stringify(order)
  },
  {
    name: 'order_lookup',
    description:
      'Look up an order by order_id (e.g. O1025). Returns order details including status, items, total, delivery date, and customer_id.',
    schema: z.object({
      order_id: z.string().describe('The order ID, e.g. O1025'),
    }),
  },
)

export const trackShipment = tool(
  async ({ order_id }) => {
    const result = shipmentService.trackShipment(order_id.trim())
    if (!result) {
      return JSON.stringify({ error: `Order not found: ${order_id}` })
    }
    return JSON.stringify(result)
  },
  {
    name: 'track_shipment',
    description:
      'Track shipment status for an order by order_id (e.g. O1025). Returns tracking number, carrier, shipment stage, and delivery date.',
    schema: z.object({
      order_id: z.string().describe('The order ID, e.g. O1025'),
    }),
  },
)

export const customerLookup = tool(
  async ({ identifier }) => {
    const trimmed = identifier.trim()
    const customer = trimmed.includes('@')
      ? crmService.getCustomerByEmail(trimmed)
      : crmService.getCustomer(trimmed)

    if (!customer) {
      return JSON.stringify({ error: `Customer not found: ${identifier}` })
    }

    return JSON.stringify({
      customer_id: customer.customer_id,
      name: customer.name,
      email: customer.email,
      join_date: customer.join_date,
      total_orders: customer.total_orders,
      lifetime_spend: customer.lifetime_spend,
      previous_refunds: customer.previous_refunds,
    })
  },
  {
    name: 'customer_lookup',
    description:
      'Look up a customer by customer_id (e.g. C001) or email address. Returns customer profile including name, email, and previous_refunds count.',
    schema: z.object({
      identifier: z.string().describe('Customer ID (e.g. C001) or email address'),
    }),
  },
)

export const getCustomerHistory = tool(
  async ({ customer_id }) => {
    const history = crmService.getCustomerHistory(customer_id.trim())
    if (!history) {
      return JSON.stringify({ error: `Customer not found: ${customer_id}` })
    }
    return JSON.stringify(history)
  },
  {
    name: 'get_customer_history',
    description:
      "Get a customer's order history and recent refund requests by customer_id (e.g. C001). Returns profile summary, list of orders, and recent refund requests.",
    schema: z.object({
      customer_id: z.string().describe('The customer ID, e.g. C001'),
    }),
  },
)

export const refundPolicySearch = tool(
  async ({ query }) => {
    const results = await policyService.searchPolicy(query)
    if (results.length === 0) {
      return JSON.stringify({ results: [], message: 'No relevant policy clauses found.' })
    }
    return JSON.stringify({ results })
  },
  {
    name: 'refund_policy_search',
    description:
      'Search the NovaMart refund and return policy for relevant clauses. Use for questions about return windows, non-refundable items, escalation rules, etc.',
    schema: z.object({
      query: z.string().describe('The policy search query'),
    }),
  },
)

export const searchKnowledgeBase = tool(
  async ({ query }) => {
    const results = await knowledgeService.searchFaq(query)
    if (results.length === 0) {
      return JSON.stringify({ results: [], message: 'No relevant FAQ entries found.' })
    }
    return JSON.stringify({ results })
  },
  {
    name: 'search_knowledge_base',
    description:
      'Search the NovaMart FAQ and knowledge base for general support questions. Use for shipping times, address changes, international shipping, payment methods, account management, and order cancellations.',
    schema: z.object({
      query: z.string().describe('The FAQ search query'),
    }),
  },
)

export const getProductInfo = tool(
  async ({ product_name }) => {
    const product = productService.getProduct(product_name.trim())
    if (!product) {
      const matches = productService.searchProducts(product_name.trim())
      if (matches.length === 0) {
        return JSON.stringify({ error: `Product not found: ${product_name}` })
      }
      return JSON.stringify({
        matches,
        message: 'Multiple products matched. Please specify.',
      })
    }
    return JSON.stringify(product)
  },
  {
    name: 'get_product_info',
    description:
      'Look up product information by name (e.g. Wireless Headphones). Returns category, warranty, returnability, and specifications.',
    schema: z.object({
      product_name: z.string().describe('The product name to look up'),
    }),
  },
)

export const checkRefundEligibility = tool(
  async ({ order_id, customer_id, reason }) => {
    const order = orderService.getOrder(order_id.trim())
    if (!order) {
      return JSON.stringify({ error: `Order not found: ${order_id}` })
    }

    const customer = crmService.getCustomer(customer_id.trim())
    if (!customer) {
      return JSON.stringify({ error: `Customer not found: ${customer_id}` })
    }

    const result = refundService.checkEligibility(order, customer, reason)
    return JSON.stringify({
      order_id,
      customer_id,
      reason,
      ...result,
    })
  },
  {
    name: 'check_refund_eligibility',
    description:
      'Check whether a refund is eligible for an order without creating a request. Returns eligible (true/false), decision (APPROVED/DENIED/ESCALATED), reasons, and policy reference. Always call this before create_refund_request.',
    schema: z.object({
      order_id: z.string().describe('The order ID'),
      customer_id: z.string().describe('The customer ID'),
      reason: z.string().describe('The refund reason stated by the customer'),
    }),
  },
)

export const createRefundRequest = tool(
  async ({ order_id, customer_id, reason }) => {
    const order = orderService.getOrder(order_id.trim())
    if (!order) {
      return JSON.stringify({ error: `Order not found: ${order_id}` })
    }

    const customer = crmService.getCustomer(customer_id.trim())
    if (!customer) {
      return JSON.stringify({ error: `Customer not found: ${customer_id}` })
    }

    const result = refundService.createRefundRequest(order, customer, reason)
    return JSON.stringify(result)
  },
  {
    name: 'create_refund_request',
    description:
      'Create a refund request for an order. Runs eligibility check and persists the request. Only call when the customer explicitly asks for a refund. Returns request_id, decision (APPROVED/DENIED/ESCALATED), reasons, and policy reference.',
    schema: z.object({
      order_id: z.string().describe('The order ID'),
      customer_id: z.string().describe('The customer ID'),
      reason: z.string().describe('The refund reason stated by the customer'),
    }),
  },
)

export const ALL_TOOLS = [
  orderLookup,
  trackShipment,
  customerLookup,
  getCustomerHistory,
  refundPolicySearch,
  searchKnowledgeBase,
  getProductInfo,
  checkRefundEligibility,
  createRefundRequest,
]
