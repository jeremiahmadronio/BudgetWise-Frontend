/**
 * Products API Service
 * Handles all product-related API requests including display, stats, newcomers, and updates
 */

const API_BASE = 'http://localhost:8080/api/v1/products';

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
  const res = await fetch(`${API_BASE}/display?page=${page}&size=${size}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

/** Fetch product catalog statistics */
export async function fetchProductStats(): Promise<ProductStatsDTO> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

/** Fetch newly detected products awaiting approval */
export async function fetchNewProducts(): Promise<NewProductDTO[]> {
  const res = await fetch(`${API_BASE}/newcomers`);
  if (!res.ok) throw new Error('Failed to fetch new products');
  return res.json();
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
  const res = await fetch(`${API_BASE}/updateProduct/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update product');
}

/**
 * Update newcomer product details
 * @param id - Product ID
 * @param data - Updated newcomer data
 */
export async function updateNewcomerProduct(id: number, data: UpdateNewcomerProductDTO): Promise<void> {
  const res = await fetch(`${API_BASE}/updatenewcomers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update newcomer product');
}

/**
 * Update single product status
 * @param id - Product ID
 * @param newStatus - New status value (ACTIVE, ARCHIVED, etc.)
 */
export async function updateProductStatus(id: number, newStatus: string): Promise<void> {
  const res = await fetch(`${API_BASE}/updateStatus`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, newStatus }),
  });
  if (!res.ok) throw new Error('Failed to update product status');
}

/**
 * Bulk update product status for multiple products
 * @param ids - Array of product IDs
 * @param newStatus - New status value to apply to all products
 */
export async function bulkUpdateStatus(ids: number[], newStatus: string): Promise<void> {
  const res = await fetch(`${API_BASE}/bulk-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, newStatus }),
  });
  if (!res.ok) throw new Error('Failed to bulk update product status');
}
