/**
 * Market API Module
 * Handles all market-related API operations
 */

import { api } from '../utils/apiClient'

// ============================================================================
// Type Definitions
// ============================================================================

export interface MarketDisplayDTO {
  id: number
  marketName: string
  // Support both field name formats from different endpoints
  type?: 'WET_MARKET' | 'SUPERMARKET'  // From /view endpoint
  marketType?: 'WET_MARKET' | 'SUPERMARKET'  // From /displayMarkets endpoint
  status?: 'ACTIVE' | 'INACTIVE'  // From /view endpoint
  marketStatus?: 'ACTIVE' | 'INACTIVE'  // From /displayMarkets endpoint
  totalProductsAvailable?: number  // From /displayMarkets endpoint
  totalProducts?: number  // From /view endpoint
  latitude?: number
  longitude?: number
  openingTime?: string | null
  closingTime?: string | null
  ratings?: number
  description?: string | null
  createdAt?: string
  updatedAt?: string | null
}

export interface MarketStatsDTO {
  totalMarkets: number
  activeMarkets: number
  totalSuperMarkets: number
  totalWetMarkets: number
}

export interface PageInfo {
  size: number
  number: number
  totalElements: number
  totalPages: number
}

export interface MarketsPage {
  content: MarketDisplayDTO[]
  page: PageInfo
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch paginated markets list
 */
export async function fetchMarketsPage(
  page: number = 0,
  size: number = 10
): Promise<MarketsPage> {
  return api.get(`/api/v1/admin/markets/displayMarkets?page=${page}&size=${size}`)
}

/**
 * Fetch market statistics
 */
export async function fetchMarketStats(): Promise<MarketStatsDTO> {
  return api.get('/api/v1/admin/markets/stats')
}

/**
 * Fetch full market details by ID
 */
export async function fetchMarketDetails(marketId: number): Promise<MarketDisplayDTO> {
  return api.get(`/api/v1/admin/markets/view/${marketId}`)
}

/**
 * Update market status
 */
export async function updateMarketStatus(
  marketId: number,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<void> {
  return api.put(`/api/v1/admin/markets/${marketId}/status?status=${status}`)
}

/**
 * Update market details
 */
export async function updateMarket(
  marketId: number,
  data: {
    marketLocation: string
    type: 'WET_MARKET' | 'SUPERMARKET'
    latitude: number
    longitude: number
    ratings: number
    openingTime: string | null
    closingTime: string | null
    description: string | null
  }
): Promise<void> {
  return api.put(`/api/v1/admin/markets/${marketId}`, data)
}

/**
 * Bulk update market status
 */
export async function bulkUpdateMarketStatus(
  ids: number[],
  newStatus: 'ACTIVE' | 'INACTIVE'
): Promise<void> {
  return api.patch('/api/v1/admin/markets/bulk-status', { ids, newStatus })
}
