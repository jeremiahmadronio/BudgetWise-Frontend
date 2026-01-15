/**
 * Archive Products Page Component
 * Displays archived products with ability to restore them back to active status
 */

import { useEffect, useState } from 'react'
import {
  fetchArchiveStats,
  fetchArchivedProductsPage,
  restoreProduct,
  bulkRestoreProducts,
  fetchMarketArchiveStats,
  fetchArchivedMarketsPage,
  restoreMarket,
  bulkRestoreMarkets,
  fetchArchivedDietaryTagsPage,
  fetchDietaryTagArchiveStats,
  restoreDietaryTags
} from '../admin-api/archive-products-api'
import type {
  ArchiveStatsDTO,
  ArchivedProductDTO,
  MarketArchiveStatsDTO,
  ArchivedMarketDTO,
  ArchivedDietaryTagDTO,
  DietaryTagArchiveStatsDTO
} from '../admin-api/archive-products-api'
import {
  Archive,
  RotateCcw,
  Search,
  Clock,
  Calendar,
  Star,
  Package,
  MapPinHouse,
  Tag
} from 'lucide-react'

export function ArchiveProductsPage() {
  // ============================================================================
  // State Management
  // ============================================================================

  // View toggle
  const [view, setView] = useState<'products' | 'markets' | 'tags'>('products')

  // Products state
  const [products, setProducts] = useState<ArchivedProductDTO[]>([])
  const [stats, setStats] = useState<ArchiveStatsDTO>({
    totalArchived: 0,
    newThisMonth: 0,
    awaitingReview: 0,
  })
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  
  // Markets state
  const [markets, setMarkets] = useState<ArchivedMarketDTO[]>([])
  const [marketStats, setMarketStats] = useState<MarketArchiveStatsDTO>({
    totalArchive: 0,
    archiveThisMonth: 0,
    highRated: 0,
  })
  const [selectedMarkets, setSelectedMarkets] = useState<number[]>([])
  
  // Dietary Tags state
  const [dietaryTags, setDietaryTags] = useState<ArchivedDietaryTagDTO[]>([])
  const [tagStats, setTagStats] = useState<DietaryTagArchiveStatsDTO>({
    totalArchived: 0,
    archivedThisMonth: 0,
    unusedTagsCount: 0,
  })
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(7)
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [originFilter, setOriginFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Modals
  const [bulkRestoreModal, setBulkRestoreModal] = useState<{ open: boolean; count: number }>({ open: false, count: 0 })
  const [restoreModal, setRestoreModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' })
  const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  // ============================================================================
  // Data Fetching
  // ============================================================================

  // Fetch products data
  useEffect(() => {
    if (view !== 'products') return
    
    const fetchData = async () => {
      try {
        const [productsPage, statsData] = await Promise.all([
          fetchArchivedProductsPage(page, pageSize),
          fetchArchiveStats(),
        ])
        
        setProducts(productsPage.content || [])
        setTotalPages(productsPage.page?.totalPages || 1)
        setStats(statsData)
      } catch (err) {
        console.error('Failed to fetch products data:', err)
        alert('Failed to fetch products data from API. Please check your connection.')
      }
    }
    
    fetchData()
  }, [page, pageSize, view])

  // Fetch markets data
  useEffect(() => {
    if (view !== 'markets') return
    
    const fetchData = async () => {
      try {
        const [marketsPage, statsData] = await Promise.all([
          fetchArchivedMarketsPage(page, pageSize),
          fetchMarketArchiveStats(),
        ])
        
        setMarkets(marketsPage.content || [])
        setTotalPages(marketsPage.page?.totalPages || 1)
        setMarketStats(statsData)
      } catch (err) {
        console.error('Failed to fetch markets data:', err)
        alert('Failed to fetch markets data from API. Please check your connection.')
      }
    }
    
    fetchData()
  }, [page, pageSize, view])

  // Fetch dietary tags data
  useEffect(() => {
    if (view !== 'tags') return
    
    const fetchData = async () => {
      try {
        const [tagsPage, statsData] = await Promise.all([
          fetchArchivedDietaryTagsPage(page, pageSize),
          fetchDietaryTagArchiveStats(),
        ])
        
        setDietaryTags(tagsPage.content || [])
        setTotalPages(tagsPage.page?.totalPages || 1)
        setTagStats(statsData)
      } catch (err) {
        console.error('Failed to fetch dietary tags data:', err)
        alert('Failed to fetch dietary tags data from API. Please check your connection.')
      }
    }
    
    fetchData()
  }, [page, pageSize, view])

  // Reset page when view changes
  useEffect(() => {
    setPage(0)
    setSearchTerm('')
    setCategoryFilter('all')
    setOriginFilter('all')
    setTypeFilter('all')
    setSelectedProducts([])
    setSelectedMarkets([])
    setSelectedTags([])
  }, [view])

  // ============================================================================
  // Filtering Logic
  // ============================================================================

  const filteredProducts = products.filter((product) => {
    if (searchTerm && !product.productName.trim().toLowerCase().startsWith(searchTerm.trim().toLowerCase())) {
      return false
    }
    if (categoryFilter !== 'all' && product.category !== categoryFilter) {
      return false
    }
    if (originFilter !== 'all' && product.origin !== originFilter) {
      return false
    }
    return true
  })

  const filteredMarkets = markets.filter((market) => {
    if (searchTerm && !market.marketLocation.trim().toLowerCase().includes(searchTerm.trim().toLowerCase())) {
      return false
    }
    if (typeFilter !== 'all' && market.type !== typeFilter) {
      return false
    }
    return true
  })

  const filteredTags = dietaryTags.filter((tag) => {
    if (searchTerm && !tag.tagName.trim().toLowerCase().startsWith(searchTerm.trim().toLowerCase())) {
      return false
    }
    return true
  })

  const categories = Array.from(new Set(products.map(p => p.category)))
  const origins = Array.from(new Set(products.map(p => p.origin)))
  const marketTypes = Array.from(new Set(markets.map(m => m.type)))

  const resetFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setOriginFilter('all')
    setTypeFilter('all')
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const formatCurrency = (amount: number) => `₱${amount.toFixed(2)}`
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  
  const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // ============================================================================
  // Action Handlers
  // ============================================================================

  /** Show restore confirmation modal */
  const handleRestore = async (id: number, name: string) => {
    setRestoreModal({ open: true, id, name })
  }

  /** Confirm single restore operation */
  const confirmRestore = async () => {
    if (!restoreModal.id) return

    try {
      if (view === 'products') {
        await restoreProduct(restoreModal.id, 'ACTIVE')
        setRestoreModal({ open: false, id: null, name: '' })
        setSuccessModal({ open: true, message: 'Product has been successfully restored!' })

        // Refresh data
        const [productsPage, statsData] = await Promise.all([
          fetchArchivedProductsPage(page, pageSize),
          fetchArchiveStats(),
        ])
        setProducts(productsPage.content || [])
        setTotalPages(productsPage.page?.totalPages || 1)
        setStats(statsData)
      } else if (view === 'markets') {
        await restoreMarket(restoreModal.id)
        setRestoreModal({ open: false, id: null, name: '' })
        setSuccessModal({ open: true, message: 'Market has been successfully restored!' })

        // Refresh data
        const [marketsPage, statsData] = await Promise.all([
          fetchArchivedMarketsPage(page, pageSize),
          fetchMarketArchiveStats(),
        ])
        setMarkets(marketsPage.content || [])
        setTotalPages(marketsPage.page?.totalPages || 1)
        setMarketStats(statsData)
      } else {
        await restoreDietaryTags([restoreModal.id])
        setRestoreModal({ open: false, id: null, name: '' })
        setSuccessModal({ open: true, message: 'Dietary tag has been successfully restored!' })

        // Refresh data
        const [tagsPage, statsData] = await Promise.all([
          fetchArchivedDietaryTagsPage(page, pageSize),
          fetchDietaryTagArchiveStats(),
        ])
        setDietaryTags(tagsPage.content || [])
        setTotalPages(tagsPage.page?.totalPages || 1)
        setTagStats(statsData)
      }
    } catch (error) {
      alert(`Failed to restore ${view === 'products' ? 'product' : view === 'markets' ? 'market' : 'tag'}. Please try again.`)
      console.error(error)
    }
  }

  /** Toggle individual product selection */
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  /** Toggle individual market selection */
  const toggleMarketSelection = (marketId: number) => {
    setSelectedMarkets(prev => 
      prev.includes(marketId) 
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    )
  }

  /** Toggle all products selection */
  const toggleAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  /** Toggle all markets selection */
  const toggleAllMarkets = () => {
    if (selectedMarkets.length === filteredMarkets.length) {
      setSelectedMarkets([])
    } else {
      setSelectedMarkets(filteredMarkets.map(m => m.id))
    }
  }

  /** Toggle individual tag selection */
  const toggleTagSelection = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  /** Toggle all tags selection */
  const toggleAllTags = () => {
    if (selectedTags.length === filteredTags.length) {
      setSelectedTags([])
    } else {
      setSelectedTags(filteredTags.map(t => t.id))
    }
  }

  /** Bulk restore selected items */
  const handleBulkRestore = async () => {
    const selectedCount = view === 'products' ? selectedProducts.length : view === 'markets' ? selectedMarkets.length : selectedTags.length
    if (selectedCount === 0) {
      alert(`Please select at least one ${view === 'products' ? 'product' : view === 'markets' ? 'market' : 'tag'} to restore.`)
      return
    }

    setBulkRestoreModal({ open: true, count: selectedCount })
  }

  /** Confirm bulk restore operation */
  const confirmBulkRestore = async () => {
    try {
      if (view === 'products') {
        await bulkRestoreProducts(selectedProducts, 'ACTIVE')
        setBulkRestoreModal({ open: false, count: 0 })
        setSuccessModal({ open: true, message: `Successfully restored ${selectedProducts.length} product(s)!` })
        setSelectedProducts([])

        // Refresh data
        const [productsPage, statsData] = await Promise.all([
          fetchArchivedProductsPage(page, pageSize),
          fetchArchiveStats(),
        ])
        setProducts(productsPage.content || [])
        setTotalPages(productsPage.page?.totalPages || 1)
        setStats(statsData)
      } else if (view === 'markets') {
        await bulkRestoreMarkets(selectedMarkets)
        setBulkRestoreModal({ open: false, count: 0 })
        setSuccessModal({ open: true, message: `Successfully restored ${selectedMarkets.length} market(s)!` })
        setSelectedMarkets([])

        // Refresh data
        const [marketsPage, statsData] = await Promise.all([
          fetchArchivedMarketsPage(page, pageSize),
          fetchMarketArchiveStats(),
        ])
        setMarkets(marketsPage.content || [])
        setTotalPages(marketsPage.page?.totalPages || 1)
        setMarketStats(statsData)
      } else {
        await restoreDietaryTags(selectedTags)
        setBulkRestoreModal({ open: false, count: 0 })
        setSuccessModal({ open: true, message: `Successfully restored ${selectedTags.length} tag(s)!` })
        setSelectedTags([])

        // Refresh data
        const [tagsPage, statsData] = await Promise.all([
          fetchArchivedDietaryTagsPage(page, pageSize),
          fetchDietaryTagArchiveStats(),
        ])
        setDietaryTags(tagsPage.content || [])
        setTotalPages(tagsPage.page?.totalPages || 1)
        setTagStats(statsData)
      }
    } catch (error) {
      alert(`Failed to restore selected ${view === 'products' ? 'products' : view === 'markets' ? 'markets' : 'tags'}. Please try again.`)
      console.error(error)
    }
  }
  
  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 pt-2 md:pt-4 pb-4 md:pb-8">
        {/* Header with View Toggle */}
        <div className="mb-5 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Archive Management</h1>
          
          {/* View Toggle Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                view === 'products'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              Products
            </button>
            <button
              onClick={() => setView('markets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                view === 'markets'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <MapPinHouse className="w-4 h-4" />
              Markets
            </button>
            <button
              onClick={() => setView('tags')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                view === 'tags'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Tag className="w-4 h-4" />
              Dietary Tags
            </button>
          </div>
        </div>

        {/* Stats Grid - Products */}
        {view === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-lg">
                  <Archive className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Total Archived</p>
                  <p className="text-xs text-gray-500">All archived products</p>
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalArchived}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">New This Month</p>
                  <p className="text-xs text-gray-500">Recently archived</p>
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.newThisMonth}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Awaiting Review</p>
                  <p className="text-xs text-gray-500">Pending evaluation</p>
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.awaitingReview}
            </div>
          </div>
        </div>
        )}

        {/* Stats Grid - Markets */}
        {view === 'markets' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-lg">
                    <Archive className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Total Archive</p>
                    <p className="text-xs text-gray-500">All archived markets</p>
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {marketStats.totalArchive}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Archive This Month</p>
                    <p className="text-xs text-gray-500">Recently archived</p>
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {marketStats.archiveThisMonth}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-lg">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">High Rated</p>
                    <p className="text-xs text-gray-500">Top rated archived</p>
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {marketStats.highRated}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid - Dietary Tags */}
        {view === 'tags' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-lg">
                    <Archive className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Total Archived</p>
                    <p className="text-xs text-gray-500">All archived tags</p>
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {tagStats.totalArchived}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Archived This Month</p>
                    <p className="text-xs text-gray-500">Recently archived</p>
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {tagStats.archivedThisMonth}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-lg">
                    <Tag className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Unused Tags</p>
                    <p className="text-xs text-gray-500">Not assigned to products</p>
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {tagStats.unusedTagsCount}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={view === 'products' ? 'Search archived products...' : view === 'markets' ? 'Search archived markets...' : 'Search archived dietary tags...'}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {view === 'products' && (
                <>
                  <select
                    className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer hover:border-gray-300 transition-colors"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => <option key={cat} value={cat}>{toTitleCase(cat)}</option>)}
                  </select>
                  <select
                    className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer hover:border-gray-300 transition-colors"
                    value={originFilter}
                    onChange={(e) => setOriginFilter(e.target.value)}
                  >
                    <option value="all">All Origins</option>
                    {origins.map(org => <option key={org} value={org}>{org}</option>)}
                  </select>
                </>
              )}
              {view === 'markets' && (
                <select
                  className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer hover:border-gray-300 transition-colors"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {marketTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                </select>
              )}
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 font-medium rounded-md transition-colors border border-gray-200 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
              {((view === 'products' && selectedProducts.length > 0) || (view === 'markets' && selectedMarkets.length > 0) || (view === 'tags' && selectedTags.length > 0)) && (
                <button
                  onClick={handleBulkRestore}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore ({view === 'products' ? selectedProducts.length : view === 'markets' ? selectedMarkets.length : selectedTags.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products Table (desktop) */}
        {view === 'products' && (
        <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-center py-2.5 px-3 w-12">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleAllProducts}
                        className="w-3.5 h-3.5 text-teal-600 bg-white hover:bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-0"
                      />
                    </div>
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Price</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Archived Date</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedProducts.includes(product.id) ? 'bg-teal-50/50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-3.5 h-3.5 text-teal-600 bg-white hover:bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-0"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-sm text-gray-500 font-medium">PR-{String(product.id).padStart(5, '0')}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-sm font-medium text-gray-900">{product.productName}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-sm text-gray-600">{toTitleCase(product.category)}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-sm text-gray-600">{product.origin}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.lastPrice)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-sm text-gray-600">{product.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-sm text-gray-600">{formatDate(product.archivedDate)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          onClick={() => handleRestore(product.id, product.productName)}
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Restore</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="py-12 text-center">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No archived products found</p>
            </div>
          )}
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Showing <span className="font-medium">{page * pageSize + 1}</span> to <span className="font-medium">{Math.min((page + 1) * pageSize, filteredProducts.length)}</span> of <span className="font-medium">{filteredProducts.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
              <button 
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Products Card View (mobile & tablet) */}
        {view === 'products' && (
        <div className="block lg:hidden space-y-4">
          {filteredProducts.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No archived products found</p>
            </div>
          )}
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Header with checkbox */}
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  className="w-4 h-4 text-teal-600 bg-white hover:bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-gray-900 mb-1">{product.productName}</h4>
                  <p className="text-sm text-gray-500">PR-{String(product.id).padStart(5, '0')}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded font-semibold whitespace-nowrap bg-orange-50 text-orange-700">
                  Archived
                </span>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="text-sm font-medium text-gray-900">{toTitleCase(product.category)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Origin</p>
                  <p className="text-sm font-medium text-gray-900">{product.origin}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last Price</p>
                  <p className="text-base font-bold text-gray-900">{formatCurrency(product.lastPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Unit</p>
                  <p className="text-sm font-medium text-gray-900">{product.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Archived Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(product.archivedDate)}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-100">
                <button 
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={() => handleRestore(product.id, product.productName)}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Product</span>
                </button>
              </div>
            </div>
          ))}
          {/* Pagination Controls (mobile) */}
          {filteredProducts.length > 0 && (
            <div className="flex justify-between items-center py-4">
              <button 
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium" 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700">Page {page + 1} of {totalPages}</span>
              <button 
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium" 
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>
        )}

        {/* Markets Table (desktop) */}
        {view === 'markets' && (
        <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-center py-2.5 px-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedMarkets.length === filteredMarkets.length && filteredMarkets.length > 0}
                      onChange={toggleAllMarkets}
                      className="w-4 h-4 text-teal-600 bg-white hover:bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-teal-500"
                    />
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider py-2.5 px-3">Market Location</th>
                  <th className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider py-2.5 px-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider py-2.5 px-3">Rating</th>
                  <th className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider py-2.5 px-3">Archived Date</th>
                  <th className="text-center text-xs font-semibold text-gray-700 uppercase tracking-wider py-2.5 px-3 w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMarkets.map((market) => (
                  <tr key={market.id} className="hover:bg-gray-50 transition-colors">
                    <td className="text-center py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedMarkets.includes(market.id)}
                        onChange={() => toggleMarketSelection(market.id)}
                        className="w-4 h-4 text-teal-600 bg-white hover:bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-teal-500"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-sm font-semibold text-gray-900">{market.marketLocation}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                        {market.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium text-gray-900">{market.ratings.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-sm text-gray-600">{formatDate(market.archivedDate)}</p>
                    </td>
                    <td className="text-center py-2.5 px-3">
                      <button
                        onClick={() => handleRestore(market.id, market.marketLocation)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMarkets.length === 0 && (
            <div className="py-12 text-center">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No archived markets found</p>
            </div>
          )}
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Showing <span className="font-medium">{page * pageSize + 1}</span> to <span className="font-medium">{Math.min((page + 1) * pageSize, filteredMarkets.length)}</span> of <span className="font-medium">{filteredMarkets.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
              <button 
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Markets Card View (mobile & tablet) */}
        {view === 'markets' && (
        <div className="block lg:hidden space-y-4">
          {filteredMarkets.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No archived markets found</p>
            </div>
          )}
          {filteredMarkets.map((market) => (
            <div key={market.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Header with checkbox */}
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedMarkets.includes(market.id)}
                  onChange={() => toggleMarketSelection(market.id)}
                  className="w-4 h-4 text-teal-600 bg-white hover:bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">{market.marketLocation}</h3>
                  <p className="text-xs text-gray-500 mt-1">{market.type.replace('_', ' ')}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded font-semibold whitespace-nowrap bg-orange-50 text-orange-700">
                  Archived
                </span>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <p className="text-sm font-medium text-gray-900">{market.ratings.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Archived Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(market.archivedDate)}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-100">
                <button 
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={() => handleRestore(market.id, market.marketLocation)}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Market</span>
                </button>
              </div>
            </div>
          ))}
          {/* Pagination Controls (mobile) */}
          {filteredMarkets.length > 0 && (
            <div className="flex justify-between items-center py-4">
              <button 
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium" 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700">Page {page + 1} of {totalPages}</span>
              <button 
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium" 
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>
        )}

        {/* Dietary Tags Table (desktop) */}
        {view === 'tags' && (
        <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-center py-2.5 px-3 w-12">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.length === filteredTags.length && filteredTags.length > 0}
                        onChange={toggleAllTags}
                        className="w-3.5 h-3.5 text-teal-600 bg-white hover:bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-0"
                      />
                    </div>
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Tag ID</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Tag Name</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Archived Date</th>
                  <th className="text-center py-2.5 px-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => toggleTagSelection(tag.id)}
                          className="w-3.5 h-3.5 text-teal-600 bg-white hover:bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-0"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-gray-900 font-semibold">
                      DT-{String(tag.id).padStart(5, '0')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                        <Tag className="w-3 h-3" />
                        {tag.tagName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-gray-600">
                      {tag.description || 'No description'}
                    </td>
                    <td className="py-2.5 px-3 text-sm text-gray-600">
                      {formatDate(tag.archivedAt)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRestore(tag.id, tag.tagName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTags.length === 0 && (
            <div className="py-12 text-center">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No archived dietary tags found</p>
            </div>
          )}
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredTags.length)} of {filteredTags.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-gray-700">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Dietary Tags Card View (mobile & tablet) */}
        {view === 'tags' && (
        <div className="block lg:hidden space-y-4">
          {filteredTags.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No archived dietary tags found</p>
            </div>
          )}
          {filteredTags.map((tag) => (
            <div key={tag.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => toggleTagSelection(tag.id)}
                  className="w-4 h-4 text-teal-600 bg-white hover:bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      <Tag className="w-3 h-3" />
                      {tag.tagName}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded font-semibold whitespace-nowrap bg-orange-50 text-orange-700">
                      Archived
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">ID: DT-{String(tag.id).padStart(5, '0')}</p>
                </div>
              </div>

              {/* Key Info */}
              <div className="space-y-2 py-3 border-t border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm font-medium text-gray-900">{tag.description || 'No description'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Archived Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(tag.archivedAt)}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-100">
                <button 
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={() => handleRestore(tag.id, tag.tagName)}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Tag</span>
                </button>
              </div>
            </div>
          ))}
          {/* Pagination Controls (mobile) */}
          {filteredTags.length > 0 && (
            <div className="flex justify-between items-center py-4">
              <button 
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium" 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700">Page {page + 1} of {totalPages}</span>
              <button 
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium" 
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Single Restore Modal */}
      {restoreModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Restore {view === 'products' ? 'Product' : view === 'markets' ? 'Market' : 'Dietary Tag'}</h2>
              <button
                onClick={() => setRestoreModal({ open: false, id: null, name: '' })}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-md">
                <div className="flex-shrink-0">
                  <RotateCcw className="w-8 h-8 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm md:text-base font-semibold text-teal-900">
                    Restore "{restoreModal.name}"?
                  </p>
                  <p className="text-xs md:text-sm text-teal-700 mt-1">
                    This {view === 'products' ? 'product' : 'market'} will be moved back to active status.
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs font-semibold text-blue-900 mb-2">What happens when you restore:</p>
                <ul className="space-y-1.5 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{view === 'products' ? 'Product' : 'Market'} will be visible in the active catalog</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>System will resume {view === 'products' ? 'price' : 'data'} tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>All historical data remains intact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{view === 'products' ? 'Product' : 'Market'} becomes available for {view === 'products' ? 'customers' : 'operations'}</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-gray-600">
                Please confirm that you want to proceed with restoring this {view === 'products' ? 'product' : view === 'markets' ? 'market' : 'dietary tag'}.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors border border-gray-200"
                onClick={() => setRestoreModal({ open: false, id: null, name: '' })}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                onClick={confirmRestore}
              >
                <RotateCcw className="w-4 h-4" />
                Restore {view === 'products' ? 'Product' : view === 'markets' ? 'Market' : 'Tag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Restore Modal */}
      {bulkRestoreModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Restore Selected {view === 'products' ? 'Products' : view === 'markets' ? 'Markets' : 'Dietary Tags'}</h2>
              <button
                onClick={() => setBulkRestoreModal({ open: false, count: 0 })}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-md">
                <div className="flex-shrink-0">
                  <RotateCcw className="w-8 h-8 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm md:text-base font-semibold text-teal-900">
                    You are about to restore {bulkRestoreModal.count} {view === 'products' ? 'product' : view === 'markets' ? 'market' : 'tag'}{bulkRestoreModal.count > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs md:text-sm text-teal-700 mt-1">
                    {view === 'products' ? 'These products' : 'These markets'} will be moved back to active status.
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs font-semibold text-blue-900 mb-2">What happens when you restore:</p>
                <ul className="space-y-1.5 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{view === 'products' ? 'Products' : 'Markets'} will be visible in the active catalog</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>System will resume {view === 'products' ? 'price' : 'data'} tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>All historical data remains intact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{view === 'products' ? 'Products' : view === 'markets' ? 'Markets' : 'Tags'} become available for {view === 'products' ? 'customers' : view === 'markets' ? 'operations' : 'assignment'}</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-gray-600">
                Please confirm that you want to proceed with restoring these {view === 'products' ? 'products' : view === 'markets' ? 'markets' : 'dietary tags'}.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors border border-gray-200"
                onClick={() => setBulkRestoreModal({ open: false, count: 0 })}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                onClick={confirmBulkRestore}
              >
                <RotateCcw className="w-4 h-4" />
                Restore {bulkRestoreModal.count} {view === 'products' ? 'Product' : view === 'markets' ? 'Market' : 'Tag'}{bulkRestoreModal.count > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" style={{
          background: 'rgba(0, 0, 0, 0)',
          animation: 'fadeInBg 0.3s ease-out forwards'
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 md:p-8 text-center" style={{
            opacity: 0,
            transform: 'scale(0.9) translateY(20px)',
            animation: 'smoothFadeIn 0.5s ease-out 0.1s forwards'
          }}>
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4 md:mb-6" style={{
              opacity: 0,
              transform: 'scale(0.8)',
              animation: 'smoothScale 0.4s ease-out 0.3s forwards'
            }}>
              <svg className="w-8 h-8 md:w-10 md:h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                strokeDasharray: 100,
                strokeDashoffset: 100,
                animation: 'drawCheckSmooth 0.6s ease-out 0.5s forwards'
              }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <h2 className="text-xl md:text-2xl font-bold text-teal-600 mb-2 md:mb-3" style={{
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'smoothFadeUp 0.4s ease-out 0.6s forwards'
            }}>Success!</h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8" style={{
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'smoothFadeUp 0.4s ease-out 0.7s forwards'
            }}>{successModal.message}</p>

            {/* OK Button */}
            <button
              className="px-8 md:px-10 py-2.5 md:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm md:text-base font-semibold transition-all duration-200 shadow-md hover:scale-105 hover:shadow-lg active:scale-95"
              style={{
                opacity: 0,
                transform: 'translateY(10px)',
                animation: 'smoothFadeUp 0.4s ease-out 0.8s forwards'
              }}
              onClick={() => setSuccessModal({ open: false, message: '' })}
            >
              Ok
            </button>
          </div>
          
          {/* Smooth Keyframe Animations */}
          <style>{`
            @keyframes fadeInBg {
              from {
                background: rgba(0, 0, 0, 0);
              }
              to {
                background: rgba(0, 0, 0, 0.4);
              }
            }
            
            @keyframes smoothFadeIn {
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            
            @keyframes smoothScale {
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes drawCheckSmooth {
              to {
                stroke-dashoffset: 0;
              }
            }
            
            @keyframes smoothFadeUp {
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
