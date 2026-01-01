/**
 * Archive Products API Service
 * Handles all archived product-related API requests
 */

const API_BASE = 'http://localhost:8080/api/v1/archive'

// ============================================================================
// Type Definitions
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
// Fetch Operations
// ============================================================================

/**
 * Fetch archive statistics
 */
export async function fetchArchiveStats(): Promise<ArchiveStatsDTO> {
  const res = await fetch(`${API_BASE}/archive/stats`)
  if (!res.ok) throw new Error('Failed to fetch archive stats')
  return res.json()
}

/**
 * Fetch paginated archived products list
 * @param page - Page number (0-indexed)
 * @param size - Items per page
 */
export async function fetchArchivedProductsPage(page = 0, size = 10): Promise<ArchivedProductsPage> {
  const res = await fetch(`${API_BASE}/archive/table?page=${page}&size=${size}`)
  if (!res.ok) throw new Error('Failed to fetch archived products')
  return res.json()
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Restore archived product by setting status back to ACTIVE
 * @param id - Product ID
 * @param newStatus - Status to set (should be "ACTIVE")
 */
export async function restoreProduct(id: number, newStatus: string = 'ACTIVE'): Promise<void> {
  const res = await fetch(`${API_BASE}/updateStatus`, {
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
  const res = await fetch(`${API_BASE}/bulk-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, newStatus }),
  })
  if (!res.ok) throw new Error('Failed to bulk restore products')
}
