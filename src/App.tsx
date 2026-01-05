import { Routes, Route, Navigate } from 'react-router-dom';
// Leaflet CSS
import 'leaflet/dist/leaflet.css';
// Layouts
import { MainLayout } from './layout/MainLayout';
import { AdminLayout } from './layout/AdminLayout';
// Admin pages
import { Dashboard } from './admin/Dashboard';
import { Analytics } from './admin/Analytics';
import { Customers } from './admin/Customers';
import { ProductsPage } from './admin/Products';
import {ArchiveProductsPage} from './admin/ArchiveProducts';
import { Market } from './admin/Market';
import { Orders } from './admin/Orders';
import { Settings } from './admin/Settings';
import { Prediction } from './admin/Prediction';
// User pages
import { UserDashboard } from './user/Dashboard';
import { UserAnalytics } from './user/Analytics';
import { UserProfile } from './user/Profile';
import { UserSettings } from './user/Settings';

function App() {
  return <>
      <Routes>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* User Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/analytics" element={<UserAnalytics />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/customers" element={<Customers />} />
         
          <Route path="/orders" element={<Orders />} />
        </Route>

        {/* Admin Layout Routes - Reusing pages for demo purposes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="users" element={<Customers />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="market" element={<Market />} />
          <Route path="settings" element={<Settings />} />
          <Route path="archive-products" element={<ArchiveProductsPage />} />
          <Route path="predictions" element={<Prediction />} />

        </Route>
      </Routes>
    </>
}
export { App };