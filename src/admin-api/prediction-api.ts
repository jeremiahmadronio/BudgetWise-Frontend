// Price Prediction API Functions

import { api } from '../utils/apiClient'

// ===========================
// Type Definitions (matching DTOs)
// ===========================

export interface MarketInfoDTO {
  id: number
  name: string
  location: string
  productCount: number
  predictionCount: number
  anomalyCount: number
}

export interface PriceCalibrationDTO {
  productId: number
  productName: string
  marketId: number
  marketName: string
  currentPrice: number
  forecastPrice: number
  trendPercentage: number
  confidenceScore: number
  status: string
}

export interface MarketPrediction {
  predictionId?: number
  marketId: number
  marketName: string
  marketLocation: string
  currentPrice: number
  forecastPrice?: number
  trendPercentage?: number
  confidenceScore?: number
  status: string
  dataPoints: number
  confidenceLevel?: string
  trendDirection?: string
}

export interface ProductCentricPredictionDTO {
  productId: number
  productName: string
  productCode: string
  category: string
  marketPredictions: MarketPrediction[]
  averageCurrentPrice: number
  averageForecastPrice: number
  maxPriceDifference: number
  mostExpensiveMarket: string
  cheapestMarket: string
  totalMarkets: number
  anomalyCount: number
}

export interface DashboardStatsDTO {
  totalProducts: number
  activeMarkets: number
  modelAccuracy: number
  anomalies: number
  totalPredictions: number
  lastUpdated: string
}

export interface PaginatedResponse<T> {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

// ===========================
// API Functions
// ===========================

/**
 * Trigger bulk prediction for all product-market pairs
 * Returns immediately, processing happens asynchronously
 */
export async function triggerBulkPrediction(): Promise<{ 
  status: string
  message: string
  timestamp: number 
}> {
  return api.post('/api/v1/admin/predictions/bulk-trigger')
}

/**
 * Get dashboard statistics
 * For the stats cards at the top of the dashboard
 */
export async function fetchDashboardStats(): Promise<DashboardStatsDTO> {
  return api.get('/api/v1/admin/predictions/dashboard/stats')
}

/**
 * Get all active markets
 * Used for market dropdown/selector in UI
 */
export async function fetchActiveMarkets(): Promise<MarketInfoDTO[]> {
  return api.get('/api/v1/admin/predictions/markets')
}

/**
 * Get product-centric predictions with pagination
 * Shows all products with predictions across ALL markets (MAIN ENDPOINT)
 */
export async function fetchProductCentricPredictions(
  page: number = 0,
  size: number = 10,
  sortBy: string = 'productName',
  sortDirection: 'ASC' | 'DESC' = 'ASC'
): Promise<PaginatedResponse<ProductCentricPredictionDTO>> {
  return api.get(`/api/v1/admin/predictions/products?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`)
}

/**
 * Get comparison matrix
 * Get specific products with full market comparison
 */
export async function fetchComparisonMatrix(
  productIds?: number[]
): Promise<ProductCentricPredictionDTO[]> {
  let url = '/api/v1/admin/predictions/comparison-matrix'
  
  if (productIds && productIds.length > 0) {
    url += `?productIds=${productIds.join(',')}`
  }
  
  return api.get(url)
}

/**
 * Get market-centric predictions (alternative view)
 * Shows all products for ONE specific market with pagination
 */
export async function fetchMarketCentricPredictions(
  marketId: number,
  page: number = 0,
  size: number = 20,
  sortBy: string = 'productName',
  sortDirection: 'ASC' | 'DESC' = 'ASC'
): Promise<PaginatedResponse<PriceCalibrationDTO>> {
  return api.get(`/api/v1/admin/predictions/markets/${marketId}/predictions?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`)
}

/**
 * Search products across markets
 * Useful for search functionality in the UI
 */
export async function searchProducts(
  searchTerm: string,
  page: number = 0,
  size: number = 10
): Promise<PaginatedResponse<ProductCentricPredictionDTO>> {
  // Fetch ALL products for comprehensive client-side search
  const data = await api.get('/api/v1/admin/predictions/products?page=0&size=10000&sortBy=productName&sortDirection=ASC')
  
  // Client-side filtering with priority on "starts with"
  const searchLower = searchTerm.toLowerCase().trim()
  
  // First priority: Products that START WITH search term
  const startsWithMatches = data.content.filter((product: ProductCentricPredictionDTO) => 
    product.productName.toLowerCase().startsWith(searchLower) ||
    product.productCode.toLowerCase().startsWith(searchLower)
  )
  
  // Second priority: Products that CONTAIN search term (but don't start with it)
  const containsMatches = data.content.filter((product: ProductCentricPredictionDTO) => 
    !product.productName.toLowerCase().startsWith(searchLower) &&
    !product.productCode.toLowerCase().startsWith(searchLower) &&
    (product.productName.toLowerCase().includes(searchLower) ||
     product.productCode.toLowerCase().includes(searchLower))
  )
  
  // Combine: starts with first, then contains
  const filtered = [...startsWithMatches, ...containsMatches]
  
  // Manual pagination
  const startIdx = page * size
  const endIdx = startIdx + size
  const paginatedContent = filtered.slice(startIdx, endIdx)
  const totalPages = Math.ceil(filtered.length / size)
  
  return {
    content: paginatedContent,
    page: {
      size: size,
      number: page,
      totalElements: filtered.length,
      totalPages: totalPages
    }
  }
}

/**
 * Get predictions by status filter
 * Filter by Normal, Anomaly, etc.
 */
export async function fetchPredictionsByStatus(
  status: string,
  page: number = 0,
  size: number = 10
): Promise<PaginatedResponse<ProductCentricPredictionDTO>> {
  // Note: Backend endpoint needs to support status filter
  // For now, fetch all and filter client-side if needed
  return fetchProductCentricPredictions(page, size, 'productName', 'ASC')
}

/**
 * Fetch price history for debugging/inspection
 * Used in the inspection modal to show historical price data and predictions
 */
export async function fetchPriceHistory(
  productId: number,
  marketId: number
): Promise<any> {
  return api.get(`/api/v1/admin/predictions/debug/history?productId=${productId}&marketId=${marketId}`)
}

/**
 * Regenerate prediction for a specific product-market pair
 * Recalculates the prediction using the latest data
 */
export async function regeneratePrediction(
  productId: number,
  marketId: number
): Promise<void> {
  return api.post(`/api/v1/admin/predictions/generate?productId=${productId}&marketId=${marketId}`)
}

/**
 * Apply manual override to prediction
 * Allows admin to force a specific trend for a product-market pair
 */
export async function applyBulkOverride(
  pairs: Array<{ productId: number; marketId: number }>,
  forceTrend: string,
  reason: string
): Promise<void> {
  return api.post('/api/v1/admin/predictions/bulk-override', {
    pairs,
    forceTrend,
    reason
  })
}

// ===========================
// Helper Functions
// ===========================

/**
 * Format confidence score as percentage
 */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`
}

/**
 * Get confidence level label
 */
export function getConfidenceLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score > 0.7) return 'HIGH'
  if (score > 0.4) return 'MEDIUM'
  return 'LOW'
}

/**
 * Get trend direction icon
 */
export function getTrendIcon(percentage: number): string {
  if (Math.abs(percentage) < 0.5) return '—'
  return percentage > 0 ? '↗' : '↘'
}

/**
 * Format price with PHP currency
 */
export function formatPrice(price: number): string {
  return `₱${price.toFixed(2)}`
}

/**
 * Format market name - convert underscore format to readable text
 */
export function formatMarketName(name: string): string {
  if (!name) return ''
  // Remove " Market" suffix if it exists to avoid duplication
  let cleanName = name.replace(/\s+Market$/i, '')
  // Convert WET_MARKET, SUPERMARKET, etc. to proper case
  cleanName = cleanName.replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return cleanName
}

/**
 * Format location - remove coordinates if present
 */
export function formatLocation(location: string): string {
  if (!location) return ''
  // Remove coordinates pattern like (0.0000, 0.0000) or (lat, lng)
  return location.replace(/\s*\([^)]*\)\s*/g, '').trim()
}

/**
 * Format trend percentage
 */
export function formatTrendPercentage(percentage: number): string {
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}%`
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'NORMAL':
      return 'green'
    case 'ANOMALY':
      return 'red'
    case 'WARNING':
      return 'yellow'
    default:
      return 'gray'
  }
}
