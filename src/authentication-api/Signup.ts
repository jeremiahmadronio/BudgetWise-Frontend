// Signup API endpoint

const BASE_URL = 'http://localhost:8080'

export const AUTH_ENDPOINTS = {
  REGISTER: `${BASE_URL}/api/v1/users/register`,
  CHECK_EMAIL: `${BASE_URL}/api/v1/users/check-email`,
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

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    let data
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      // Handle plain text response
      const text = await response.text()
      data = { message: text }
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Registration failed')
    }

    return data
  } catch (error: any) {
    console.error('Registration error:', error)
    throw error
  }
}
