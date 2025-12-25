

/**
 * Markets Page Component
 * Manages market locations with viewing, editing, and product availability tracking
 */

import { useEffect, useState } from 'react'
import {
  fetchMarketsPage,
  fetchMarketStats,
  fetchMarketDetails,
  updateMarket,
  updateMarketStatus,
  bulkUpdateMarketStatus
} from '../admin-api/market-api'
import type {
  MarketDisplayDTO,
  MarketStatsDTO,
  MarketsPage
} from '../admin-api/market-api'
import {
  Store,
  TrendingUp,
  ShoppingCart,
  Droplets,
  Search,
  Eye,
  Pencil,
  Info,
  ChevronRight
} from 'lucide-react'

export function Market() {
  // ============================================================================
  // State Management
  // ============================================================================

  const [markets, setMarkets] = useState<MarketDisplayDTO[]>([])
  const [stats, setStats] = useState<MarketStatsDTO>({
    totalMarkets: 0,
    activeMarkets: 0,
    totalSuperMarkets: 0,
    totalWetMarkets: 0,
  })
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10)
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Selection
  const [selectedMarkets, setSelectedMarkets] = useState<number[]>([])
  
  // Modals
  const [editModal, setEditModal] = useState<{ open: boolean; market?: MarketDisplayDTO }>({ open: false })
  const [viewModal, setViewModal] = useState<{ open: boolean; market?: MarketDisplayDTO; loading?: boolean; error?: string }>({ open: false, loading: false })
  const [bulkArchiveModal, setBulkArchiveModal] = useState<{ open: boolean; count: number }>({ open: false, count: 0 })
  const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  // ============================================================================
  // Data Fetching
  // ============================================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketsPage, statsData] = await Promise.all([
          fetchMarketsPage(page, pageSize),
          fetchMarketStats(),
        ])
        
        setMarkets(marketsPage.content || [])
        setTotalPages(marketsPage.page?.totalPages || 1)
        setStats(statsData)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        alert('Failed to fetch data from API. Please check your connection.')
      }
    }
    
    fetchData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [page, pageSize])

  // ============================================================================
  // Filtering Logic
  // ============================================================================

  const filteredMarkets = markets.filter((market) => {
    if (searchTerm && !market.marketName.trim().toLowerCase().includes(searchTerm.trim().toLowerCase())) {
      return false
    }
    if (typeFilter !== 'all' && market.marketType !== typeFilter) {
      return false
    }
    if (statusFilter !== 'all' && market.marketStatus !== statusFilter) {
      return false
    }
    return true
  })

  const resetFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setStatusFilter('all')
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const toTitleCase = (str: string) => {
    return str.replace(/_/g, ' ').toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // ============================================================================
  // Selection Handlers
  // ============================================================================

  const toggleMarketSelection = (marketId: number) => {
    setSelectedMarkets(prev => 
      prev.includes(marketId) 
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    )
  }

  const toggleAllMarkets = () => {
    if (selectedMarkets.length === filteredMarkets.length) {
      setSelectedMarkets([])
    } else {
      setSelectedMarkets(filteredMarkets.map(m => m.id))
    }
  }

  const handleBulkArchive = () => {
    if (selectedMarkets.length === 0) {
      alert('Please select at least one market to archive.')
      return
    }
    setBulkArchiveModal({ open: true, count: selectedMarkets.length })
  }

  const confirmBulkArchive = async () => {
    try {
      await bulkUpdateMarketStatus(selectedMarkets, 'INACTIVE')
      setBulkArchiveModal({ open: false, count: 0 })
      setSuccessModal({ open: true, message: `Successfully archived ${selectedMarkets.length} market(s)!` })
      setSelectedMarkets([])

      // Refresh data
      const [marketsPage, statsData] = await Promise.all([
        fetchMarketsPage(page, pageSize),
        fetchMarketStats(),
      ])
      setMarkets(marketsPage.content || [])
      setTotalPages(marketsPage.page?.totalPages || 1)
      setStats(statsData)
    } catch (error) {
      alert('Failed to archive selected markets. Please try again.')
      console.error(error)
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 pt-2 md:pt-4 pb-4 md:pb-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Markets</h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Manage market locations and track product availability
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Markets</span>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalMarkets}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Markets</span>
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.activeMarkets}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Supermarkets</span>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalSuperMarkets}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wet Markets</span>
              <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalWetMarkets}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-5 mb-4 md:mb-6 flex flex-col md:flex-row gap-2 md:gap-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-base font-bold text-blue-900 mb-1">
              Quick Tip: Market Management
            </h4>
            <p className="text-sm md:text-base text-blue-700">
              Click on "View Products" to see all products available in a specific market. Use search to
              quickly find markets by name or filter by type.
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
                placeholder="Search markets..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer hover:border-gray-300 transition-colors"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="WET_MARKET">Wet Market</option>
                <option value="SUPERMARKET">Supermarket</option>
              </select>
              <select
                className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer hover:border-gray-300 transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
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
            </div>
          </div>
        </div>

        {/* Markets Table (desktop) */}
        <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
          {/* Bulk Actions Bar */}
          {selectedMarkets.length > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedMarkets.length} market(s) selected
              </span>
              <button
                onClick={handleBulkArchive}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                Archive Selected
              </button>
            </div>
          )}
          <div className="w-full min-w-[350px] md:min-w-0">
            <table className="min-w-[700px] w-full text-sm md:text-base">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-center py-3 px-3 md:px-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedMarkets.length === filteredMarkets.length && filteredMarkets.length > 0}
                      onChange={toggleAllMarkets}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-center py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Market Name</th>
                  <th className="text-center py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-center py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="text-center py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkets.map((market) => (
                  <tr key={market.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <td className="py-4 px-3 md:px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedMarkets.includes(market.id)}
                        onChange={() => toggleMarketSelection(market.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-3 md:px-4 text-center">
                      <div className="text-base text-gray-600">MK-{String(market.id).padStart(3, '0')}</div>
                    </td>
                    <td className="py-4 px-3 md:px-4 text-left">
                      <div className="text-base font-medium text-gray-900">{market.marketName}</div>
                    </td>
                    <td className="py-4 px-3 md:px-4 text-center">
                      <span className={`text-sm px-3 py-1 rounded-md font-medium inline-block ${
                        market.marketType === 'SUPERMARKET' 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                          : 'bg-sky-50 text-sky-700 border border-sky-100'
                      }`}>
                        {toTitleCase(market.marketType)}
                      </span>
                    </td>
                    <td className="py-4 px-3 md:px-4 text-center">
                      <button className="inline-flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-base font-semibold">{market.totalProductsAvailable} products</span>
                      </button>
                    </td>
                    <td className="py-4 px-3 md:px-4">
                      <div className="flex justify-center">
                        <span className={`inline-block px-2.5 py-1 rounded text-sm font-medium ${
                          market.marketStatus === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                        }`}>{toTitleCase(market.marketStatus)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 md:px-4">  
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
                          onClick={() => {
                            console.log('=== BUTTON CLICKED ===')
                            console.log('Market object:', market)
                            console.log('Market ID:', market.id)
                            
                            // Simple test - just open modal with existing market data
                            setViewModal({ 
                              open: true, 
                              market: market,
                              loading: false, 
                              error: undefined 
                            })
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          onClick={() => setEditModal({ open: true, market })}
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
          {filteredMarkets.length === 0 && (
            <div className="py-8 md:py-12 text-center text-gray-500">
              <p className="text-xs md:text-sm">No markets found matching your filters</p>
            </div>
          )}
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{page * pageSize + 1}</span> to <span className="font-medium">{Math.min((page + 1) * pageSize, filteredMarkets.length)}</span> of <span className="font-medium">{filteredMarkets.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
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

        {/* Markets Card View (mobile & tablet) */}
        <div className="block lg:hidden space-y-4">
          {/* Bulk Actions Bar (mobile) */}
          {selectedMarkets.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedMarkets.length} selected
              </span>
              <button
                onClick={handleBulkArchive}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                Archive
              </button>
            </div>
          )}
          {/* Select All Button (mobile) */}
          {filteredMarkets.length > 0 && (
            <button
              onClick={toggleAllMarkets}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {selectedMarkets.length === filteredMarkets.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
          {filteredMarkets.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <p className="text-xs">No markets found matching your filters</p>
            </div>
          )}
          {filteredMarkets.map((market) => (
            <div key={market.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedMarkets.includes(market.id)}
                  onChange={() => toggleMarketSelection(market.id)}
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-base leading-tight">{market.marketName}</div>
                  <div className="text-sm text-gray-500 mt-1">MK-{String(market.id).padStart(3, '0')}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
                  market.marketStatus === 'ACTIVE' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  {toTitleCase(market.marketStatus)}
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                {market.marketType === 'SUPERMARKET' ? (
                  <ShoppingCart className="w-4 h-4 text-indigo-500" />
                ) : (
                  <Droplets className="w-4 h-4 text-sky-500" />
                )}
                <span className="font-medium">{toTitleCase(market.marketType)}</span>
              </div>

              {/* Products Available */}
              <button className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 transition-colors mb-3">
                <span className="font-semibold">{market.totalProductsAvailable} products</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button 
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors font-medium"
                  onClick={() => {
                    console.log('=== MOBILE BUTTON CLICKED ===')
                    console.log('Market object:', market)
                    console.log('Market ID:', market.id)
                    
                    // Simple test - just open modal with existing market data
                    setViewModal({ 
                      open: true, 
                      market: market,
                      loading: false, 
                      error: undefined 
                    })
                  }}
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button 
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors font-medium"
                  onClick={() => setEditModal({ open: true, market })}
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit</span>
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
      </div>

    {/* Edit Modal */}
    {editModal.open && editModal.market && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 md:p-4" onClick={() => setEditModal({ open: false })}>
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 md:p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Edit Market</h2>
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
          <form className="space-y-3 md:space-y-5" onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            
            const updateData = {
              marketName: formData.get('marketName') as string,
              marketType: formData.get('marketType') as 'WET_MARKET' | 'SUPERMARKET'
            }
            
            try {
              await updateMarket(editModal.market!.id, updateData)
              setEditModal({ open: false })
              setSuccessModal({ 
                open: true, 
                message: 'Market has been successfully updated!' 
              })
              
              // Refresh data
              const [marketsPage, statsData] = await Promise.all([
                fetchMarketsPage(page, pageSize),
                fetchMarketStats(),
              ])
              setMarkets(marketsPage.content || [])
              setTotalPages(marketsPage.page?.totalPages || 1)
              setStats(statsData)
            } catch (error) {
              alert('Failed to update market. Please try again.')
              console.error(error)
            }
          }}>
            {/* Market Name */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Market Name</label>
              <input
                type="text"
                name="marketName"
                className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={editModal.market.marketName}
                required
              />
            </div>

            {/* Market Type */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Market Type</label>
              <select
                name="marketType"
                className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                defaultValue={editModal.market.marketType}
                required
              >
                <option value="WET_MARKET">Wet Market</option>
                <option value="SUPERMARKET">Supermarket</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200">
              <button
                type="button"
                className="flex-1 px-4 md:px-5 py-2.5 md:py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm md:text-base font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setEditModal({ open: false })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 md:px-5 py-2.5 md:py-3 rounded-lg bg-green-600 text-white text-sm md:text-base font-medium hover:bg-green-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* View Modal */}
    {viewModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 md:p-4" onClick={() => setViewModal({ open: false, loading: false })}>
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-5 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          
          {/* Loading State */}
          {viewModal.loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
              <p className="text-sm text-gray-600">Loading market details...</p>
            </div>
          )}
          
          {/* Error State */}
          {!viewModal.loading && viewModal.error && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</p>
              <p className="text-sm text-gray-600 mb-6">{viewModal.error}</p>
              <button
                className="px-4 py-2 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                onClick={() => setViewModal({ open: false, loading: false, error: undefined })}
              >
                Close
              </button>
            </div>
          )}
          
          {/* Content State */}
          {!viewModal.loading && !viewModal.error && viewModal.market && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Market Details</h2>
                  <p className="text-sm text-gray-500 mt-1">View complete market information</p>
                </div>
                <button
                  onClick={() => setViewModal({ open: false, loading: false })}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="space-y-5">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Market ID</label>
                  <div className="text-base font-semibold text-gray-900">MK-{String(viewModal.market.id).padStart(3, '0')}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Status</label>
                  <span className={`inline-block px-2.5 py-1 rounded text-sm font-medium ${
                    viewModal.market.marketStatus === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                  }`}>
                    {toTitleCase(viewModal.market.marketStatus)}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Market Name</label>
                  <div className="text-lg font-bold text-gray-900">{viewModal.market.marketName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Market Type</label>
                  <span className={`inline-block text-sm px-2.5 py-1 rounded-md font-medium ${
                    viewModal.market.marketType === 'SUPERMARKET' 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                      : 'bg-sky-50 text-sky-700 border border-sky-100'
                  }`}>
                    {toTitleCase(viewModal.market.marketType)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Total Products</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold text-teal-600">{viewModal.market.totalProductsAvailable || viewModal.market.totalProducts || 0}</span>
                    <span className="text-sm text-gray-500">products</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Hours */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Location & Operating Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Latitude</label>
                  <div className="text-base text-gray-700">{viewModal.market.latitude || 'Not set'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Longitude</label>
                  <div className="text-base text-gray-700">{viewModal.market.longitude || 'Not set'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Opening Time</label>
                  <div className="text-base text-gray-700">{viewModal.market.openingTime || 'Not set'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Closing Time</label>
                  <div className="text-base text-gray-700">{viewModal.market.closingTime || 'Not set'}</div>
                </div>
              </div>
            </div>

            {/* Rating & Dates */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Performance & Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Rating</label>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-lg font-bold text-gray-900">
                      {viewModal.market.ratings ? viewModal.market.ratings.toFixed(1) : 'N/A'}
                    </span>
                    {viewModal.market.ratings && <span className="text-sm text-gray-500">/ 5.0</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Created Date</label>
                  <div className="text-base font-medium text-gray-900">
                    {viewModal.market.createdAt ? new Date(viewModal.market.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </div>
                  {viewModal.market.createdAt && (
                    <div className="text-sm text-gray-500 mt-0.5">
                      {new Date(viewModal.market.createdAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Last Updated</label>
                  <div className="text-base text-gray-700">
                    {viewModal.market.updatedAt ? (
                      <>
                        {new Date(viewModal.market.updatedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })} at {new Date(viewModal.market.updatedAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </>
                    ) : (
                      'Never updated'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {viewModal.market.description && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-base text-gray-700 leading-relaxed">{viewModal.market.description}</p>
              </div>
            )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  className="flex-1 px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                  onClick={() => setViewModal({ open: false, loading: false })}
                >
                  Close
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
                  onClick={() => { 
                    setViewModal({ open: false, loading: false })
                    setEditModal({ open: true, market: viewModal.market })
                  }}
                >
                  Edit Market
                </button>
              </div>
            </>
          )}
          
          {/* Unexpected Empty State */}
          {!viewModal.loading && !viewModal.error && !viewModal.market && (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-lg font-semibold text-gray-900 mb-2">No Data Available</p>
              <p className="text-sm text-gray-600 mb-6">Unable to display market information</p>
              <button
                className="px-4 py-2 rounded-md bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                onClick={() => setViewModal({ open: false, loading: false, error: undefined })}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Bulk Archive Modal */}
    {bulkArchiveModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 md:p-4" onClick={() => setBulkArchiveModal({ open: false, count: 0 })}>
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 md:p-8 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Archive Selected Markets</h2>
            <button
              onClick={() => setBulkArchiveModal({ open: false, count: 0 })}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Warning Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 md:p-5 mb-5">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"/>
              </svg>
              <div>
                <p className="text-base md:text-lg font-semibold text-orange-900">
                  You are about to archive {bulkArchiveModal.count} market{bulkArchiveModal.count > 1 ? 's' : ''}
                </p>
                <p className="text-sm md:text-base text-orange-700 mt-1">
                  This action will affect multiple markets at once.
                </p>
              </div>
            </div>
          </div>

          {/* Information Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 md:p-5 mb-5">
            <h3 className="text-sm md:text-base font-semibold text-amber-900 mb-3">What happens when you archive:</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm md:text-base text-amber-800">
                <span className="text-amber-600 mt-1 text-lg">•</span>
                <span>Markets will be hidden from active lists</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm md:text-base text-amber-800">
                <span className="text-amber-600 mt-1 text-lg">•</span>
                <span>All product availability data will be preserved</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm md:text-base text-amber-800">
                <span className="text-amber-600 mt-1 text-lg">•</span>
                <span>System will stop tracking new products in these markets</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm md:text-base text-amber-800">
                <span className="text-amber-600 mt-1 text-lg">•</span>
                <span>You can restore them later if needed</span>
              </li>
            </ul>
          </div>

          {/* Confirmation Text */}
          <p className="text-sm md:text-base text-gray-600 mb-6">
            Please confirm that you want to proceed with archiving these markets.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              className="flex-1 px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-base font-medium hover:bg-gray-50 transition-colors"
              onClick={() => setBulkArchiveModal({ open: false, count: 0 })}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-5 py-3 rounded-lg bg-orange-600 text-white text-base font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              onClick={confirmBulkArchive}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"/>
              </svg>
              Archive {bulkArchiveModal.count} Market{bulkArchiveModal.count > 1 ? 's' : ''}
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
      }} onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 md:p-8 text-center" onClick={(e) => e.stopPropagation()} style={{
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
