// Signup API endpoint

const BASE_URL = 'http://localhost:8080'

export const AUTH_ENDPOINTS = {
  REGISTER: `${BASE_URL}/api/v1/auth/register`,
  CHECK_EMAIL: `${BASE_URL}/api/v1/auth/check-email`,
}

export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  try {
    const response = await fetch(`${AUTH_ENDPOINTS.CHECK_EMAIL}?email=${encodeURIComponent(email)}`)
    const isTaken = await response.json()
    return isTaken
  } catch (error) {
    console.error('Email check error:', error)
    return false
  }
}

export const registerUser = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Registration failed')
    }

    // Store token and user info
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.id)
      localStorage.setItem('userRole', data.role)
      localStorage.setItem('userEmail', data.email)
    }

    return data
  } catch (error: any) {
    console.error('Registration error:', error)
    throw error
  }
}
