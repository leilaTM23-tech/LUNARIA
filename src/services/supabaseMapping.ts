/**
 * Conversión entre los objetos de la app (camelCase, src/types) y las filas
 * de Supabase (snake_case, supabase/schema.sql).
 *
 * Cada tabla declara la lista de campos que persiste. Los campos que no están
 * en la lista se ignoran al guardar (evita errores de "columna no existe").
 *
 * Este módulo no depende de Vite, así que también lo usa scripts/seed-supabase.ts.
 */

export type TableName =
  | 'communities'
  | 'categories'
  | 'profiles'
  | 'florists'
  | 'catalog_products'
  | 'product_offers'
  | 'orders'
  | 'florist_invitations'
  | 'florist_applications'
  | 'application_audit_logs';

/** Campos (en camelCase) que se guardan en cada tabla. */
export const TABLE_FIELDS: Record<TableName, string[]> = {
  communities: ['id', 'name', 'municipality', 'postalCodes', 'isActive', 'notes'],
  categories: ['id', 'name', 'slug', 'description', 'iconName', 'order'],
  profiles: [
    'id', 'email', 'fullName', 'phone', 'role', 'avatarUrl', 'floristId', 'addresses',
    'createdAt', 'updatedAt',
  ],
  florists: [
    'id', 'ownerId', 'commercialName', 'businessName', 'email', 'slug', 'description', 'address',
    'communityId', 'phone', 'whatsapp', 'instagram', 'openingHours', 'orderAgentName',
    'registrationMethod', 'status', 'approvedAt', 'rejectedAt', 'suspendedAt', 'rejectionReason',
    'suspensionReason', 'infoRequiredNotes', 'rating', 'reviewCount', 'deliveryZones',
    'deliveryCoverage', 'bannerUrl', 'logoUrl', 'featured', 'createdAt', 'updatedAt',
  ],
  catalog_products: [
    'id', 'categoryId', 'name', 'slug', 'description', 'flowerTypes', 'recommendedOccasion',
    'defaultImageUrl', 'isActive', 'createdAt',
  ],
  product_offers: [
    'id', 'catalogProductId', 'floristId', 'title', 'description', 'price', 'comparePrice', 'stock',
    'images', 'preparationTime', 'sameDayDelivery', 'isPublished', 'salesCount',
    'customizationOptions', 'createdAt', 'updatedAt',
  ],
  orders: [
    'id', 'buyerId', 'buyerName', 'buyerPhone', 'buyerEmail', 'floristId', 'floristName',
    'floristPhone', 'floristWhatsapp', 'items', 'totalAmount', 'deliveryFee', 'deliveryMethod',
    'deliveryAddress', 'deliveryCommunityId', 'deliveryCommunityName', 'scheduledDate',
    'scheduledTimeWindow', 'cardMessage', 'specialNotes', 'status', 'statusHistory',
    'whatsappMessageSent', 'paymentStatus', 'paidAt', 'stripeSessionId', 'stripePaymentIntentId',
    'createdAt', 'updatedAt',
  ],
  florist_invitations: [
    'id', 'email', 'businessName', 'token', 'tokenHash', 'expiresAt', 'usedAt', 'revokedAt',
    'createdBy', 'createdByName', 'createdAt',
  ],
  florist_applications: [
    'id', 'applicantId', 'floristId', 'registrationMethod', 'status', 'submittedAt', 'reviewedBy',
    'reviewedAt', 'reviewNotes', 'infoRequiredNotes', 'applicantName', 'applicantEmail',
    'applicantPhone', 'businessName', 'communityId', 'communityName', 'address', 'description',
    'openingHours', 'whatsapp', 'phone', 'deliveryModes', 'deliveryCommunities',
    'estimatedDeliveryTime', 'logoUrl', 'invitationId',
  ],
  application_audit_logs: [
    'id', 'applicationId', 'actorId', 'actorName', 'action', 'previousStatus', 'newStatus', 'notes',
    'createdAt',
  ],
};

/** Columnas cuyo nombre no es la simple conversión a snake_case. */
const COLUMN_RENAMES: Partial<Record<TableName, Record<string, string>>> = {
  categories: { order: 'sort_order' }, // "order" es palabra reservada en SQL
};

/** Columnas NUMERIC: PostgREST puede devolverlas como string, las normalizamos a number. */
const NUMERIC_FIELDS = new Set(['rating', 'price', 'comparePrice', 'totalAmount', 'deliveryFee']);

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function columnFor(table: TableName, field: string): string {
  return COLUMN_RENAMES[table]?.[field] ?? toSnake(field);
}

/**
 * Objeto de la app → fila de Supabase.
 * @param full  true = los campos presentes con valor `undefined` (ej. `{ infoRequiredNotes: undefined }`)
 *              se escriben como NULL, para que "borrar" un campo opcional se refleje en la base.
 *              Los campos que ni siquiera vienen en el objeto se omiten (aplica el DEFAULT
 *              al insertar o se conserva el valor actual al actualizar).
 */
export function toRow(table: TableName, obj: Record<string, any>, full = false): Record<string, any> {
  const row: Record<string, any> = {};
  for (const field of TABLE_FIELDS[table]) {
    const value = obj[field];
    if (value !== undefined) {
      row[columnFor(table, field)] = value;
    } else if (full && field in obj && field !== 'createdAt') {
      row[columnFor(table, field)] = null;
    }
  }
  return row;
}

/** Fila de Supabase → objeto de la app (NULL se convierte en undefined). */
export function fromRow<T>(table: TableName, row: Record<string, any>): T {
  const obj: Record<string, any> = {};
  for (const field of TABLE_FIELDS[table]) {
    const value = row[columnFor(table, field)];
    if (value === null || value === undefined) continue;
    obj[field] = NUMERIC_FIELDS.has(field) ? Number(value) : value;
  }
  return obj as T;
}
