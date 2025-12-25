

/**
 * Markets Page Component
 * Manages market locations with viewing, editing, and product availability tracking
 */

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../config/leafleat-config'
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
  ChevronRight,
  MapPin,
  Map,
  Satellite,
  Star
} from 'lucide-react'

// ============================================================================
// Custom Red Marker Icon
// ============================================================================

const redMarkerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// ============================================================================
// Map Click Handler Component
// ============================================================================

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface MapUpdaterProps {
  center: { lat: number; lng: number } | null
}

function MapUpdater({ center }: MapUpdaterProps) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 15)
    }
  }, [center, map])
  
  return null
}

// Custom Ctrl+Scroll Zoom Handler
function CtrlScrollZoom() {
  const map = useMap()
  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        const delta = e.deltaY
        const zoom = map.getZoom()
        
        if (delta < 0) {
          map.setZoom(zoom + 1)
        } else {
          map.setZoom(zoom - 1)
        }
      }
    }
    
    const container = map.getContainer()
    container.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [map])
  
  return null
}

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
  
  const [editLocation, setEditLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapInteractionEnabled, setMapInteractionEnabled] = useState(true)
  const [locationSearch, setLocationSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ lat: string; lon: string; display_name: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street')
  const [isSaving, setIsSaving] = useState(false)
  const [editRating, setEditRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)

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
    const marketType = market.type || market.marketType
    if (typeFilter !== 'all' && marketType !== typeFilter) {
      return false
    }
    const marketStatus = market.status || market.marketStatus
    if (statusFilter !== 'all' && marketStatus !== statusFilter) {
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
  
  const toTitleCase = (str: string | undefined) => {
    if (!str) return ''
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

  // Search for location using Nominatim (OpenStreetMap)
  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return
    
    setIsSearching(true)
    setSearchResults([])
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&countrycodes=ph&limit=5`
      )
      const data = await response.json()
      setSearchResults(data)
      
      if (data.length > 0) {
        // Auto-select first result
        const first = data[0]
        setSearchCenter({ lat: parseFloat(first.lat), lng: parseFloat(first.lon) })
        setEditLocation({ lat: parseFloat(first.lat), lng: parseFloat(first.lon) })
      }
    } catch (error) {
      console.error('Failed to search location:', error)
      alert('Failed to search location. Please try again.')
    } finally {
      setIsSearching(false)
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
                        (market.type || market.marketType) === 'SUPERMARKET' 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                          : 'bg-sky-50 text-sky-700 border border-sky-100'
                      }`}>
                        {toTitleCase(market.type || market.marketType || '')}
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
                          (market.status || market.marketStatus) === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                        }`}>{toTitleCase(market.status || market.marketStatus || '')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 md:px-4">  
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
                          onClick={async () => {
                            console.log('Fetching market details for ID:', market.id)
                            
                            // Open modal with loading state
                            setViewModal({ 
                              open: true, 
                              loading: true,
                              error: undefined 
                            })
                            
                            try {
                              // Fetch full details from /view endpoint
                              const fullDetails = await fetchMarketDetails(market.id)
                              console.log('Fetched market details:', fullDetails)
                              
                              setViewModal({
                                open: true,
                                market: fullDetails,
                                loading: false,
                                error: undefined
                              })
                            } catch (error) {
                              console.error('Failed to fetch market details:', error)
                              setViewModal({
                                open: true,
                                loading: false,
                                error: 'Failed to load market details. Please try again.'
                              })
                            }
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          onClick={async () => {
                            try {
                              // Fetch full details from /view endpoint
                              const fullDetails = await fetchMarketDetails(market.id)
                              setEditModal({ open: true, market: fullDetails })
                              setEditRating(fullDetails.ratings || 0)
                            } catch (error) {
                              console.error('Failed to fetch market details:', error)
                              alert('Failed to load market details. Please try again.')
                            }
                          }}
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
                  (market.status || market.marketStatus) === 'ACTIVE' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  {toTitleCase(market.status || market.marketStatus || '')}
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                {(market.type || market.marketType) === 'SUPERMARKET' ? (
                  <ShoppingCart className="w-4 h-4 text-indigo-500" />
                ) : (
                  <Droplets className="w-4 h-4 text-sky-500" />
                )}
                <span className="font-medium">{toTitleCase(market.type || market.marketType || '')}</span>
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
                  onClick={async () => {
                    console.log('Fetching market details for ID:', market.id)
                    
                    // Open modal with loading state
                    setViewModal({ 
                      open: true, 
                      loading: true,
                      error: undefined 
                    })
                    
                    try {
                      // Fetch full details from /view endpoint
                      const fullDetails = await fetchMarketDetails(market.id)
                      console.log('Fetched market details:', fullDetails)
                      
                      setViewModal({
                        open: true,
                        market: fullDetails,
                        loading: false,
                        error: undefined
                      })
                    } catch (error) {
                      console.error('Failed to fetch market details:', error)
                      setViewModal({
                        open: true,
                        loading: false,
                        error: 'Failed to load market details. Please try again.'
                      })
                    }
                  }}
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button 
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors font-medium"
                  onClick={async () => {
                    try {
                      // Fetch full details from /view endpoint
                      const fullDetails = await fetchMarketDetails(market.id)
                      setEditModal({ open: true, market: fullDetails })
                      setEditRating(fullDetails.ratings || 0)
                    } catch (error) {
                      console.error('Failed to fetch market details:', error)
                      alert('Failed to load market details. Please try again.')
                    }
                  }}
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 md:p-4" onClick={() => {
        setEditModal({ open: false })
        setEditLocation(null)
        setMapInteractionEnabled(true)
        setLocationSearch('')
        setSearchResults([])
        setSearchCenter(null)
        setMapLayer('street')
        setEditRating(0)
        setHoverRating(0)
      }}>
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full p-4 md:p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Edit Market</h2>
            </div>
            <button
              onClick={() => {
                setEditModal({ open: false })
                setEditLocation(null)
                setMapInteractionEnabled(true)
                setLocationSearch('')
                setSearchResults([])
                setSearchCenter(null)
                setMapLayer('street')
                setEditRating(0)
                setHoverRating(0)
              }}
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
            
            // Format times to LocalDateTime format (ISO 8601)
            const currentDate = new Date().toISOString().split('T')[0]
            
            // Parse opening time
            let openingTime = null
            const openingHour = formData.get('openingHour') as string
            const openingMinute = formData.get('openingMinute') as string
            const openingPeriod = formData.get('openingPeriod') as string
            if (openingHour && openingMinute && openingPeriod) {
              let hour = parseInt(openingHour)
              if (openingPeriod === 'PM' && hour !== 12) hour += 12
              if (openingPeriod === 'AM' && hour === 12) hour = 0
              openingTime = `${currentDate}T${String(hour).padStart(2, '0')}:${String(openingMinute).padStart(2, '0')}:00`
            }
            
            // Parse closing time
            let closingTime = null
            const closingHour = formData.get('closingHour') as string
            const closingMinute = formData.get('closingMinute') as string
            const closingPeriod = formData.get('closingPeriod') as string
            if (closingHour && closingMinute && closingPeriod) {
              let hour = parseInt(closingHour)
              if (closingPeriod === 'PM' && hour !== 12) hour += 12
              if (closingPeriod === 'AM' && hour === 12) hour = 0
              closingTime = `${currentDate}T${String(hour).padStart(2, '0')}:${String(closingMinute).padStart(2, '0')}:00`
            }
            
            const updateData = {
              marketLocation: formData.get('marketName') as string,
              type: formData.get('marketType') as 'WET_MARKET' | 'SUPERMARKET',
              latitude: editLocation?.lat || editModal.market!.latitude || 0,
              longitude: editLocation?.lng || editModal.market!.longitude || 0,
              ratings: parseFloat(formData.get('ratings') as string) || 0,
              openingTime,
              closingTime,
              description: formData.get('description') as string || null,
            }
            
            setIsSaving(true)
            
            try {
              await updateMarket(editModal.market!.id, updateData)
              
              // Refresh data first
              const [marketsPage, statsData] = await Promise.all([
                fetchMarketsPage(page, pageSize),
                fetchMarketStats(),
              ])
              setMarkets(marketsPage.content || [])
              setTotalPages(marketsPage.page?.totalPages || 1)
              setStats(statsData)
              
              // Close modal and show success
              setEditModal({ open: false })
              setEditLocation(null)
              setMapInteractionEnabled(true)
              setLocationSearch('')
              setSearchResults([])
              setSearchCenter(null)
              setMapLayer('street')
              
              setSuccessModal({ 
                open: true, 
                message: 'Market has been successfully updated!' 
              })
            } catch (error) {
              console.error('Failed to update market:', error)
              alert('Failed to update market. Please check the console for details and try again.')
            } finally {
              setIsSaving(false)
            }
          }}>
            {/* Market Name & Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Market Type</label>
                <select
                  name="marketType"
                  className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  defaultValue={editModal.market.type || editModal.market.marketType}
                  required
                >
                  <option value="WET_MARKET">Wet Market</option>
                  <option value="SUPERMARKET">Supermarket</option>
                </select>
              </div>
            </div>

            {/* Operating Hours Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Opening Time</label>
                <div className="flex gap-2">
                  <select
                    name="openingHour"
                    className="flex-1 border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    defaultValue={editModal.market.openingTime ? new Date(editModal.market.openingTime).getHours() % 12 || 12 : ''}
                  >
                    <option value="">Hour</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select
                    name="openingMinute"
                    className="flex-1 border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    defaultValue={editModal.market.openingTime ? new Date(editModal.market.openingTime).getMinutes() : ''}
                  >
                    <option value="">Min</option>
                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    name="openingPeriod"
                    className="flex-1 border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    defaultValue={editModal.market.openingTime ? (new Date(editModal.market.openingTime).getHours() >= 12 ? 'PM' : 'AM') : ''}
                  >
                    <option value="">--</option>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Closing Time</label>
                <div className="flex gap-2">
                  <select
                    name="closingHour"
                    className="flex-1 border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    defaultValue={editModal.market.closingTime ? new Date(editModal.market.closingTime).getHours() % 12 || 12 : ''}
                  >
                    <option value="">Hour</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select
                    name="closingMinute"
                    className="flex-1 border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    defaultValue={editModal.market.closingTime ? new Date(editModal.market.closingTime).getMinutes() : ''}
                  >
                    <option value="">Min</option>
                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    name="closingPeriod"
                    className="flex-1 border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    defaultValue={editModal.market.closingTime ? (new Date(editModal.market.closingTime).getHours() >= 12 ? 'PM' : 'AM') : ''}
                  >
                    <option value="">--</option>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Coordinates (Read-only display) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Latitude</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm bg-gray-50 text-gray-600"
                  value={editLocation?.lat?.toFixed(6) || editModal.market.latitude?.toFixed(6) || 'Not set'}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Longitude</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm bg-gray-50 text-gray-600"
                  value={editLocation?.lng?.toFixed(6) || editModal.market.longitude?.toFixed(6) || 'Not set'}
                  readOnly
                />
              </div>
            </div>

            {/* Ratings */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Ratings</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = (hoverRating || editRating) >= star
                    const halfFilled = (hoverRating || editRating) >= star - 0.5 && (hoverRating || editRating) < star
                    
                    return (
                      <div key={star} className="relative">
                        <Star
                          className={`w-8 h-8 cursor-pointer transition-all ${
                            filled
                              ? 'fill-amber-400 text-amber-400'
                              : halfFilled
                              ? 'fill-amber-200 text-amber-400'
                              : 'fill-none text-gray-300 hover:text-amber-300'
                          }`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setEditRating(star)}
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900">{editRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">out of 5</span>
                </div>
              </div>
              <input type="hidden" name="ratings" value={editRating} />
              <p className="text-xs text-gray-500 mt-2">Click on stars to set rating</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Description (Optional)</label>
              <textarea
                name="description"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                defaultValue={editModal.market.description || ''}
                placeholder="Add a description for this market..."
              />
            </div>

            {/* Map Section */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-3">
                Market Location
              </label>
              
              {/* Map Controls Row */}
              <div className="flex flex-col md:flex-row gap-3 mb-3">
                {/* Left: Instructions */}
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs text-blue-800">
                      <p className="font-semibold mb-1">Map Controls:</p>
                      <ul className="space-y-0.5">
                        <li className="hidden md:block">• <span className="font-medium">Ctrl + Scroll</span> to zoom</li>
                        <li className="hidden md:block">• <span className="font-medium">Click & Drag</span> to pan</li>
                        <li className="hidden md:block">• <span className="font-medium">Click</span> to set marker</li>
                        <li className="md:hidden">• Tap "Enable Map" button first</li>
                        <li className="md:hidden">• Tap "Done" when finished</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Right: Layer Toggle */}
                <div className="flex md:flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setMapLayer('street')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      mapLayer === 'street'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" />
                    Street
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapLayer('satellite')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      mapLayer === 'satellite'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Satellite className="w-3.5 h-3.5" />
                    Satellite
                  </button>
                </div>
              </div>
              
              {/* Location Search Bar */}
              <div className="mb-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for address or place name..."
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLocationSearch}
                    disabled={isSearching || !locationSearch.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setSearchCenter({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
                          setEditLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
                          setSearchResults([])
                          setLocationSearch('')
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{result.display_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Map Container */}
              <div className="border border-gray-300 rounded-lg overflow-hidden relative" style={{ height: '400px' }}>
                {/* Mobile Map Overlay - Shows when map is disabled */}
                {!mapInteractionEnabled && (
                  <div 
                    className="absolute inset-0 z-10 bg-black bg-opacity-20 flex items-center justify-center cursor-pointer backdrop-blur-[2px] md:hidden"
                    onClick={() => setMapInteractionEnabled(true)}
                  >
                    <div className="bg-white rounded-lg p-4 shadow-xl text-center">
                      <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-900 mb-1">Tap to Enable Map</p>
                      <p className="text-xs text-gray-600">Click here to interact with the map</p>
                    </div>
                  </div>
                )}
                
                {/* Active Map Indicator - Shows on mobile when enabled */}
                {mapInteractionEnabled && (
                  <div className="absolute top-2 right-2 z-10 md:hidden">
                    <button
                      onClick={() => setMapInteractionEnabled(false)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Done
                    </button>
                  </div>
                )}
                
                <MapContainer
                  center={
                    editModal.market.latitude && editModal.market.longitude
                      ? [editModal.market.latitude, editModal.market.longitude]
                      : [14.5995, 120.9842] // Default: Metro Manila center
                  }
                  zoom={editModal.market.latitude && editModal.market.longitude ? 15 : 11}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                  dragging={mapInteractionEnabled}
                  touchZoom={mapInteractionEnabled}
                  doubleClickZoom={mapInteractionEnabled}
                  boxZoom={mapInteractionEnabled}
                  keyboard={mapInteractionEnabled}
                  key={`map-${editModal.market.id}`}
                >
                  {mapLayer === 'street' ? (
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  ) : (
                    <TileLayer
                      attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  )}
                  <MapClickHandler onLocationSelect={(lat, lng) => setEditLocation({ lat, lng })} />
                  <MapUpdater center={searchCenter} />
                  <CtrlScrollZoom />
                  {(editLocation || (editModal.market.latitude && editModal.market.longitude)) && (
                    <Marker 
                      position={
                        editLocation 
                          ? [editLocation.lat, editLocation.lng]
                          : [editModal.market.latitude!, editModal.market.longitude!]
                      }
                      icon={redMarkerIcon}
                    />
                  )}
                </MapContainer>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200">
              <button
                type="button"
                className="flex-1 px-4 md:px-5 py-2.5 md:py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm md:text-base font-medium hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setEditModal({ open: false })
                  setEditLocation(null)
                  setMapInteractionEnabled(true)
                  setLocationSearch('')
                  setSearchResults([])
                  setSearchCenter(null)
                  setMapLayer('street')
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 md:px-5 py-2.5 md:py-3 rounded-lg bg-teal-600 text-white text-sm md:text-base font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
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
                    (viewModal.market.status || viewModal.market.marketStatus) === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                  }`}>
                    {toTitleCase(viewModal.market.status || viewModal.market.marketStatus || '')}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Market Name</label>
                  <div className="text-lg font-bold text-gray-900">{viewModal.market.marketName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Market Type</label>
                  <span className={`inline-block text-sm px-2.5 py-1 rounded-md font-medium ${
                    (viewModal.market.type || viewModal.market.marketType) === 'SUPERMARKET' 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                      : 'bg-sky-50 text-sky-700 border border-sky-100'
                  }`}>
                    {toTitleCase(viewModal.market.type || viewModal.market.marketType || '')}
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
                  <div className="text-base text-gray-700">{viewModal.market.latitude?.toFixed(6) || 'Not set'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Longitude</label>
                  <div className="text-base text-gray-700">{viewModal.market.longitude?.toFixed(6) || 'Not set'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Opening Time</label>
                  <div className="text-base text-gray-700">
                    {viewModal.market.openingTime ? (
                      new Date(viewModal.market.openingTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                    ) : (
                      'Not set'
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Closing Time</label>
                  <div className="text-base text-gray-700">
                    {viewModal.market.closingTime ? (
                      new Date(viewModal.market.closingTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                    ) : (
                      'Not set'
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Ratings</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-amber-600">{viewModal.market.ratings || 0}</span>
                    <span className="text-sm text-gray-500">out of 5</span>
                  </div>
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
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Description</h3>
              <p className="text-base text-gray-700 leading-relaxed">
                {viewModal.market.description || 'No description available'}
              </p>
            </div>
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
                    const market = viewModal.market
                    setViewModal({ open: false, loading: false })
                    setEditModal({ open: true, market })
                    setEditRating(market?.ratings || 0)
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
