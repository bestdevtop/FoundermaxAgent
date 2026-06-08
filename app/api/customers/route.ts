import { NextResponse } from 'next/server'
import { getAllCustomers } from '@/lib/services/customer-service'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ customers: getAllCustomers() })
}
