import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductOffer, CatalogProduct, Florist } from '../../types';
import { useCart } from '../../context/CartContext';
import { Star, Clock, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  offer: ProductOffer;
  product: CatalogProduct;
  florist: Florist;
}

export const ProductCard: React.FC<ProductCardProps> = ({ offer, product, florist }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (offer.stock <= 0) return;

    addToCart(offer, product, florist, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const imageSrc = offer.images[0] || product.defaultImageUrl;

  return (
    <div className="group relative bg-white rounded-2xl border border-[#EAE3D9] overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col h-full">
      {/* Imagen del producto */}
      <Link to={`/producto/${offer.id}`} className="block relative aspect-4/3 bg-[#F7F4EE] overflow-hidden">
        <img
          src={imageSrc}
          alt={offer.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Indicador de stock o entrega hoy */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {offer.sameDayDelivery && (
            <span className="text-[11px] font-medium text-[#2C2825] bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs">
              Entrega hoy
            </span>
          )}
          {offer.stock < 5 && offer.stock > 0 && (
            <span className="text-[11px] font-medium text-[#8C3D38] bg-[#FDF2F0]/90 backdrop-blur-xs px-2 py-0.5 rounded">
              Últimas {offer.stock} pzas
            </span>
          )}
          {offer.stock === 0 && (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-200/90 backdrop-blur-xs px-2 py-0.5 rounded">
              Agotado
            </span>
          )}
        </div>
      </Link>

      {/* Contenido */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadatos limpios sin cápsulas */}
          <div className="flex items-center gap-1.5 text-xs text-[#8A8179] mb-1">
            <span className="truncate">{florist.commercialName}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-0.5 text-amber-700 font-medium">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {florist.rating.toFixed(1)}
            </span>
          </div>

          {/* Título */}
          <Link to={`/producto/${offer.id}`} className="block">
            <h3 className="font-semibold text-sm text-[#2C2825] leading-snug line-clamp-2 hover:text-[#B25E5C] transition-colors">
              {offer.title}
            </h3>
          </Link>

          {/* Tiempo estimado */}
          <div className="flex items-center gap-1 text-[11px] text-[#7A736E] mt-2">
            <Clock className="w-3 h-3 text-[#A8A199]" />
            <span>Listo en: {offer.preparationTime}</span>
          </div>
        </div>

        {/* Precio y acción rápida */}
        <div className="mt-4 pt-3 border-t border-[#F2EDE4] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#8A8179]">Precio unitario</div>
            <div className="text-base font-semibold text-[#2C2825] tabular-nums">
              ${offer.price.toLocaleString('es-MX')}{' '}
              <span className="text-xs font-normal text-[#8A8179]">MXN</span>
            </div>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={offer.stock <= 0}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              added
                ? 'bg-[#5A735E] text-white'
                : offer.stock <= 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-[#FAF0ED] text-[#B25E5C] hover:bg-[#B25E5C] hover:text-white'
            }`}
            title="Agregar al carrito"
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Agregado</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
