import { NextResponse } from 'next/server'
import { getPolicy } from '@/lib/services/policy-service'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ policy: getPolicy() })
}
