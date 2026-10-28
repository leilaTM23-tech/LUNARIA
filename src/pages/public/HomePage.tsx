import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMarketplace } from '../../context/MarketplaceContext';
import { repository } from '../../services/repository';
import { ProductOffer, CatalogProduct, Florist } from '../../types';
import { ProductCard } from '../../components/common/ProductCard';
import {
  Search,
  MapPin,
  Sparkles,
  Truck,
  HeartHandshake,
  MessageCircle,
  ArrowRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { getFloralSvg } from '../../data/flowerImages';

export const HomePage: React.FC = () => {
  const { selectedCommunity, categories, florists } = useMarketplace();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredOffers, setFeaturedOffers] = useState<
    { offer: ProductOffer; product: CatalogProduct; florist: Florist }[]
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const [offers, catalog, allFlorists] = await Promise.all([
        repository.getProductOffers({ communityId: selectedCommunity?.id }),
        repository.getCatalogProducts(),
        repository.getFlorists(),
      ]);

      const mapped = offers
        .filter((o) => o.isPublished && o.stock > 0)
        .slice(0, 8)
        .map((offer) => {
          const product = catalog.find((cp) => cp.id === offer.catalogProductId) || catalog[0];
          const florist = allFlorists.find((f) => f.id === offer.floristId) || allFlorists[0];
          return { offer, product, florist };
        });

      setFeaturedOffers(mapped);
    }
    loadData();
  }, [selectedCommunity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalogo');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5EDE8] to-[#FAF8F5] pt-12 pb-16 lg:pt-16 lg:pb-20 border-b border-[#EAE3D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Columna Izquierda: Mensaje y Buscador */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#8C3D38] bg-[#FDF0EE] px-3 py-1 rounded-full border border-[#ECCECE]">
                <Sparkles className="w-3.5 h-3.5 text-[#B25E5C]" />
                <span>Florerías artesanales unidas de Tlaxcala</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#2C2825] leading-tight">
                Flores frescas con el alma de <span className="italic font-serif text-[#B25E5C]">Tlaxcala</span>
              </h1>

              <p className="text-base sm:text-lg text-[#665E58] max-w-xl font-normal leading-relaxed">
                Conectamos tu dedicatoria con floristas locales en Tlaxcala Centro, Apizaco, Huamantla y comunidades vecinas. Ramos artesanales, corte fresco del día y trato humano directo.
              </p>

              {/* Formulario de búsqueda principal */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl">
                <div className="p-1.5 bg-white rounded-2xl shadow-sm border border-[#EAE3D9] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 flex items-center px-3 gap-2">
                    <Search className="w-4 h-4 text-[#A8A199] shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar rosas, girasoles, tulipanes..."
                      className="w-full py-2 text-sm text-[#2C2825] placeholder-[#A8A199] focus:outline-none bg-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#2C2825] hover:bg-[#1A1816] text-white text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Explorar catálogo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtexto de cobertura */}
                <div className="mt-3 flex items-center gap-2 text-xs text-[#7A736E]">
                  <MapPin className="w-3.5 h-3.5 text-[#B25E5C]" />
                  <span>
                    Entregando en:{' '}
                    <strong className="text-[#2C2825] font-semibold">
                      {selectedCommunity ? selectedCommunity.name : 'Todas las comunidades'}
                    </strong>
                  </span>
                  <Link to="/catalogo" className="text-[#B25E5C] hover:underline font-medium">
                    (Cambiar)
                  </Link>
                </div>
              </form>

              {/* Badges de confianza */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[#5C534E]">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#5A735E]" />
                  <span>Entrega express en 2 a 4 hrs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Acuerdo directo por WhatsApp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#5A735E]" />
                  <span>Florerías 100% verificadas</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Visual Floral */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white p-3 rounded-3xl shadow-xl border border-[#EAE3D9]">
                <div className="aspect-4/3 rounded-2xl overflow-hidden bg-[#FAF6F0] relative">
                  <img
                    src={getFloralSvg('roses')}
                    alt="Ramo floral artesanal Lunaria"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-white/60 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#8C3D38]">Rosas Blush & Eucalipto</div>
                      <div className="text-xs font-semibold text-[#2C2825]">Florería Bugambilia · Tlaxcala Centro</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#2C2825] tabular-nums">$680 MXN</div>
                      <div className="text-[10px] text-[#5A735E] font-medium">Disponible hoy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categorías Rápidas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#2C2825]">
              Explora por ocasión y tipo de flor
            </h2>
            <p className="text-xs text-[#7A736E] mt-0.5">
              Encuentra el arreglo perfecto confeccionado por manos floristas de Tlaxcala.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="text-xs font-semibold text-[#B25E5C] hover:text-[#8C3D38] flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              to={`/catalogo?cat=${cat.id}`}
              className="group p-4 bg-white rounded-2xl border border-[#EAE3D9] hover:border-[#B25E5C] hover:shadow-sm transition-all text-center flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#2C2825] group-hover:text-[#B25E5C] transition-colors leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Ofertas Destacadas en Cobertura */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#B25E5C] mb-1">
              Selección de temporada
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#2C2825]">
              Arreglos florales destacados
            </h2>
            <p className="text-xs text-[#7A736E] mt-0.5">
              {selectedCommunity
                ? `Mostrando opciones disponibles para entrega o recolección en ${selectedCommunity.name}.`
                : 'Confeccionados hoy por nuestras florerías colaboradoras.'}
            </p>
          </div>

          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2C2825] hover:text-[#B25E5C] transition-colors"
          >
            <span>Ver catálogo completo ({featuredOffers.length > 0 ? '+20 ramos' : 'explorar'})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredOffers.map(({ offer, product, florist }) => (
            <ProductCard key={offer.id} offer={offer} product={product} florist={florist} />
          ))}
        </div>
      </section>

      {/* 4. Florerías de Tlaxcala */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF6F2] rounded-3xl p-6 sm:p-10 border border-[#EAE3D9]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5A735E] mb-1">
                Comercio Local Responsable
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#2C2825]">
                Conoce a las florerías de nuestra red
              </h2>
              <p className="text-xs text-[#7A736E] mt-0.5">
                Talleres florales independientes con reputación contrastada en Tlaxcala, Apizaco y Huamantla.
              </p>
            </div>

            <Link
              to="/florerias"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-xs font-semibold text-[#2C2825] rounded-xl border border-[#EAE3D9] hover:border-[#B25E5C] transition-all shrink-0"
            >
              <span>Ver todas las florerías</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B25E5C]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {florists.map((f) => (
              <div
                key={f.id}
                className="bg-white rounded-2xl p-5 border border-[#EAE3D9] flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-serif text-lg font-semibold text-[#2C2825]">{f.commercialName}</h3>
                    <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{f.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#665E58] line-clamp-3 mb-4 leading-relaxed">
                    {f.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-[#7A736E] border-t border-[#F2ECE4] pt-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#B25E5C] shrink-0 mt-0.5" />
                      <span className="truncate">{f.address}</span>
                    </div>
                    <div className="text-[11px] text-[#5A735E]">
                      Responsable de pedidos: <strong>{f.orderAgentName}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                  <span className="text-[11px] text-[#8A8179]">
                    {f.deliveryZones.length} zonas de entrega
                  </span>
                  <Link
                    to={`/floreria/${f.id}`}
                    className="text-xs font-semibold text-[#B25E5C] hover:text-[#8C3D38] inline-flex items-center gap-1"
                  >
                    <span>Ver catálogo</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Cómo funciona Lunaria */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-serif text-3xl font-normal text-[#2C2825]">
            Cómo pedir flores en Lunaria
          </h2>
          <p className="text-xs text-[#7A736E] mt-1">
            Diseñado para garantizar flores frescas, puntualidad y comunicación directa sin comisiones ocultas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-serif text-xl font-bold mb-4">
              1
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2825] mb-2">
              Elige ramo y tu comunidad
            </h3>
            <p className="text-xs text-[#7A736E] leading-relaxed">
              Selecciona tu municipio en Tlaxcala para ver florerías con cobertura real, tiempos estimados y costos transparentes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-serif text-xl font-bold mb-4">
              2
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2825] mb-2">
              Personaliza tu dedicatoria
            </h3>
            <p className="text-xs text-[#7A736E] leading-relaxed">
              Agrega el mensaje que llevará la tarjeta de regalo, elige si deseas entrega a domicilio o recolección en taller.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-serif text-xl font-bold mb-4">
              3
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2825] mb-2">
              Confirma vía WhatsApp
            </h3>
            <p className="text-xs text-[#7A736E] leading-relaxed">
              Con un solo clic se genera tu resumen de pedido y te comunicas directo con el florista para acordar transferencia o contra entrega.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
