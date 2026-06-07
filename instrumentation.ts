export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initCustomers } = await import('@/lib/services/customer-service')
    const { initOrders } = await import('@/lib/services/order-service')

    initCustomers()
    initOrders()

    try {
      const { initPolicyIndex } = await import('@/lib/services/policy-service')
      const { initFaqIndex } = await import('@/lib/services/knowledge-service')
      await initPolicyIndex()
      await initFaqIndex()
    } catch {
      // Vector index init may fail without OPENAI_API_KEY at build time
    }
  }
}
