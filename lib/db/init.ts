import fs from 'fs'
import Database from 'better-sqlite3'
import { DATA_DIR } from '@/lib/paths'

const DB_PATH = `${DATA_DIR}/novamart.db`
const CUSTOMERS_CSV = `${DATA_DIR}/customers.csv`

const CREATE_CUSTOMERS_TABLE = `
CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    join_date TEXT NOT NULL,
    total_orders INTEGER NOT NULL,
    lifetime_spend REAL NOT NULL,
    previous_refunds INTEGER NOT NULL
);
`

const CREATE_REFUND_REQUESTS_TABLE = `
CREATE TABLE IF NOT EXISTS refund_requests (
    request_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    decision TEXT NOT NULL,
    reasons_json TEXT NOT NULL,
    policy_reference TEXT,
    created_at TEXT NOT NULL
);
`

const CREATE_REFUND_REQUESTS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_refund_requests_order ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_customer ON refund_requests(customer_id);
`

let db: Database.Database | null = null
let initialized = false

export function getConnection(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
  }
  return db
}

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

export function initDb(): void {
  if (initialized) return

  fs.mkdirSync(DATA_DIR, { recursive: true })
  const conn = getConnection()

  conn.exec(CREATE_CUSTOMERS_TABLE)
  conn.exec(CREATE_REFUND_REQUESTS_TABLE)
  conn.exec(CREATE_REFUND_REQUESTS_INDEXES)
  conn.prepare('DELETE FROM customers').run()

  const csvContent = fs.readFileSync(CUSTOMERS_CSV, 'utf-8')
  const rows = parseCsv(csvContent)

  const insert = conn.prepare(`
    INSERT INTO customers (
      customer_id, name, email, join_date,
      total_orders, lifetime_spend, previous_refunds
    ) VALUES (
      @customer_id, @name, @email, @join_date,
      @total_orders, @lifetime_spend, @previous_refunds
    )
  `)

  const insertMany = conn.transaction((customers: Record<string, string>[]) => {
    for (const row of customers) {
      insert.run({
        customer_id: row.customer_id,
        name: row.name,
        email: row.email,
        join_date: row.join_date,
        total_orders: Number.parseInt(row.total_orders, 10),
        lifetime_spend: Number.parseFloat(row.lifetime_spend),
        previous_refunds: Number.parseInt(row.previous_refunds, 10),
      })
    }
  })

  insertMany(rows)
  initialized = true
}
