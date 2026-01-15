/**
 * Archive Products & Markets API Service
 * Handles all archived product and market-related API requests
 */

const API_BASE = 'http://localhost:8080/api/v1'

// ============================================================================
// Type Definitions - Products
// ============================================================================

/** Archive statistics */
export interface ArchiveStatsDTO {
  totalArchived: number
  newThisMonth: number
  awaitingReview: number
}

/** Archived product display information */
export interface ArchivedProductDTO {
  id: number
  productName: string
  category: string
  lastPrice: number
  unit: string
  origin: string
  archivedDate: string
}

/** Paginated archived products response */
export interface ArchivedProductsPage {
  content: ArchivedProductDTO[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

// ============================================================================
// Type Definitions - Markets
// ============================================================================

/** Market archive statistics */
export interface MarketArchiveStatsDTO {
  totalArchive: number
  archiveThisMonth: number
  highRated: number
}

// ============================================================================
// Type Definitions - Dietary Tags
// ============================================================================

/** Dietary tag archive statistics */
export interface DietaryTagArchiveStatsDTO {
  totalArchived: number
  archivedThisMonth: number
  unusedTagsCount: number
}

/** Archived dietary tag display information */
export interface ArchivedDietaryTagDTO {
  id: number
  tagName: string
  description: string
  archivedAt: string
}

/** Paginated archived dietary tags response */
export interface ArchivedDietaryTagsPage {
  content: ArchivedDietaryTagDTO[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

/** Archived market display information */
export interface ArchivedMarketDTO {
  id: number
  marketLocation: string
  type: string
  ratings: number
  archivedDate: string
}

/** Paginated archived markets response */
export interface ArchivedMarketsPage {
  content: ArchivedMarketDTO[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

// ============================================================================
// Fetch Operations - Products
// ============================================================================

/**
 * Fetch archive statistics
 */
export async function fetchArchiveStats(): Promise<ArchiveStatsDTO> {
  const res = await fetch(`${API_BASE}/archive/archive/stats`)
  if (!res.ok) throw new Error('Failed to fetch archive stats')
  return res.json()
}

/**
 * Fetch paginated archived products list
 * @param page - Page number (0-indexed)
 * @param size - Items per page
 */
export async function fetchArchivedProductsPage(page = 0, size = 10): Promise<ArchivedProductsPage> {
  const res = await fetch(`${API_BASE}/archive/archive/table?page=${page}&size=${size}`)
  if (!res.ok) throw new Error('Failed to fetch archived products')
  return res.json()
}

// ============================================================================
// Fetch Operations - Markets
// ============================================================================

/**
 * Fetch market archive statistics
 */
export async function fetchMarketArchiveStats(): Promise<MarketArchiveStatsDTO> {
  const res = await fetch(`${API_BASE}/markets/archive/stats`)
  if (!res.ok) throw new Error('Failed to fetch market archive stats')
  return res.json()
}

/**
 * Fetch paginated archived markets list
 * @param page - Page number (0-indexed)
 * @param size - Items per page
 */
export async function fetchArchivedMarketsPage(page = 0, size = 10): Promise<ArchivedMarketsPage> {
  const res = await fetch(`${API_BASE}/markets/archive/table?page=${page}&size=${size}`)
  if (!res.ok) throw new Error('Failed to fetch archived markets')
  return res.json()
}

// ============================================================================
// Update Operations - Products
// ============================================================================

/**
 * Restore archived product by setting status back to ACTIVE
 * @param id - Product ID
 * @param newStatus - Status to set (should be "ACTIVE")
 */
export async function restoreProduct(id: number, newStatus: string = 'ACTIVE'): Promise<void> {
  const res = await fetch(`${API_BASE}/archive/updateStatus`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, newStatus }),
  })
  if (!res.ok) throw new Error('Failed to restore product')
}

/**
 * Bulk restore archived products by setting status to ACTIVE
 * @param ids - Array of product IDs to restore
 * @param newStatus - Status to set (should be "ACTIVE")
 */
export async function bulkRestoreProducts(ids: number[], newStatus: string = 'ACTIVE'): Promise<void> {
  const res = await fetch(`${API_BASE}/archive/bulk-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, newStatus }),
  })
  if (!res.ok) throw new Error('Failed to bulk restore products')
}

// ============================================================================
// Update Operations - Markets
// ============================================================================

/**
 * Restore archived market
 * @param id - Market ID
 */
export async function restoreMarket(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/markets/archive/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([id]),
  })
  if (!res.ok) throw new Error('Failed to restore market')
}

/**
 * Bulk restore archived markets
 * @param ids - Array of market IDs to restore
 */
export async function bulkRestoreMarkets(ids: number[]): Promise<void> {
  const res = await fetch(`${API_BASE}/markets/archive/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids),
  })
  if (!res.ok) throw new Error('Failed to bulk restore markets')
}

// ============================================================================
// Fetch Operations - Dietary Tags
// ============================================================================

/**
 * Fetch dietary tag archive statistics
 */
export async function fetchDietaryTagArchiveStats(): Promise<DietaryTagArchiveStatsDTO> {
  const res = await fetch(`${API_BASE}/archiveTag/stats`)
  if (!res.ok) throw new Error('Failed to fetch dietary tag archive stats')
  return res.json()
}

/**
 * Fetch paginated archived dietary tags list
 * @param page - Page number (0-indexed)
 * @param size - Items per page
 */
export async function fetchArchivedDietaryTagsPage(page = 0, size = 10): Promise<ArchivedDietaryTagsPage> {
  const res = await fetch(`${API_BASE}/archiveTag/archive?page=${page}&size=${size}`)
  if (!res.ok) throw new Error('Failed to fetch archived dietary tags')
  return res.json()
}

// ============================================================================
// Update Operations - Dietary Tags
// ============================================================================

/**
 * Restore archived dietary tags by setting status to ACTIVE
 * @param ids - Array of dietary tag IDs to restore
 */
export async function restoreDietaryTags(ids: number[]): Promise<void> {
  const res = await fetch(`${API_BASE}/archiveTag/status?status=ACTIVE`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids),
  })
  if (!res.ok) throw new Error('Failed to restore dietary tags')
}
