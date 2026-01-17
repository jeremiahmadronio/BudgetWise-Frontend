/**
 * Archive Products & Markets API Service
 * Handles all archived product and market-related API requests
 */

import { api } from '../utils/apiClient'

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
  return api.get('/api/v1/admin/archive/archive/stats')
}

/**
 * Fetch paginated archived products list
 * @param page - Page number (0-indexed)
 * @param size - Items per page
 */
export async function fetchArchivedProductsPage(page = 0, size = 10): Promise<ArchivedProductsPage> {
  return api.get(`/api/v1/admin/archive/archive/table?page=${page}&size=${size}`)
}

// ============================================================================
// Fetch Operations - Markets
// ============================================================================

/**
 * Fetch market archive statistics
 */
export async function fetchMarketArchiveStats(): Promise<MarketArchiveStatsDTO> {
  return api.get('/api/v1/admin/markets/archive/stats')
}

/**
 * Fetch paginated archived markets list
 * @param page - Page number (0-indexed)
 * @param size - Items per page
 */
export async function fetchArchivedMarketsPage(page = 0, size = 10): Promise<ArchivedMarketsPage> {
  return api.get(`/api/v1/admin/markets/archive/table?page=${page}&size=${size}`)
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
  return api.put('/api/v1/admin/archive/updateStatus', { id, newStatus })
}

/**
 * Bulk restore archived products by setting status to ACTIVE
 * @param ids - Array of product IDs to restore
 * @param newStatus - Status to set (should be "ACTIVE")
 */
export async function bulkRestoreProducts(ids: number[], newStatus: string = 'ACTIVE'): Promise<void> {
  return api.patch('/api/v1/admin/archive/bulk-status', { ids, newStatus })
}

// ============================================================================
// Update Operations - Markets
// ============================================================================

/**
 * Restore archived market
 * @param id - Market ID
 */
export async function restoreMarket(id: number): Promise<void> {
  return api.post('/api/v1/admin/markets/archive/restore', [id])
}

/**
 * Bulk restore archived markets
 * @param ids - Array of market IDs to restore
 */
export async function bulkRestoreMarkets(ids: number[]): Promise<void> {
  return api.post('/api/v1/admin/markets/archive/restore', ids)
}

// ============================================================================
// Fetch Operations - Dietary Tags
// ============================================================================

/**
 * Fetch dietary tag archive statistics
 */
export async function fetchDietaryTagArchiveStats(): Promise<DietaryTagArchiveStatsDTO> {
  return api.get('/api/v1/admin/archiveTag/stats')
}

/**
 * Fetch paginated archived dietary tags list
 * @param page - Page number (0-indexed)
 * @param size - Items per page
 */
export async function fetchArchivedDietaryTagsPage(page = 0, size = 10): Promise<ArchivedDietaryTagsPage> {
  return api.get(`/api/v1/admin/archiveTag/archive?page=${page}&size=${size}`)
}

// ============================================================================
// Update Operations - Dietary Tags
// ============================================================================

/**
 * Restore archived dietary tags by setting status to ACTIVE
 * @param ids - Array of dietary tag IDs to restore
 */
export async function restoreDietaryTags(ids: number[]): Promise<void> {
  return api.put('/api/v1/admin/archiveTag/status?status=ACTIVE', ids)
}
