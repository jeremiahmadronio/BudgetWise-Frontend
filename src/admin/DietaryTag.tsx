/**
 * DietaryTag Page Component
 * Manages product dietary tags with overview, tagging, and quality control
 */

import { useState, useEffect } from 'react'
import {
  fetchDietaryTagStats,
  fetchProductsWithTags,
  fetchAllDietaryTags,
  updateProductTags,
  createDietaryTag,
  updateDietaryTag,
  fetchQualityIssues,
  archiveDietaryTags,
  fetchTagCoverage,
  type DietaryTagStatsDTO,
  type ProductWithTagsDTO,
  type DietaryTag,
  type QualityIssue,
  type TagCoverageDTO,
} from '../admin-api/dietaryTag-api'

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'overview' | 'coverage' | 'tagging' | 'quality'

// ============================================================================
// Main Component
// ============================================================================

export function DietaryTag() {
  // ============================================================================
  // State Management
  // ============================================================================

  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [stats, setStats] = useState<DietaryTagStatsDTO | null>(null)

  // Products state
  const [products, setProducts] = useState<ProductWithTagsDTO[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 10

  // Available tags
  const [availableTags, setAvailableTags] = useState<DietaryTag[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<number[]>([])

  // Search states
  const [productSearch, setProductSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [activeStatus, setActiveStatus] = useState('')

  // Filter states for Overview
  const [productSearchInput, setProductSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Filter states for Tag Options
  const [tagSearchInput, setTagSearchInput] = useState('')
  const [tagPage, setTagPage] = useState(0)
  const tagPageSize = 10

  // Quality Control state
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([])
  const [qualityLoading, setQualityLoading] = useState(false)
  const [qualitySearchInput, setQualitySearchInput] = useState('')
  const [qualitySearch, setQualitySearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [activeSeverity, setActiveSeverity] = useState('')
  const [issueTypeFilter, setIssueTypeFilter] = useState('')
  const [activeIssueType, setActiveIssueType] = useState('')
  const [qualityPage, setQualityPage] = useState(0)
  const qualityPageSize = 10

  // Tag Coverage state
  const [coverageData, setCoverageData] = useState<TagCoverageDTO[]>([])
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [coverageSearchInput, setCoverageSearchInput] = useState('')
  const [coverageSearch, setCoverageSearch] = useState('')
  const [statusFilterCoverage, setStatusFilterCoverage] = useState('')
  const [activeStatusCoverage, setActiveStatusCoverage] = useState('')
  const [coveragePage, setCoveragePage] = useState(0)
  const coveragePageSize = 5

  // Modal states
  const [addTagsModal, setAddTagsModal] = useState<{
    open: boolean
    product?: ProductWithTagsDTO
    selectedTags: number[]
  }>({ open: false, selectedTags: [] })

  const [successModal, setSuccessModal] = useState<{
    open: boolean
    message: string
  }>({ open: false, message: '' })

  const [createTagModal, setCreateTagModal] = useState<{
    open: boolean
    tagName: string
    tagDescription: string
  }>({ open: false, tagName: '', tagDescription: '' })

  const [editTagModal, setEditTagModal] = useState<{
    open: boolean
    tag?: DietaryTag
    tagName: string
    tagDescription: string
  }>({ open: false, tagName: '', tagDescription: '' })

  const [archiveTagsModal, setArchiveTagsModal] = useState<{
    open: boolean
    count: number
  }>({ open: false, count: 0 })

  // ============================================================================
  // Data Fetching
  // ============================================================================

  // Fetch stats on mount
  useEffect(() => {
    loadStats()
    loadAvailableTags()
    loadQualityIssues()
  }, [])

  // Fetch products when page or view mode changes
  useEffect(() => {
    if (viewMode === 'overview' || viewMode === 'tagging') {
      loadProducts()
    }
  }, [page, viewMode, productSearch, activeCategory, activeStatus])

  // Reload tags when search changes
  useEffect(() => {
    if (viewMode === 'tagging') {
      loadAvailableTags()
    }
  }, [tagSearch])

  // Fetch quality issues when in quality view
  useEffect(() => {
    if (viewMode === 'quality') {
      loadQualityIssues()
    }
  }, [viewMode, qualitySearch, activeSeverity, activeIssueType])

  // Fetch coverage data when in coverage view
  useEffect(() => {
    if (viewMode === 'coverage') {
      loadCoverageData()
    }
  }, [viewMode, coverageSearch, activeStatusCoverage])

  const loadStats = async () => {
    try {
      const data = await fetchDietaryTagStats()
      setStats(data)
      // Also refresh quality issues whenever stats are reloaded
      await loadQualityIssues()
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadProducts = async () => {
    try {
      setProductsLoading(true)
      const data = await fetchProductsWithTags(
        page, 
        pageSize, 
        productSearch,
        activeCategory,
        activeStatus
      )
      setProducts(data.content)
      setTotalPages(data.page.totalPages)
      setTotalElements(data.page.totalElements)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setProductsLoading(false)
    }
  }

  const loadAvailableTags = async () => {
    try {
      setTagsLoading(true)
      const tags = await fetchAllDietaryTags(tagSearch)
      console.log('=== AVAILABLE DIETARY TAGS ===')
      console.log('Total tags:', tags.length)
      console.log('Tags:', tags)
      console.log('Tag IDs:', tags.map(t => t.id))
      setAvailableTags(tags)
    } catch (error) {
      console.error('Failed to load available tags:', error)
    } finally {
      setTagsLoading(false)
    }
  }

  const loadQualityIssues = async () => {
    try {
      setQualityLoading(true)
      const issues = await fetchQualityIssues()
      setQualityIssues(issues)
    } catch (error) {
      console.error('Failed to load quality issues:', error)
    } finally {
      setQualityLoading(false)
    }
  }

  const loadCoverageData = async () => {
    try {
      setCoverageLoading(true)
      const coverage = await fetchTagCoverage()
      setCoverageData(coverage)
    } catch (error) {
      console.error('Failed to load coverage data:', error)
    } finally {
      setCoverageLoading(false)
    }
  }

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleOpenAddTags = (product: ProductWithTagsDTO) => {
    const tagIds = product.tags.map(t => t.tagId)
    console.log('=== OPENING ADD/EDIT TAGS MODAL ===')
    console.log('Product:', product.productName, '(ID:', product.productId, ')')
    console.log('Current Tags:', product.tags)
    console.log('Pre-selected Tag IDs (using tagId):', tagIds)
    
    setAddTagsModal({
      open: true,
      product,
      selectedTags: tagIds,
    })
  }

  const handleToggleTag = (tagId: number) => {
    console.log('=== TOGGLING TAG ===')
    console.log('Tag ID:', tagId)
    console.log('Currently selected:', addTagsModal.selectedTags)
    
    setAddTagsModal(prev => {
      const isCurrentlySelected = prev.selectedTags.includes(tagId)
      const newSelection = isCurrentlySelected
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
      
      console.log('Action:', isCurrentlySelected ? 'REMOVING' : 'ADDING')
      console.log('New selection:', newSelection)
      
      return {
        ...prev,
        selectedTags: newSelection,
      }
    })
  }

  const handleSaveTags = async () => {
    if (!addTagsModal.product) return

    try {
      const productId = addTagsModal.product.productId
      const newTagIds = addTagsModal.selectedTags

      console.log('=== SAVING TAGS ===')
      console.log('Product ID:', productId)
      console.log('Tag IDs:', newTagIds)
      console.log('Request will send:', { tagIds: newTagIds })

      // Update all tags at once (backend replaces all existing tags)
      await updateProductTags(productId, newTagIds)

      setAddTagsModal({ open: false, selectedTags: [] })
      setSuccessModal({
        open: true,
        message: 'Tags updated successfully!',
      })

      // Refresh data
      await loadStats()
      await loadProducts()
    } catch (error) {
      console.error('Failed to save tags:', error)
      alert('Failed to update tags. Please try again.')
    }
  }

  const handleCreateTag = async () => {
    if (!createTagModal.tagName.trim()) {
      alert('Please enter a tag name')
      return
    }

    if (!createTagModal.tagDescription.trim()) {
      alert('Please enter a tag description')
      return
    }

    try {
      await createDietaryTag(createTagModal.tagName, createTagModal.tagDescription)
      setCreateTagModal({ open: false, tagName: '', tagDescription: '' })
      setSuccessModal({
        open: true,
        message: 'Dietary tag created successfully!',
      })

      // Refresh data
      await loadStats()
      await loadAvailableTags()
    } catch (error) {
      console.error('Failed to create tag:', error)
      alert('Failed to create tag. Please try again.')
    }
  }

  const toggleTagSelection = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const toggleAllTags = () => {
    if (selectedTags.length === availableTags.length) {
      setSelectedTags([])
    } else {
      setSelectedTags(availableTags.map(t => t.id))
    }
  }

  const handleBulkArchive = () => {
    if (selectedTags.length === 0) {
      alert('Please select at least one tag to archive.')
      return
    }
    setArchiveTagsModal({ open: true, count: selectedTags.length })
  }

  const confirmBulkArchive = async () => {
    try {
      await archiveDietaryTags(selectedTags)
      setArchiveTagsModal({ open: false, count: 0 })
      setSuccessModal({ open: true, message: `Successfully archived ${selectedTags.length} tag(s)!` })
      setSelectedTags([])
      await loadStats()
      await loadAvailableTags()
    } catch (error) {
      alert('Failed to archive selected tags. Please try again.')
      console.error(error)
    }
  }

  const handleOpenEditTag = (tag: DietaryTag) => {
    setEditTagModal({
      open: true,
      tag,
      tagName: tag.tagName,
      tagDescription: tag.description || '',
    })
  }

  const handleUpdateTag = async () => {
    if (!editTagModal.tag) return

    if (!editTagModal.tagName.trim()) {
      alert('Please enter a tag name')
      return
    }

    if (!editTagModal.tagDescription.trim()) {
      alert('Please enter a tag description')
      return
    }

    try {
      await updateDietaryTag(
        editTagModal.tag.id,
        editTagModal.tagName,
        editTagModal.tagDescription
      )
      setEditTagModal({ open: false, tagName: '', tagDescription: '' })
      setSuccessModal({ open: true, message: 'Tag updated successfully!' })
      await loadStats()
      await loadAvailableTags()
    } catch (error) {
      console.error('Failed to update tag:', error)
      alert('Failed to update tag. Please try again.')
    }
  }

  // Filter handlers
  const handleApplyProductFilters = () => {
    setProductSearch(productSearchInput)
    setActiveCategory(categoryFilter)
    setActiveStatus(statusFilter)
    setPage(0) // Reset to first page when filtering
  }

  const handleResetProductFilters = () => {
    setProductSearchInput('')
    setCategoryFilter('')
    setStatusFilter('')
    setProductSearch('')
    setActiveCategory('')
    setActiveStatus('')
    setPage(0)
  }

  const handleApplyTagFilters = () => {
    setTagSearch(tagSearchInput)
    setTagPage(0)
  }

  const handleResetTagFilters = () => {
    setTagSearchInput('')
    setTagSearch('')
    setTagPage(0)
  }

  const handleApplyQualityFilters = () => {
    setQualitySearch(qualitySearchInput)
    setActiveSeverity(severityFilter)
    setActiveIssueType(issueTypeFilter)
    setQualityPage(0)
  }

  const handleResetQualityFilters = () => {
    setQualitySearchInput('')
    setSeverityFilter('')
    setIssueTypeFilter('')
    setQualitySearch('')
    setActiveSeverity('')
    setActiveIssueType('')
    setQualityPage(0)
  }

  const handleApplyCoverageFilters = () => {
    setCoverageSearch(coverageSearchInput)
    setActiveStatusCoverage(statusFilterCoverage)
    setCoveragePage(0)
  }

  const handleResetCoverageFilters = () => {
    setCoverageSearchInput('')
    setStatusFilterCoverage('')
    setCoverageSearch('')
    setActiveStatusCoverage('')
    setCoveragePage(0)
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 pt-2 md:pt-4 pb-4 md:pb-8">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dietary Tags Management</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage product dietary tags and track tagging progress
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600 font-medium">Total Products</p>
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalProducts.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">All products in catalog</p>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600 font-medium">Tagged Products</p>
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.taggedProducts.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Products with dietary tags</p>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600 font-medium">Untagged Products</p>
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.untaggedProducts.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Need dietary tags</p>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600 font-medium">Tag Option</p>
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalDietaryOption.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Available dietary options</p>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="mb-4 md:mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1.5 md:p-2 inline-flex gap-1 md:gap-2 flex-wrap">
            <button
              onClick={() => {
                setViewMode('overview')
                setPage(0)
              }}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-md text-sm md:text-base font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                setViewMode('coverage')
                setCoveragePage(0)
              }}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-md text-sm md:text-base font-medium transition-colors ${
                viewMode === 'coverage'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tag Coverage
            </button>
            <button
              onClick={() => {
                setViewMode('tagging')
                setPage(0)
              }}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-md text-sm md:text-base font-medium transition-colors ${
                viewMode === 'tagging'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Dietary Tag Options
            </button>
            <button
              onClick={() => {
                setViewMode('quality')
                setPage(0)
              }}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-md text-sm md:text-base font-medium transition-colors ${
                viewMode === 'quality'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Quality Control
            </button>
          </div>
          
          <button
            onClick={() => setCreateTagModal({ open: true, tagName: '', tagDescription: '' })}
            className="px-4 md:px-6 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg text-sm md:text-base font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Tag
          </button>
        </div>

        {/* Content Area */}
        {viewMode === 'overview' && (
          <OverviewView
            products={products}
            loading={productsLoading}
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            stats={stats}
            searchInput={productSearchInput}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            activeSearch={productSearch}
            activeCategory={activeCategory}
            activeStatus={activeStatus}
            onSearchInputChange={setProductSearchInput}
            onCategoryFilterChange={setCategoryFilter}
            onStatusFilterChange={setStatusFilter}
            onApplyFilters={handleApplyProductFilters}
            onResetFilters={handleResetProductFilters}
            onPageChange={setPage}
            onAddTags={handleOpenAddTags}
          />
        )}

        {viewMode === 'coverage' && (
          <CoverageView
            coverageData={coverageData}
            loading={coverageLoading}
            searchInput={coverageSearchInput}
            statusFilter={statusFilterCoverage}
            activeSearch={coverageSearch}
            activeStatus={activeStatusCoverage}
            page={coveragePage}
            pageSize={coveragePageSize}
            onSearchInputChange={setCoverageSearchInput}
            onStatusFilterChange={setStatusFilterCoverage}
            onApplyFilters={handleApplyCoverageFilters}
            onResetFilters={handleResetCoverageFilters}
            onPageChange={setCoveragePage}
          />
        )}

        {viewMode === 'tagging' && (
          <TagOptionsView 
            tags={availableTags}
            loading={tagsLoading}
            selectedTags={selectedTags}
            searchInput={tagSearchInput}
            activeSearch={tagSearch}
            page={tagPage}
            pageSize={tagPageSize}
            onSearchInputChange={setTagSearchInput}
            onApplyFilters={handleApplyTagFilters}
            onResetFilters={handleResetTagFilters}
            onPageChange={setTagPage}
            onToggleTag={toggleTagSelection}
            onToggleAll={toggleAllTags}
            onEdit={handleOpenEditTag}
            onBulkArchive={handleBulkArchive}
          />
        )}

        {viewMode === 'quality' && (
          <QualityControlView 
            issues={qualityIssues}
            loading={qualityLoading}
            searchInput={qualitySearchInput}
            severityFilter={severityFilter}
            issueTypeFilter={issueTypeFilter}
            activeSearch={qualitySearch}
            activeSeverity={activeSeverity}
            activeIssueType={activeIssueType}
            products={products}
            page={qualityPage}
            pageSize={qualityPageSize}
            onSearchInputChange={setQualitySearchInput}
            onSeverityFilterChange={setSeverityFilter}
            onIssueTypeFilterChange={setIssueTypeFilter}
            onApplyFilters={handleApplyQualityFilters}
            onResetFilters={handleResetQualityFilters}
            onPageChange={setQualityPage}
            onReviewProduct={handleOpenAddTags}
          />
        )}
      </div>

    {/* Add Tags Modal */}
    {addTagsModal.open && addTagsModal.product && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            {addTagsModal.product.productName}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {addTagsModal.product.category} • Select dietary tags
          </p>
        </div>

        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {availableTags.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="text-gray-500 mt-3 font-medium">No dietary tags available</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableTags.map(tag => {
                  const isSelected = addTagsModal.selectedTags.includes(tag.id)
                  return (
                    <label
                      key={tag.id}
                      className={`group flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTag(tag.id)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded outline-none"
                      />
                      <span className={`text-sm font-medium ${
                        isSelected ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {tag.tagName}
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  {addTagsModal.selectedTags.length} tag{addTagsModal.selectedTags.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => setAddTagsModal({ open: false, selectedTags: [] })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTags}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
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
          {/* Success Icon with pulse animation */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{
            opacity: 0,
            animation: 'iconPulse 0.6s ease-out 0.3s forwards'
          }}>
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{
            opacity: 0,
            animation: 'slideUp 0.5s ease-out 0.4s forwards'
          }}>Success!</h3>
          <p className="text-sm md:text-base text-gray-600 mb-6" style={{
            opacity: 0,
            animation: 'slideUp 0.5s ease-out 0.5s forwards'
          }}>
            {successModal.message}
          </p>

          {/* Close Button */}
          <button
            onClick={() => setSuccessModal({ open: false, message: '' })}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm md:text-base font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{
              opacity: 0,
              animation: 'slideUp 0.5s ease-out 0.6s forwards'
            }}
          >
            Done
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
            from {
              opacity: 0;
              transform: scale(0.9) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes iconPulse {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    )}

    {/* Edit Tag Modal */}
    {editTagModal.open && editTagModal.tag && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Edit Dietary Tag</h2>
            <p className="text-sm text-gray-500 mt-1">
              Update the dietary tag information
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag Name
              </label>
              <input
                type="text"
                value={editTagModal.tagName}
                onChange={(e) => setEditTagModal(prev => ({ ...prev, tagName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                placeholder="e.g., Gluten-Free"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={editTagModal.tagDescription}
                onChange={(e) => setEditTagModal(prev => ({ ...prev, tagDescription: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                placeholder="Describe this dietary tag..."
                rows={3}
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => setEditTagModal({ open: false, tagName: '', tagDescription: '' })}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Tag
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Archive Tags Modal */}
    {archiveTagsModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Archive Dietary Tags</h2>
          </div>

          {/* Warning Card */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Archive {archiveTagsModal.count} Tag{archiveTagsModal.count > 1 ? 's' : ''}?
                </h3>
                <p className="text-xs text-gray-600">
                  You are about to archive {archiveTagsModal.count} dietary tag{archiveTagsModal.count > 1 ? 's' : ''}. This will remove {archiveTagsModal.count > 1 ? 'them' : 'it'} from active use.
                </p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">What happens when you archive?</h4>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Tag{archiveTagsModal.count > 1 ? 's' : ''} will be hidden from active lists</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Products using {archiveTagsModal.count > 1 ? 'these tags' : 'this tag'} will need updating</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Historical data will be preserved</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setArchiveTagsModal({ open: false, count: 0 })}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={confirmBulkArchive}
              className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
            >
              Archive {archiveTagsModal.count} Tag{archiveTagsModal.count > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Create Tag Modal */}
    {createTagModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Create New Dietary Tag</h3>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createTagModal.tagName}
                onChange={(e) => setCreateTagModal(prev => ({ ...prev, tagName: e.target.value }))}
                placeholder="e.g., Vegan, Gluten-Free, Keto"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={createTagModal.tagDescription}
                onChange={(e) => setCreateTagModal(prev => ({ ...prev, tagDescription: e.target.value }))}
                placeholder="Describe this dietary tag and what it represents..."
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-colors resize-none"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => setCreateTagModal({ open: false, tagName: '', tagDescription: '' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTag}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Tag
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  )
}

// ============================================================================
// Overview View Component
// ============================================================================

interface OverviewViewProps {
  products: ProductWithTagsDTO[]
  loading: boolean
  page: number
  totalPages: number
  totalElements: number
  stats: DietaryTagStatsDTO | null
  searchInput: string
  categoryFilter: string
  statusFilter: string
  activeSearch: string
  activeCategory: string
  activeStatus: string
  onSearchInputChange: (search: string) => void
  onCategoryFilterChange: (category: string) => void
  onStatusFilterChange: (status: string) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  onPageChange: (page: number) => void
  onAddTags: (product: ProductWithTagsDTO) => void
}

function OverviewView({
  products,
  loading,
  page,
  totalPages,
  totalElements,
  stats,
  searchInput,
  categoryFilter,
  statusFilter,
  activeSearch,
  activeCategory,
  activeStatus,
  onSearchInputChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onApplyFilters,
  onResetFilters,
  onPageChange,
  onAddTags,
}: OverviewViewProps) {

  // Predefined categories
  const categories = [
    'All Categories',
    'Fruits',
    'Vegetables', 
    'Meat',
    'Seafood',
    'Dairy',
    'Bakery',
    'Beverages',
    'Snacks',
    'Condiments',
    'Grains',
    'Others'
  ]

  // Client-side filtering
  const filteredProducts = products.filter(product => {
    // Search filter (case-insensitive, starts with first letter) - use ACTIVE search
    const matchesSearch = !activeSearch || 
      product.productName.toLowerCase().startsWith(activeSearch.toLowerCase()) ||
      (product.localName && product.localName.toLowerCase().startsWith(activeSearch.toLowerCase()))
    
    // Category filter - use ACTIVE category
    const matchesCategory = !activeCategory || product.category === activeCategory
    
    // Status filter - use ACTIVE status
    const matchesStatus = !activeStatus || 
      (activeStatus === 'tagged' && product.tags.length > 0) ||
      (activeStatus === 'untagged' && product.tags.length === 0)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="text-gray-500 mt-4">Loading products...</p>
      </div>
    )
  }

  if (filteredProducts.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white min-w-[180px]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat === 'All Categories' ? '' : cat}>{cat}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white min-w-[180px]"
            >
              <option value="">All Status</option>
              <option value="tagged">Tagged</option>
              <option value="untagged">Needs Tagging</option>
            </select>

            <button
              onClick={onApplyFilters}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>

            <button
              onClick={onResetFilters}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500 mt-4 font-medium">No products match your filters</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-500 mt-4">No products found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white min-w-[180px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat === 'All Categories' ? '' : cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white min-w-[180px]"
          >
            <option value="">All Status</option>
            <option value="tagged">Tagged</option>
            <option value="untagged">Needs Tagging</option>
          </select>

          <button
            onClick={onApplyFilters}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>

          <button
            onClick={onResetFilters}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {stats && stats.untaggedProducts > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-orange-900">
                {stats.untaggedProducts} product{stats.untaggedProducts > 1 ? 's' : ''} need dietary tags
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Add dietary tags to help users find products that match their dietary preferences.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tag Info */}
      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                {stats.totalDietaryOption} dietary tag{stats.totalDietaryOption > 1 ? 's' : ''} available
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Ensure products are tagged accurately to help users find what they need.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile/iPad Cards View (below lg) */}
      <div className="lg:hidden space-y-3">
        {filteredProducts.map((product) => (
          <div key={product.productId} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {product.productName}
                </h3>
                <p className="text-xs text-gray-500">
                  PR-{product.productId.toString().padStart(5, '0')}
                </p>
              </div>
              <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md ${
                product.tags.length > 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {product.tags.length > 0 ? 'Active' : 'Untagged'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Category</p>
                <p className="text-gray-900 font-medium">{product.category}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">{product.localName ? 'Origin' : 'Status'}</p>
                <p className="text-gray-900 font-medium">{product.localName || 'Local'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tags
                </p>
                <p className="text-gray-900 font-medium">{product.tags.length} {product.tags.length === 1 ? 'tag' : 'tags'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Unit</p>
                <p className="text-gray-900 font-medium">kg</p>
              </div>
            </div>
            
            {product.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {product.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.tagId}
                      className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
                    >
                      {tag.tagName}
                    </span>
                  ))}
                  {product.tags.length > 3 && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                      +{product.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <button
              onClick={() => onAddTags(product)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {product.tags.length > 0 ? 'Edit Tags' : 'Add Tags'}
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table View (lg and above) */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    PR-{product.productId.toString().padStart(5, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                    {product.localName && (
                      <div className="text-xs text-gray-500">{product.localName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag) => (
                          <span
                            key={tag.tagId}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag.tagName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        No tags
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onAddTags(product)}
                      className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                    >
                      {product.tags.length > 0 ? 'Edit Tags' : 'Add Tags'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {activeSearch || activeCategory || activeStatus ? (
              <>
                Showing <span className="font-medium">{filteredProducts.length}</span> of{' '}
                <span className="font-medium">{totalElements}</span> products
                {(activeSearch || activeCategory || activeStatus) && (
                  <span className="text-blue-600"> (filtered)</span>
                )}
              </>
            ) : (
              <>
                Showing <span className="font-medium">{page * 10 + 1}</span> to{' '}
                <span className="font-medium">{Math.min((page + 1) * 10, totalElements)}</span> of{' '}
                <span className="font-medium">{totalElements}</span> results
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i
                if (totalPages > 5) {
                  if (page < 3) {
                    pageNum = i
                  } else if (page > totalPages - 3) {
                    pageNum = totalPages - 5 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      pageNum === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Dietary Tag Options View Component
// ============================================================================

interface TagOptionsViewProps {
  tags: DietaryTag[]
  loading: boolean
  selectedTags: number[]
  searchInput: string
  activeSearch: string
  page: number
  pageSize: number
  onSearchInputChange: (search: string) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  onPageChange: (page: number) => void
  onToggleTag: (tagId: number) => void
  onToggleAll: () => void
  onEdit: (tag: DietaryTag) => void
  onBulkArchive: () => void
}

function TagOptionsView({
  tags,
  loading,
  selectedTags,
  searchInput,
  activeSearch,
  page,
  pageSize,
  onSearchInputChange,
  onApplyFilters,
  onResetFilters,
  onPageChange,
  onToggleTag,
  onToggleAll,
  onEdit,
  onBulkArchive,
}: TagOptionsViewProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Client-side filtering for tags - use ACTIVE search
  const filteredTags = tags.filter(tag => {
    if (!activeSearch) return true
    return tag.tagName.toLowerCase().startsWith(activeSearch.toLowerCase()) ||
           (tag.description && tag.description.toLowerCase().startsWith(activeSearch.toLowerCase()))
  })

  // Pagination
  const totalPages = Math.ceil(filteredTags.length / pageSize)
  const paginatedTags = filteredTags.slice(page * pageSize, (page + 1) * pageSize)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="text-gray-500 mt-4">Loading dietary tags...</p>
      </div>
    )
  }

  if (filteredTags.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                placeholder="Search dietary tags..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none"
              />
            </div>

            <button
              onClick={onApplyFilters}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>

            <button
              onClick={onResetFilters}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-gray-500 mt-4 font-medium">No tags match your search</p>
          <p className="text-gray-400 text-sm mt-2">Try a different search term</p>
        </div>
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p className="text-gray-500 mt-4">No dietary tags found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search dietary tags..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none"
            />
          </div>

          <button
            onClick={onApplyFilters}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>

          <button
            onClick={onResetFilters}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Manage Dietary Tag Options
            </h3>
            <p className="text-xs text-blue-700">
              View, edit, and archive dietary tag options. These tags can be assigned to products to indicate dietary attributes.
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTags.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={onBulkArchive}
            className="px-4 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archive Selected
          </button>
        </div>
      )}

      {/* Mobile/iPad Cards View (below lg) */}
      <div className="lg:hidden space-y-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTags.length === filteredTags.length && filteredTags.length > 0}
              onChange={onToggleAll}
              className="rounded border-gray-300 text-blue-600 outline-none w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All Tags ({filteredTags.length})
            </span>
          </label>
        </div>
        {paginatedTags.map((tag) => (
          <div 
            key={tag.id}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => onToggleTag(tag.id)}
                  className="rounded border-gray-300 text-blue-600 outline-none w-4 h-4 mt-0.5"
                />
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {tag.tagName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    DT-{tag.id.toString().padStart(4, '0')}
                  </p>
                </div>
              </div>
              <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md">
                Active
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
              {tag.description || 'No description'}
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Last Updated</p>
                <p className="text-gray-900 font-medium">{formatDate(tag.updatedAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Tag ID</p>
                <p className="text-gray-900 font-medium">{tag.id}</p>
              </div>
            </div>
            
            <button
              onClick={() => onEdit(tag)}
              className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Quality Control View Component
// ============================================================================

interface QualityControlViewProps {
  issues: QualityIssue[]
  loading: boolean
  searchInput: string
  severityFilter: string
  issueTypeFilter: string
  activeSearch: string
  activeSeverity: string
  activeIssueType: string
  products: ProductWithTagsDTO[]
  page: number
  pageSize: number
  onSearchInputChange: (search: string) => void
  onSeverityFilterChange: (severity: string) => void
  onIssueTypeFilterChange: (issueType: string) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  onPageChange: (page: number) => void
  onReviewProduct: (product: ProductWithTagsDTO) => void
}

function QualityControlView({
  issues,
  loading,
  searchInput,
  severityFilter,
  issueTypeFilter,
  activeSearch,
  activeSeverity,
  activeIssueType,
  products,
  page,
  pageSize,
  onSearchInputChange,
  onSeverityFilterChange,
  onIssueTypeFilterChange,
  onApplyFilters,
  onResetFilters,
  onPageChange,
  onReviewProduct,
}: QualityControlViewProps) {
  const handleReview = (issue: QualityIssue) => {
    // Find the product from the products list
    const product = products.find(p => p.productId === issue.productId)
    if (product) {
      onReviewProduct(product)
    } else {
      // If product not found in current page, create a minimal product object
      const minimalProduct: ProductWithTagsDTO = {
        productId: issue.productId,
        productName: issue.productName,
        category: issue.category,
        localName: null,
        tags: issue.currentTags.map((tagName, index) => ({
          tagId: index, // Temporary ID, will be resolved by backend
          tagName: tagName
        }))
      }
      onReviewProduct(minimalProduct)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Client-side filtering
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = !activeSearch ||
      issue.productName.toLowerCase().startsWith(activeSearch.toLowerCase()) ||
      issue.category.toLowerCase().startsWith(activeSearch.toLowerCase())

    const matchesSeverity = !activeSeverity || issue.severity === activeSeverity

    const matchesIssueType = !activeIssueType || issue.issueType === activeIssueType

    return matchesSearch && matchesSeverity && matchesIssueType
  })

  // Pagination
  const totalPages = Math.ceil(filteredIssues.length / pageSize)
  const paginatedIssues = filteredIssues.slice(page * pageSize, (page + 1) * pageSize)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading quality issues...</p>
      </div>
    )
  }

  if (filteredIssues.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />

            <select
              value={severityFilter}
              onChange={(e) => onSeverityFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={issueTypeFilter}
              onChange={(e) => onIssueTypeFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">All Issue Types</option>
              <option value="Untagged">Untagged</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Missing Info">Missing Info</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={onApplyFilters}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Filter
              </button>
              <button
                onClick={onResetFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No Quality Issues Found</h3>
          <p className="text-xs md:text-sm text-gray-500">All products meet quality standards.</p>
        </div>
      </div>
    )
  }

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quality Issues</h3>
        <p className="text-sm text-gray-500">All products meet quality standards.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
    
    <div className="md:col-span-5">
      <input
        type="text"
        placeholder="Search products..."
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      />
    </div>

    
    <div className="md:col-span-2">
      <select
        value={severityFilter}
        onChange={(e) => onSeverityFilterChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
      >
        <option value="">All Severities</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
    </div>

    
    <div className="md:col-span-2">
      <select
        value={issueTypeFilter}
        onChange={(e) => onIssueTypeFilterChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
      >
        <option value="">All Issue Types</option>
        <option value="Untagged">Untagged</option>
        <option value="Duplicate">Duplicate</option>
        <option value="Missing Info">Missing Info</option>
      </select>
    </div>

   
    <div className="md:col-span-3 flex gap-2">
      <button
        onClick={onApplyFilters}
        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filter
      </button>
      <button
        onClick={onResetFilters}
        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-200"
      >
        Reset
      </button>
    </div>
  </div>
</div>

      {/* Info Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-orange-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-900 mb-1">Quality Issues Detected</h3>
            <p className="text-xs text-orange-700">
              Found {filteredIssues.length} product{filteredIssues.length !== 1 ? 's' : ''} with quality issues. Review and resolve them to improve data quality.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile/iPad Cards View (below lg) */}
      <div className="lg:hidden space-y-3">
        {paginatedIssues.map((issue) => (
          <div key={issue.productId} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {issue.productName}
                </h3>
                <p className="text-xs text-gray-500">
                  PR-{issue.productId.toString().padStart(5, '0')}
                </p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getSeverityColor(issue.severity)}`}>
                {issue.severity}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Category</p>
                <p className="text-gray-900 font-medium">{issue.category}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Issue Type</p>
                <p className="text-gray-900 font-medium">{issue.issueType}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 text-xs mb-1">Current Tags</p>
                <div className="flex flex-wrap gap-1">
                  {issue.currentTags.length > 0 ? (
                    issue.currentTags.map((tag, idx) => (
                      <span key={idx} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">No tags</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs font-semibold text-orange-900 mb-1">Issue</p>
              <p className="text-xs text-orange-800">{issue.description}</p>
            </div>
            
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-semibold text-green-900 mb-1">Suggested Fix</p>
              <p className="text-xs text-green-800">{issue.suggestedFix}</p>
            </div>
            
            <button
              onClick={() => handleReview(issue)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Review & Fix
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table View (lg and above) */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedIssues.map((issue) => (
                <tr key={issue.productId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    PR-{issue.productId.toString().padStart(5, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{issue.productName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {issue.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {issue.issueType}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {issue.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleReview(issue)}
                      className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                    >
                      Review & Fix
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing <span className="font-medium">{page * pageSize + 1}</span> to{' '}
            <span className="font-medium">{Math.min((page + 1) * pageSize, filteredIssues.length)}</span> of{' '}
            <span className="font-medium">{filteredIssues.length}</span> results
            {(activeSearch || activeSeverity || activeIssueType) && (
              <span className="text-blue-600"> (filtered)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i
                if (totalPages > 5) {
                  if (page < 3) {
                    pageNum = i
                  } else if (page > totalPages - 3) {
                    pageNum = totalPages - 5 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      pageNum === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
// Temporary file - content to be added to DietaryTag.tsx

// ============================================================================
// Tag Coverage View Component
// ============================================================================

interface CoverageViewProps {
  coverageData: TagCoverageDTO[]
  loading: boolean
  searchInput: string
  statusFilter: string
  activeSearch: string
  activeStatus: string
  page: number
  pageSize: number
  onSearchInputChange: (search: string) => void
  onStatusFilterChange: (status: string) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  onPageChange: (page: number) => void
}

function CoverageView({
  coverageData,
  loading,
  searchInput,
  statusFilter,
  activeSearch,
  activeStatus,
  page,
  pageSize,
  onSearchInputChange,
  onStatusFilterChange,
  onApplyFilters,
  onResetFilters,
  onPageChange,
}: CoverageViewProps) {

  // Client-side filtering
  const filteredCoverage = coverageData.filter(item => {
    const matchesSearch = !activeSearch || item.category.toLowerCase().includes(activeSearch.toLowerCase())
    const matchesStatus = !activeStatus || item.status === activeStatus
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredCoverage.length / pageSize)
  const paginatedCoverage = filteredCoverage.slice(page * pageSize, (page + 1) * pageSize)

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'Good':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'Needs Work':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (filteredCoverage.length === 0 && !loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by category..."
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Needs Work">Needs Work</option>
          </select>
          <button
            onClick={onApplyFilters}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={onResetFilters}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No coverage data found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {(activeSearch || activeStatus) ? 'Try adjusting your search or filters' : 'Coverage data will appear here once available'}
          </p>
        </div>
      </div>
    )
  }

  if (coverageData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-md">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Coverage Data</h3>
        <p className="mt-1 text-sm text-gray-500">Coverage analysis will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Search & Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by category..."
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Needs Work">Needs Work</option>
          </select>
          <button
            onClick={onApplyFilters}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          <button
            onClick={onResetFilters}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Mobile/iPad Cards View (below lg) */}
      <div className="lg:hidden space-y-3">
        {paginatedCoverage.map((item, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {item.category}
                </h3>
                <p className="text-xs text-gray-500">
                  Category Coverage
                </p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Tagged Products</p>
                <p className="text-gray-900 font-medium">{item.taggedCount}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Products</p>
                <p className="text-gray-900 font-medium">{item.totalCount}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coverage</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {item.coveragePercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${item.coveragePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (lg and above) */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tagged</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCoverage.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.taggedCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.totalCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600">
                        {item.coveragePercentage.toFixed(0)}%
                      </span>
                      <div className="flex-1 max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.coveragePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing <span className="font-medium">{page * pageSize + 1}</span> to{' '}
            <span className="font-medium">{Math.min((page + 1) * pageSize, filteredCoverage.length)}</span> of{' '}
            <span className="font-medium">{filteredCoverage.length}</span> results
            {(activeSearch || activeStatus) && (
              <span className="text-blue-600"> (filtered)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i
                if (totalPages > 5) {
                  if (page < 3) {
                    pageNum = i
                  } else if (page > totalPages - 3) {
                    pageNum = totalPages - 5 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      pageNum === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
