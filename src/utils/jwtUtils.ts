// JWT Utility functions

interface JwtPayload {
  id: string
  role: string
  email?: string
  sub: string
  iat: number
  exp: number
}

export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwt(token)
  if (!payload) return true
  
  const currentTime = Date.now() / 1000
  return payload.exp < currentTime
}

export const getTokenData = (token: string) => {
  const payload = decodeJwt(token)
  if (!payload) return null
  
  return {
    id: payload.id,
    role: payload.role,
    email: payload.sub,
  }
}
