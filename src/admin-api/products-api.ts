  /**
   * Products API Service
   * Handles all product-related API requests including display, stats, newcomers, and updates
   */

  import { api } from '../utils/apiClient'

  // ============================================================================
  // Type Definitions
  // ============================================================================

  /** Product display information for catalog listing */
  export interface ProductDisplayDTO {
    id: number;
    productName: string;
    category: string;
    origin: string;
    localName: string | null;
    unit: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'DEACTIVATED';
    price: number;
    previousPrice: number;
    totalMarkets: number;
    totalDietaryTags: number;
    lastUpdated: string;
  }

  /** Summary statistics for product catalog */
  export interface ProductStatsDTO {
    totalProducts: number;
    activeProducts: number;
    archivedProducts: number;
    totalProductDietaryTags: number;
  }

  /** Newly detected products awaiting approval */
  export interface NewProductDTO {
    id: number;
    productName: string;
    category: string;
    origin: string;
    localName: string | null;
    unit: string;
    price: number;
    totalMarkets: number;
    detectedDate: string;
  }

  /** Paginated product response */
  export interface ProductsPage {
    content: ProductDisplayDTO[];
    page: {
      size: number;
      number: number;
      totalElements: number;
      totalPages: number;
    };
  }

  /** Update payload for existing products */
  export interface UpdateProductDTO {
    localName: string | null;
    price: number;
    unit: string;
    status: string;
  }

  /** Update payload for newcomer products */
  export interface UpdateNewcomerProductDTO {
    productName: string;
    category: string;
    localName: string | null;
    origin: string;
  }

  // ============================================================================
  // Fetch Operations
  // ============================================================================

  /**
   * Fetch paginated products list
   * @param page - Page number (0-indexed)
   * @param size - Items per page
   */
  export async function fetchProductsPage(page = 0, size = 10): Promise<ProductsPage> {
    return api.get(`/api/v1/admin/products/display?page=${page}&size=${size}`);
  }

  /** Fetch product catalog statistics */
  export async function fetchProductStats(): Promise<ProductStatsDTO> {
    return api.get('/api/v1/admin/products/stats');
  }

  /** Fetch newly detected products awaiting approval */
  export async function fetchNewProducts(): Promise<NewProductDTO[]> {
    return api.get('/api/v1/admin/products/newcomers');
  }

  // ============================================================================
  // Update Operations
  // ============================================================================

  /**
   * Update existing product details
   * @param id - Product ID
   * @param data - Updated product data
   */
  export async function updateProduct(id: number, data: UpdateProductDTO): Promise<void> {
    return api.put(`/api/v1/admin/products/updateProduct/${id}`, data);
  }

  /**
   * Update newcomer product details
   * @param id - Product ID
   * @param data - Updated newcomer data
   */
  export async function updateNewcomerProduct(id: number, data: UpdateNewcomerProductDTO): Promise<void> {
    return api.put(`/api/v1/admin/products/updatenewcomers/${id}`, data);
  }

  /**
   * Update single product status
   * @param id - Product ID
   * @param newStatus - New status value (ACTIVE, ARCHIVED, etc.)
   */
  export async function updateProductStatus(id: number, newStatus: string): Promise<void> {
    return api.put('/api/v1/admin/products/updateStatus', { id, newStatus });
  }

  /**
   * Bulk update product status for multiple products
   * @param ids - Array of product IDs
   * @param newStatus - New status value to apply to all products
   */
  export async function bulkUpdateStatus(ids: number[], newStatus: string): Promise<void> {
    return api.patch('/api/v1/admin/products/bulk-status', { ids, newStatus });
  }
