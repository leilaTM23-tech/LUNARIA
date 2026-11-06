import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { repository } from '../../services/repository';
import { useCart } from '../../context/CartContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ProductOffer, CatalogProduct, Florist, Category } from '../../types';
import {
  Star,
  Clock,
  Truck,
  Check,
  ShoppingBag,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Share2,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { selectedCommunity } = useMarketplace();

  const [offer, setOffer] = useState<ProductOffer | null>(null);
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [florist, setFlorist] = useState<Florist | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [otherOffers, setOtherOffers] = useState<
    { offer: ProductOffer; florist: Florist }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadProductDetail() {
      if (!id) return;
      setLoading(true);
      try {
        const foundOffer = await repository.getProductOfferById(id);
        if (!foundOffer) {
          setLoading(false);
          return;
        }

        const [cp, fl, cats, allOffers, allFlorists] = await Promise.all([
          repository.getCatalogProductById(foundOffer.catalogProductId),
          repository.getFloristById(foundOffer.floristId),
          repository.getCategories(),
          repository.getProductOffers(),
          repository.getFlorists(),
        ]);

        setOffer(foundOffer);
        setProduct(cp);
        setFlorist(fl);

        if (cp) {
          const cat = cats.find((c) => c.id === cp.categoryId);
          setCategory(cat || null);

          // Buscar si otras florerías ofrecen este mismo catálogo
          const others = allOffers
            .filter((o) => o.catalogProductId === cp.id && o.id !== foundOffer.id && o.isPublished)
            .map((o) => {
              const flor = allFlorists.find((f) => f.id === o.floristId) || allFlorists[0];
              return { offer: o, florist: flor };
            });
          setOtherOffers(others);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProductDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-[#8A8179]">
        Cargando detalles del arreglo floral...
      </div>
    );
  }

  if (!offer || !product || !florist) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">Producto no encontrado</h2>
        <p className="text-xs text-[#7A736E]">
          El arreglo que buscas no está disponible o fue retirado del catálogo.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2C2825] text-white rounded-lg text-xs font-semibold"
        >
          <span>Regresar al catálogo</span>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(offer, product, florist, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(offer, product, florist, quantity);
    navigate('/checkout');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Cobertura en la comunidad seleccionada
  const deliveryRule = selectedCommunity
    ? florist.deliveryZones.find((dz) => dz.communityId === selectedCommunity.id && dz.isActive)
    : florist.deliveryZones[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#8A8179]">
        <Link to="/" className="hover:text-[#2C2825]">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/catalogo" className="hover:text-[#2C2825]">Catálogo</Link>
        {category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/catalogo?cat=${category.id}`} className="hover:text-[#2C2825]">{category.name}</Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#2C2825] font-medium truncate max-w-[200px]">{offer.title}</span>
      </nav>

      {/* Grid PDP: Galería izquierda + Módulo de Compra Contiguo derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Columna Izquierda: Galería e Imagen Principal */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-white border border-[#EAE3D9] shadow-sm relative">
            <img
              src={offer.images[0] || product.defaultImageUrl}
              alt={offer.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {offer.sameDayDelivery && (
              <span className="absolute top-4 left-4 text-xs font-semibold bg-white/95 text-[#2C2825] px-3 py-1 rounded-full shadow-xs">
                Entrega hoy en Tlaxcala
              </span>
            )}
          </div>

          {/* Ficha descriptiva y flores que contiene */}
          <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#2C2825]">
              Composición floral y detalles
            </h3>
            <p className="text-xs text-[#665E58] leading-relaxed">
              {offer.description || product.description}
            </p>

            <div className="pt-3 border-t border-[#F2ECE4]">
              <div className="text-xs font-semibold text-[#2C2825] mb-2">
                Flores y follajes en esta creación:
              </div>
              <div className="flex flex-wrap gap-2">
                {product.flowerTypes.map((flower, idx) => (
                  <span
                    key={idx}
                    className="text-xs text-[#5A735E] bg-[#F2F6F3] px-2.5 py-1 rounded-lg border border-[#DCE8DD]"
                  >
                    {flower}
                  </span>
                ))}
              </div>
            </div>

            {offer.customizationOptions && offer.customizationOptions.length > 0 && (
              <div className="pt-3 border-t border-[#F2ECE4]">
                <div className="text-xs font-semibold text-[#2C2825] mb-2">
                  Incluye sin costo adicional:
                </div>
                <ul className="space-y-1 text-xs text-[#665E58]">
                  {offer.customizationOptions.map((opt, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#5A735E] shrink-0" />
                      <span>{opt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Módulo de Compra Contiguo */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-sm space-y-6 lg:sticky lg:top-24">
          <div>
            {/* Metadatos limpios */}
            <div className="flex items-center justify-between text-xs text-[#8A8179] mb-2">
              <span className="uppercase tracking-wider font-semibold text-[#B25E5C]">
                {category?.name || 'Arreglo Floral'}
              </span>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1 hover:text-[#2C2825] cursor-pointer"
                title="Copiar enlace"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Copiado' : 'Compartir'}</span>
              </button>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2C2825] leading-tight">
              {offer.title}
            </h1>

            {/* Florería oferente */}
            <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-serif font-bold text-xs">
                  {florist.commercialName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#2C2825]">
                    {florist.commercialName}
                  </div>
                  <div className="text-[11px] text-[#7A736E] flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{florist.rating.toFixed(1)} ({florist.reviewCount} opiniones)</span>
                  </div>
                </div>
              </div>
              <Link
                to={`/floreria/${florist.id}`}
                className="text-xs font-semibold text-[#B25E5C] hover:underline"
              >
                Ver taller
              </Link>
            </div>
          </div>

          {/* Precio */}
          <div className="pb-4 border-b border-[#F2ECE4]">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#2C2825] tabular-nums">
                ${offer.price.toLocaleString('es-MX')}
              </span>
              <span className="text-xs text-[#8A8179]">MXN (pesos mexicanos)</span>
              {offer.comparePrice && (
                <span className="text-sm text-[#A8A199] line-through tabular-nums">
                  ${offer.comparePrice.toLocaleString('es-MX')}
                </span>
              )}
            </div>
            <div className="text-xs text-[#5A735E] mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Tiempo de preparación estimado: {offer.preparationTime}</span>
            </div>
          </div>

          {/* Información de entrega calculada */}
          <div className="p-3.5 rounded-xl bg-[#F7F9F7] border border-[#DCE8DD] space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-[#5A735E] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#2C2825]">
                  {deliveryRule
                    ? `Entrega en ${selectedCommunity?.name || 'su comunidad'}: $${deliveryRule.deliveryFee} MXN`
                    : 'Entrega local disponible'}
                </div>
                <div className="text-[#665E58] text-[11px]">
                  Tiempo de ruta estimado: {deliveryRule?.estimatedDeliveryTime || '1 a 3 horas'}. También puedes elegir recolección sin costo.
                </div>
              </div>
            </div>
          </div>

          {/* Selector de cantidad y stock */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#2C2825]">Cantidad</span>
              <span className="text-[#8A8179]">
                Stock disponible: <strong>{offer.stock}</strong> piezas
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#EAE3D9] rounded-xl bg-[#FAF8F5]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-3 py-2 text-xs font-bold text-[#5C534E] hover:text-black disabled:opacity-30 cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 py-2 text-xs font-semibold text-[#2C2825] tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(offer.stock, q + 1))}
                  disabled={quantity >= offer.stock}
                  className="px-3 py-2 text-xs font-bold text-[#5C534E] hover:text-black disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Botón Agregar al carrito */}
              <button
                onClick={handleAddToCart}
                disabled={offer.stock <= 0}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  added
                    ? 'bg-[#5A735E] text-white'
                    : offer.stock <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#FAF0ED] text-[#B25E5C] hover:bg-[#B25E5C] hover:text-white border border-[#ECCECE]'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Agregado al carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Agregar al carrito</span>
                  </>
                )}
              </button>
            </div>

            {/* Botón Comprar ahora */}
            <button
              onClick={handleBuyNow}
              disabled={offer.stock <= 0}
              className="w-full py-3.5 px-4 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>Comprar ahora y coordinar por WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Garantías y políticas */}
          <div className="pt-4 border-t border-[#F2ECE4] space-y-2 text-[11px] text-[#7A736E]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5A735E]" />
              <span>Flores de corte matutino con garantía de frescura.</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Coordinación personal con el agente de la florería.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Otras florerías que ofrecen este arreglo en Tlaxcala */}
      {otherOffers.length > 0 && (
        <section className="pt-8 border-t border-[#EAE3D9] space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-normal text-[#2C2825]">
              Otras opciones de este mismo diseño floral
            </h2>
            <p className="text-xs text-[#7A736E] mt-0.5">
              Distintas florerías de Tlaxcala con sus propios precios, stock y tiempos de entrega.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherOffers.map(({ offer: o, florist: fl }) => (
              <div
                key={o.id}
                className="bg-white rounded-2xl p-5 border border-[#EAE3D9] flex flex-col justify-between hover:border-[#B25E5C] transition-all"
              >
                <div>
                  <div className="text-xs text-[#8A8179] mb-1">{fl.commercialName}</div>
                  <h4 className="font-semibold text-sm text-[#2C2825]">{o.title}</h4>
                  <div className="text-xs text-[#665E58] mt-2 flex items-center gap-2">
                    <span className="font-semibold text-base text-[#2C2825] tabular-nums">
                      ${o.price.toLocaleString('es-MX')} MXN
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[11px] text-[#5A735E]">{o.preparationTime}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                  <span className="text-[11px] text-[#7A736E]">Stock: {o.stock} pzas</span>
                  <Link
                    to={`/producto/${o.id}`}
                    className="text-xs font-semibold text-[#B25E5C] hover:underline"
                  >
                    Ver esta oferta →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
