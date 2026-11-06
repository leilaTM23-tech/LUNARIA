import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useCart } from '../../context/CartContext';
import { CommunitySelectorModal } from './CommunitySelectorModal';
import {
  ShoppingBag,
  MapPin,
  Menu,
  X,
  User,
  Store,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { selectedCommunity } = useMarketplace();
  const { totalItemsCount } = useCart();
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleNavigation = () => {
    if (currentUser.role === 'admin') {
      navigate('/admin');
    } else if (currentUser.role === 'florist') {
      navigate('/vendedor');
    } else {
      navigate('/comprador/perfil');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE3D9] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand wordmark (single element, font-serif, 1 line) */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="group flex items-baseline gap-1 text-2xl font-serif font-bold tracking-tight text-[#2C2825] whitespace-nowrap"
            >
              <span>Lunaria</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#B25E5C] inline-block mb-1 group-hover:scale-125 transition-transform" />
            </Link>

            {/* Selector de comunidad rápido */}
            <button
              onClick={() => setIsCommunityModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white text-[#5C534E] rounded-md border border-[#EAE3D9] hover:border-[#D1C6BA] hover:text-[#2C2825] transition-colors cursor-pointer"
              title="Cambiar comunidad de entrega"
            >
              <MapPin className="w-3.5 h-3.5 text-[#B25E5C]" />
              <span className="max-w-[130px] truncate font-medium">
                {selectedCommunity ? selectedCommunity.name : 'Tlaxcala'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#A8A199]" />
            </button>
          </div>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#5C534E]">
            <Link
              to="/catalogo"
              className="hover:text-[#B25E5C] transition-colors whitespace-nowrap shrink-0"
            >
              Catálogo de Flores
            </Link>
            <Link
              to="/florerias"
              className="hover:text-[#B25E5C] transition-colors whitespace-nowrap shrink-0"
            >
              Florerías en Tlaxcala
            </Link>
            {currentUser.role === 'buyer' && (
              <Link
                to="/comprador/pedidos"
                className="hover:text-[#B25E5C] transition-colors whitespace-nowrap shrink-0"
              >
                Mis Pedidos
              </Link>
            )}
            {currentUser.role === 'florist' && (
              <Link
                to="/vendedor"
                className="hover:text-[#B25E5C] text-[#5A735E] font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <Store className="w-4 h-4" />
                Panel Vendedor
              </Link>
            )}
            {currentUser.role === 'admin' && (
              <Link
                to="/admin"
                className="hover:text-[#B25E5C] text-[#8C3D38] font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <ShieldCheck className="w-4 h-4" />
                Panel Admin
              </Link>
            )}
          </nav>

          {/* Zone 3: Actions (Community mobile trigger + Vende con nosotros + Cart + User menu) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Vende con nosotros visible CTA */}
            <Link
              to="/vende-con-nosotros"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8C3D38] bg-[#FAF0ED] hover:bg-[#F2DDD9] border border-[#F2DDD9] rounded-lg transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#B25E5C]" />
              <span>Vende con nosotros</span>
            </Link>

            {/* Mobile community button */}
            <button
              onClick={() => setIsCommunityModalOpen(true)}
              className="lg:hidden p-2 text-[#5C534E] hover:text-[#2C2825] hover:bg-[#F2ECE4] rounded-lg transition-colors cursor-pointer"
              title="Elegir comunidad"
              aria-label="Elegir comunidad"
            >
              <MapPin className="w-4 h-4 text-[#B25E5C]" />
            </button>

            {/* Shopping cart button */}
            <Link
              to="/carrito"
              className="relative p-2 text-[#2C2825] hover:bg-[#F2ECE4] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Ver carrito"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B25E5C] text-white text-[11px] font-semibold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            {/* User profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-[#2C2825] bg-white border border-[#EAE3D9] rounded-lg hover:border-[#D1C6BA] transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-semibold text-xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.fullName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#EAE3D9] py-2 z-50 text-xs"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-[#EAE3D9]">
                    <div className="font-semibold text-sm text-[#2C2825] truncate">{currentUser.fullName}</div>
                    <div className="text-[#8A8179] truncate">{currentUser.email}</div>
                    <div className="mt-1">
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#B25E5C]">
                        Rol: {currentUser.role}
                      </span>
                    </div>
                  </div>

                  {currentUser.role === 'buyer' && (
                    <>
                      <Link
                        to="/comprador/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5] hover:text-[#2C2825]"
                      >
                        Mi Perfil y Direcciones
                      </Link>
                      <Link
                        to="/comprador/pedidos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5] hover:text-[#2C2825]"
                      >
                        Historial de Pedidos
                      </Link>
                      <Link
                        to="/carrito"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5] hover:text-[#2C2825]"
                      >
                        Mi Carrito ({totalItemsCount})
                      </Link>
                    </>
                  )}

                  {currentUser.role === 'florist' && (
                    <>
                      <Link
                        to="/vendedor"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 font-medium text-[#5A735E] hover:bg-[#F2F6F3]"
                      >
                        Dashboard Vendedor
                      </Link>
                      <Link
                        to="/vendedor/floreria"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5]"
                      >
                        Perfil de Mi Florería
                      </Link>
                      <Link
                        to="/vendedor/productos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5]"
                      >
                        Mis Productos
                      </Link>
                      <Link
                        to="/vendedor/pedidos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5]"
                      >
                        Pedidos Recibidos
                      </Link>
                      <Link
                        to="/vendedor/inventario"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5]"
                      >
                        Control de Inventario
                      </Link>
                    </>
                  )}

                  {currentUser.role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 font-medium text-[#8C3D38] hover:bg-[#FBF4F2]"
                      >
                        Dashboard Administrador
                      </Link>
                      <Link
                        to="/admin/florerias"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5]"
                      >
                        Gestión de Florerías
                      </Link>
                      <Link
                        to="/admin/pedidos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5]"
                      >
                        Supervisión de Pedidos
                      </Link>
                      <Link
                        to="/admin/comunidades"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5]"
                      >
                        Zonas de Cobertura
                      </Link>
                      <Link
                        to="/admin/catalogo"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-[#4A443F] hover:bg-[#FAF8F5]"
                      >
                        Gestión de Catálogo
                      </Link>
                    </>
                  )}

                  <div className="border-t border-[#EAE3D9] mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#2C2825] hover:bg-[#F2ECE4] rounded-lg transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#EAE3D9] bg-white px-4 py-4 space-y-3">
            <div className="pb-3 border-b border-[#EAE3D9]">
              <div className="text-xs text-[#8A8179] mb-1">Comunidad activa para entrega:</div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsCommunityModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] border border-[#EAE3D9] text-xs font-medium text-[#2C2825]"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#B25E5C]" />
                  <span>{selectedCommunity ? selectedCommunity.name : 'Elegir comunidad'}</span>
                </div>
                <span className="text-[#B25E5C]">Cambiar</span>
              </button>
            </div>

            <div className="space-y-1 text-sm font-medium">
              <Link
                to="/catalogo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-[#2C2825] hover:bg-[#FAF8F5]"
              >
                Catálogo de Flores
              </Link>
              <Link
                to="/florerias"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-[#2C2825] hover:bg-[#FAF8F5]"
              >
                Florerías en Tlaxcala
              </Link>
              <Link
                to="/vende-con-nosotros"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-[#8C3D38] font-semibold bg-[#FAF0ED]"
              >
                Vende con nosotros (Registro de Florería)
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleRoleNavigation();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-[#B25E5C] hover:bg-[#FAF0ED]"
              >
                Mi Panel ({currentUser.role})
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modal de selección de comunidad */}
      <CommunitySelectorModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
      />
    </>
  );
};
