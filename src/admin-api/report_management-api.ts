const API_BASE_URL = 'http://localhost:8080/api/v1'

// ============================================================================
// Types
// ============================================================================

export interface PriceReport {
  id: number
  dateReported: string
  totalProducts: number
  totalMarkets: number
  durationMs: number
  url: string | null
  status: string
}

export interface PriceReportPage {
  content: PriceReport[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch price reports with pagination
 */
export const getPriceReports = async (
  page: number = 0,
  size: number = 10
): Promise<PriceReportPage> => {
  const response = await fetch(`${API_BASE_URL}/priceReport/table?page=${page}&size=${size}`)
  if (!response.ok) {
    throw new Error('Failed to fetch price reports')
  }
  return response.json()
}

/**
 * Trigger scraping
 */
export const triggerScrape = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/scrape/trigger`, {
    method: 'POST'
  })
  if (!response.ok) {
    throw new Error('Failed to trigger scraping')
  }
  return response.text()
}

/**
 * Upload manual PDF report
 */
export const uploadManualReport = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`${API_BASE_URL}/scrape/manual-upload`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload file')
  }
  return response.text()
}
