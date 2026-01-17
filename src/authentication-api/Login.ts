// Authentication API endpoints

const BASE_URL = 'http://localhost:8080'

// Frontend callback URL - ito yung tinatawag ng backend after successful Google OAuth
// Make sure na naka-match ito sa OAuth2LoginSuccessHandler sa backend
export const FRONTEND_CALLBACK_URL = 'http://localhost:5173/auth/callback'

export const AUTH_ENDPOINTS = {
  GOOGLE_OAUTH: `${BASE_URL}/oauth2/authorization/google`,
  LOGIN: `${BASE_URL}/api/auth/login`,
  LOGOUT: `${BASE_URL}/api/auth/logout`,
  REFRESH_TOKEN: `${BASE_URL}/api/auth/refresh`,
}

export const loginWithGoogle = () => {
  window.location.href = AUTH_ENDPOINTS.GOOGLE_OAUTH
}

export const loginWithCredentials = async (username: string, password: string) => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}
