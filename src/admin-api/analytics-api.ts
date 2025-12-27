// Analytics API Functions

const API_BASE_URL = 'http://localhost:8080/api/v1'

export interface Market {
  id: number
  marketName: string
  type: 'WET_MARKET' | 'SUPERMARKET'
}

export interface Product {
  id: number
  productName: string
  category: string
}

export interface DiscoveryData {
  markets: Market[]
  products: Product[]
}

export interface PriceHistory {
  date: string
  price: number
}

export interface AnalyticsData {
  productName: string
  marketName: string
  minPrice: number
  maxPrice: number
  averagePrice: number
  volatility: string
  history: PriceHistory[]
}

export interface MarketComparisonData {
  marketName: string
  averagePrice: number
  isTargetMarket: boolean
}

/**
 * Fetch markets and products for dropdowns
 */
export async function fetchDiscoveryData(): Promise<DiscoveryData> {
  const response = await fetch(`${API_BASE_URL}/analytics/discovery`)
  if (!response.ok) {
    throw new Error('Failed to fetch discovery data')
  }
  return response.json()
}

/**
 * Fetch analytics data for a specific product, market, and period
 */
export async function fetchProductAnalytics(
  productName: string,
  marketId: number,
  days: number
): Promise<AnalyticsData> {
  const params = new URLSearchParams({
    productName,
    marketId: marketId.toString(),
    days: days.toString()
  })
  
  const response = await fetch(`${API_BASE_URL}/analytics/product?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data')
  }
  return response.json()
}

/**
 * Fetch market comparison data for a specific product and period
 */
export async function fetchMarketComparison(
  productName: string,
  marketId: number,
  days: number
): Promise<MarketComparisonData[]> {
  const params = new URLSearchParams({
    productName,
    marketId: marketId.toString(),
    days: days.toString()
  })
  
  const response = await fetch(`${API_BASE_URL}/analytics/market-comparison?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch market comparison data')
  }
  return response.json()
}
