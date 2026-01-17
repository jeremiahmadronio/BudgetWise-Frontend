import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getTokenData } from '../utils/jwtUtils'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Get token from query params (OAuth2 login)
    const token = searchParams.get('token')

    if (token) {
      // Store token
      localStorage.setItem('token', token)
      
      // Decode token to get user data
      const userData = getTokenData(token)
      
      if (userData) {
        localStorage.setItem('userId', userData.id)
        localStorage.setItem('userRole', userData.role)
        localStorage.setItem('userEmail', userData.email)
        
        // Redirect based on role
        setTimeout(() => {
          if (userData.role === 'USER') {
            navigate('/dashboard')
          } else if (userData.role === 'ADMIN') {
            navigate('/admin/dashboard')
          } else {
            navigate('/')
          }
        }, 800)
      } else {
        // Failed to decode token
        navigate('/login')
      }
    } else {
      // No token found, redirect to login
      navigate('/login')
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        
        {/* Loading Text */}
        <p className="mt-4 text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  )
}
