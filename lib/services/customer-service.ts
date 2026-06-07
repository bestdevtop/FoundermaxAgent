import fs from 'fs'
import { DATA_DIR } from '@/lib/paths'

const CUSTOMERS_PATH = `${DATA_DIR}/customers.csv`

export type Customer = {
  customer_id: string
  name: string
  email: string
  join_date: string
  total_orders: number
  lifetime_spend: number
  previous_refunds: number
}

let customers: Customer[] | null = null

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const values = line.split(',')
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() ?? ''
    })
    return row
  })
}

function loadCustomers(): Customer[] {
  if (customers === null) {
    const csvContent = fs.readFileSync(CUSTOMERS_PATH, 'utf-8')
    customers = parseCsv(csvContent).map((row) => ({
      customer_id: row.customer_id,
      name: row.name,
      email: row.email,
      join_date: row.join_date,
      total_orders: Number.parseInt(row.total_orders, 10),
      lifetime_spend: Number.parseFloat(row.lifetime_spend),
      previous_refunds: Number.parseInt(row.previous_refunds, 10),
    }))
  }
  return customers
}

export function initCustomers(): void {
  loadCustomers()
}

export function getCustomer(customerId: string): Customer | null {
  const normalized = customerId.toUpperCase()
  return loadCustomers().find((c) => c.customer_id === normalized) ?? null
}

export function getCustomerByEmail(email: string): Customer | null {
  const normalized = email.trim().toLowerCase()
  return loadCustomers().find((c) => c.email.toLowerCase() === normalized) ?? null
}
