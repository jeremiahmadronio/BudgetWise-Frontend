// ============================================================================
// DietaryTag API
// ============================================================================

const BASE_URL = 'http://localhost:8080/api/v1/dietaryTag'

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

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch dietary tag statistics
 */
export async function fetchDietaryTagStats(): Promise<DietaryTagStatsDTO> {
  const response = await fetch(`${BASE_URL}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch dietary tag stats')
  }

  return response.json()
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
  let url = `${BASE_URL}/products?page=${page}&size=${size}`
  if (search && search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`
  }
  if (category && category.trim()) {
    url += `&category=${encodeURIComponent(category.trim())}`
  }
  if (status && status.trim()) {
    url += `&status=${status}`
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch products with tags')
  }

  return response.json()
}

/**
 * Update product dietary tags (replaces all existing tags)
 */
export async function updateProductTags(
  productId: number,
  tagIds: number[]
): Promise<void> {
  const requestBody = { tagIds }
  console.log('=== API REQUEST ===')
  console.log('URL:', `${BASE_URL}/products/${productId}/tags`)
  console.log('Method: PUT')
  console.log('Body:', JSON.stringify(requestBody))
  
  const response = await fetch(`${BASE_URL}/products/${productId}/tags`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  console.log('Response status:', response.status)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ API ERROR:', errorText)
    throw new Error(`Failed to update product tags: ${errorText}`)
  }
  
  console.log('✅ Tags updated successfully!')
}

/**
 * Fetch all available dietary tag options
 */
export async function fetchAllDietaryTags(search?: string): Promise<DietaryTag[]> {
  let url = `${BASE_URL}/options`
  if (search && search.trim()) {
    url += `?search=${encodeURIComponent(search.trim())}`
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch dietary tags')
  }

  return response.json()
}

/**
 * Create a new dietary tag
 */
export async function createDietaryTag(
  tagName: string,
  tagDescription: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/createTag`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tagName, tagDescription }),
  })

  if (!response.ok) {
    throw new Error('Failed to create dietary tag')
  }
}

/**
 * Update an existing dietary tag
 */
export async function updateDietaryTag(
  tagId: number,
  tagName: string,
  description: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/updateTag/${tagId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tagName, description }),
  })

  if (!response.ok) {
    throw new Error('Failed to update dietary tag')
  }
}

/**
 * Fetch quality control scan results
 */
export async function fetchQualityIssues(): Promise<QualityIssue[]> {
  const response = await fetch('http://localhost:8080/api/v1/quality/scan', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch quality issues')
  }

  return response.json()
}

/**
 * Archive dietary tags (set status to INACTIVE)
 */
export async function archiveDietaryTags(
  tagIds: number[]
): Promise<void> {
  const response = await fetch('http://localhost:8080/api/v1/archiveTag/status?status=INACTIVE', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tagIds),
  })

  if (!response.ok) {
    throw new Error('Failed to archive dietary tags')
  }
}
