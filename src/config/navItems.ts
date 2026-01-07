import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Settings,
  MapPinHouse,
  Archive,
} from 'lucide-react'

export const userNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Profile', path: '/profile', icon: Users },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Orders', path: '/orders', icon: ShoppingCart },
]

export const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Products', path: '/admin/products', icon: Package },
   { label: 'Market', path: '/admin/market', icon: MapPinHouse },
   { label: 'Predictions', path: '/admin/predictions', icon: BarChart3 },
  { label: 'Archive', path: '/admin/archive-products', icon: Archive },
  { label: 'Users', path: '/admin/users', icon: Users },
  
  { label: 'Settings', path: '/admin/settings', icon: Settings },
  
]
