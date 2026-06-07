export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initDb } = await import('@/lib/db/init')
    const { initOrders } = await import('@/lib/services/order-service')

    initDb()
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
