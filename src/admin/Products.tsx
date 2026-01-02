/**
 * Products Page Component
 * Manages product catalog with features for viewing, editing, archiving products
 * and handling newly detected products awaiting approval
 */

import { useEffect, useState } from 'react'
import {
  fetchProductsPage,
  fetchProductStats,
  fetchNewProducts,
  updateProduct,
  updateNewcomerProduct,
  updateProductStatus,
  bulkUpdateStatus
} from '../admin-api/products-api'
import type {
  ProductDisplayDTO,
  ProductStatsDTO,
  NewProductDTO,
  ProductsPage,
  UpdateNewcomerProductDTO
} from '../admin-api/products-api'
import {
  Package,
  TrendingUp,
  Archive,
  Search,
  Eye,
  Pencil,
  ChevronRight,
  AlertCircle,
  Info,
  Leaf,
  CheckCircle,
  Store
} from 'lucide-react'

// ============================================================================
// Constants
// ============================================================================

const ProductStatus = {
  ACTIVE: 'ACTIVE' as const,
  ARCHIVED: 'ARCHIVED' as const,
  DEACTIVATED: 'DEACTIVATED' as const,
}

export function ProductsPage() {
  // ============================================================================
  // State Management
  // ============================================================================

  const [products, setProducts] = useState<ProductDisplayDTO[]>([])
  const [stats, setStats] = useState<ProductStatsDTO>({
    totalProducts: 0,
    activeProducts: 0,
    archivedProducts: 0,
    totalProductDietaryTags: 0,
  })
  const [newProducts, setNewProducts] = useState<NewProductDTO[]>([])
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10)
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [originFilter, setOriginFilter] = useState('all')
  
  // Modals
  const [editModal, setEditModal] = useState<{ open: boolean; product?: ProductDisplayDTO }>({ open: false })
  const [viewModal, setViewModal] = useState<{ open: boolean; product?: ProductDisplayDTO; isNewProduct?: boolean }>({ open: false })
  const [bulkArchiveModal, setBulkArchiveModal] = useState<{ open: boolean; count: number }>({ open: false, count: 0 })
  const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
  
  // Markets modal state
  const [marketsModal, setMarketsModal] = useState<{
    open: boolean
    loading: boolean
    productId?: number
    productName?: string
    markets: any[]
    filteredMarkets: any[]
    error?: string
  }>({ open: false, loading: false, markets: [], filteredMarkets: [] })
  const [marketsPage, setMarketsPage] = useState(0)
  const [marketsPageSize] = useState(5)
  const [marketsSearch, setMarketsSearch] = useState('')
  const [selectedMarketType, setSelectedMarketType] = useState('all')

  // ============================================================================
  // Data Fetching
  // ============================================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsPage, statsData, newProductsData] = await Promise.all([
          fetchProductsPage(page, pageSize),
          fetchProductStats(),
          fetchNewProducts(),
        ])
        
        setProducts(productsPage.content || [])
        setTotalPages(productsPage.page?.totalPages || 1)
        setStats(statsData)
        setNewProducts(newProductsData)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        alert('Failed to fetch data from API. Please check your connection.')
      }
    }
    
    fetchData()
  }, [page, pageSize])

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

  const categories = Array.from(new Set(products.map(p => p.category)))
  const origins = Array.from(new Set(products.map(p => p.origin)))

  const resetFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setOriginFilter('all')
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

  /** Add a newcomer product (set status to ACTIVE) */
  const handleAdd = async (productId: number) => {
    try {
      await updateProductStatus(productId, 'ACTIVE')
      setSuccessModal({ open: true, message: 'Product has been successfully added!' })

      // Refresh all data
      const [productsPage, statsData, newProductsData] = await Promise.all([
        fetchProductsPage(page, pageSize),
        fetchProductStats(),
        fetchNewProducts(),
      ])
      setProducts(productsPage.content || [])
      setTotalPages(productsPage.page?.totalPages || 1)
      setStats(statsData)
      setNewProducts(newProductsData)
    } catch (error) {
      alert('Failed to add product. Please try again.')
      console.error(error)
    }
  }

  /** Ignore a newcomer product (set status to UNRECOGNIZED) */
  const handleIgnore = async (productId: number) => {
    try {
      await updateProductStatus(productId, 'UNRECOGNIZED')
      setSuccessModal({ open: true, message: 'Product has been successfully ignored!' })

      // Refresh newcomers list
      const newProductsData = await fetchNewProducts()
      setNewProducts(newProductsData)
    } catch (error) {
      alert('Failed to ignore product. Please try again.')
      console.error(error)
    }
  }

  /** Approve all newcomer products at once */
  const handleApproveAll = async () => {
    try {
      const allIds = newProducts.map(p => p.id)
      await bulkUpdateStatus(allIds, 'ACTIVE')
      
      setSuccessModal({ open: true, message: 'All products have been successfully approved!' })

      // Refresh all data
      const [productsPage, statsData, newProductsData] = await Promise.all([
        fetchProductsPage(page, pageSize),
        fetchProductStats(),
        fetchNewProducts(),
      ])
      setProducts(productsPage.content || [])
      setTotalPages(productsPage.page?.totalPages || 1)
      setStats(statsData)
      setNewProducts(newProductsData)
    } catch (error) {
      alert('Failed to approve all products. Please try again.')
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

  /** Toggle all products selection */
  const toggleAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  /** Archive selected products (bulk operation) */
  const handleBulkArchive = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to archive.')
      return
    }

    // Open the modal instead of using confirm
    setBulkArchiveModal({ open: true, count: selectedProducts.length })
  }

  /** Confirm bulk archive operation */
  const confirmBulkArchive = async () => {
    try {
      await bulkUpdateStatus(selectedProducts, 'INACTIVE')
      setBulkArchiveModal({ open: false, count: 0 })
      setSuccessModal({ open: true, message: `Successfully archived ${selectedProducts.length} product(s)!` })
      setSelectedProducts([])

      // Refresh data
      const [productsPage, statsData] = await Promise.all([
        fetchProductsPage(page, pageSize),
        fetchProductStats(),
      ])
      setProducts(productsPage.content || [])
      setTotalPages(productsPage.page?.totalPages || 1)
      setStats(statsData)
    } catch (error) {
      alert('Failed to archive selected products. Please try again.')
      console.error(error)
    }
  }

  /** Fetch product market details */
  const fetchProductMarkets = async (productId: number, productName: string) => {
    setMarketsModal({ 
      open: true, 
      loading: true, 
      productId, 
      productName,
      markets: [],
      filteredMarkets: [],
      error: undefined 
    })
    setMarketsPage(0)
    setMarketsSearch('')
    setSelectedMarketType('all')
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/products/marketDetails/${productId}`)
      if (!response.ok) throw new Error('Failed to fetch markets')
      
      const data = await response.json()
      setMarketsModal(prev => ({ 
        ...prev, 
        loading: false,
        markets: data.marketDetails || [],
        filteredMarkets: data.marketDetails || []
      }))
    } catch (error) {
      console.error('Failed to fetch product markets:', error)
      setMarketsModal(prev => ({ 
        ...prev, 
        loading: false,
        error: 'Failed to load markets. Please try again.' 
      }))
    }
  }
  
  // Filter markets by search and type
  useEffect(() => {
    if (!marketsModal.markets.length) return
    
    let filtered = [...marketsModal.markets]
    
    // Filter by search
    if (marketsSearch.trim()) {
      filtered = filtered.filter(m => 
        m.marketName?.toLowerCase().includes(marketsSearch.toLowerCase())
      )
    }
    
    // Filter by market type
    if (selectedMarketType !== 'all') {
      filtered = filtered.filter(m => m.marketType === selectedMarketType)
    }
    
    setMarketsModal(prev => ({ ...prev, filteredMarkets: filtered }))
    setMarketsPage(0)
  }, [marketsSearch, selectedMarketType, marketsModal.markets])

  // Get unique market types
  const marketTypes = ['all', ...new Set(marketsModal.markets.map(m => m.marketType).filter(Boolean))]
  
  // Paginate filtered markets
  const paginatedMarkets = marketsModal.filteredMarkets.slice(
    marketsPage * marketsPageSize,
    (marketsPage + 1) * marketsPageSize
  )
  const marketsTotalPages = Math.ceil(marketsModal.filteredMarkets.length / marketsPageSize)
  
  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50  ">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 pt-2 md:pt-4 pb-4 md:pb-8">
        {/* Header */}
        <div className="mb-5 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Monitor prices, manage inventory, and track product availability across markets
          </p>
        </div>

        {/* New Products Alert */}
        {newProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-blue-900">New Products Detected</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {newProducts.length} product{newProducts.length > 1 ? 's' : ''} awaiting approval
                </p>
              </div>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors shadow-sm"
                onClick={handleApproveAll}
              >
                Approve All ({newProducts.length})
              </button>
            </div>

            <div className="space-y-3">
              {newProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-blue-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 mb-2">{product.productName}</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Price:</span>
                          <span className="text-base font-bold text-blue-600">₱{product.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Category:</span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 text-xs font-semibold text-blue-700">
                            {toTitleCase(product.category)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors font-medium"
                        onClick={() => setViewModal({ open: true, product: { ...product, status: ProductStatus.ACTIVE, previousPrice: 0, totalDietaryTags: 0, lastUpdated: product.detectedDate } as ProductDisplayDTO, isNewProduct: true })}
                        title="View details"
                      >
                        View
                      </button>
                      <button 
                        className="px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors font-medium shadow-sm"
                        onClick={() => handleAdd(product.id)}
                        title="Add to catalog"
                      >
                        Add
                      </button>
                      <button 
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors font-medium"
                        onClick={() => handleIgnore(product.id)}
                        title="Ignore this product"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Products</span>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {stats.totalProducts}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Active Products</span>
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {stats.activeProducts}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Archived</span>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Archive className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {stats.archivedProducts}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Dietary Tags</span>
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {stats.totalProductDietaryTags}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-2 shadow-sm">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-0.5">
              Quick Tip: Product Management
            </h4>
            <p className="text-xs md:text-sm text-blue-700">
              Click on market counts to view detailed coverage. Use search to
              quickly find products by name, category, or local name.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
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
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 font-medium rounded-md transition-colors border border-gray-200 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
              {selectedProducts.length > 0 && (
                <button
                  onClick={handleBulkArchive}
                  className="px-3 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive ({selectedProducts.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products Table (desktop) */}
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
                        className="w-3.5 h-3.5 text-blue-600 bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </div>
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Average Price</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Markets</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedProducts.includes(product.id) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-3.5 h-3.5 text-blue-600 bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
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
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.price)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => fetchProductMarkets(product.id, product.productName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors font-medium"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>{product.totalMarkets} Markets</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <span className={`inline-block px-2.5 py-1 rounded text-sm font-medium ${
                          product.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 
                          product.status === 'ARCHIVED' ? 'bg-gray-50 text-gray-600' : 
                          'bg-gray-50 text-gray-600'
                        }`}>{toTitleCase(product.status)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                          onClick={() => setViewModal({ open: true, product })}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          onClick={() => setEditModal({ open: true, product })}
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edit</span>
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
              <p className="text-sm text-gray-500">No products found matching "{searchTerm}"</p>
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

        {/* Products Card View (mobile & tablet) */}
        <div className="block lg:hidden space-y-4">
          {filteredProducts.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">No products found matching "{searchTerm}"</p>
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
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-gray-900 mb-1">{product.productName}</h4>
                  <p className="text-sm text-gray-500">PR-{String(product.id).padStart(5, '0')}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
                  product.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 
                  product.status === 'ARCHIVED' ? 'bg-gray-50 text-gray-600' : 
                  'bg-gray-50 text-gray-600'
                }`}>{toTitleCase(product.status)}</span>
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
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <p className="text-base font-bold text-gray-900">{formatCurrency(product.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Unit</p>
                  <p className="text-sm font-medium text-gray-900">{product.unit}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => fetchProductMarkets(product.id, product.productName)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-semibold">{product.totalMarkets} Markets</span>
                  </button>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{product.totalDietaryTags}</span> tags
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button 
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors font-medium"
                  onClick={() => setViewModal({ open: true, product })}
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button 
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors font-medium"
                  onClick={() => setEditModal({ open: true, product })}
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit</span>
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
      </div>
    {/* Bulk Archive Modal */}
    {bulkArchiveModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Archive Selected Products</h2>
            <button
              onClick={() => setBulkArchiveModal({ open: false, count: 0 })}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex-shrink-0">
                <Archive className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm md:text-base font-semibold text-orange-900">
                  You are about to archive {bulkArchiveModal.count} product{bulkArchiveModal.count > 1 ? 's' : ''}
                </p>
                <p className="text-xs md:text-sm text-orange-700 mt-1">
                  This action will affect multiple products at once.
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-xs font-semibold text-amber-900 mb-2">What happens when you archive:</p>
              <ul className="space-y-1.5 text-xs text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>Products will be hidden from active lists</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>All historical price data will be preserved</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>System will stop tracking new prices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>You can restore them later if needed</span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-gray-600">
              Please confirm that you want to proceed with archiving these products.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-5">
            <button
              className="flex-1 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              onClick={() => setBulkArchiveModal({ open: false, count: 0 })}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5"
              onClick={confirmBulkArchive}
            >
              <Archive className="w-4 h-4" />
              Archive {bulkArchiveModal.count} Product{bulkArchiveModal.count > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Modal */}
    {editModal.open && editModal.product && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Edit Product</h2>
            <button
              onClick={() => setEditModal({ open: false })}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            
            // Check if this is a new product (doesn't have status field)
            const isNewProduct = !formData.has('status');
            
            if (isNewProduct) {
              const updateData: UpdateNewcomerProductDTO = {
                productName: formData.get('productName') as string,
                localName: formData.get('localName') as string || null,
                category: formData.get('category') as string,
                origin: formData.get('origin') as string,
              };
              
              try {
                await updateNewcomerProduct(editModal.product!.id, updateData);
                setEditModal({ open: false });
                setSuccessModal({ 
                  open: true, 
                  message: 'Product has been successfully updated!' 
                });
                
                // Refresh data
                const [productsPage, statsData, newProductsData] = await Promise.all([
                  fetchProductsPage(page, pageSize),
                  fetchProductStats(),
                  fetchNewProducts(),
                ]);
                setProducts(productsPage.content || []);
                setTotalPages(productsPage.page?.totalPages || 1);
                setStats(statsData);
                setNewProducts(newProductsData);
              } catch (error) {
                alert('Failed to update product. Please try again.');
                console.error(error);
              }
            } else {
              const updateData = {
                localName: formData.get('localName') as string || null,
                price: parseFloat(formData.get('price') as string),
                unit: formData.get('unit') as string,
                status: formData.get('status') as string
              };
              
              try {
                await updateProduct(editModal.product!.id, updateData);
                setEditModal({ open: false });
                setSuccessModal({ 
                  open: true, 
                  message: 'Product has been successfully updated!' 
                });
                
                // Refresh data
                const [productsPage, statsData] = await Promise.all([
                  fetchProductsPage(page, pageSize),
                  fetchProductStats(),
                ]);
                setProducts(productsPage.content || []);
                setTotalPages(productsPage.page?.totalPages || 1);
                setStats(statsData);
              } catch (error) {
                alert('Failed to update product. Please try again.');
                console.error(error);
              }
            }
          }}>
            {/* Row 1: Product Name & Local Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Product Name</label>
                <input
                  type="text"
                  name="productName"
                  className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm ${
                    editModal.product.status ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  defaultValue={editModal.product.productName}
                  disabled={!!editModal.product.status}
                  readOnly={!!editModal.product.status}
                  required
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Local Name</label>
                <input
                  type="text"
                  name="localName"
                  className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={editModal.product.localName || ''}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Row 2: Category & Origin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Category</label>
                <input
                  type="text"
                  name="category"
                  className={`w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm ${
                    editModal.product.status ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  defaultValue={editModal.product.category}
                  disabled={!!editModal.product.status}
                  readOnly={!!editModal.product.status}
                  required
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Origin</label>
                <input
                  type="text"
                  name="origin"
                  className={`w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm ${
                    editModal.product.status ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  defaultValue={editModal.product.origin}
                  disabled={!!editModal.product.status}
                  readOnly={!!editModal.product.status}
                  required
                />
              </div>
            </div>

            {/* Row 3: Price & Unit - Only shown for existing products */}
            {editModal.product.status && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editModal.product.price}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={editModal.product.unit}
                    required
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-5 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="flex-1 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setEditModal({ open: false })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* View Modal */}
    {viewModal.open && viewModal.product && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Product Details</h2>
            <button
              onClick={() => setViewModal({ open: false })}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Row 1: ID & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Product ID</label>
                <div className="text-sm font-semibold text-gray-900">PR-{String(viewModal.product.id).padStart(5, '0')}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${
                  viewModal.product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                  viewModal.product.status === 'ARCHIVED' ? 'bg-orange-100 text-orange-700' : 
                  'bg-slate-100 text-slate-700'
                }`}>{toTitleCase(viewModal.product.status)}</span>
              </div>
            </div>

            {/* Row 2: Product Name & Local Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Product Name</label>
                <div className="text-sm font-semibold text-gray-900">{viewModal.product.productName}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Local Name</label>
                <div className="text-sm text-gray-700">{viewModal.product.localName || <span className="italic text-gray-400">N/A</span>}</div>
              </div>
            </div>

            {/* Row 3: Category & Origin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                <div className="text-sm text-gray-700">{toTitleCase(viewModal.product.category)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Origin</label>
                <div className="text-sm text-gray-700">{viewModal.product.origin}</div>
              </div>
            </div>

            {/* Row 4: Price & Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Price</label>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(viewModal.product.price)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Unit</label>
                <div className="text-sm text-gray-700">{viewModal.product.unit}</div>
              </div>
            </div>

            {/* Row 4.5: Previous Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Previous Price</label>
                <div className="text-sm text-gray-700">
                  {viewModal.product.previousPrice ? formatCurrency(viewModal.product.previousPrice) : <span className="italic text-gray-400">N/A</span>}
                </div>
              </div>
            </div>

            {/* Row 5: Markets & Dietary Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Markets Available</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-teal-600">{viewModal.product.totalMarkets}</span>
                  <span className="text-sm text-gray-600">markets</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Dietary Tags</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-purple-600">{viewModal.product.totalDietaryTags}</span>
                  <span className="text-sm text-gray-600">tags</span>
                </div>
              </div>
            </div>

            {/* Row 6: Last Updated */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Last Updated</label>
              <div className="text-sm text-gray-700">{formatDate(viewModal.product.lastUpdated)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-5 pt-4 border-t border-gray-200">
            <button
              className="flex-1 px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              onClick={() => setViewModal({ open: false })}
            >
              Close
            </button>
            <button
              className="flex-1 px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
              onClick={() => { 
                setViewModal({ open: false }); 
                if (viewModal.isNewProduct) {
                  // Remove status and other fields to treat as new product
                  const { status, ...productWithoutStatus } = viewModal.product!;
                  setEditModal({ open: true, product: productWithoutStatus as any });
                } else {
                  setEditModal({ open: true, product: viewModal.product });
                }
              }}
            >
              Edit Product
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Markets Modal */}
    {marketsModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 md:p-4" onClick={() => setMarketsModal({ open: false, loading: false, markets: [], filteredMarkets: [] })}>
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-3 md:p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Markets Selling {marketsModal.productName}</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                {marketsModal.filteredMarkets.length} market{marketsModal.filteredMarkets.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <button
              onClick={() => setMarketsModal({ open: false, loading: false, markets: [], filteredMarkets: [] })}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Loading State */}
          {marketsModal.loading && (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-sm text-gray-600">Loading markets...</p>
            </div>
          )}

          {/* Error State */}
          {marketsModal.error && (
            <div className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-red-600">{marketsModal.error}</p>
            </div>
          )}

          {/* Content */}
          {!marketsModal.loading && !marketsModal.error && (
            <>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search markets..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={marketsSearch}
                    onChange={(e) => setMarketsSearch(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                  value={selectedMarketType}
                  onChange={(e) => setSelectedMarketType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {marketTypes.filter(t => t !== 'all').map(type => (
                    <option key={type} value={type}>{toTitleCase(type)}</option>
                  ))}
                </select>
              </div>

              {/* Markets Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Market Name</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedMarkets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          <Store className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm">No markets found</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedMarkets.map((market, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{market.marketName}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${
                              market.marketType === 'SUPERMARKET' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {toTitleCase(market.marketType)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-gray-900">{formatCurrency(market.currentPrice)}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-gray-600">{market.unit}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {marketsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Showing {marketsPage * marketsPageSize + 1} to {Math.min((marketsPage + 1) * marketsPageSize, marketsModal.filteredMarkets.length)} of {marketsModal.filteredMarkets.length} markets
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMarketsPage(p => Math.max(0, p - 1))}
                      disabled={marketsPage === 0}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {marketsPage + 1} of {marketsTotalPages}
                    </span>
                    <button
                      onClick={() => setMarketsPage(p => Math.min(marketsTotalPages - 1, p + 1))}
                      disabled={marketsPage >= marketsTotalPages - 1}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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
          }}>Oh Yeah!</h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8" style={{
            opacity: 0,
            transform: 'translateY(10px)',
            animation: 'smoothFadeUp 0.4s ease-out 0.7s forwards'
          }}>{successModal.message}</p>

          {/* OK Button */}
          <button
            className="px-8 md:px-10 py-2.5 md:py-3 rounded-lg bg-teal-600 text-white text-sm md:text-base font-semibold hover:bg-teal-700 transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95"
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
