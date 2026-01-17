import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const id = searchParams.get('id')
    const role = searchParams.get('role')
    const email = searchParams.get('email')
    const providerId = searchParams.get('providerId')

    if (id && role && email) {
      // Store user data in localStorage
      localStorage.setItem('userId', id)
      localStorage.setItem('userRole', role)
      localStorage.setItem('userEmail', email)
      
      // Store providerId if available (for OAuth users)
      if (providerId) {
        localStorage.setItem('providerId', providerId)
      }

      // Redirect based on role
      setTimeout(() => {
        if (role === 'USER') {
          navigate('/dashboard')
        } else if (role === 'ADMIN') {
          navigate('/admin/dashboard')
        } else {
          navigate('/')
        }
      }, 800)
    } else {
      // If missing params, redirect to login
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
