import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repository } from '../../services/repository';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Florist, ProductOffer, CatalogProduct } from '../../types';
import { ProductCard } from '../../components/common/ProductCard';
import {
  MapPin,
  Star,
  Clock,
  Phone,
  MessageCircle,
  Truck,
  Instagram,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

export const FloristPublicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { communities } = useMarketplace();
  const [florist, setFlorist] = useState<Florist | null>(null);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFloristData() {
      if (!id) return;
      setLoading(true);
      try {
        const [fl, allOffers, allCatalog] = await Promise.all([
          repository.getFloristById(id),
          repository.getProductOffers({ floristId: id }),
          repository.getCatalogProducts(),
        ]);
        setFlorist(fl);
        setOffers(allOffers);
        setCatalogProducts(allCatalog);
      } finally {
        setLoading(false);
      }
    }
    loadFloristData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-[#8A8179]">
        Cargando perfil de la florería...
      </div>
    );
  }

  if (!florist) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">Florería no encontrada</h2>
        <p className="text-xs text-[#7A736E]">La florería que buscas no existe o fue dada de baja.</p>
        <Link to="/florerias" className="inline-block px-4 py-2 bg-[#2C2825] text-white rounded-lg text-xs font-semibold">
          Volver al directorio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Banner y Encabezado de la Florería */}
      <section className="bg-white border-b border-[#EAE3D9] pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <nav className="flex items-center gap-1.5 text-xs text-[#8A8179]">
            <Link to="/" className="hover:text-[#2C2825]">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/florerias" className="hover:text-[#2C2825]">Florerías</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#2C2825] font-medium">{florist.commercialName}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-serif font-bold text-2xl shadow-xs shrink-0">
                {florist.commercialName.charAt(0)}
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
                    {florist.commercialName}
                  </h1>
                  <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{florist.rating.toFixed(1)}</span>
                    <span className="text-[#8A8179]">({florist.reviewCount} reseñas)</span>
                  </div>
                </div>

                <p className="text-xs text-[#665E58] max-w-2xl leading-relaxed">
                  {florist.description}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#7A736E]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#B25E5C]" />
                    <span>{florist.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#A8A199]" />
                    <span>{florist.openingHours}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#5A735E]" />
                    <span>Responsable: {florist.orderAgentName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Canales de contacto directo */}
            <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
              <a
                href={`https://wa.me/${florist.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar por WhatsApp</span>
              </a>

              {florist.instagram && (
                <a
                  href={`https://instagram.com/${florist.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#FAF8F5] border border-[#EAE3D9] text-[#2C2825] hover:bg-[#F2ECE4] text-xs font-medium rounded-xl transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5 text-[#C86D67]" />
                  <span>{florist.instagram}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de la Florería */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">
              Arreglos y ramos de {florist.commercialName}
            </h2>
            <p className="text-xs text-[#7A736E] mt-0.5">
              {offers.length} diseños disponibles para entrega o recolección en taller.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {offers.map((offer) => {
            const product =
              catalogProducts.find((cp) => cp.id === offer.catalogProductId) || catalogProducts[0];
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
      </section>

      {/* Zonas de Cobertura y Tarifas de Envío */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2C2825]">
            <Truck className="w-4 h-4 text-[#5A735E]" />
            <span>Zonas de cobertura de entrega y tarifas oficiales</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3D9] text-[#8A8179]">
                  <th className="py-2.5 px-3 font-semibold">Comunidad / Municipio</th>
                  <th className="py-2.5 px-3 font-semibold">Costo de envío</th>
                  <th className="py-2.5 px-3 font-semibold">Tiempo estimado</th>
                  <th className="py-2.5 px-3 font-semibold">Pedido mínimo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {florist.deliveryZones.map((dz) => {
                  const comm = communities.find((c) => c.id === dz.communityId);
                  return (
                    <tr key={dz.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-2.5 px-3 font-medium text-[#2C2825]">
                        {comm ? `${comm.name} (${comm.municipality})` : dz.communityId}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums font-semibold text-[#2C2825]">
                        ${dz.deliveryFee} MXN
                      </td>
                      <td className="py-2.5 px-3 text-[#5A735E] font-medium">
                        {dz.estimatedDeliveryTime}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-[#665E58]">
                        ${dz.minOrderAmount || 0} MXN
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
