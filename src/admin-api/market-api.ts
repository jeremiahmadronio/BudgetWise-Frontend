/**
 * Market API Module
 * Handles all market-related API operations
 */

const API_BASE_URL = 'http://localhost:8080/api/v1/markets'

// ============================================================================
// Type Definitions
// ============================================================================

export interface MarketDisplayDTO {
  id: number
  marketName: string
  marketType: 'WET_MARKET' | 'SUPERMARKET'
  marketStatus: 'ACTIVE' | 'INACTIVE'
  totalProductsAvailable: number
  latitude?: number
  longitude?: number
  totalProducts?: number
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
  const response = await fetch(
    `${API_BASE_URL}/displayMarkets?page=${page}&size=${size}`
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch markets')
  }
  
  return response.json()
}

/**
 * Fetch market statistics
 */
export async function fetchMarketStats(): Promise<MarketStatsDTO> {
  const response = await fetch(`${API_BASE_URL}/stats`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch market stats')
  }
  
  return response.json()
}

/**
 * Fetch full market details by ID
 */
export async function fetchMarketDetails(marketId: number): Promise<MarketDisplayDTO> {
  const response = await fetch(`${API_BASE_URL}/view/${marketId}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch market details')
  }
  
  return response.json()
}

/**
 * Update market status
 */
export async function updateMarketStatus(
  marketId: number,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/${marketId}/status?status=${status}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to update market status')
  }
}

/**
 * Update market details
 */
export async function updateMarket(
  marketId: number,
  data: {
    marketName: string
    marketType: 'WET_MARKET' | 'SUPERMARKET'
  }
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${marketId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update market')
  }
}

/**
 * Bulk update market status
 */
export async function bulkUpdateMarketStatus(
  ids: number[],
  newStatus: 'ACTIVE' | 'INACTIVE'
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids, newStatus }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to bulk update market status')
  }
}
