import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarketplace } from '../../context/MarketplaceContext';
import { repository } from '../../services/repository';
import { ProductOffer, CatalogProduct, Florist } from '../../types';
import { ProductCard } from '../../components/common/ProductCard';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, selectedCommunity, setSelectedCommunity, communities, florists } = useMarketplace();

  // Estados de datos
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('cat') || 'all');
  const [selectedFloristId, setSelectedFloristId] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'under600' | '600to1000' | 'over1000'>('all');
  const [sameDayOnly, setSameDayOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'prep_time'>('featured');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const [allOffers, allCatalog] = await Promise.all([
          repository.getProductOffers(),
          repository.getCatalogProducts(),
        ]);
        setOffers(allOffers);
        setCatalogProducts(allCatalog);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Sincronizar URL query params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchTerm(q);
    const cat = searchParams.get('cat');
    if (cat !== null) setSelectedCategory(cat);
  }, [searchParams]);

  // Filtrado y ordenamiento combinables
  const filteredItems = useMemo(() => {
    return offers
      .filter((offer) => {
        // Publicado
        if (!offer.isPublished) return false;

        // Stock disponible
        if (inStockOnly && offer.stock <= 0) return false;

        // Entrega hoy
        if (sameDayOnly && !offer.sameDayDelivery) return false;

        // Florería específica
        if (selectedFloristId !== 'all' && offer.floristId !== selectedFloristId) return false;

        // Categoría
        if (selectedCategory !== 'all') {
          const cp = catalogProducts.find((p) => p.id === offer.catalogProductId);
          if (!cp || cp.categoryId !== selectedCategory) return false;
        }

        // Cobertura geográfica de la florería según la comunidad elegida
        if (selectedCommunity) {
          const florist = florists.find((f) => f.id === offer.floristId);
          if (!florist) return false;
          const deliversHere = florist.deliveryZones.some(
            (dz) => dz.communityId === selectedCommunity.id && dz.isActive
          );
          if (!deliversHere) return false;
        }

        // Rango de precio
        if (priceRange === 'under600' && offer.price >= 600) return false;
        if (priceRange === '600to1000' && (offer.price < 600 || offer.price > 1000)) return false;
        if (priceRange === 'over1000' && offer.price <= 1000) return false;

        // Búsqueda por texto
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const cp = catalogProducts.find((p) => p.id === offer.catalogProductId);
          const titleMatch = offer.title.toLowerCase().includes(q);
          const descMatch = offer.description.toLowerCase().includes(q);
          const flowerMatch = cp?.flowerTypes.some((ft) => ft.toLowerCase().includes(q));
          const nameMatch = cp?.name.toLowerCase().includes(q);
          if (!titleMatch && !descMatch && !flowerMatch && !nameMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'prep_time') {
          const aTime = a.preparationTime.includes('24 horas') ? 24 : parseInt(a.preparationTime) || 2;
          const bTime = b.preparationTime.includes('24 horas') ? 24 : parseInt(b.preparationTime) || 2;
          return aTime - bTime;
        }
        // Por defecto: más vendidos / destacados
        return b.salesCount - a.salesCount;
      });
  }, [
    offers,
    catalogProducts,
    florists,
    inStockOnly,
    sameDayOnly,
    selectedFloristId,
    selectedCategory,
    selectedCommunity,
    priceRange,
    searchTerm,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedFloristId('all');
    setPriceRange('all');
    setSameDayOnly(false);
    setInStockOnly(true);
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado del catálogo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EAE3D9]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#B25E5C] mb-1">
            Exploración general de flores
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2C2825]">
            Catálogo de Flores en Tlaxcala
          </h1>
          <p className="text-xs text-[#7A736E] mt-1 max-w-2xl leading-relaxed">
            Compara ofertas de ramos y arreglos elaborados por distintas florerías locales. Cada vendedor ofrece su propia selección floral, tiempos de preparación y tarifas de envío.
          </p>
        </div>

        {/* Selector de comunidad contextual */}
        <div className="bg-white p-2.5 rounded-xl border border-[#EAE3D9] flex items-center gap-2 self-start md:self-auto">
          <MapPin className="w-4 h-4 text-[#B25E5C] shrink-0" />
          <div className="text-xs">
            <span className="text-[#8A8179] block text-[10px]">Filtrar por cobertura:</span>
            <select
              value={selectedCommunity?.id || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setSelectedCommunity(null);
                } else {
                  const found = communities.find((c) => c.id === val);
                  setSelectedCommunity(found || null);
                }
              }}
              className="font-semibold text-[#2C2825] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">Todas las localidades de Tlaxcala</option>
              {communities
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.municipality})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A8A199] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo de flor o nombre del ramo..."
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#EAE3D9] rounded-xl text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Ordenar por */}
          <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-[#EAE3D9] text-xs shrink-0">
            <span className="text-[#8A8179]">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium text-[#2C2825] focus:outline-none cursor-pointer"
            >
              <option value="featured">Más populares</option>
              <option value="price_asc">Precio: Menor a mayor</option>
              <option value="price_desc">Precio: Mayor a menor</option>
              <option value="prep_time">Tiempo de preparación más rápido</option>
            </select>
          </div>

          {/* Toggle filtros móviles */}
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-[#EAE3D9] text-xs font-medium text-[#2C2825] shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#B25E5C]" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Grid de contenido: Sidebar de Filtros + Galería de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Sidebar de filtros (Desktop y toggle Mobile) */}
        <aside
          className={`space-y-6 bg-white p-5 rounded-2xl border border-[#EAE3D9] ${
            showFiltersMobile ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D9]">
            <span className="font-semibold text-xs text-[#2C2825] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#B25E5C]" />
              Filtros combinables
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] text-[#B25E5C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar
            </button>
          </div>

          {/* Filtro por Categoría */}
          <div>
            <label className="block text-xs font-semibold text-[#2C2825] mb-2">Categoría</label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#FAF0ED] text-[#B25E5C] font-semibold'
                    : 'text-[#665E58] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>Todas las categorías</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#FAF0ED] text-[#B25E5C] font-semibold'
                      : 'text-[#665E58] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Florería */}
          <div className="pt-4 border-t border-[#EAE3D9]">
            <label className="block text-xs font-semibold text-[#2C2825] mb-2">Florería vendedora</label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFloristId('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedFloristId === 'all'
                    ? 'bg-[#F2F6F3] text-[#5A735E] font-semibold'
                    : 'text-[#665E58] hover:bg-[#FAF8F5]'
                }`}
              >
                Todas las florerías
              </button>
              {florists.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFloristId(f.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    selectedFloristId === f.id
                      ? 'bg-[#F2F6F3] text-[#5A735E] font-semibold'
                      : 'text-[#665E58] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span className="truncate">{f.commercialName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Rango de Precio */}
          <div className="pt-4 border-t border-[#EAE3D9]">
            <label className="block text-xs font-semibold text-[#2C2825] mb-2">Precio en pesos ($MXN)</label>
            <div className="space-y-1 text-xs">
              {[
                { id: 'all', label: 'Cualquier precio' },
                { id: 'under600', label: 'Menos de $600 MXN' },
                { id: '600to1000', label: '$600 a $1,000 MXN' },
                { id: 'over1000', label: 'Más de $1,000 MXN' },
              ].map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="radio"
                    name="priceFilter"
                    checked={priceRange === p.id}
                    onChange={() => setPriceRange(p.id as any)}
                    className="accent-[#B25E5C]"
                  />
                  <span className="text-[#665E58]">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Disponibilidad */}
          <div className="pt-4 border-t border-[#EAE3D9] space-y-2">
            <label className="block text-xs font-semibold text-[#2C2825] mb-1">Disponibilidad</label>
            <label className="flex items-center gap-2 text-xs text-[#665E58] cursor-pointer">
              <input
                type="checkbox"
                checked={sameDayOnly}
                onChange={(e) => setSameDayOnly(e.target.checked)}
                className="rounded accent-[#B25E5C]"
              />
              <span>Solo entrega el mismo día</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#665E58] cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded accent-[#B25E5C]"
              />
              <span>Solo productos con stock</span>
            </label>
          </div>
        </aside>

        {/* Galería de productos */}
        <div className="md:col-span-3">
          {/* Resultados meta */}
          <div className="flex items-center justify-between text-xs text-[#7A736E] mb-4">
            <span>
              Mostrando <strong>{filteredItems.length}</strong> arreglos florales
              {selectedCommunity && ` disponibles para ${selectedCommunity.name}`}
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-[#8A8179]">Cargando catálogo floral...</div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((offer) => {
                const product =
                  catalogProducts.find((cp) => cp.id === offer.catalogProductId) || catalogProducts[0];
                const florist = florists.find((f) => f.id === offer.floristId) || florists[0];
                return (
                  <ProductCard
                    key={offer.id}
                    offer={offer}
                    product={product}
                    florist={florist}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center border border-[#EAE3D9] space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#2C2825]">
                No encontramos productos con estos filtros
              </h3>
              <p className="text-xs text-[#7A736E] max-w-md mx-auto">
                Prueba relajando los filtros de precio o cambiando de comunidad para ver florerías con cobertura en otras zonas de Tlaxcala.
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2C2825] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer filtros</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
