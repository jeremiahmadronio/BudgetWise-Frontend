import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, User, Loader2, Check, X, CheckCircle2 } from 'lucide-react'
import { registerUser, checkEmailAvailability } from '../authentication-api/Signup'
import { useNavigate } from 'react-router-dom'
import marketImage from '../assets/market.png'

export function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  const validatePassword = (pwd: string) => {
    setPasswordValidation({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value
    setPassword(pwd)
    validatePassword(pwd)
  }

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean)
  }

  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return
    
    setCheckingEmail(true)
    setError('')
    
    try {
      const isTaken = await checkEmailAvailability(email)
      setEmailTaken(isTaken)
      
      if (isTaken) {
        setError('This email is already registered. Please use a different email or login.')
      }
    } catch (error) {
      console.error('Email check error:', error)
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check if email is taken
    if (emailTaken) {
      setError('This email is already registered. Please use a different email.')
      return
    }

    // Validation
    if (!isPasswordValid()) {
      setError('Password does not meet requirements')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const result = await registerUser(name, email, password)
      console.log('Registration successful:', result)
      
      // Show success modal (no auto-redirect)
      setSuccess(true)
    } catch (error: any) {
      console.error('Registration failed:', error)
      setError(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-3 sm:p-4 md:p-6 animate-fadeIn">
      {/* Main Container Card */}
      <div className="w-full max-w-[1100px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden flex animate-slideUp my-3 sm:my-4">
        
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-5 sm:p-6 md:p-7 lg:p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">BudgetWise</span>
          </div>

          {/* Welcome Text */}
          <div className="mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Create an account</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Get started with your budget planning journey</p>
          </div>
          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-2 sm:space-y-2.5">
            {/* Message Area - Fixed Height */}
            <div className="min-h-[3rem] sm:h-12">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm animate-shake">
                  {error}
                </div>
              )}
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-sm transition-all outline-none text-gray-900 text-sm placeholder:text-gray-400"
                />
              </div>
            </div>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailTaken(false)
                    if (error.includes('email')) setError('')
                  }}
                  onBlur={handleEmailBlur}
                  placeholder="name@company.com"
                  required
                  className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-sm transition-all outline-none text-gray-900 text-sm placeholder:text-gray-400 ${
                    emailTaken ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {checkingEmail && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-blue-600 animate-spin" />
                )}
                {!checkingEmail && emailTaken && (
                  <X className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-red-500" />
                )}
                {!checkingEmail && email && !emailTaken && email.includes('@') && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-green-500" />
                )}
              </div>
              {emailTaken && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Email already registered
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Create a strong password"
                  required
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-sm transition-all outline-none text-gray-900 text-sm placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <PasswordRequirement met={passwordValidation.length} text="At least 8 characters" />
                  <PasswordRequirement met={passwordValidation.number} text="One number" />
                  <PasswordRequirement met={passwordValidation.uppercase} text="One uppercase letter" />
                  <PasswordRequirement met={passwordValidation.special} text="One special character" />
                  <PasswordRequirement met={passwordValidation.lowercase} text="One lowercase letter" />
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-sm transition-all outline-none text-gray-900 text-sm placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid() || password !== confirmPassword || emailTaken || checkingEmail}
              className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none text-sm mt-2 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Sign in
            </a>
          </p>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block lg:w-1/2 relative bg-blue-600">
          <img 
            src={marketImage} 
            alt="Fresh Market" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-blue-900/20 to-transparent"></div>
          
          {/* Content on image */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">Price Monitoring & Budget Planner</h2>
            <p className="text-white/80 text-sm">Track wet market prices in real-time and plan your shopping budget efficiently.</p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-slideUp">
            {/* Success Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2 sm:mb-3">
              Account Created Successfully!
            </h3>
            
            {/* Message */}
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
              Your account has been created. You can now sign in with your credentials.
            </p>
            
            {/* Actions */}
            <div className="space-y-2.5 sm:space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98] text-sm sm:text-base"
              >
                Go to Login
              </button>
              <button
                onClick={() => {
                  setSuccess(false)
                  setName('')
                  setEmail('')
                  setPassword('')
                  setConfirmPassword('')
                  setEmailTaken(false)
                  setError('')
                }}
                className="w-full py-2.5 sm:py-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all active:scale-[0.98] text-sm sm:text-base"
              >
                Create another account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  )
}

// Password Requirement Component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? (
        <Check className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
      <span>{text}</span>
    </div>
  )
}
