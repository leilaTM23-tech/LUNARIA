/**
 * Tipos de datos para el Marketplace Lunaria / FloraTlax (Tlaxcala)
 * Diseñado conforme al esquema de entidades relacionales preparado para Supabase.
 */

export type UserRole = 'buyer' | 'florist' | 'admin';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  floristId?: string; // Si role === 'florist'
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  label: string; // Ej. "Casa", "Oficina", "Destinatario especial"
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string; // Colonia
  communityId: string; // ID de comunidad en Tlaxcala
  reference?: string;
  recipientName?: string;
  recipientPhone?: string;
  isDefault?: boolean;
}

export type RegistrationMethod = 'invitation' | 'public_application';

export type FloristStatus =
  | 'draft'               // Borrador
  | 'pending_review'     // Pendiente de revisión
  | 'info_required'      // Información adicional requerida
  | 'approved'           // Aprobado
  | 'rejected'           // Rechazado
  | 'suspended';         // Suspendido

export interface Florist {
  id: string;
  ownerId: string;
  commercialName: string;
  businessName?: string; // alias
  email?: string;
  slug: string;
  description: string;
  address: string;
  communityId: string;
  phone: string;
  whatsapp: string; // Formato internacional sin + ni espacios para wa.me, ej. "522461234567"
  instagram?: string;
  openingHours: string; // Ej. "Lunes a Sábado: 8:00 AM - 8:00 PM, Domingo: 9:00 AM - 3:00 PM"
  orderAgentName: string; // Responsable de pedidos
  registrationMethod: RegistrationMethod;
  status: FloristStatus;
  approvedAt?: string;
  rejectedAt?: string;
  suspendedAt?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  infoRequiredNotes?: string;
  rating: number; // e.g. 4.9
  reviewCount: number;
  deliveryZones: DeliveryZoneRule[];
  deliveryCoverage?: string[];
  bannerUrl?: string;
  logoUrl?: string;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FloristApplication {
  id: string;
  applicantId: string;
  floristId: string;
  registrationMethod: RegistrationMethod;
  status: FloristStatus;
  submittedAt: string;
  createdAt?: string; // alias for submittedAt
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  infoRequiredNotes?: string;
  // Snapshot comercial
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  businessName: string;
  commercialName?: string; // alias for businessName
  orderAgentName?: string; // alias for applicantName
  email?: string;          // alias for applicantEmail
  communityId: string;
  communityName?: string;
  address: string;
  description: string;
  openingHours: string;
  whatsapp: string;
  phone: string;
  deliveryModes: ('delivery' | 'pickup')[];
  deliveryCommunities: string[];
  estimatedDeliveryTime: string;
  prepTimeEstimated?: string; // alias for estimatedDeliveryTime
  logoUrl?: string;
  invitationId?: string;
}

export interface FloristInvitation {
  id: string;
  email: string;
  businessName: string;
  token: string; // Token público de acceso para demo
  tokenHash: string; // Hash seguro para backend/Supabase
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
  status?: 'pending' | 'used' | 'revoked' | 'expired';
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export interface FloristMember {
  id: string;
  floristId: string;
  userId: string;
  role: 'owner' | 'manager' | 'staff';
  status: 'active' | 'inactive';
}

export type AuditAction =
  | 'create_invitation'
  | 'submit_application'
  | 'update_info'
  | 'request_info'
  | 'approve'
  | 'reject'
  | 'suspend'
  | 'reactivate'
  | 'revoke_invitation';

export interface ApplicationAuditLog {
  id: string;
  applicationId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  previousStatus?: FloristStatus;
  newStatus?: FloristStatus;
  notes?: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  municipality: string;
  postalCodes: string[];
  isActive: boolean;
  notes?: string;
}

export interface DeliveryZoneRule {
  id: string;
  floristId: string;
  communityId: string;
  deliveryFee: number; // en MXN
  estimatedDeliveryTime: string; // Ej. "2 a 4 horas"
  minOrderAmount?: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName?: string;
  order: number;
}

export interface CatalogProduct {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  flowerTypes: string[]; // Ej. ["Rosas holandesas", "Eucalipto", "Gypsophila"]
  recommendedOccasion: string;
  defaultImageUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductOffer {
  id: string;
  catalogProductId: string;
  floristId: string;
  title: string;
  description: string;
  price: number; // MXN
  comparePrice?: number;
  stock: number;
  images: string[];
  preparationTime: string; // Ej. "1 hora", "3 horas", "24 horas de anticipación"
  sameDayDelivery: boolean;
  isPublished: boolean;
  salesCount: number;
  customizationOptions?: string[]; // Ej. ["Tarjeta con mensaje personalizado", "Lazo color a elegir", "Florero de vidrio incluido"]
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending_contact'      // Pendiente de contacto
  | 'contacted'            // Contactado
  | 'confirmed_by_vendor'  // Confirmado por vendedor
  | 'in_preparation'       // En preparación
  | 'on_the_way'           // En camino
  | 'delivered'            // Entregado
  | 'cancelled';           // Cancelado

export type DeliveryMethod = 'delivery' | 'pickup';

export interface OrderItem {
  id: string;
  offerId: string;
  catalogProductId: string;
  productTitle: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  floristId: string;
  floristName: string;
  productImage: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  changedBy: string; // Nombre del usuario o sistema
  note?: string;
}

export interface Order {
  id: string; // Ej: "LUN-8492"
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  floristId: string;
  floristName: string;
  floristPhone: string;
  floristWhatsapp: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: Address;
  deliveryCommunityId: string;
  deliveryCommunityName: string;
  scheduledDate?: string;
  scheduledTimeWindow?: string;
  cardMessage?: string; // Dedicatoria para la tarjeta floral
  specialNotes?: string;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  whatsappMessageSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  offerId: string;
  offer: ProductOffer;
  product: CatalogProduct;
  florist: Florist;
  quantity: number;
}
