import React, { useState, useEffect } from 'react'
import {
  fetchDashboardStats,
  fetchActiveMarkets,
  fetchProductCentricPredictions,
  fetchMarketCentricPredictions,
  triggerBulkPrediction,
  searchProducts,
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
  const [isSearching, setIsSearching] = useState(false)

  // State for bulk prediction
  const [bulkPredictionRunning, setBulkPredictionRunning] = useState(false)
  const [showBulkPredictionModal, setShowBulkPredictionModal] = useState(false)
  const [bulkPredictionSuccess, setBulkPredictionSuccess] = useState(false)

  // State for inspection (shared across all views)
  const [inspectingAnomaly, setInspectingAnomaly] = useState<{productId: number, marketId: number, productName: string, marketName: string} | null>(null)
  const [historyData, setHistoryData] = useState<PriceHistoryData | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [overrideType, setOverrideType] = useState('NO_OVERRIDE')
  const [overrideReason, setOverrideReason] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [applyingOverride, setApplyingOverride] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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

  // Load product-centric view on mount, page change, or search change
  useEffect(() => {
    if (viewMode === 'product') {
      loadProductPredictions()
    }
  }, [viewMode, productPage, searchTerm])

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
      setIsSearching(searchTerm.length > 0)
      
      const data = searchTerm.length > 0
        ? await searchProducts(searchTerm, productPage, 10)
        : await fetchProductCentricPredictions(productPage, 10, 'productName', 'ASC')
      
      setProductPredictions(data.content)
      setProductTotalPages(data.page.totalPages)
    } catch (error) {
      console.error('Failed to load product predictions:', error)
    } finally {
      setProductLoading(false)
      setIsSearching(false)
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
      
      // Show success state
      setBulkPredictionSuccess(true)
      
      // Reload data after a delay
      setTimeout(() => {
        loadDashboardStats()
        if (viewMode === 'product') loadProductPredictions()
        if (viewMode === 'market') loadMarketPredictions()
        if (viewMode === 'comparison') loadComparisonMatrix()
        setBulkPredictionRunning(false)
        
        // Close modal after data refresh
        setTimeout(() => {
          setShowBulkPredictionModal(false)
          setBulkPredictionSuccess(false)
        }, 1500)
      }, 3000)
    } catch (error) {
      console.error('Failed to trigger bulk prediction:', error)
      setBulkPredictionRunning(false)
    }
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setProductPage(0) // Reset to first page on new search
  }

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
  const handleInspect = (productId: number, marketId: number, productName: string, marketName: string, trendPercentage?: number) => {
    if (inspectingAnomaly?.productId === productId && inspectingAnomaly?.marketId === marketId) {
      setInspectingAnomaly(null)
      setHistoryData(null)
      setOverrideType('NO_OVERRIDE')
      setOverrideReason('')
      setSuccessMessage('')
    } else {
      setInspectingAnomaly({ productId, marketId, productName, marketName })
      fetchPriceHistory(productId, marketId)
      
      // Auto-select matching override option based on trend percentage
      if (trendPercentage !== undefined) {
        const trendPercent = Math.round(Math.abs(trendPercentage))
        const isIncrease = trendPercentage > 0
        
        if (trendPercent === 10) {
          setOverrideType(isIncrease ? '+10% INCREASE' : '-10% DECREASE')
        } else if (trendPercent === 20) {
          setOverrideType(isIncrease ? '+20% INCREASE' : '-20% DECREASE')
        } else if (trendPercent === 30) {
          setOverrideType(isIncrease ? '+30% INCREASE' : '-30% DECREASE')
        } else if (trendPercent === 50) {
          setOverrideType(isIncrease ? '+50% INCREASE' : '-50% DECREASE')
        } else {
          setOverrideType('NO_OVERRIDE')
        }
      } else {
        setOverrideType('NO_OVERRIDE')
      }
    }
  }

  // Handle regenerate prediction
  const handleRegeneratePrediction = async () => {
    if (!inspectingAnomaly) return

    try {
      setRegenerating(true)
      const response = await fetch(
        `http://localhost:8080/api/v1/predictions/generate?productId=${inspectingAnomaly.productId}&marketId=${inspectingAnomaly.marketId}`,
        { method: 'POST' }
      )
      
      if (!response.ok) throw new Error('Failed to regenerate prediction')
      
      setSuccessMessage('Prediction regenerated successfully!')
      setShowConfirmModal(false)
      
      setTimeout(() => {
        fetchPriceHistory(inspectingAnomaly.productId, inspectingAnomaly.marketId)
        // Reload comparison data to update anomaly view
        loadComparisonMatrix()
        // Reload current view data
        if (viewMode === 'product') loadProductPredictions()
        if (viewMode === 'market') loadMarketPredictions()
      }, 1000)
    } catch (error) {
      console.error('Failed to regenerate prediction:', error)
      alert('Failed to regenerate prediction. Please try again.')
    } finally {
      setRegenerating(false)
    }
  }

  // Handle apply override
  const handleApplyOverride = async () => {
    if (!inspectingAnomaly) return
    if (overrideType === 'NO_OVERRIDE') {
      alert('Please select an override type')
      return
    }

    try {
      setApplyingOverride(true)
      const response = await fetch(
        'http://localhost:8080/api/v1/predictions/bulk-override',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pairs: [{
              productId: inspectingAnomaly.productId,
              marketId: inspectingAnomaly.marketId
            }],
            forceTrend: overrideType,
            reason: overrideReason || 'No reason provided'
          })
        }
      )
      
      if (!response.ok) throw new Error('Failed to apply override')
      
      setSuccessMessage('Override applied successfully!')
      setShowOverrideModal(false)
      setShowSuccessModal(true)
      
      // Refresh data after override
      setTimeout(() => {
        fetchPriceHistory(inspectingAnomaly.productId, inspectingAnomaly.marketId)
        // Reload comparison data to update anomaly view
        loadComparisonMatrix()
        // Reload current view data
        if (viewMode === 'product') loadProductPredictions()
        if (viewMode === 'market') loadMarketPredictions()
      }, 1000)
    } catch (error) {
      console.error('Failed to apply override:', error)
      alert('Failed to apply override. Please try again.')
    } finally {
      setApplyingOverride(false)
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
            onClick={() => setShowBulkPredictionModal(true)}
            disabled={bulkPredictionRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all ${
              bulkPredictionRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <svg
              className="w-5 h-5"
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
            Run Bulk Prediction
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
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() => setViewMode('product')}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all flex-1 md:flex-initial ${
                  viewMode === 'product'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span className="whitespace-nowrap">Product</span>
              </button>

              <button
                onClick={() => setViewMode('market')}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all flex-1 md:flex-initial ${
                  viewMode === 'market'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="whitespace-nowrap">Market</span>
              </button>

              <button
                onClick={() => setViewMode('comparison')}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all flex-1 md:flex-initial ${
                  viewMode === 'comparison'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="whitespace-nowrap hidden sm:inline">Comparison</span>
                <span className="whitespace-nowrap sm:hidden">Compare</span>
              </button>

              <button
                onClick={() => setViewMode('anomaly')}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all flex-1 md:flex-initial ${
                  viewMode === 'anomaly'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="whitespace-nowrap hidden sm:inline">Anomaly</span>
                <span className="whitespace-nowrap sm:hidden">Alert</span>
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

            {/* Search - Only show in Product view */}
            {viewMode === 'product' && (
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
                    placeholder="Search all products..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'product' && (
          <ProductView
            products={productPredictions}
            loading={productLoading}
            page={productPage}
            totalPages={productTotalPages}
            onPageChange={setProductPage}
            searchTerm={searchTerm}
            onInspect={handleInspect}
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
            onInspect={handleInspect}
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
            onInspect={handleInspect}
          />
        )}
      </div>

      {/* Bulk Prediction Modal */}
      {showBulkPredictionModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => !bulkPredictionRunning && setShowBulkPredictionModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {!bulkPredictionSuccess ? (
                <>
                  {/* Icon */}
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                    Run Bulk Prediction
                  </h3>

                  {/* Message */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-900 text-center leading-relaxed mb-2">
                      This will generate price predictions for <span className="font-bold">all products across all markets</span> using the latest available data.
                    </p>
                    <p className="text-xs text-blue-700 text-center">
                      This process may take several minutes to complete.
                    </p>
                  </div>

                  {/* Stats Info */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Active Markets</p>
                      <p className="text-2xl font-bold text-blue-600">{stats?.activeMarkets || 0}</p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBulkPredictionModal(false)}
                      disabled={bulkPredictionRunning}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkPrediction}
                      disabled={bulkPredictionRunning}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {bulkPredictionRunning ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Start Prediction
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Success State */}
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                    Prediction Started!
                  </h3>

                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-900 text-center leading-relaxed">
                      Bulk prediction has been triggered successfully. Predictions are being generated in the background and will be updated shortly.
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-6 h-6 border-3 border-green-600 border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-sm text-gray-600">Refreshing data...</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inspection Modal (Shared across all views) */}
      {inspectingAnomaly && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto"
          onClick={() => {
            setInspectingAnomaly(null)
            setHistoryData(null)
            setOverrideType('NO_OVERRIDE')
            setOverrideReason('')
            setSuccessMessage('')
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-4 md:my-8 max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 flex items-center justify-between rounded-t-xl z-10">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className="p-1.5 md:p-2 rounded-lg flex-shrink-0 bg-indigo-100">
                  <svg className="w-4 h-4 md:w-6 md:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 truncate">
                    Price Inspection Report
                  </h3>
                  <p className="text-xs text-gray-600 truncate">{inspectingAnomaly.productName} • {inspectingAnomaly.marketName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setInspectingAnomaly(null)
                  setHistoryData(null)
                  setOverrideType('NO_OVERRIDE')
                  setOverrideReason('')
                  setSuccessMessage('')
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="px-6 pb-4 pt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">{successMessage}</span>
                </div>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-3 md:p-6 space-y-4 md:space-y-6">
              {historyLoading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading price history...</p>
                </div>
              ) : historyData ? (
                <>
                  {/* Price Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                    {/* Current Price */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-3 md:p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 p-1.5 rounded">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-600">Current Price</span>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900">
                        {formatPrice(historyData.currentPrice)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Market price today</p>
                    </div>

                    {/* Forecast Price */}
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-3 md:p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 p-1.5 rounded">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-600">AI Forecast</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatPrice(historyData.tomorrowPrice)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Predicted price tomorrow</p>
                    </div>

                    {/* Price Change */}
                    <div className={`bg-white border-2 rounded-xl p-3 md:p-5 ${
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
                        <span className="text-sm font-medium text-gray-600">Price Change</span>
                      </div>
                      <p className={`text-2xl md:text-3xl font-bold ${
                        historyData.changePercent > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {historyData.changePercent > 0 ? '+' : ''}{historyData.changePercent.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {Math.abs(historyData.changePercent) > 30 ? 'Extreme' : 'Significant'} price {historyData.changePercent > 0 ? 'increase' : 'decrease'}
                      </p>
                    </div>
                  </div>

                  {/* Price History Chart */}
                  <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 mb-4 md:mb-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Price Trend Analysis</h4>
                          <p className="text-sm text-gray-600">Historical prices and prediction</p>
                        </div>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      {/* Chart SVG */}
                      <div className="w-full overflow-x-auto">
                        <svg viewBox="0 0 800 280" className="w-full min-w-[600px] md:min-w-0">
                          {/* Y-axis line */}
                          <line x1="60" y1="40" x2="60" y2="220" stroke="#d1d5db" strokeWidth="1.5" />
                          {/* X-axis line */}
                          <line x1="60" y1="220" x2="760" y2="220" stroke="#d1d5db" strokeWidth="1.5" />
                          
                          {/* Horizontal grid lines */}
                          <g stroke="#e5e7eb" strokeWidth="1">
                            {[0, 1, 2, 3, 4].map(i => (
                              <line key={`h-${i}`} x1="60" y1={40 + i * 45} x2="760" y2={40 + i * 45} strokeDasharray="3 3" opacity="0.5" />
                            ))}
                          </g>

                          {/* Price line and points */}
                          {(() => {
                            // Get predictions for next 7 days
                            const predictions = historyData.predictions.slice(0, 7)
                            const allPrices = [...historyData.rawHistory.map(h => h.price), ...predictions.map(p => p.predictedPrice)]
                            const minPrice = Math.min(...allPrices)
                            const maxPrice = Math.max(...allPrices)
                            const priceRange = maxPrice - minPrice
                            const padding = priceRange * 0.15
                            const chartMin = minPrice - padding
                            const chartMax = maxPrice + padding
                            const chartRange = chartMax - chartMin

                            const totalPoints = historyData.rawHistory.length + predictions.length
                            const getY = (price: number) => 220 - ((price - chartMin) / chartRange) * 180
                            const getX = (index: number) => 60 + (index / (totalPoints - 1)) * 700

                            return (
                              <>
                                {/* Historical price line (without circles) */}
                                <polyline
                                  fill="none"
                                  stroke="#2563eb"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={historyData.rawHistory.map((h, i) => 
                                    `${getX(i)},${getY(h.price)}`
                                  ).join(' ')}
                                />

                                {/* Today reference line (vertical) */}
                                <line
                                  x1={getX(historyData.rawHistory.length - 1)}
                                  y1="40"
                                  x2={getX(historyData.rawHistory.length - 1)}
                                  y2="220"
                                  stroke="#f59e0b"
                                  strokeWidth="2"
                                  strokeDasharray="5 5"
                                  opacity="0.7"
                                />
                                {/* Today label at top */}
                                <text
                                  x={getX(historyData.rawHistory.length - 1)}
                                  y="25"
                                  textAnchor="middle"
                                  fontSize="11"
                                  fill="#f59e0b"
                                  fontWeight="700"
                                >
                                  Today
                                </text>

                                {/* Prediction line (green, continuous, next 7 days) */}
                                <polyline
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={[
                                    `${getX(historyData.rawHistory.length - 1)},${getY(historyData.rawHistory[historyData.rawHistory.length - 1].price)}`,
                                    ...predictions.map((p, i) => 
                                      `${getX(historyData.rawHistory.length + i)},${getY(p.predictedPrice)}`
                                    )
                                  ].join(' ')}
                                />

                                {/* Y-axis labels */}
                                {[0, 1, 2, 3, 4].map(i => {
                                  const price = chartMax - (i / 4) * chartRange
                                  return (
                                    <text
                                      key={`y-label-${i}`}
                                      x="50"
                                      y={40 + i * 45}
                                      textAnchor="end"
                                      fontSize="11"
                                      fill="#6b7280"
                                      fontWeight="500"
                                      dominantBaseline="middle"
                                    >
                                      ₱{Math.round(price)}
                                    </text>
                                  )
                                })}

                                {/* X-axis labels - Historical dates */}
                                {historyData.rawHistory.map((h, i) => {
                                  // Show every 5th label and skip the last one (will show as Today)
                                  if (i % 5 !== 0 || i === historyData.rawHistory.length - 1) return null
                                  const date = new Date(h.date)
                                  return (
                                    <text
                                      key={`x-label-${i}`}
                                      x={getX(i)}
                                      y="240"
                                      textAnchor="middle"
                                      fontSize="11"
                                      fill="#6b7280"
                                      fontWeight="500"
                                    >
                                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </text>
                                  )
                                })}

                                {/* Today date label (current date) */}
                                <text
                                  x={getX(historyData.rawHistory.length - 1)}
                                  y="255"
                                  textAnchor="middle"
                                  fontSize="11"
                                  fill="#f59e0b"
                                  fontWeight="700"
                                >
                                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </text>

                                {/* Prediction date labels */}
                                {predictions.map((p, i) => {
                                  // Show last prediction date only
                                  if (i !== predictions.length - 1) return null
                                  const date = new Date(p.date)
                                  return (
                                    <text
                                      key={`pred-label-${i}`}
                                      x={getX(historyData.rawHistory.length + i)}
                                      y="240"
                                      textAnchor="middle"
                                      fontSize="11"
                                      fill="#10b981"
                                      fontWeight="600"
                                    >
                                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </text>
                                  )
                                })}
                              </>
                            )
                          })()}
                        </svg>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          <span className="text-sm text-gray-700 font-medium">Historical Prices</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <span className="text-sm text-gray-700 font-medium">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                          <span className="text-sm text-gray-700 font-medium">Next 7 Days Prediction</span>
                        </div>
                      </div>
                    </div>

                    {/* Regression Stats */}
                    <div className="mt-5 pt-5 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Data Points</p>
                        <p className="text-2xl font-bold text-gray-900">{historyData.dataPoints}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">R² Score</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {historyData.regressionStats.rSquare.toFixed(3)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Trend Direction</p>
                        <p className={`text-lg font-bold ${
                          historyData.regressionStats.slope > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {historyData.regressionStats.slopeDirection}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Slope</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {historyData.regressionStats.slope.toFixed(2)}
                        </p>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white font-medium outline-none"
                        >
                          <option value="NO_OVERRIDE">Select Override Type</option>
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
                      <div className="bg-blue-50 rounded-lg p-3 md:p-5 border-2 border-blue-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">New Override Price</p>
                        <p className="text-2xl md:text-3xl font-bold text-blue-600">
                          {formatPrice(calculateOverridePrice(historyData.currentPrice, overrideType))}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          Based on current: {formatPrice(historyData.currentPrice)}
                        </p>
                      </div>

                      {/* Reason Input */}
                      <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Override Reason (Optional)</label>
                        <textarea
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="Explain why you're overriding the AI prediction..."
                          className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg resize-none bg-white outline-none"
                          rows={3}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col md:flex-row gap-2 md:gap-3 pt-2">
                        <button
                          onClick={() => setShowConfirmModal(true)}
                          disabled={regenerating}
                          className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className={`w-4 h-4 md:w-5 md:h-5 ${regenerating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {regenerating ? 'Regenerating...' : 'Regenerate Prediction'}
                        </button>

                        <button
                          onClick={() => setShowOverrideModal(true)}
                          disabled={overrideType === 'NO_OVERRIDE'}
                          className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Confirmation Modal for Regenerate */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Regenerate Prediction?
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-900 text-center leading-relaxed">
                  This will recalculate the price prediction for this product-market pair using the algorithm based on the latest available data.
                </p>
              </div>
              {inspectingAnomaly && (
                <div className="text-sm text-gray-600 space-y-1 mb-6">
                  <p><span className="font-medium">Product:</span> {inspectingAnomaly.productName}</p>
                  <p><span className="font-medium">Market:</span> {inspectingAnomaly.marketName}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegeneratePrediction}
                  disabled={regenerating}
                  className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {regenerating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Yes, Regenerate'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Override Confirmation Modal */}
      {showOverrideModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowOverrideModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Apply Override?
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 text-center leading-relaxed">
                  This will apply a manual override to the price prediction. The algorithm prediction will be adjusted based on your selected trend.
                </p>
              </div>
              {inspectingAnomaly && (
                <div className="text-sm space-y-3 mb-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-600 mb-1"><span className="font-medium text-gray-900">Product:</span> {inspectingAnomaly.productName}</p>
                    <p className="text-gray-600 mb-1"><span className="font-medium text-gray-900">Market:</span> {inspectingAnomaly.marketName}</p>
                    <p className="text-gray-600"><span className="font-medium text-gray-900">Override Type:</span> 
                      <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold">
                        {overrideType}
                      </span>
                    </p>
                  </div>
                  {overrideReason && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-gray-600 text-xs mb-1 font-medium">Reason:</p>
                      <p className="text-gray-800 text-sm">{overrideReason}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyOverride}
                  disabled={applyingOverride}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {applyingOverride ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Yes, Apply Override'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              {/* Success Icon */}
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 animate-bounce">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Success Message */}
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Override Applied!
              </h3>
              <p className="text-gray-600 text-center mb-6">
                The price prediction has been successfully updated with your manual override.
              </p>

              {/* Details */}
              {inspectingAnomaly && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-semibold text-gray-900">{inspectingAnomaly.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market:</span>
                      <span className="font-semibold text-gray-900">{inspectingAnomaly.marketName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Override Type:</span>
                      <span className="px-2 py-0.5 rounded bg-green-600 text-white text-xs font-bold">
                        {overrideType}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
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
  searchTerm?: string
  onInspect: (productId: number, marketId: number, productName: string, marketName: string, trendPercentage?: number) => void
}

function ProductView({ products, loading, page, totalPages, onPageChange, searchTerm, onInspect }: ProductViewProps) {
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

  if (!loading && products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-600 text-lg font-medium">No products found</p>
        {searchTerm && (
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search terms</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Product Cards */}
      {products.map((product) => (
        <div key={product.productId} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Desktop Product Header */}
          <div className="hidden md:block px-6 py-4 border-b border-gray-100">
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

          {/* Mobile Product Card */}
          <div className="md:hidden p-4 border-b border-gray-100">
            {/* Product Header */}
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{product.productName}</h3>
              <p className="text-xs text-gray-500 mt-1">{product.productCode}</p>
            </div>

            {/* Price and Markets Grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Avg Current</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatPrice(product.averageCurrentPrice)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Avg Forecast</p>
                <p className="text-sm font-semibold text-blue-600">
                  {formatPrice(product.averageForecastPrice)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Markets</p>
                <p className="text-sm font-semibold text-gray-900">
                  {product.totalMarkets}
                </p>
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setExpandedProduct(expandedProduct === product.productId ? null : product.productId)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg transition-colors"
            >
              {expandedProduct === product.productId ? 'Hide Markets' : 'View Markets'}
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

          {/* Market Predictions Table (Expandable) */}
          {expandedProduct === product.productId && (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Market</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Price</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Forecast</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Trend</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Confidence</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {(() => {
                      const currentPage = getMarketPage(product.productId)
                      const marketsPerPage = 10
                      const startIdx = currentPage * marketsPerPage
                      const endIdx = startIdx + marketsPerPage
                      const paginatedMarkets = product.marketPredictions.slice(startIdx, endIdx)
                      
                      return paginatedMarkets.map((market) => (
                        <tr key={market.marketId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{formatMarketName(market.marketName)}</div>
                            <div className="text-xs text-gray-500">{formatLocation(market.marketLocation)}</div>
                          </td>
                          <td className="px-6 py-4 text-right text-base font-bold text-gray-900">
                            {formatPrice(market.currentPrice)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {market.forecastPrice && market.forecastPrice > 0 ? (
                              <span className="text-base font-bold text-blue-600">
                                {formatPrice(market.forecastPrice)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {market.forecastPrice && market.forecastPrice > 0 ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {market.trendPercentage !== 0 && (
                                  <svg className={`w-4 h-4 ${
                                    market.trendPercentage > 0 ? 'text-red-600' : 'text-green-600'
                                  }`} fill="currentColor" viewBox="0 0 20 20">
                                    {market.trendPercentage > 0 ? (
                                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    ) : (
                                      <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    )}
                                  </svg>
                                )}
                                <span className={`text-sm font-bold ${
                                  market.trendPercentage > 0 ? 'text-red-600' :
                                  market.trendPercentage < 0 ? 'text-green-600' :
                                  'text-gray-600'
                                }`}>
                                  {formatTrendPercentage(market.trendPercentage)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {market.forecastPrice && market.forecastPrice > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className={`text-sm font-bold ${
                                  getConfidenceLevel(market.confidenceScore) === 'HIGH' ? 'text-green-600' :
                                  getConfidenceLevel(market.confidenceScore) === 'MEDIUM' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>
                                  {formatConfidence(market.confidenceScore)}
                                </div>
                                <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      getConfidenceLevel(market.confidenceScore) === 'HIGH' ? 'bg-green-600' :
                                      getConfidenceLevel(market.confidenceScore) === 'MEDIUM' ? 'bg-yellow-500' :
                                      'bg-gray-400'
                                    }`}
                                    style={{ width: `${market.confidenceScore}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-md uppercase ${
                              market.status === 'NORMAL' ? 'bg-green-100 text-green-700' :
                              market.status === 'NO_DATA' ? 'bg-gray-100 text-gray-600' :
                              market.status === 'ANOMALY' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {market.status === 'NO_DATA' ? 'No Data' : market.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => onInspect(product.productId, market.marketId, product.productName, market.marketName, market.trendPercentage)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {(() => {
                  const currentPage = getMarketPage(product.productId)
                  const marketsPerPage = 10
                  const startIdx = currentPage * marketsPerPage
                  const endIdx = startIdx + marketsPerPage
                  const paginatedMarkets = product.marketPredictions.slice(startIdx, endIdx)
                  
                  return paginatedMarkets.map((market) => (
                    <div key={market.marketId} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                      {/* Market Header */}
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900 text-sm">{formatMarketName(market.marketName)}</h4>
                        <p className="text-xs text-gray-500 mt-1">{formatLocation(market.marketLocation)}</p>
                      </div>

                      {/* Price Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Current Price</p>
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(market.currentPrice)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Forecast Price</p>
                          {market.forecastPrice && market.forecastPrice > 0 ? (
                            <p className="text-sm font-semibold text-blue-600">{formatPrice(market.forecastPrice)}</p>
                          ) : (
                            <p className="text-sm text-gray-400">—</p>
                          )}
                        </div>
                      </div>

                      {/* Trend & Confidence */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Trend</p>
                          {market.forecastPrice && market.forecastPrice > 0 ? (
                            <span className={`text-sm font-medium ${
                              market.trendPercentage > 0 ? 'text-red-600' :
                              market.trendPercentage < 0 ? 'text-green-600' :
                              'text-gray-600'
                            }`}>
                              {formatTrendPercentage(market.trendPercentage)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Confidence</p>
                          {market.forecastPrice && market.forecastPrice > 0 ? (
                            <span className={`inline-block text-xs font-medium px-3 py-1 rounded ${
                              getConfidenceLevel(market.confidenceScore) === 'HIGH' ? 'bg-green-100 text-green-700' :
                              getConfidenceLevel(market.confidenceScore) === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {formatConfidence(market.confidenceScore)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="bg-white p-3 rounded-lg flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 font-medium">Status</span>
                        <span className={`text-xs font-medium px-3 py-1 rounded ${
                          market.status === 'NORMAL' ? 'bg-green-100 text-green-700' :
                          market.status === 'NO_DATA' ? 'bg-gray-100 text-gray-600' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {market.status === 'NO_DATA' ? 'No Data' : market.status}
                        </span>
                      </div>

                      {/* Inspect Button */}
                      <button
                        onClick={() => onInspect(product.productId, market.marketId, product.productName, market.marketName, market.trendPercentage)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Inspect Market
                      </button>
                    </div>
                  ))
                })()}
              </div>
              
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
  onInspect: (productId: number, marketId: number, productName: string, marketName: string, trendPercentage?: number) => void
}

function MarketView({ predictions, loading, market, page, totalPages, onPageChange, onInspect }: MarketViewProps) {
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
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Price</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Forecast</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Trend</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {predictions.map((pred) => (
                  <tr key={pred.productId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{pred.productName || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-base font-bold text-gray-900">
                      {pred.currentPrice ? formatPrice(pred.currentPrice) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-base font-bold text-blue-600">
                      {pred.forecastPrice ? formatPrice(pred.forecastPrice) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pred.trendPercentage !== undefined && pred.trendPercentage !== null ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {pred.trendPercentage !== 0 && (
                            <svg className={`w-4 h-4 ${
                              pred.trendPercentage > 0 ? 'text-red-600' : 'text-green-600'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              {pred.trendPercentage > 0 ? (
                                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              ) : (
                                <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              )}
                            </svg>
                          )}
                          <span className={`text-sm font-bold ${
                            pred.trendPercentage > 0 ? 'text-red-600' : pred.trendPercentage < 0 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {formatTrendPercentage(pred.trendPercentage)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {pred.confidenceScore !== undefined && pred.confidenceScore !== null ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className={`text-sm font-bold ${
                            getConfidenceLevel(pred.confidenceScore) === 'HIGH' ? 'text-green-600' :
                            getConfidenceLevel(pred.confidenceScore) === 'MEDIUM' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {formatConfidence(pred.confidenceScore)}
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                getConfidenceLevel(pred.confidenceScore) === 'HIGH' ? 'bg-green-600' :
                                getConfidenceLevel(pred.confidenceScore) === 'MEDIUM' ? 'bg-yellow-500' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${pred.confidenceScore}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-md uppercase ${
                        pred.status === 'NORMAL' || pred.status === 'Normal' ? 'bg-green-100 text-green-700' : 
                        pred.status === 'ANOMALY' || pred.status === 'Anomaly' ? 'bg-red-100 text-red-700' : 
                        pred.status === 'NO_DATA' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {pred.status === 'NO_DATA' ? 'No Data' : pred.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onInspect(pred.productId, market.id, pred.productName, market.name, pred.trendPercentage)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-4">
            {predictions.map((pred) => (
              <div key={pred.productId} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                {/* Product Header */}
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 text-sm">{pred.productName || 'Unknown'}</h4>
                </div>

                {/* Price Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Current Price</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {pred.currentPrice ? formatPrice(pred.currentPrice) : '—'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Forecast Price</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {pred.forecastPrice ? formatPrice(pred.forecastPrice) : '—'}
                    </p>
                  </div>
                </div>

                {/* Trend & Confidence */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Trend</p>
                    {pred.trendPercentage !== undefined && pred.trendPercentage !== null ? (
                      <span className={`text-sm font-medium ${
                        pred.trendPercentage > 0 ? 'text-red-600' : pred.trendPercentage < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {formatTrendPercentage(pred.trendPercentage)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Confidence</p>
                    {pred.confidenceScore !== undefined && pred.confidenceScore !== null ? (
                      <span className={`inline-block text-xs font-medium px-3 py-1 rounded ${
                        getConfidenceLevel(pred.confidenceScore) === 'HIGH' ? 'bg-green-100 text-green-700' :
                        getConfidenceLevel(pred.confidenceScore) === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {formatConfidence(pred.confidenceScore)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="bg-white p-3 rounded-lg flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 font-medium">Status</span>
                  <span className={`text-xs font-medium px-3 py-1 rounded ${
                    pred.status === 'NORMAL' || pred.status === 'Normal' ? 'bg-green-100 text-green-700' : 
                    pred.status === 'ANOMALY' || pred.status === 'Anomaly' ? 'bg-red-100 text-red-700' : 
                    pred.status === 'NO_DATA' ? 'bg-gray-100 text-gray-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {pred.status === 'NO_DATA' ? 'No Data' : pred.status || 'Unknown'}
                  </span>
                </div>

                {/* Inspect Button */}
                <button
                  onClick={() => onInspect(pred.productId, market.id, pred.productName, market.name, pred.trendPercentage)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Inspect Product
                </button>
              </div>
            ))}
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
  onInspect: (productId: number, marketId: number, productName: string, marketName: string, trendPercentage?: number) => void
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

function AnomalyView({ data, loading, onInspect }: AnomalyViewProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ANOMALY' | 'OVERRIDDEN'>('ALL')
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
      .filter(mp => {
        const status = mp.status.toUpperCase()
        return status === 'ANOMALY' || status === 'OVERRIDDEN'
      })
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

  // Filter by status
  const filteredAnomalies = statusFilter === 'ALL' 
    ? anomalies 
    : anomalies.filter(a => a.status.toUpperCase() === statusFilter)

  // Pagination
  const totalPages = Math.ceil(filteredAnomalies.length / itemsPerPage)
  const startIdx = currentPage * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedAnomalies = filteredAnomalies.slice(startIdx, endIdx)

  // Reset to page 0 when filter changes
  useEffect(() => {
    setCurrentPage(0)
  }, [statusFilter])

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
                    Anomaly Detection & Overridden
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Products with unusual price patterns and manually overridden predictions
                  </p>
                </div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl px-6 py-3">
                <p className="text-3xl font-bold text-red-600">{filteredAnomalies.length}</p>
                <p className="text-xs text-gray-600 uppercase tracking-wide mt-1">Items Found</p>
              </div>
            </div>

            {/* Status Filter */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Filter by Status:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({anomalies.length})
                </button>
                <button
                  onClick={() => setStatusFilter('ANOMALY')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    statusFilter === 'ANOMALY'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Anomaly ({anomalies.filter(a => a.status.toUpperCase() === 'ANOMALY').length})
                </button>
                <button
                  onClick={() => setStatusFilter('OVERRIDDEN')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    statusFilter === 'OVERRIDDEN'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Overridden ({anomalies.filter(a => a.status.toUpperCase() === 'OVERRIDDEN').length})
                </button>
              </div>
            </div>
          </div>

        {/* Anomaly Table */}
        {filteredAnomalies.length === 0 ? (
          <div className="px-6 py-16 text-center">
            {statusFilter === 'ALL' ? (
              <>
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-900">All Clear!</p>
                <p className="text-sm text-gray-600 mt-2">No anomalies detected in current predictions.</p>
              </>
            ) : (
              <>
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-900">No Results Found</p>
                <p className="text-sm text-gray-600 mt-2">No items found with status: {statusFilter}</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Market</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
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
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                          anomaly.status.toUpperCase() === 'ANOMALY' 
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}>
                          {anomaly.status}
                        </span>
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
                          onClick={() => onInspect(anomaly.productId, anomaly.marketId, anomaly.productName, anomaly.marketName, anomaly.trendPercentage)}
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {paginatedAnomalies.map((anomaly) => (
                <div key={`${anomaly.productId}-${anomaly.marketId}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Header with Product and Status */}
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{anomaly.productName}</h4>
                        <p className="text-xs text-blue-600 mt-1">ID: {anomaly.productId}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        anomaly.status.toUpperCase() === 'ANOMALY' 
                          ? 'bg-red-100 text-red-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {anomaly.status}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{formatMarketName(anomaly.marketName)}</p>
                      <p className="text-xs text-gray-500">{formatLocation(anomaly.marketLocation)}</p>
                    </div>
                  </div>

                  {/* Price Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Current Price</p>
                      <p className="text-sm font-semibold text-gray-900">{formatPrice(anomaly.currentPrice)}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Forecast Price</p>
                      <p className="text-sm font-semibold text-blue-600">{formatPrice(anomaly.forecastPrice)}</p>
                    </div>
                  </div>

                  {/* Trend & Confidence */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Trend</p>
                      <div className="flex items-center gap-2">
                        {anomaly.trendPercentage > 0 ? (
                          <div className="bg-red-100 p-1 rounded">
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                        ) : (
                          <div className="bg-green-100 p-1 rounded">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                          </div>
                        )}
                        <span className={`text-sm font-semibold ${
                          anomaly.trendPercentage > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {anomaly.trendPercentage > 0 ? '+' : ''}{anomaly.trendPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Confidence</p>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 mb-1">
                          {(anomaly.confidenceScore * 100).toFixed(0)}%
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
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
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onInspect(anomaly.productId, anomaly.marketId, anomaly.productName, anomaly.marketName, anomaly.trendPercentage)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Inspect Details
                  </button>
                </div>
              ))}
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
                    Showing <span className="font-semibold text-gray-900">{startIdx + 1}-{Math.min(endIdx, filteredAnomalies.length)}</span> of <span className="font-semibold text-gray-900">{filteredAnomalies.length}</span> items
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
    </>
  )
}

