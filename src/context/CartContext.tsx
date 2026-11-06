import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { CartItem, ProductOffer, CatalogProduct, Florist, Order, DeliveryMethod, Address } from '../types';
import { repository } from '../services/repository';

interface FloristOrderGroup {
  florist: Florist;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (offer: ProductOffer, product: CatalogProduct, florist: Florist, quantity?: number) => void;
  removeFromCart: (offerId: string) => void;
  updateQuantity: (offerId: string, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  groupedByFlorist: FloristOrderGroup[];
  isMultiFloristCart: boolean;
  createCheckoutOrders: (params: {
    buyerId: string;
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    deliveryMethod: DeliveryMethod;
    deliveryAddress?: Address;
    deliveryCommunityId: string;
    deliveryCommunityName: string;
    scheduledDate?: string;
    scheduledTimeWindow?: string;
    cardMessage?: string;
    specialNotes?: string;
  }) => Promise<Order[]>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'lunaria_cart_items_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error guardando carrito:', e);
    }
  }, [items]);

  const addToCart = (offer: ProductOffer, product: CatalogProduct, florist: Florist, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.offerId === offer.id);
      if (existingIndex >= 0) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(offer.stock, currentQty + quantity);
        const updated = [...prev];
        updated[existingIndex] = {
          ...prev[existingIndex],
          quantity: newQty,
          offer,
        };
        return updated;
      } else {
        const validQty = Math.min(offer.stock, Math.max(1, quantity));
        return [...prev, { offerId: offer.id, offer, product, florist, quantity: validQty }];
      }
    });
  };

  const removeFromCart = (offerId: string) => {
    setItems((prev) => prev.filter((i) => i.offerId !== offerId));
  };

  const updateQuantity = (offerId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(offerId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.offerId === offerId) {
          const maxStock = item.offer.stock;
          return {
            ...item,
            quantity: Math.min(maxStock, quantity),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.offer.price * item.quantity, 0);
  }, [items]);

  // Agrupar items por florería para cumplir con la regla:
  // "Si el carrito contiene artículos de diferentes florerías, dividirlo en pedidos independientes por vendedor."
  const groupedByFlorist = useMemo(() => {
    const map = new Map<string, { florist: Florist; items: CartItem[] }>();

    for (const item of items) {
      const fId = item.florist.id;
      if (!map.has(fId)) {
        map.set(fId, { florist: item.florist, items: [] });
      }
      map.get(fId)!.items.push(item);
    }

    const groups: FloristOrderGroup[] = [];
    map.forEach((value) => {
      const groupSubtotal = value.items.reduce((acc, i) => acc + i.offer.price * i.quantity, 0);
      // Tomamos la tarifa base de la primera zona activa de la florería o $45 por defecto
      const defaultFee = value.florist.deliveryZones[0]?.deliveryFee || 45;
      groups.push({
        florist: value.florist,
        items: value.items,
        subtotal: groupSubtotal,
        deliveryFee: defaultFee,
        total: groupSubtotal + defaultFee,
      });
    });

    return groups;
  }, [items]);

  const isMultiFloristCart = groupedByFlorist.length > 1;

  // Checkout generator: crea 1 pedido por cada florería involucrada
  const createCheckoutOrders = async (params: {
    buyerId: string;
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    deliveryMethod: DeliveryMethod;
    deliveryAddress?: Address;
    deliveryCommunityId: string;
    deliveryCommunityName: string;
    scheduledDate?: string;
    scheduledTimeWindow?: string;
    cardMessage?: string;
    specialNotes?: string;
  }): Promise<Order[]> => {
    const createdOrders: Order[] = [];

    for (const group of groupedByFlorist) {
      // Buscar costo de entrega específico para la comunidad elegida
      const zone = group.florist.deliveryZones.find(
        (dz) => dz.communityId === params.deliveryCommunityId && dz.isActive
      );
      const deliveryFee = params.deliveryMethod === 'delivery' ? (zone ? zone.deliveryFee : 50) : 0;
      const totalAmount = group.subtotal + deliveryFee;

      const orderItems = group.items.map((cartItem) => ({
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        offerId: cartItem.offer.id,
        catalogProductId: cartItem.product.id,
        productTitle: cartItem.offer.title,
        unitPrice: cartItem.offer.price,
        quantity: cartItem.quantity,
        subtotal: cartItem.offer.price * cartItem.quantity,
        floristId: group.florist.id,
        floristName: group.florist.commercialName,
        productImage: cartItem.offer.images[0] || cartItem.product.defaultImageUrl,
      }));

      const created = await repository.createOrder({
        buyerId: params.buyerId,
        buyerName: params.buyerName,
        buyerPhone: params.buyerPhone,
        buyerEmail: params.buyerEmail,
        floristId: group.florist.id,
        floristName: group.florist.commercialName,
        floristPhone: group.florist.phone,
        floristWhatsapp: group.florist.whatsapp,
        items: orderItems,
        totalAmount,
        deliveryFee,
        deliveryMethod: params.deliveryMethod,
        deliveryAddress: params.deliveryAddress,
        deliveryCommunityId: params.deliveryCommunityId,
        deliveryCommunityName: params.deliveryCommunityName,
        scheduledDate: params.scheduledDate,
        scheduledTimeWindow: params.scheduledTimeWindow,
        cardMessage: params.cardMessage,
        specialNotes: params.specialNotes,
        status: 'pending_contact',
        whatsappMessageSent: false,
      });

      createdOrders.push(created);
    }

    // Vaciar carrito tras confirmación exitosa
    clearCart();
    return createdOrders;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotal,
        groupedByFlorist,
        isMultiFloristCart,
        createCheckoutOrders,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};
