// Analytics API Functions

import { api } from '../utils/apiClient'

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

export interface PriceMovement {
  productName: string
  currentPrice: number
  oldPrice: number
  percentageChange: number
  trend: 'UP' | 'DOWN'
}

export interface MarketMovementsData {
  topGainers: PriceMovement[]
  topDecliners: PriceMovement[]
  allGainersCount: number
  allDeclinersCount: number
}

/**
 * Fetch markets and products for dropdowns
 */
export async function fetchDiscoveryData(): Promise<DiscoveryData> {
  return api.get('/api/v1/admin/analytics/discovery')
}

/**
 * Fetch analytics data for a specific product, market, and period
 */
export async function fetchProductAnalytics(
  productName: string,
  marketId: number,
  days: number
): Promise<AnalyticsData> {
  return api.get(`/api/v1/admin/analytics/product?productName=${encodeURIComponent(productName)}&marketId=${marketId}&days=${days}`)
}

/**
 * Fetch market comparison data for a specific product and period
 */
export async function fetchMarketComparison(
  productName: string,
  marketId: number,
  days: number
): Promise<MarketComparisonData[]> {
  return api.get(`/api/v1/admin/analytics/market-comparison?productName=${encodeURIComponent(productName)}&marketId=${marketId}&days=${days}`)
}

/**
 * Fetch market price movements (top gainers and decliners)
 */
export async function fetchMarketMovements(
  productName: string,
  marketId: number,
  days: number
): Promise<MarketMovementsData> {
  return api.get(`/api/v1/admin/analytics/market-movements?marketId=${marketId}&days=${days}`)
}
