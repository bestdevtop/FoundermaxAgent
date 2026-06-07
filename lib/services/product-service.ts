import fs from 'fs'
import { DATA_DIR } from '@/lib/paths'

const PRODUCTS_PATH = `${DATA_DIR}/products.json`

export type Product = {
  name: string
  category: string
  warranty: string
  returnable: boolean
  specifications: Record<string, string>
}

let products: Product[] | null = null

function loadProducts(): Product[] {
  if (products === null) {
    products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8')) as Product[]
  }
  return products
}

export function getProduct(name: string): Product | null {
  const query = name.trim().toLowerCase()
  return loadProducts().find((product) => product.name.toLowerCase().includes(query)) ?? null
}

export function searchProducts(query: string): Product[] {
  const normalized = query.trim().toLowerCase()
  return loadProducts().filter(
    (product) =>
      product.name.toLowerCase().includes(normalized) ||
      product.category.toLowerCase().includes(normalized),
  )
}
