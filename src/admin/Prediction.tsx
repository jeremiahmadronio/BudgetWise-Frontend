import React, { useState, useEffect } from 'react'
import {
  fetchDashboardStats,
  fetchActiveMarkets,
  fetchProductCentricPredictions,
  fetchMarketCentricPredictions,
  triggerBulkPrediction,
  formatPrice,
  formatTrendPercentage,
  formatConfidence,
  getConfidenceLevel,
  getTrendIcon,
  formatMarketName,
  formatLocation,
  type DashboardStatsDTO,
  type MarketInfoDTO,
  type ProductCentricPredictionDTO,
  type PriceCalibrationDTO
} from '../admin-api/prediction-api'

type ViewMode = 'product' | 'market' | 'comparison' | 'anomaly'

export function Prediction() {
  // State for dashboard stats
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // State for markets
  const [markets, setMarkets] = useState<MarketInfoDTO[]>([])
  const [selectedMarket, setSelectedMarket] = useState<MarketInfoDTO | null>(null)

  // State for view mode
  const [viewMode, setViewMode] = useState<ViewMode>('product')

  // State for product-centric view
  const [productPredictions, setProductPredictions] = useState<ProductCentricPredictionDTO[]>([])
  const [productLoading, setProductLoading] = useState(false)
  const [productPage, setProductPage] = useState(0)
  const [productTotalPages, setProductTotalPages] = useState(0)

  // State for market-centric view
  const [marketPredictions, setMarketPredictions] = useState<PriceCalibrationDTO[]>([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketPage, setMarketPage] = useState(0)
  const [marketTotalPages, setMarketTotalPages] = useState(0)

  // State for comparison matrix
  const [comparisonData, setComparisonData] = useState<ProductCentricPredictionDTO[]>([])
  const [comparisonLoading, setComparisonLoading] = useState(false)

  // State for search
  const [searchTerm, setSearchTerm] = useState('')

  // State for bulk prediction
  const [bulkPredictionRunning, setBulkPredictionRunning] = useState(false)

  // Fetch dashboard stats on mount
  useEffect(() => {
    loadDashboardStats()
    loadMarkets()
    loadComparisonMatrix() // Pre-load comparison data for faster switching
  }, [])

  // Load stats
  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true)
      const data = await fetchDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  // Load markets
  const loadMarkets = async () => {
    try {
      const data = await fetchActiveMarkets()
      setMarkets(data)
      if (data.length > 0) {
        setSelectedMarket(data[0])
      }
    } catch (error) {
      console.error('Failed to load markets:', error)
    }
  }

  // Load product-centric view on mount or page change
  useEffect(() => {
    if (viewMode === 'product') {
      loadProductPredictions()
    }
  }, [viewMode, productPage])

  // Load market-centric view when market or page changes
  useEffect(() => {
    if (viewMode === 'market' && selectedMarket) {
      loadMarketPredictions()
    }
  }, [viewMode, selectedMarket, marketPage])

  // Comparison matrix is pre-loaded on mount for faster view switching

  const loadProductPredictions = async () => {
    try {
      setProductLoading(true)
      const data = await fetchProductCentricPredictions(productPage, 10, 'productName', 'ASC')
      setProductPredictions(data.content)
      setProductTotalPages(data.page.totalPages)
    } catch (error) {
      console.error('Failed to load product predictions:', error)
    } finally {
      setProductLoading(false)
    }
  }

  const loadMarketPredictions = async () => {
    if (!selectedMarket) return

    try {
      setMarketLoading(true)
      const data = await fetchMarketCentricPredictions(
        selectedMarket.id,
        marketPage,
        20,
        'productName',
        'ASC'
      )
      setMarketPredictions(data.content)
      setMarketTotalPages(data.page.totalPages)
    } catch (error) {
      console.error('Failed to load market predictions:', error)
    } finally {
      setMarketLoading(false)
    }
  }

  const loadComparisonMatrix = async () => {
    try {
      setComparisonLoading(true)
      // Fetch with large page size to get all products for comparison dropdown
      const data = await fetchProductCentricPredictions(0, 1000, 'productName', 'ASC')
      setComparisonData(data.content)
    } catch (error) {
      console.error('Failed to load comparison matrix:', error)
    } finally {
      setComparisonLoading(false)
    }
  }

  const handleBulkPrediction = async () => {
    if (bulkPredictionRunning) return

    try {
      setBulkPredictionRunning(true)
      await triggerBulkPrediction()
      
      // Show success message
      alert('Bulk prediction started successfully! Predictions will be updated in the background.')
      
      // Reload data after a delay
      setTimeout(() => {
        loadDashboardStats()
        if (viewMode === 'product') loadProductPredictions()
        if (viewMode === 'market') loadMarketPredictions()
        if (viewMode === 'comparison') loadComparisonMatrix()
        setBulkPredictionRunning(false)
      }, 3000)
    } catch (error) {
      console.error('Failed to trigger bulk prediction:', error)
      alert('Failed to trigger bulk prediction. Please try again.')
      setBulkPredictionRunning(false)
    }
  }

  // Filter products based on search
  const filteredProducts = productPredictions.filter(p =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 pt-2 md:pt-4 pb-4 md:pb-8">
        {/* Header */}
        <div className="mb-4 md:mb-5 flex justify-between items-start">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Price Prediction Intelligence
            </h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Enterprise-grade cross-market analysis
            </p>
          </div>
          
          {/* Bulk Prediction Button */}
          <button
            onClick={handleBulkPrediction}
            disabled={bulkPredictionRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all ${
              bulkPredictionRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <svg
              className={`w-5 h-5 ${bulkPredictionRunning ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {bulkPredictionRunning ? 'Running...' : 'Run Bulk Prediction'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Total Products */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">TOTAL PRODUCTS</p>
            <p className="text-3xl font-bold text-gray-900">
              {statsLoading ? '...' : stats?.totalProducts || 0}
            </p>
          </div>

          {/* Active Markets */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">ACTIVE MARKETS</p>
            <p className="text-3xl font-bold text-blue-600">
              {statsLoading ? '...' : stats?.activeMarkets || 0}
            </p>
          </div>

          {/* Model Accuracy */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">MODEL ACCURACY</p>
            <p className="text-3xl font-bold text-green-600">
              {statsLoading ? '...' : `${stats?.modelAccuracy.toFixed(1)}%` || '0%'}
            </p>
          </div>

          {/* Anomalies */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">ANOMALIES</p>
            <p className="text-3xl font-bold text-red-600">
              {statsLoading ? '...' : stats?.anomalies || 0}
            </p>
          </div>
        </div>

        {/* View Switcher & Search */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('product')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'product'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Product View
              </button>

              <button
                onClick={() => setViewMode('market')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'market'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Market View
              </button>

              <button
                onClick={() => setViewMode('comparison')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'comparison'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Comparison Matrix
              </button>

              <button
                onClick={() => setViewMode('anomaly')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'anomaly'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Anomaly Detection
              </button>
            </div>

            {/* Market Selector (for Market View) */}
            {viewMode === 'market' && (
              <select
                value={selectedMarket?.id || ''}
                onChange={(e) => {
                  const market = markets.find(m => m.id === Number(e.target.value))
                  setSelectedMarket(market || null)
                  setMarketPage(0) // Reset to first page when changing market
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {markets.map(market => (
                  <option key={market.id} value={market.id}>
                    {formatMarketName(market.name)} - {formatLocation(market.location)}
                  </option>
                ))}
              </select>
            )}

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'product' && (
          <ProductView
            products={searchTerm ? filteredProducts : productPredictions}
            loading={productLoading}
            page={productPage}
            totalPages={productTotalPages}
            onPageChange={setProductPage}
          />
        )}

        {viewMode === 'market' && selectedMarket && (
          <MarketView
            predictions={marketPredictions}
            loading={marketLoading}
            market={selectedMarket}
            page={marketPage}
            totalPages={marketTotalPages}
            onPageChange={setMarketPage}
          />
        )}

        {viewMode === 'comparison' && (
          <ComparisonView
            data={comparisonData}
            loading={comparisonLoading}
            markets={markets}
          />
        )}

        {viewMode === 'anomaly' && (
          <AnomalyView
            data={comparisonData}
            loading={comparisonLoading}
          />
        )}
      </div>
    </div>
  )
}

// ===========================
// Product View Component
// ===========================
interface ProductViewProps {
  products: ProductCentricPredictionDTO[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function ProductView({ products, loading, page, totalPages, onPageChange }: ProductViewProps) {
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const [marketPages, setMarketPages] = useState<Record<number, number>>({})

  // Get current page for a specific product's markets
  const getMarketPage = (productId: number) => marketPages[productId] || 0

  // Set page for a specific product's markets
  const setMarketPage = (productId: number, page: number) => {
    setMarketPages(prev => ({ ...prev, [productId]: page }))
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading predictions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Product Cards */}
      {products.map((product) => (
        <div key={product.productId} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Product Header - Compact */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex-1 grid grid-cols-6 gap-6 items-center">
              {/* Product Info */}
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-gray-900">{product.productName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{product.productCode}</p>
              </div>

              {/* Avg Current */}
              <div>
                <p className="text-xs text-gray-500">Current</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatPrice(product.averageCurrentPrice)}
                </p>
              </div>

              {/* Avg Forecast */}
              <div>
                <p className="text-xs text-gray-500">Forecast</p>
                <p className="text-sm font-semibold text-blue-600">
                  {formatPrice(product.averageForecastPrice)}
                </p>
              </div>

              {/* Markets Count */}
              <div>
                <p className="text-xs text-gray-500">Markets</p>
                <p className="text-sm font-semibold text-gray-900">
                  {product.totalMarkets}
                </p>
              </div>

              {/* Action */}
              <div className="text-right">
                <button
                  onClick={() => setExpandedProduct(expandedProduct === product.productId ? null : product.productId)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto"
                >
                  {expandedProduct === product.productId ? 'Hide' : 'View'}
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedProduct === product.productId ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Market Predictions Table (Expandable) */}
          {expandedProduct === product.productId && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Forecast</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trend</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    const currentPage = getMarketPage(product.productId)
                    const marketsPerPage = 10
                    const startIdx = currentPage * marketsPerPage
                    const endIdx = startIdx + marketsPerPage
                    const paginatedMarkets = product.marketPredictions.slice(startIdx, endIdx)
                    
                    return paginatedMarkets.map((market) => (
                      <tr key={market.marketId} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <div className="text-sm font-medium text-gray-900">{formatMarketName(market.marketName)}</div>
                          <div className="text-xs text-gray-500">{formatLocation(market.marketLocation)}</div>
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                          {formatPrice(market.currentPrice)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {market.forecastPrice && market.forecastPrice > 0 ? (
                            <span className="text-sm font-semibold text-blue-600">
                              {formatPrice(market.forecastPrice)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {market.forecastPrice && market.forecastPrice > 0 ? (
                            <span className={`text-sm font-medium ${
                              market.trendPercentage > 0 ? 'text-red-600' :
                              market.trendPercentage < 0 ? 'text-green-600' :
                              'text-gray-600'
                            }`}>
                              {formatTrendPercentage(market.trendPercentage)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center">
                          {market.forecastPrice && market.forecastPrice > 0 ? (
                            <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                              getConfidenceLevel(market.confidenceScore) === 'HIGH' ? 'bg-green-100 text-green-700' :
                              getConfidenceLevel(market.confidenceScore) === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {formatConfidence(market.confidenceScore)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-block text-xs px-2 py-1 rounded ${
                            market.status === 'NORMAL' ? 'bg-green-100 text-green-700' :
                            market.status === 'NO_DATA' ? 'bg-gray-100 text-gray-600' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {market.status === 'NO_DATA' ? 'No Data' : market.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
              
              {/* Market Pagination */}
              {product.marketPredictions.length > 10 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setMarketPage(product.productId, Math.max(0, getMarketPage(product.productId) - 1))}
                    disabled={getMarketPage(product.productId) === 0}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-600">
                    Showing {getMarketPage(product.productId) * 10 + 1}-{Math.min((getMarketPage(product.productId) + 1) * 10, product.marketPredictions.length)} of {product.marketPredictions.length} markets
                  </span>
                  <button
                    onClick={() => setMarketPage(product.productId, getMarketPage(product.productId) + 1)}
                    disabled={(getMarketPage(product.productId) + 1) * 10 >= product.marketPredictions.length}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

// ===========================
// Market View Component
// ===========================
interface MarketViewProps {
  predictions: PriceCalibrationDTO[]
  loading: boolean
  market: MarketInfoDTO
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function MarketView({ predictions, loading, market, page, totalPages, onPageChange }: MarketViewProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading market predictions...</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Market Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">{formatMarketName(market.name)}</h3>
        <p className="text-sm text-gray-600">{formatLocation(market.location)}</p>
      </div>

      {predictions.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">No predictions available for this market.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Current Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Forecast Price</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Trend</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Confidence</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {predictions.map((pred) => (
                  <tr key={pred.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{pred.productName || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">
                      {pred.currentPrice ? formatPrice(pred.currentPrice) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-600">
                      {pred.forecastPrice ? formatPrice(pred.forecastPrice) : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {pred.trendPercentage !== undefined && pred.trendPercentage !== null ? (
                        <span className={`font-medium ${
                          pred.trendPercentage > 0 ? 'text-red-600' : pred.trendPercentage < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {formatTrendPercentage(pred.trendPercentage)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {pred.confidenceScore !== undefined && pred.confidenceScore !== null ? (
                        <>
                          <span className="font-medium text-gray-900">
                            {formatConfidence(pred.confidenceScore)}
                          </span>
                          <span className={`ml-2 text-xs ${
                            getConfidenceLevel(pred.confidenceScore) === 'HIGH' ? 'text-green-600' :
                            getConfidenceLevel(pred.confidenceScore) === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {getConfidenceLevel(pred.confidenceScore)}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded ${
                        pred.status === 'Normal' ? 'bg-green-100 text-green-700' : 
                        pred.status === 'Anomaly' ? 'bg-red-100 text-red-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {pred.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ===========================
// Comparison View Component
// ===========================
interface ComparisonViewProps {
  data: ProductCentricPredictionDTO[]
  loading: boolean
  markets: MarketInfoDTO[]
}

function ComparisonView({ data, loading, markets }: ComparisonViewProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [market1Id, setMarket1Id] = useState<number | null>(null)
  const [market2Id, setMarket2Id] = useState<number | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Set defaults when data loads
  useEffect(() => {
    if (data.length > 0 && !selectedProductId) {
      setSelectedProductId(data[0].productId)
    }
    if (markets.length >= 2 && !market1Id) {
      setMarket1Id(markets[0].id)
      setMarket2Id(markets[1].id)
    }
  }, [data, markets])

  // Filter products based on search
  const filteredProducts = data.filter(p => 
    p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.productCode.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Only show loading if there's no data yet (initial load)
  // If data exists, show it immediately even if refreshing
  if (loading && data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading comparison matrix...</p>
      </div>
    )
  }

  // Get selected product for display
  const selectedProduct = data.find(p => p.productId === selectedProductId)
  const market1 = markets.find(m => m.id === market1Id)
  const market2 = markets.find(m => m.id === market2Id)

  const market1Pred = selectedProduct?.marketPredictions.find(mp => mp.marketId === market1Id)
  const market2Pred = selectedProduct?.marketPredictions.find(mp => mp.marketId === market2Id)

  return (
    <div className="space-y-5">
      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Compare Markets</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Product Combobox */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search products..."
                value={selectedProduct ? selectedProduct.productName : productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setSelectedProductId(null)
                  setShowProductDropdown(true)
                }}
                onFocus={() => setShowProductDropdown(true)}
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Dropdown */}
            {showProductDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.productId}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    onClick={() => {
                      setSelectedProductId(product.productId)
                      setProductSearch('')
                      setShowProductDropdown(false)
                    }}
                  >
                    <div className="font-medium text-gray-900">{product.productName}</div>
                    <div className="text-xs text-gray-500">{product.productCode}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Market 1 Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Market 1
            </label>
            <select
              value={market1Id || ''}
              onChange={(e) => setMarket1Id(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {markets.map(market => (
                <option key={market.id} value={market.id}>
                  {formatMarketName(market.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Market 2 Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Market 2
            </label>
            <select
              value={market2Id || ''}
              onChange={(e) => setMarket2Id(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {markets.map(market => (
                <option key={market.id} value={market.id}>
                  {formatMarketName(market.name)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      {selectedProduct && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Product Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.productName}</h2>
            <p className="text-sm text-gray-600 mt-1">{selectedProduct.productCode}</p>
            <div className="flex gap-6 mt-3 text-sm">
              <div>
                <span className="text-gray-600">Avg Current: </span>
                <span className="font-semibold text-gray-900">{formatPrice(selectedProduct.averageCurrentPrice)}</span>
              </div>
              <div>
                <span className="text-gray-600">Avg Forecast: </span>
                <span className="font-semibold text-blue-600">{formatPrice(selectedProduct.averageForecastPrice)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Markets: </span>
                <span className="font-semibold text-gray-900">{selectedProduct.totalMarkets}</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market 1 Card */}
              {market1 && (
                <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-blue-50">
                  <div className="bg-blue-600 px-5 py-3">
                    <h3 className="text-lg font-bold text-white">{formatMarketName(market1.name)}</h3>
                    <p className="text-sm text-blue-100">{formatLocation(market1.location)}</p>
                  </div>
                  
                  {!market1Pred ? (
                    <div className="p-8 text-center text-gray-500">
                      No prediction data available
                    </div>
                  ) : (
                    <div className="p-6 bg-white space-y-4">
                      {/* Current Price */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">Current Price</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(market1Pred.currentPrice)}
                        </span>
                      </div>

                      {/* Forecast Price */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">Forecast Price</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(market1Pred.forecastPrice)}
                        </span>
                      </div>

                      {/* Price Difference */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">Price Difference</span>
                        <span className="text-xl font-semibold text-gray-900">
                          {formatPrice(Math.abs(market1Pred.forecastPrice - market1Pred.currentPrice))}
                        </span>
                      </div>

                      {/* Trend */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">Trend</span>
                        <span className={`text-2xl font-bold ${
                          market1Pred.trendPercentage > 0 ? 'text-red-600' : 
                          market1Pred.trendPercentage < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {formatTrendPercentage(market1Pred.trendPercentage)}
                        </span>
                      </div>

                      {/* Confidence */}
                      <div className="flex items-center justify-between py-3">
                        <span className="text-gray-700 font-medium">Confidence</span>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {formatConfidence(market1Pred.confidenceScore)}
                          </div>
                          <div className={`text-sm font-semibold ${
                            getConfidenceLevel(market1Pred.confidenceScore) === 'HIGH' ? 'text-green-600' :
                            getConfidenceLevel(market1Pred.confidenceScore) === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {getConfidenceLevel(market1Pred.confidenceScore)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Market 2 Card */}
              {market2 && (
                <div className="border-2 border-green-200 rounded-xl overflow-hidden bg-green-50">
                  <div className="bg-green-600 px-5 py-3">
                    <h3 className="text-lg font-bold text-white">{formatMarketName(market2.name)}</h3>
                    <p className="text-sm text-green-100">{formatLocation(market2.location)}</p>
                  </div>
                  
                  {!market2Pred ? (
                    <div className="p-8 text-center text-gray-500">
                      No prediction data available
                    </div>
                  ) : (
                    <div className="p-6 bg-white space-y-4">
                      {/* Current Price */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">Current Price</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(market2Pred.currentPrice)}
                        </span>
                      </div>

                      {/* Forecast Price */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">Forecast Price</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(market2Pred.forecastPrice)}
                        </span>
                      </div>

                      {/* Price Difference */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">Price Difference</span>
                        <span className="text-xl font-semibold text-gray-900">
                          {formatPrice(Math.abs(market2Pred.forecastPrice - market2Pred.currentPrice))}
                        </span>
                      </div>

                      {/* Trend */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">Trend</span>
                        <span className={`text-2xl font-bold ${
                          market2Pred.trendPercentage > 0 ? 'text-red-600' : 
                          market2Pred.trendPercentage < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {formatTrendPercentage(market2Pred.trendPercentage)}
                        </span>
                      </div>

                      {/* Confidence */}
                      <div className="flex items-center justify-between py-3">
                        <span className="text-gray-700 font-medium">Confidence</span>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {formatConfidence(market2Pred.confidenceScore)}
                          </div>
                          <div className={`text-sm font-semibold ${
                            getConfidenceLevel(market2Pred.confidenceScore) === 'HIGH' ? 'text-green-600' :
                            getConfidenceLevel(market2Pred.confidenceScore) === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {getConfidenceLevel(market2Pred.confidenceScore)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comparison Summary */}
            {market1Pred && market2Pred && market1 && market2 && (
              <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Comparison Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Price Difference */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Current Price Difference</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(Math.abs(market1Pred.currentPrice - market2Pred.currentPrice))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {market1Pred.currentPrice > market2Pred.currentPrice 
                        ? `${market1.name} is more expensive` 
                        : `${market2.name} is more expensive`}
                    </p>
                  </div>

                  {/* Forecast Difference */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Forecast Price Difference</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(Math.abs(market1Pred.forecastPrice - market2Pred.forecastPrice))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {market1Pred.forecastPrice > market2Pred.forecastPrice 
                        ? `${market1.name} will be more expensive` 
                        : `${market2.name} will be more expensive`}
                    </p>
                  </div>

                  {/* Better Deal */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Better Deal (Forecast)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {market1Pred.forecastPrice < market2Pred.forecastPrice ? market1.name : market2.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Lower predicted price
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ===========================
// Anomaly View Component
// ===========================
interface AnomalyViewProps {
  data: ProductCentricPredictionDTO[]
  loading: boolean
}

interface PriceHistoryData {
  regressionInput: Array<{ date: string; price: number; x: number }>
  productId: number
  regressionStats: {
    intercept: number
    rSquare: number
    slope: number
    slopeDirection: string
  }
  change: number
  changePercent: number
  dataPoints: number
  currentPrice: number
  rawHistory: Array<{ date: string; price: number }>
  tomorrowPrice: number
  predictions: Array<{ date: string; predictedPrice: number; day: number }>
  marketId: number
}

function AnomalyView({ data, loading }: AnomalyViewProps) {
  const [inspectingAnomaly, setInspectingAnomaly] = useState<{productId: number, marketId: number} | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [historyData, setHistoryData] = useState<PriceHistoryData | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [overrideType, setOverrideType] = useState('NO_OVERRIDE')
  const [overrideReason, setOverrideReason] = useState('')
  const itemsPerPage = 10

  // Get all anomalies from all products
  const anomalies: Array<{
    productId: number
    productName: string
    productCode: string
    marketId: number
    marketName: string
    marketLocation: string
    currentPrice: number
    forecastPrice: number
    trendPercentage: number
    confidenceScore: number
    status: string
  }> = []

  data.forEach(product => {
    product.marketPredictions
      .filter(mp => mp.status.toUpperCase() === 'ANOMALY')
      .forEach(mp => {
        anomalies.push({
          productId: product.productId,
          productName: product.productName,
          productCode: product.productCode,
          marketId: mp.marketId,
          marketName: mp.marketName,
          marketLocation: mp.marketLocation,
          currentPrice: mp.currentPrice,
          forecastPrice: mp.forecastPrice,
          trendPercentage: mp.trendPercentage,
          confidenceScore: mp.confidenceScore,
          status: mp.status
        })
      })
  })

  // Pagination
  const totalPages = Math.ceil(anomalies.length / itemsPerPage)
  const startIdx = currentPage * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedAnomalies = anomalies.slice(startIdx, endIdx)

  // Fetch price history when inspecting
  const fetchPriceHistory = async (productId: number, marketId: number) => {
    try {
      setHistoryLoading(true)
      const response = await fetch(
        `http://localhost:8080/api/v1/predictions/debug/history?productId=${productId}&marketId=${marketId}`
      )
      if (!response.ok) throw new Error('Failed to fetch history')
      const data = await response.json()
      setHistoryData(data)
    } catch (error) {
      console.error('Failed to fetch price history:', error)
      setHistoryData(null)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Handle inspect click
  const handleInspect = (productId: number, marketId: number) => {
    if (inspectingAnomaly?.productId === productId && inspectingAnomaly?.marketId === marketId) {
      setInspectingAnomaly(null)
      setHistoryData(null)
      setOverrideType('NO_OVERRIDE')
      setOverrideReason('')
    } else {
      setInspectingAnomaly({ productId, marketId })
      fetchPriceHistory(productId, marketId)
    }
  }

  // Calculate override price
  const calculateOverridePrice = (currentPrice: number, overrideType: string): number => {
    switch (overrideType) {
      case 'NO_OVERRIDE':
      case 'STABILIZE':
        return currentPrice
      case '+10% INCREASE':
        return currentPrice * 1.10
      case '+20% INCREASE':
        return currentPrice * 1.20
      case '+30% INCREASE':
        return currentPrice * 1.30
      case '+50% INCREASE':
        return currentPrice * 1.50
      case '-10% DECREASE':
        return currentPrice * 0.90
      case '-20% DECREASE':
        return currentPrice * 0.80
      case '-30% DECREASE':
        return currentPrice * 0.70
      case '-50% DECREASE':
        return currentPrice * 0.50
      default:
        return currentPrice
    }
  }

  if (loading && data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading anomaly detection...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-white px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2.5 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Anomaly Detection
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Products with unusual price patterns requiring attention
                  </p>
                </div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl px-6 py-3">
                <p className="text-3xl font-bold text-red-600">{anomalies.length}</p>
                <p className="text-xs text-gray-600 uppercase tracking-wide mt-1">Anomalies Detected</p>
              </div>
            </div>
          </div>

        {/* Anomaly Table */}
        {anomalies.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl font-bold text-gray-900">All Clear!</p>
            <p className="text-sm text-gray-600 mt-2">No anomalies detected in current predictions.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Market</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Current Price</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Forecast</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Trend</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Confidence</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedAnomalies.map((anomaly) => (
                    <tr key={`${anomaly.productId}-${anomaly.marketId}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{anomaly.productName}</div>
                        <div className="text-xs text-blue-600 mt-0.5">Product ID: {anomaly.productId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{formatMarketName(anomaly.marketName)}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{formatLocation(anomaly.marketLocation)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-semibold text-gray-900">{formatPrice(anomaly.currentPrice)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-semibold text-blue-600">{formatPrice(anomaly.forecastPrice)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {anomaly.trendPercentage > 0 ? (
                            <div className="bg-red-100 p-1 rounded">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                          ) : (
                            <div className="bg-green-100 p-1 rounded">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                              </svg>
                            </div>
                          )}
                          <span className={`font-semibold ${
                            anomaly.trendPercentage > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {anomaly.trendPercentage > 0 ? '+' : ''}{anomaly.trendPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-bold text-gray-900">{(anomaly.confidenceScore * 100).toFixed(0)}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                anomaly.confidenceScore > 0.7 ? 'bg-green-500' :
                                anomaly.confidenceScore > 0.4 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${anomaly.confidenceScore * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleInspect(anomaly.productId, anomaly.marketId)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2.5 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold text-sm transition-colors"
                >
                  Previous
                </button>
                <div className="text-center">
                  <span className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{startIdx + 1}-{Math.min(endIdx, anomalies.length)}</span> of <span className="font-semibold text-gray-900">{anomalies.length}</span> anomalies
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Page {currentPage + 1} of {totalPages}</p>
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 py-2.5 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>

      {/* Modal Popup for Inspection */}
      {inspectingAnomaly && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setInspectingAnomaly(null)
            setHistoryData(null)
            setOverrideType('NO_OVERRIDE')
            setOverrideReason('')
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-xl z-10">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Anomaly Detection Report</h3>
                  <p className="text-xs text-gray-600">Product ID: {inspectingAnomaly.productId} • Market ID: {inspectingAnomaly.marketId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setInspectingAnomaly(null)
                  setHistoryData(null)
                  setOverrideType('NO_OVERRIDE')
                  setOverrideReason('')
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {historyLoading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading price history...</p>
                </div>
              ) : historyData ? (
                <>
                  {/* Price Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Current Price */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 p-1.5 rounded">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-600">Current Price</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{formatPrice(historyData.currentPrice)}</p>
                      <p className="text-xs text-gray-500 mt-1">Market price today</p>
                    </div>

                    {/* Forecast Price */}
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 p-1.5 rounded">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-600">AI Forecast</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{formatPrice(historyData.tomorrowPrice)}</p>
                      <p className="text-xs text-gray-500 mt-1">Predicted price tomorrow</p>
                    </div>

                    {/* Anomaly Explanation */}
                    <div className={`bg-white border-2 rounded-xl p-5 ${
                      Math.abs(historyData.changePercent) > 30 ? 'border-red-200' : 'border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded ${
                          Math.abs(historyData.changePercent) > 30 ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          <svg className={`w-4 h-4 ${
                            Math.abs(historyData.changePercent) > 30 ? 'text-red-600' : 'text-yellow-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-600">Anomaly Reason</span>
                      </div>
                      <p className={`text-3xl font-bold ${
                        historyData.changePercent > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {historyData.changePercent > 0 ? '+' : ''}{historyData.changePercent.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {Math.abs(historyData.changePercent) > 30 ? 'Extreme' : 'Significant'} price {historyData.changePercent > 0 ? 'increase' : 'decrease'} detected
                      </p>
                    </div>
                  </div>

                  {/* Chart Section */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                      Price Trend Analysis
                    </h4>
                    
                    {/* Legend */}
                    <div className="flex gap-6 mb-4 text-sm bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-blue-500"></div>
                        <span className="text-gray-700 font-medium">Historical Price</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-green-500 border-t-2 border-dashed border-green-500"></div>
                        <span className="text-gray-700 font-medium">AI Prediction</span>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <svg viewBox="0 0 800 240" className="w-full" style={{ height: '260px' }}>
                        {(() => {
                          // Group prices by date and average them to smooth the zigzag pattern
                          const dateMap = new Map<string, number[]>()
                          historyData.regressionInput.forEach(point => {
                            if (!dateMap.has(point.date)) {
                              dateMap.set(point.date, [])
                            }
                            dateMap.get(point.date)!.push(point.price)
                          })

                          // Create smoothed historical data by averaging prices per date
                          const smoothedHistory = Array.from(dateMap.entries())
                            .map(([date, prices]) => ({
                              date,
                              price: prices.reduce((sum, p) => sum + p, 0) / prices.length
                            }))
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                          const historicalPrices = smoothedHistory.map(p => p.price)
                          const predictionPrices = historyData.predictions.map(p => p.predictedPrice)
                          const allPrices = [...historicalPrices, ...predictionPrices]
                          const maxPrice = Math.max(...allPrices)
                          const minPrice = Math.min(...allPrices)
                          const priceRange = maxPrice - minPrice || 1

                          const chartHeight = 160
                          const chartTop = 30
                          const chartBottom = chartHeight + chartTop
                          const chartWidth = 760
                          const chartLeft = 30

                          // Calculate points using smoothed data
                          const totalPoints = smoothedHistory.length + historyData.predictions.length
                          const historicalPoints = smoothedHistory.map((point, idx) => {
                            const x = chartLeft + (idx / (totalPoints - 1)) * chartWidth
                            const y = chartTop + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight
                            return { x, y, price: point.price, date: point.date }
                          })

                          const predictionPoints = historyData.predictions.map((pred, idx) => {
                            const x = chartLeft + ((smoothedHistory.length + idx) / (totalPoints - 1)) * chartWidth
                            const y = chartTop + chartHeight - ((pred.predictedPrice - minPrice) / priceRange) * chartHeight
                            return { x, y, price: pred.predictedPrice, date: pred.date }
                          })

                          // Get date labels
                          const getDateLabel = (dateStr: string) => {
                            const date = new Date(dateStr)
                            const month = date.toLocaleString('default', { month: 'short' })
                            return `${month} ${date.getDate()}`
                          }

                          const dateLabels = [
                            { x: chartLeft, label: '30 days ago' },
                            { x: chartLeft + chartWidth * 0.33, label: '15 days ago' },
                            { x: historicalPoints[historicalPoints.length - 1]?.x || chartLeft + chartWidth * 0.66, label: 'Today' },
                            { x: chartLeft + chartWidth, label: '+7 days' }
                          ]

                          return (
                            <>
                              {/* Horizontal grid lines */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                                const y = chartTop + chartHeight * ratio
                                return (
                                  <line 
                                    key={`grid-${idx}`} 
                                    x1={chartLeft} 
                                    y1={y} 
                                    x2={chartLeft + chartWidth} 
                                    y2={y} 
                                    stroke="#f3f4f6" 
                                    strokeWidth="1"
                                  />
                                )
                              })}

                              {/* Y-axis labels */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                                const y = chartTop + chartHeight * ratio
                                const price = maxPrice - (priceRange * ratio)
                                return (
                                  <text 
                                    key={`ylabel-${idx}`} 
                                    x={chartLeft - 10} 
                                    y={y + 4} 
                                    textAnchor="end" 
                                    fontSize="11" 
                                    fill="#9ca3af"
                                    fontFamily="system-ui, -apple-system, sans-serif"
                                  >
                                    ₱{Math.round(price)}
                                  </text>
                                )
                              })}

                              {/* Historical line (blue solid) */}
                              <polyline
                                points={historicalPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2.5"
                              />

                              {/* Prediction line (green dashed) */}
                              {predictionPoints.length > 0 && (
                                <polyline
                                  points={predictionPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="2.5"
                                  strokeDasharray="6,4"
                                />
                              )}

                              {/* X-axis labels */}
                              {dateLabels.map((label, idx) => (
                                <text 
                                  key={`xlabel-${idx}`} 
                                  x={label.x} 
                                  y={chartBottom + 25} 
                                  textAnchor="middle" 
                                  fontSize="11" 
                                  fill="#9ca3af"
                                  fontFamily="system-ui, -apple-system, sans-serif"
                                >
                                  {label.label}
                                </text>
                              ))}
                            </>
                          )
                        })()}
                      </svg>

                      {/* Bottom stats */}
                      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">Current: <span className="font-semibold text-gray-900">{formatPrice(historyData.currentPrice)}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600">Forecast: <span className="font-semibold text-green-700">{formatPrice(historyData.tomorrowPrice)}</span></span>
                        </div>
                        <div>
                          <span className="text-gray-600">Change: </span>
                          <span className={`font-semibold ${historyData.changePercent > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {historyData.changePercent > 0 ? '+' : ''}{historyData.changePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Data Points</p>
                        <p className="text-2xl font-bold text-gray-900">{historyData.dataPoints}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">R² Score</p>
                        <p className="text-2xl font-bold text-gray-900">{historyData.regressionStats.rSquare.toFixed(3)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Slope</p>
                        <p className="text-2xl font-bold text-gray-900">{historyData.regressionStats.slope.toFixed(2)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Trend</p>
                        <p className="text-lg font-bold text-gray-900">{historyData.regressionStats.slopeDirection}</p>
                      </div>
                    </div>
                  </div>

                  {/* Manual Override Section */}
                  <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <div className="bg-indigo-100 p-1.5 rounded">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      Manual Price Override
                    </h4>
                    <p className="text-sm text-gray-600 mb-4 ml-9">Adjust the AI prediction with manual price controls</p>

                    <div className="space-y-4">
                      {/* Override Type Selector */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Override Type</label>
                        <select
                          value={overrideType}
                          onChange={(e) => setOverrideType(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium"
                        >
                          <option value="NO_OVERRIDE">No Override</option>
                          <option value="STABILIZE">Stabilize Price</option>
                          <option value="+10% INCREASE">+10% Increase</option>
                          <option value="+20% INCREASE">+20% Increase</option>
                          <option value="+30% INCREASE">+30% Increase</option>
                          <option value="+50% INCREASE">+50% Increase</option>
                          <option value="-10% DECREASE">-10% Decrease</option>
                          <option value="-20% DECREASE">-20% Decrease</option>
                          <option value="-30% DECREASE">-30% Decrease</option>
                          <option value="-50% DECREASE">-50% Decrease</option>
                        </select>
                      </div>

                      {/* Calculated Override Price */}
                      <div className="bg-indigo-50 rounded-lg p-5 border-2 border-indigo-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">New Override Price</p>
                        <p className="text-3xl font-bold text-indigo-600">
                          {formatPrice(calculateOverridePrice(historyData.currentPrice, overrideType))}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          Based on current: {formatPrice(historyData.currentPrice)}
                        </p>
                      </div>

                      {/* Reason Input */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Override Reason (Optional)</label>
                        <textarea
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="Explain why you're overriding the AI prediction..."
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white"
                          rows={3}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            alert('Generate Another Override - This would trigger AI to generate a new prediction')
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Regenerate Prediction
                        </button>

                        <button
                          onClick={() => {
                            if (overrideType === 'NO_OVERRIDE') {
                              alert('Please select an override type')
                              return
                            }
                            alert(`Apply Override:\\nType: ${overrideType}\\nPrice: ${formatPrice(calculateOverridePrice(historyData.currentPrice, overrideType))}\\nReason: ${overrideReason || 'No reason provided'}`)
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Apply Override
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Failed to load price history data
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
