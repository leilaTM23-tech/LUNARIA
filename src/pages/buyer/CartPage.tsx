import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  Store,
  Truck,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, totalItemsCount, groupedByFlorist, isMultiFloristCart, clearCart } =
    useCart();
  const { selectedCommunity } = useMarketplace();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#2C2825]">Tu carrito está vacío</h1>
        <p className="text-xs text-[#7A736E] max-w-sm mx-auto">
          Explora los arreglos florales elaborados por nuestros artesanos en Tlaxcala y añade flores frescas para tu ser querido.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <span>Ir al catálogo de flores</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#EAE3D9] gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#B25E5C] mb-1">
            Bolsa de compras
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Mi Carrito Floral ({totalItemsCount} {totalItemsCount === 1 ? 'artículo' : 'artículos'})
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-700 hover:underline self-start sm:self-auto cursor-pointer"
        >
          Vaciar carrito
        </button>
      </div>

      {/* Alerta de Carrito Dividido por Florería si aplica */}
      {isMultiFloristCart && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aviso de múltiples florerías:</span> Tienes flores de{' '}
            <strong>{groupedByFlorist.length} florerías distintas</strong>. Al finalizar la compra, el sistema dividirá tu pedido en entregas independientes por vendedor para garantizar que cada taller floral coordine contigo por WhatsApp.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lista de productos agrupados por florería */}
        <div className="lg:col-span-8 space-y-6">
          {groupedByFlorist.map((group) => (
            <div
              key={group.florist.id}
              className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#5A735E]" />
                  <span className="text-xs font-semibold text-[#2C2825]">
                    {group.florist.commercialName}
                  </span>
                  <span className="text-[11px] text-[#8A8179] font-normal">
                    ({group.florist.address})
                  </span>
                </div>
                <Link
                  to={`/floreria/${group.florist.id}`}
                  className="text-[11px] text-[#B25E5C] hover:underline"
                >
                  Ver florería
                </Link>
              </div>

              {/* Items de este grupo */}
              <div className="divide-y divide-[#F2ECE4]">
                {group.items.map((cartItem) => (
                  <div key={cartItem.offerId} className="py-4 flex items-center gap-4">
                    <img
                      src={cartItem.offer.images[0] || cartItem.product.defaultImageUrl}
                      alt={cartItem.offer.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/producto/${cartItem.offer.id}`}
                        className="font-medium text-xs sm:text-sm text-[#2C2825] hover:text-[#B25E5C] transition-colors line-clamp-1"
                      >
                        {cartItem.offer.title}
                      </Link>
                      <div className="text-[11px] text-[#8A8179] mt-0.5">
                        ${cartItem.offer.price.toLocaleString('es-MX')} MXN c/u · Prep: {cartItem.offer.preparationTime}
                      </div>

                      <div className="mt-2 flex items-center gap-3">
                        {/* Stepper de cantidad */}
                        <div className="flex items-center border border-[#EAE3D9] rounded-lg bg-[#FAF8F5]">
                          <button
                            onClick={() => updateQuantity(cartItem.offerId, cartItem.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-[#5C534E] hover:text-black cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 text-xs font-semibold text-[#2C2825] tabular-nums">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(cartItem.offerId, cartItem.quantity + 1)}
                            disabled={cartItem.quantity >= cartItem.offer.stock}
                            className="px-2 py-0.5 text-xs text-[#5C534E] hover:text-black disabled:opacity-30 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(cartItem.offerId)}
                          className="text-[#A8A199] hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Eliminar del carrito"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm sm:text-base text-[#2C2825] tabular-nums">
                        ${(cartItem.offer.price * cartItem.quantity).toLocaleString('es-MX')}
                      </div>
                      <span className="text-[10px] text-[#8A8179]">MXN</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal del grupo */}
              <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between text-xs text-[#665E58]">
                <span>Subtotal de este vendedor:</span>
                <span className="font-semibold text-[#2C2825] tabular-nums">
                  ${group.subtotal.toLocaleString('es-MX')} MXN
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen de compra lateral */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-sm space-y-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
            Resumen del pedido
          </h2>

          <div className="space-y-3 text-xs border-b border-[#F2ECE4] pb-4">
            <div className="flex items-center justify-between text-[#665E58]">
              <span>Subtotal productos:</span>
              <span className="font-semibold text-[#2C2825] tabular-nums">
                $
                {groupedByFlorist
                  .reduce((acc, g) => acc + g.subtotal, 0)
                  .toLocaleString('es-MX')}{' '}
                MXN
              </span>
            </div>

            <div className="flex items-center justify-between text-[#665E58]">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#5A735E]" />
                <span>Envío estimado ({selectedCommunity?.name || 'Tlaxcala'}):</span>
              </span>
              <span className="font-semibold text-[#2C2825] tabular-nums">
                $
                {groupedByFlorist
                  .reduce((acc, g) => acc + g.deliveryFee, 0)
                  .toLocaleString('es-MX')}{' '}
                MXN
              </span>
            </div>

            <p className="text-[11px] text-[#8A8179]">
              * Puedes elegir recolección en taller en el siguiente paso para entrega sin costo de envío.
            </p>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-[#2C2825]">Total estimado:</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#2C2825] tabular-nums">
                $
                {groupedByFlorist
                  .reduce((acc, g) => acc + g.total, 0)
                  .toLocaleString('es-MX')}{' '}
              </span>
              <span className="text-xs text-[#8A8179]">MXN</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Continuar con el pedido</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-[11px] text-[#7A736E] text-center">
            Pagas directo a la florería tras confirmar disponibilidad por WhatsApp. Sin comisiones de pasarela.
          </div>
        </div>
      </div>
    </div>
  );
};
