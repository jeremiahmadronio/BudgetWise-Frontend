// ============================================================================
// DietaryTag API
// ============================================================================

import { api } from '../utils/apiClient'

// ============================================================================
// Types
// ============================================================================

export interface DietaryTagStatsDTO {
  totalProducts: number
  taggedProducts: number
  untaggedProducts: number
  totalDietaryOption: number
}

export interface DietaryTag {
  id: number
  tagName: string
  description?: string
  updatedAt?: string
}

export interface ProductDietaryTag {
  tagId: number
  tagName: string
}

export interface ProductWithTagsDTO {
  productId: number
  productName: string
  category: string
  localName: string | null
  tags: ProductDietaryTag[]
}

export interface ProductsPageDTO {
  content: ProductWithTagsDTO[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

export interface QualityIssue {
  productId: number
  productName: string
  category: string
  issueType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  suggestedFix: string
  currentTags: string[]
  lastUpdated: string
}

export interface TagCoverageDTO {
  category: string
  taggedCount: number
  totalCount: number
  coveragePercentage: number
  status: 'Needs Work' | 'Good' | 'Excellent'
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch dietary tag statistics
 */
export async function fetchDietaryTagStats(): Promise<DietaryTagStatsDTO> {
  return api.get('/api/v1/admin/dietaryTag/stats')
}

/**
 * Fetch products with dietary tags (paginated)
 */
export async function fetchProductsWithTags(
  page: number = 0,
  size: number = 10,
  search?: string,
  category?: string,
  status?: string
): Promise<ProductsPageDTO> {
  let url = `/api/v1/admin/dietaryTag/products?page=${page}&size=${size}`
  if (search && search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`
  }
  if (category && category.trim()) {
    url += `&category=${encodeURIComponent(category.trim())}`
  }
  if (status && status.trim()) {
    url += `&status=${status}`
  }
  
  return api.get(url)
}

/**
 * Update product dietary tags (replaces all existing tags)
 */
export async function updateProductTags(
  productId: number,
  tagIds: number[]
): Promise<void> {
  console.log('=== API REQUEST ===')
  console.log('URL:', `/api/v1/admin/dietaryTag/products/${productId}/tags`)
  console.log('Method: PUT')
  console.log('Body:', JSON.stringify({ tagIds }))
  
  await api.put(`/api/v1/admin/dietaryTag/products/${productId}/tags`, { tagIds })
  
  console.log('✅ Tags updated successfully!')
}

/**
 * Fetch all available dietary tag options
 */
export async function fetchAllDietaryTags(search?: string): Promise<DietaryTag[]> {
  let url = '/api/v1/admin/dietaryTag/options'
  if (search && search.trim()) {
    url += `?search=${encodeURIComponent(search.trim())}`
  }
  
  return api.get(url)
}

/**
 * Create a new dietary tag
 */
export async function createDietaryTag(
  tagName: string,
  tagDescription: string
): Promise<void> {
  return api.post('/api/v1/admin/dietaryTag/createTag', { tagName, tagDescription })
}

/**
 * Update an existing dietary tag
 */
export async function updateDietaryTag(
  tagId: number,
  tagName: string,
  description: string
): Promise<void> {
  return api.put(`/api/v1/admin/dietaryTag/updateTag/${tagId}`, { tagName, description })
}

/**
 * Fetch quality control scan results
 */
export async function fetchQualityIssues(): Promise<QualityIssue[]> {
  return api.get('/api/v1/quality/scan')
}

/**
 * Archive dietary tags (set status to INACTIVE)
 */
export async function archiveDietaryTags(
  tagIds: number[]
): Promise<void> {
  return api.put('/api/v1/archiveTag/status?status=INACTIVE', tagIds)
}

/**
 * Fetch tag coverage by category
 */
export async function fetchTagCoverage(): Promise<TagCoverageDTO[]> {
  return api.get('/api/v1/admin/dietaryTag/coverage')
}
