import { useState, useEffect } from 'react'
import { Search, TrendingDown, TrendingUp, Filter } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { 
  fetchDiscoveryData, 
  fetchProductAnalytics,
  fetchMarketComparison,
  fetchMarketMovements
} from '../admin-api/analytics-api'
import type { Market, Product, AnalyticsData, MarketComparisonData, MarketMovementsData } from '../admin-api/analytics-api'

export function Analytics() {
  // State for dropdowns data
  const [markets, setMarkets] = useState<Market[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  // State for selections
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null)
  const [selectedDays, setSelectedDays] = useState<number>(30)
  
  // State for product search
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [marketComparisonData, setMarketComparisonData] = useState<MarketComparisonData[]>([])
  const [marketMovementsData, setMarketMovementsData] = useState<MarketMovementsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState<string | null>(null)
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [movementsError, setMovementsError] = useState<string | null>(null)
  const [appliedDays, setAppliedDays] = useState<number>(30)

  // Fetch markets and products on mount, set default filter
  useEffect(() => {
    const loadDiscoveryData = async () => {
      try {
        const data = await fetchDiscoveryData()
        setMarkets(data.markets)
        setProducts(data.products)
        
        // Set default filtering - first product and first market
        if (data.products.length > 0 && data.markets.length > 0) {
          const defaultProduct = data.products[0]
          const defaultMarket = data.markets[0].id
          setSelectedProduct(defaultProduct)
          setSelectedMarket(defaultMarket)
          
          // Fetch default data
          fetchDefaultData(defaultProduct.productName, defaultMarket, selectedDays)
        }
      } catch (err) {
        console.error('Failed to load discovery data:', err)
      }
    }
    loadDiscoveryData()
  }, [])
  
  // Fetch default data on initial load
  const fetchDefaultData = async (productName: string, marketId: number, days: number) => {
    setLoading(true)
    setComparisonLoading(true)
    setMovementsLoading(true)
    setError(null)
    setComparisonError(null)
    setMovementsError(null)
    
    try {
      const [analyticsResult, comparisonResult, movementsResult] = await Promise.all([
        fetchProductAnalytics(productName, marketId, days),
        fetchMarketComparison(productName, marketId, days),
        fetchMarketMovements(productName, marketId, days)
      ])
      setAnalyticsData(analyticsResult)
      setMarketComparisonData(comparisonResult)
      setMarketMovementsData(movementsResult)
      setAppliedDays(days)
    } catch (err) {
      console.error('Failed to load default data:', err)
      setError('Failed to load analytics data')
      setComparisonError('Failed to load market comparison data')
      setMovementsError('Failed to load market movements data')
    } finally {
      setLoading(false)
      setComparisonLoading(false)
      setMovementsLoading(false)
    }
  }

  // Manual fetch function triggered by button
  const handleFilter = async () => {
    if (!selectedProduct || !selectedMarket) {
      alert('Please select both a product and a market')
      return
    }

    setLoading(true)
    setComparisonLoading(true)
    setMovementsLoading(true)
    setError(null)
    setComparisonError(null)
    setMovementsError(null)
    
    try {
      const [analyticsResult, comparisonResult, movementsResult] = await Promise.all([
        fetchProductAnalytics(
          selectedProduct.productName,
          selectedMarket,
          selectedDays
        ),
        fetchMarketComparison(
          selectedProduct.productName,
          selectedMarket,
          selectedDays
        ),
        fetchMarketMovements(
          selectedProduct.productName,
          selectedMarket,
          selectedDays
        )
      ])
      setAnalyticsData(analyticsResult)
      setMarketComparisonData(comparisonResult)
      setMarketMovementsData(movementsResult)
      setAppliedDays(selectedDays)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to load analytics data. Please try again.')
      setComparisonError('Failed to load market comparison data.')
      setMovementsError('Failed to load market movements data.')
      setAnalyticsData(null)
      setMarketComparisonData([])
      setMarketMovementsData(null)
    } finally {
      setLoading(false)
      setComparisonLoading(false)
      setMovementsLoading(false)
    }
  }

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Format date for chart (informative)
  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month} ${day}`
  }

  // Format price
  const formatPrice = (price: number) => `₱${price.toFixed(2)}`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 pt-2 md:pt-4 pb-4 md:pb-8">
        {/* Header */}
        <div className="mb-4 md:mb-5">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Price Trends</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Analyze price movements and market trends over time
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Product Combobox */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
                Product
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Search products..."
                  value={selectedProduct ? selectedProduct.productName : productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setSelectedProduct(null)
                    setShowProductDropdown(true)
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                />
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              {/* Product Dropdown */}
              {showProductDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      onClick={() => {
                        setSelectedProduct(product)
                        setProductSearch('')
                        setShowProductDropdown(false)
                      }}
                    >
                      <div className="font-medium text-gray-900">{product.productName}</div>
                      <div className="text-xs text-gray-500">{product.category}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Market Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
                Market
              </label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer"
                value={selectedMarket || ''}
                onChange={(e) => setSelectedMarket(Number(e.target.value))}
              >
                <option value="">Select a market</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.marketName}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">
                Period
              </label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer"
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>

            {/* Filter Button */}
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                disabled={!selectedProduct || !selectedMarket || loading}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Filter className="w-4 h-4" />
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {analyticsData && !loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {/* Minimum */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Minimum</span>
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(analyticsData.minPrice)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last {appliedDays} days</p>
            </div>

            {/* Average */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Average</span>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(analyticsData.averagePrice)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last {appliedDays} days</p>
            </div>

            {/* Maximum */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Maximum</span>
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(analyticsData.maxPrice)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last {appliedDays} days</p>
            </div>

            {/* Volatility */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Volatility</span>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${
                  analyticsData.volatility === 'Low' ? 'bg-green-100 text-green-700' :
                  analyticsData.volatility === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {analyticsData.volatility}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Price stability indicator</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-md">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="animate-spin rounded-full h-12 w-12 md:h-14 md:w-14 border-b-3 md:border-b-4 border-blue-600 mb-3 md:mb-4"></div>
              <p className="text-sm md:text-base font-bold text-gray-900 mb-1">Loading Analytics...</p>
              <p className="text-xs md:text-sm text-gray-500">Please wait while we fetch the data</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 rounded-full flex items-center justify-center mb-3 md:mb-4 shadow-sm">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm md:text-base font-bold text-gray-900 mb-1">Failed to Load</p>
              <p className="text-xs md:text-sm text-gray-600">{error}</p>
            </div>
          )}

          {!loading && !error && !analyticsData && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3 md:mb-4 shadow-sm">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm md:text-base font-bold text-gray-900 mb-1">No Data Selected</p>
              <p className="text-xs md:text-sm text-gray-600 text-center px-4">Select filters and click "Apply Filter" to view analytics</p>
            </div>
          )}

          {analyticsData && !loading && !error && (
            <>
              <div className="mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-bold text-gray-900">{analyticsData.productName}</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  {analyticsData.marketName} • Last {appliedDays} days
                </p>
              </div>

              {/* Desktop Chart */}
              <div className="hidden md:block">
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart 
                    data={analyticsData.history}
                    margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatChartDate}
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: '500' }}
                      tickLine={false}
                      axisLine={{ stroke: '#d1d5db' }}
                      height={40}
                      interval={appliedDays === 7 ? 0 : 'preserveStartEnd'}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: '500' }}
                      tickFormatter={(value) => `₱${value}`}
                      tickLine={false}
                      axisLine={{ stroke: '#d1d5db' }}
                      width={65}
                      domain={[
                        (dataMin: number) => appliedDays === 7 ? Math.floor(dataMin * 0.98) : Math.floor(dataMin * 0.95),
                        (dataMax: number) => appliedDays === 7 ? Math.ceil(dataMax * 1.02) : Math.ceil(dataMax * 1.05)
                      ]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                      }}
                      labelStyle={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '6px'
                      }}
                      itemStyle={{
                        fontSize: '12px',
                        color: '#2563eb',
                        fontWeight: '600',
                        padding: '2px 0'
                      }}
                      labelFormatter={(label) => formatDate(label)}
                      formatter={(value: number | undefined) => value ? [formatPrice(value), 'Price'] : ['', 'Price']}
                    />
                    <Line 
                      type="monotoneX" 
                      dataKey="price" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: 'white' }}
                      fill="url(#colorPrice)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile Chart */}
              <div className="block md:hidden">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart 
                    data={analyticsData.history}
                    margin={{ top: 10, right: 5, left: -20, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorPriceMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatChartDate}
                      stroke="#6b7280"
                      style={{ fontSize: '10px', fontWeight: '500' }}
                      tickLine={false}
                      axisLine={{ stroke: '#d1d5db' }}
                      height={35}
                      interval={selectedDays === 7 ? 'preserveStartEnd' : 'preserveStartEnd'}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '10px', fontWeight: '500' }}
                      tickFormatter={(value) => `₱${value}`}
                      tickLine={false}
                      axisLine={{ stroke: '#d1d5db' }}
                      width={50}
                      tick={{ fontSize: 10 }}
                      domain={[
                        (dataMin: number) => appliedDays === 7 ? Math.floor(dataMin * 0.98) : Math.floor(dataMin * 0.95),
                        (dataMax: number) => appliedDays === 7 ? Math.ceil(dataMax * 1.02) : Math.ceil(dataMax * 1.05)
                      ]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '11px'
                      }}
                      labelStyle={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '4px'
                      }}
                      itemStyle={{
                        fontSize: '10px',
                        color: '#2563eb',
                        fontWeight: '600',
                        padding: '1px 0'
                      }}
                      labelFormatter={(label) => formatDate(label)}
                      formatter={(value: number | undefined) => value ? [formatPrice(value), 'Price'] : ['', 'Price']}
                    />
                    <Line 
                      type="monotoneX" 
                      dataKey="price" 
                      stroke="#2563eb" 
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }}
                      fill="url(#colorPriceMobile)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Market Comparison Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-md mt-5">
          {comparisonLoading && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="animate-spin rounded-full h-12 w-12 md:h-14 md:w-14 border-b-3 md:border-b-4 border-blue-600 mb-3 md:mb-4"></div>
              <p className="text-sm md:text-base font-bold text-gray-900 mb-1">Loading Market Comparison...</p>
              <p className="text-xs md:text-sm text-gray-500">Please wait while we fetch the data</p>
            </div>
          )}

          {comparisonError && !comparisonLoading && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 rounded-full flex items-center justify-center mb-3 md:mb-4 shadow-sm">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm md:text-base font-bold text-gray-900 mb-1">Failed to Load</p>
              <p className="text-xs md:text-sm text-gray-600">{comparisonError}</p>
            </div>
          )}

          {!comparisonLoading && !comparisonError && marketComparisonData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3 md:mb-4 shadow-sm">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm md:text-base font-bold text-gray-900 mb-1">No Comparison Data</p>
              <p className="text-xs md:text-sm text-gray-600 text-center px-4">Select filters and click "Apply Filter" to view market comparison</p>
            </div>
          )}

          {marketComparisonData.length > 0 && !comparisonLoading && !comparisonError && (
            <>
              <div className="mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-bold text-gray-900">Market Price Comparison</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Average prices across different markets • Last {appliedDays} days
                </p>
              </div>

              {/* Desktop Bar Chart */}
              <div className="hidden md:block">
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart 
                    data={marketComparisonData}
                    margin={{ top: 20, right: 30, left: 50, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="marketName"
                      stroke="#374151"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `₱${value}`}
                      domain={[
                        (dataMin: number) => Math.floor(dataMin * 0.95),
                        (dataMax: number) => Math.ceil(dataMax * 1.05)
                      ]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number | undefined) => value ? formatPrice(value) : ''}
                    />
                    <Bar 
                      dataKey="averagePrice" 
                      radius={[4, 4, 0, 0]}
                    >
                      {marketComparisonData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isTargetMarket ? '#1e3a8a' : '#3b82f6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile Bar Chart */}
              <div className="block md:hidden">
                <ResponsiveContainer width="100%" height={Math.max(300, marketComparisonData.length * 35)}>
                  <BarChart 
                    data={marketComparisonData}
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number"
                      stroke="#6b7280"
                      style={{ fontSize: '10px' }}
                      tickFormatter={(value) => `₱${value}`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="marketName"
                      stroke="#374151"
                      style={{ fontSize: '9px' }}
                      width={100}
                      interval={0}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        fontSize: '11px'
                      }}
                      formatter={(value: number | undefined) => value ? formatPrice(value) : ''}
                    />
                    <Bar 
                      dataKey="averagePrice" 
                      radius={[0, 4, 4, 0]}
                    >
                      {marketComparisonData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isTargetMarket ? '#1e3a8a' : '#3b82f6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1e3a8a' }}></div>
                  <span className="text-xs sm:text-sm text-gray-700">Selected Market</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-xs sm:text-sm text-gray-700">Compared Markets</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Market Price Movements */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-md mt-5">
          {movementsLoading && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="animate-spin rounded-full h-12 w-12 md:h-14 md:w-14 border-b-3 md:border-b-4 border-blue-600 mb-3 md:mb-4"></div>
              <p className="text-sm md:text-base font-bold text-gray-900 mb-1">Loading Price Movements...</p>
              <p className="text-xs md:text-sm text-gray-500">Please wait while we fetch the data</p>
            </div>
          )}

          {movementsError && !movementsLoading && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 rounded-full flex items-center justify-center mb-3 md:mb-4 shadow-sm">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm md:text-base font-bold text-gray-900 mb-1">Failed to Load</p>
              <p className="text-xs md:text-sm text-gray-600">{movementsError}</p>
            </div>
          )}

          {!movementsLoading && !movementsError && !marketMovementsData && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3 md:mb-4 shadow-sm">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-sm md:text-base font-bold text-gray-900 mb-1">No Movement Data</p>
              <p className="text-xs md:text-sm text-gray-600 text-center px-4">Select filters and click "Apply Filter" to view price movements</p>
            </div>
          )}

          {marketMovementsData && !movementsLoading && !movementsError && (
            <>
              <div className="mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-bold text-gray-900">Market Price Movements</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Top gainers and decliners • Last {appliedDays} days
                </p>
              </div>

              {/* Combine and prepare data for diverging bar chart */}
              {(() => {
                const allMovements = [
                  ...marketMovementsData.topGainers.slice(0, 5),
                  ...marketMovementsData.topDecliners.slice(0, 5)
                ].sort((a, b) => b.percentageChange - a.percentageChange)

                return (
                  <>
                    {/* Desktop Chart */}
                    <div className="hidden md:block">
                      <ResponsiveContainer width="100%" height={Math.max(400, allMovements.length * 40)}>
                        <BarChart 
                          data={allMovements}
                          layout="vertical"
                          margin={{ top: 20, right: 40, left: 180, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            type="number"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <YAxis 
                            type="category"
                            dataKey="productName"
                            stroke="#374151"
                            style={{ fontSize: '12px' }}
                            width={170}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              padding: '8px 12px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number | undefined) => value !== undefined ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : ''}
                          />
                          <Bar 
                            dataKey="percentageChange" 
                            radius={[0, 2, 2, 0]}
                          >
                            {allMovements.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.trend === 'UP' ? '#2563eb' : '#ef4444'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Mobile Chart */}
                    <div className="block md:hidden">
                      <ResponsiveContainer width="100%" height={Math.max(400, allMovements.length * 40)}>
                        <BarChart 
                          data={allMovements}
                          layout="vertical"
                          margin={{ top: 10, right: 35, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            type="number"
                            stroke="#6b7280"
                            style={{ fontSize: '10px' }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <YAxis 
                            type="category"
                            dataKey="productName"
                            stroke="#374151"
                            style={{ fontSize: '9px' }}
                            width={100}
                            interval={0}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              fontSize: '11px'
                            }}
                            formatter={(value: number | undefined) => value !== undefined ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : ''}
                          />
                          <Bar 
                            dataKey="percentageChange" 
                            radius={[0, 3, 3, 0]}
                          >
                            {allMovements.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.trend === 'UP' ? '#2563eb' : '#ef4444'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2563eb' }}></div>
                        <span className="text-xs sm:text-sm text-gray-700">Price Increase</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                        <span className="text-xs sm:text-sm text-gray-700">Price Decrease</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
