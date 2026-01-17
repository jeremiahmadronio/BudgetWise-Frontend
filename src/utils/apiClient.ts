// Centralized API Client with automatic token injection

const BASE_URL = 'http://localhost:8080'

interface ApiClientOptions extends RequestInit {
  requiresAuth?: boolean
}

/**
 * Fetch wrapper that automatically adds JWT token to requests
 * Usage: apiClient('/api/v1/endpoint', { method: 'POST', body: JSON.stringify(data) })
 */
export const apiClient = async (endpoint: string, options: ApiClientOptions = {}) => {
  const { requiresAuth = true, headers = {}, body, ...restOptions } = options

  // Build headers
  const requestHeaders: Record<string, string> = { ...(headers as Record<string, string>) }

  // Only add Content-Type if not FormData (FormData sets its own boundary)
  if (!(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  // Add Authorization header if authentication is required
  if (requiresAuth) {
    const token = localStorage.getItem('token')
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    } else {
      console.warn('No token found. Redirecting to login...')
      window.location.href = '/login'
      throw new Error('No authentication token found')
    }
  }

  // Make the request
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
      body,
    })

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.warn('Token expired or invalid. Redirecting to login...')
      localStorage.clear()
      window.location.href = '/login'
      throw new Error('Authentication failed')
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null
    }

    // Handle other error responses
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      let errorMessage = `Request failed with status ${response.status}`
      
      if (contentType?.includes('application/json')) {
        const error = await response.json().catch(() => ({}))
        errorMessage = error.message || errorMessage
      } else {
        const text = await response.text().catch(() => '')
        errorMessage = text || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    // Check response content type
    const contentType = response.headers.get('content-type')
    
    // Handle JSON responses
    if (contentType?.includes('application/json')) {
      const text = await response.text()
      return text ? JSON.parse(text) : null
    }
    
    // Handle text responses
    if (contentType?.includes('text/')) {
      return await response.text()
    }
    
    // Default: try to parse as JSON, fallback to text
    const text = await response.text()
    if (!text) return null
    
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  } catch (error) {
    // Don't re-throw if already redirecting to login
    if (error instanceof Error && error.message === 'Authentication failed') {
      return
    }
    console.error('API request failed:', error)
    throw error
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint: string, options?: ApiClientOptions) =>
    apiClient(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, data?: any, options?: ApiClientOptions) => {
    // Handle FormData differently - don't stringify it
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined)
    return apiClient(endpoint, {
      ...options,
      method: 'POST',
      body,
    })
  },

  put: (endpoint: string, data?: any, options?: ApiClientOptions) => {
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined)
    return apiClient(endpoint, {
      ...options,
      method: 'PUT',
      body,
    })
  },

  patch: (endpoint: string, data?: any, options?: ApiClientOptions) => {
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined)
    return apiClient(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    })
  },

  delete: (endpoint: string, options?: ApiClientOptions) =>
    apiClient(endpoint, { ...options, method: 'DELETE' }),
}

/**
 * Get current user info from token
 */
export const getCurrentUser = () => {
  return {
    id: localStorage.getItem('userId'),
    email: localStorage.getItem('userEmail'),
    role: localStorage.getItem('userRole'),
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

/**
 * Logout user
 */
export const logout = () => {
  localStorage.clear()
  window.location.href = '/login'
}
