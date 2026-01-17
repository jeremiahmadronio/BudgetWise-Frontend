import { api } from '../utils/apiClient'

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
  return api.get(`/api/v1/admin/priceReport/table?page=${page}&size=${size}`)
}

/**
 * Trigger scraping
 */
export const triggerScrape = async (): Promise<string> => {
  return api.post('/api/v1/admin/scrape/trigger')
}

/**
 * Upload manual PDF report
 */
export const uploadManualReport = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post('/api/v1/admin/scrape/manual-upload', formData)
}
