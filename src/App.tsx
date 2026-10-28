import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { CartProvider } from './context/CartContext';

// Componentes estructurales
import { DemoNoticeBanner } from './components/common/DemoNoticeBanner';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Páginas Públicas
import { HomePage } from './pages/public/HomePage';
import { CatalogPage } from './pages/public/CatalogPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { FloristsDirectoryPage } from './pages/public/FloristsDirectoryPage';
import { FloristPublicPage } from './pages/public/FloristPublicPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { SellWithUsPage } from './pages/public/SellWithUsPage';
import { InvitationRegisterPage } from './pages/public/InvitationRegisterPage';

// Páginas Comprador
import { BuyerProfilePage } from './pages/buyer/BuyerProfilePage';
import { CartPage } from './pages/buyer/CartPage';
import { CheckoutPage } from './pages/buyer/CheckoutPage';
import { BuyerOrdersPage } from './pages/buyer/BuyerOrdersPage';
import { BuyerOrderDetailPage } from './pages/buyer/BuyerOrderDetailPage';

// Páginas Vendedor / Florería
import { VendorDashboardPage } from './pages/vendor/VendorDashboardPage';
import { VendorShopProfilePage } from './pages/vendor/VendorShopProfilePage';
import { VendorProductsPage } from './pages/vendor/VendorProductsPage';
import { VendorProductFormPage } from './pages/vendor/VendorProductFormPage';
import { VendorInventoryPage } from './pages/vendor/VendorInventoryPage';
import { VendorOrdersPage } from './pages/vendor/VendorOrdersPage';
import { VendorDeliveriesPage } from './pages/vendor/VendorDeliveriesPage';

// Páginas Administrador
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminFloristsPage } from './pages/admin/AdminFloristsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCommunitiesPage } from './pages/admin/AdminCommunitiesPage';
import { AdminCatalogPage } from './pages/admin/AdminCatalogPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MarketplaceProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2C2825]">
              {/* Banner de aviso DEMO y selector de roles */}
              <DemoNoticeBanner />

              {/* Barra de navegación superior conforme al Top Bar Contract */}
              <Navbar />

              {/* Contenedor principal de rutas */}
              <main className="flex-1">
                <Routes>
                  {/* --- PÁGINAS PÚBLICAS --- */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalogo" element={<CatalogPage />} />
                  <Route path="/producto/:id" element={<ProductDetailPage />} />
                  <Route path="/florerias" element={<FloristsDirectoryPage />} />
                  <Route path="/floreria/:id" element={<FloristPublicPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/registro" element={<RegisterPage />} />
                  <Route path="/vende-con-nosotros" element={<SellWithUsPage />} />
                  <Route path="/invitacion/:token" element={<InvitationRegisterPage />} />
                  <Route path="/registro-invitacion" element={<InvitationRegisterPage />} />

                  {/* --- PÁGINAS COMPRADOR --- */}
                  <Route path="/comprador/perfil" element={<BuyerProfilePage />} />
                  <Route path="/carrito" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/comprador/pedidos" element={<BuyerOrdersPage />} />
                  <Route path="/comprador/pedido/:id" element={<BuyerOrderDetailPage />} />

                  {/* --- PÁGINAS VENDEDOR (FLORERÍA) --- */}
                  <Route path="/vendedor" element={<VendorDashboardPage />} />
                  <Route path="/vendedor/floreria" element={<VendorShopProfilePage />} />
                  <Route path="/vendedor/productos" element={<VendorProductsPage />} />
                  <Route path="/vendedor/producto/nuevo" element={<VendorProductFormPage />} />
                  <Route path="/vendedor/producto/:id/editar" element={<VendorProductFormPage />} />
                  <Route path="/vendedor/inventario" element={<VendorInventoryPage />} />
                  <Route path="/vendedor/pedidos" element={<VendorOrdersPage />} />
                  <Route path="/vendedor/entregas" element={<VendorDeliveriesPage />} />

                  {/* --- PÁGINAS ADMINISTRADOR --- */}
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/florerias" element={<AdminFloristsPage />} />
                  <Route path="/admin/usuarios" element={<AdminUsersPage />} />
                  <Route path="/admin/comunidades" element={<AdminCommunitiesPage />} />
                  <Route path="/admin/catalogo" element={<AdminCatalogPage />} />
                  <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
                  <Route path="/admin/reportes" element={<AdminReportsPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Pie de página editorial */}
              <Footer />
            </div>
          </CartProvider>
        </MarketplaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
