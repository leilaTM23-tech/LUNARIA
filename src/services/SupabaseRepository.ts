import { supabase } from './supabaseClient';
import { ILunariaRepository } from './repository';
import { TableName, fromRow, toRow } from './supabaseMapping';
import { seedDatabase } from './supabaseSeed';
import {
  Florist,
  FloristApplication,
  FloristInvitation,
  ApplicationAuditLog,
  Community,
  Category,
  CatalogProduct,
  ProductOffer,
  Order,
  OrderStatus,
  DeliveryZoneRule,
  FloristStatus,
  RegistrationMethod,
  Profile,
} from '../types';

/** Comunidad por defecto cuando un formulario no envía una (debe existir en `communities`). */
const DEFAULT_COMMUNITY_ID = 'com-tlaxcala-centro';
const DEFAULT_DELIVERY_FEE = 50;

/**
 * Implementación del repositorio sobre Supabase.
 * Replica el comportamiento de LocalStorageRepository (repository.ts), pero persiste
 * en las tablas definidas en supabase/schema.sql.
 */
export class SupabaseRepository implements ILunariaRepository {
  // ===========================================================================
  // Helpers genéricos
  // ===========================================================================

  /** SELECT * con filtros/orden opcionales. Si falla, registra el error y devuelve []. */
  private async selectAll<T>(table: TableName, build?: (q: any) => any): Promise<T[]> {
    let query: any = supabase.from(table).select('*');
    if (build) query = build(query);
    const { data, error } = await query;
    if (error) {
      console.error(`[Supabase] Error leyendo "${table}":`, error.message);
      return [];
    }
    return (data ?? []).map((row: any) => fromRow<T>(table, row));
  }

  private async selectById<T>(table: TableName, id: string): Promise<T | null> {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error) {
      console.error(`[Supabase] Error leyendo "${table}" (${id}):`, error.message);
      return null;
    }
    return data ? fromRow<T>(table, data) : null;
  }

  /** Inserta o reemplaza el objeto completo y devuelve lo que quedó guardado. */
  private async upsertFull<T>(table: TableName, obj: Record<string, any>): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .upsert(toRow(table, obj, true))
      .select()
      .single();
    if (error) throw new Error(`[Supabase] No se pudo guardar en "${table}": ${error.message}`);
    return fromRow<T>(table, data);
  }

  /** Actualiza solo los campos indicados. */
  private async patch(table: TableName, id: string, changes: Record<string, any>): Promise<void> {
    const { error } = await supabase.from(table).update(toRow(table, changes)).eq('id', id);
    if (error) throw new Error(`[Supabase] No se pudo actualizar "${table}" (${id}): ${error.message}`);
  }

  /** Rellena los alias que usan las pantallas (commercialName, email, etc.). */
  private withApplicationAliases(app: FloristApplication): FloristApplication {
    return {
      ...app,
      createdAt: app.submittedAt,
      commercialName: app.businessName,
      orderAgentName: app.applicantName,
      email: app.applicantEmail,
      prepTimeEstimated: app.estimatedDeliveryTime,
      deliveryModes: app.deliveryModes ?? ['delivery'],
      deliveryCommunities: app.deliveryCommunities ?? [],
    };
  }

  private withInvitationStatus(inv: FloristInvitation): FloristInvitation {
    const isExpired = new Date(inv.expiresAt) < new Date();
    const status = inv.revokedAt ? 'revoked' : inv.usedAt ? 'used' : isExpired ? 'expired' : 'pending';
    return { ...inv, status };
  }

  // ===========================================================================
  // Comunidades y categorías
  // ===========================================================================

  async getCommunities(): Promise<Community[]> {
    return this.selectAll<Community>('communities', (q) => q.order('name'));
  }

  async saveCommunity(community: Community): Promise<Community> {
    return this.upsertFull<Community>('communities', community);
  }

  async toggleCommunityStatus(id: string, isActive: boolean): Promise<void> {
    await this.patch('communities', id, { isActive });
  }

  async getCategories(): Promise<Category[]> {
    return this.selectAll<Category>('categories', (q) => q.order('sort_order'));
  }

  async saveCategory(category: Category): Promise<Category> {
    return this.upsertFull<Category>('categories', category);
  }

  // ===========================================================================
  // Florerías
  // ===========================================================================

  async getFlorists(): Promise<Florist[]> {
    const list = await this.selectAll<Florist>('florists', (q) => q.order('created_at'));
    return list.map((f) => ({ ...f, deliveryZones: f.deliveryZones ?? [] }));
  }

  async getFloristById(id: string): Promise<Florist | null> {
    return this.selectById<Florist>('florists', id);
  }

  async getFloristByOwnerId(ownerId: string): Promise<Florist | null> {
    const list = await this.selectAll<Florist>('florists', (q) => q.eq('owner_id', ownerId).limit(1));
    return list[0] ?? null;
  }

  async saveFlorist(florist: Florist): Promise<Florist> {
    return this.upsertFull<Florist>('florists', { ...florist, updatedAt: new Date().toISOString() });
  }

  /**
   * Cambia el estado de una florería (el `id` es el de la FLORERÍA, como lo usa
   * AdminFloristsPage) y sincroniza su solicitud + bitácora.
   */
  async updateFloristStatus(
    id: string,
    status: FloristStatus,
    optionsOrActorId?:
      | string
      | {
          adminNotes?: string;
          rejectionReason?: string;
          suspensionReason?: string;
          actorId?: string;
          actorName?: string;
        },
    actorNameParam?: string,
    notesParam?: string
  ): Promise<void> {
    const florist = await this.getFloristById(id);
    if (!florist) throw new Error(`Florería no encontrada: ${id}`);

    let actorId = 'system';
    let actorName = 'Administrador';
    let notes = notesParam;

    if (typeof optionsOrActorId === 'object' && optionsOrActorId !== null) {
      actorId = optionsOrActorId.actorId || actorId;
      actorName = optionsOrActorId.actorName || actorName;
      notes =
        optionsOrActorId.adminNotes ||
        optionsOrActorId.rejectionReason ||
        optionsOrActorId.suspensionReason ||
        notes;
    } else if (typeof optionsOrActorId === 'string') {
      actorId = optionsOrActorId;
      actorName = actorNameParam || actorName;
    }

    const previousStatus = florist.status;
    const now = new Date().toISOString();

    await this.patch('florists', id, {
      status,
      updatedAt: now,
      ...(status === 'approved' && { approvedAt: now }),
      ...(status === 'rejected' && { rejectedAt: now, rejectionReason: notes }),
      ...(status === 'suspended' && { suspendedAt: now, suspensionReason: notes }),
      ...(status === 'info_required' && { infoRequiredNotes: notes }),
    });

    // Sincronizar la solicitud asociada (si existe) y registrar en bitácora
    const app = await this.getFloristApplicationByFloristId(id);
    if (app) {
      await this.patch('florist_applications', app.id, {
        status,
        reviewedBy: actorId,
        reviewedAt: now,
        reviewNotes: notes || app.reviewNotes,
        ...(status === 'info_required' && { infoRequiredNotes: notes }),
      });

      let action: ApplicationAuditLog['action'] = 'approve';
      if (status === 'rejected') action = 'reject';
      else if (status === 'info_required') action = 'request_info';
      else if (status === 'suspended') action = 'suspend';
      else if (status === 'approved' && previousStatus === 'suspended') action = 'reactivate';

      await this.addAuditLog({
        applicationId: app.id,
        actorId,
        actorName,
        action,
        previousStatus,
        newStatus: status,
        notes,
      });
    }
  }

  async updateDeliveryZones(floristId: string, zones: DeliveryZoneRule[]): Promise<void> {
    await this.patch('florists', floristId, {
      deliveryZones: zones,
      updatedAt: new Date().toISOString(),
    });
  }

  // ===========================================================================
  // Invitaciones
  // ===========================================================================

  async getFloristInvitations(): Promise<FloristInvitation[]> {
    const list = await this.selectAll<FloristInvitation>('florist_invitations', (q) =>
      q.order('created_at', { ascending: false })
    );
    return list.map((inv) => this.withInvitationStatus(inv));
  }

  async getFloristInvitationByToken(token: string): Promise<FloristInvitation | null> {
    const list = await this.selectAll<FloristInvitation>('florist_invitations', (q) =>
      q.eq('token', token).limit(1)
    );
    return list[0] ? this.withInvitationStatus(list[0]) : null;
  }

  async createFloristInvitation(invitationData: {
    businessName: string;
    email: string;
    expiresInDays?: number;
    expiresAt?: string;
    token?: string;
    tokenHash?: string;
    createdBy?: string;
    createdById?: string;
    createdByName?: string;
  }): Promise<FloristInvitation> {
    const token =
      invitationData.token ||
      `inv-${invitationData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;
    const days = invitationData.expiresInDays || 7;
    const createdBy = invitationData.createdById || invitationData.createdBy || 'admin';
    const createdByName = invitationData.createdByName || 'Administrador General';

    const saved = await this.upsertFull<FloristInvitation>('florist_invitations', {
      id: `inv-${Date.now()}`,
      businessName: invitationData.businessName,
      email: invitationData.email,
      token,
      tokenHash: invitationData.tokenHash || `hash_${token}_sha256`,
      expiresAt:
        invitationData.expiresAt || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      createdBy,
      createdByName,
    });
    const invitation = this.withInvitationStatus(saved);

    await this.addAuditLog({
      applicationId: `invitation-${invitation.id}`,
      actorId: createdBy,
      actorName: createdByName,
      action: 'create_invitation',
      notes: `Invitación creada para "${invitation.businessName}" (${invitation.email}). Vence el ${new Date(
        invitation.expiresAt
      ).toLocaleDateString('es-MX')}.`,
    });

    return invitation;
  }

  async revokeFloristInvitation(
    id: string,
    actorId = 'admin',
    actorName = 'Administrador General'
  ): Promise<void> {
    const target = await this.selectById<FloristInvitation>('florist_invitations', id);
    await this.patch('florist_invitations', id, { revokedAt: new Date().toISOString() });

    if (target) {
      await this.addAuditLog({
        applicationId: `invitation-${id}`,
        actorId,
        actorName,
        action: 'revoke_invitation',
        notes: `Invitación para "${target.businessName}" revocada por el administrador.`,
      });
    }
  }

  async markInvitationUsed(tokenOrId: string): Promise<void> {
    const changes = toRow('florist_invitations', { usedAt: new Date().toISOString() });
    // Dos consultas separadas en lugar de .or() con texto interpolado
    await supabase.from('florist_invitations').update(changes).eq('token', tokenOrId);
    await supabase.from('florist_invitations').update(changes).eq('id', tokenOrId);
  }

  // ===========================================================================
  // Solicitudes de florerías
  // ===========================================================================

  async getFloristApplications(filter?: {
    status?: FloristStatus;
    registrationMethod?: RegistrationMethod;
  }): Promise<FloristApplication[]> {
    const list = await this.selectAll<FloristApplication>('florist_applications', (q) => {
      if (filter?.status) q = q.eq('status', filter.status);
      if (filter?.registrationMethod) q = q.eq('registration_method', filter.registrationMethod);
      return q.order('submitted_at', { ascending: false });
    });
    return list.map((a) => this.withApplicationAliases(a));
  }

  async getFloristApplicationById(id: string): Promise<FloristApplication | null> {
    const app = await this.selectById<FloristApplication>('florist_applications', id);
    return app ? this.withApplicationAliases(app) : null;
  }

  async getFloristApplicationByFloristId(floristId: string): Promise<FloristApplication | null> {
    const list = await this.selectAll<FloristApplication>('florist_applications', (q) =>
      q.eq('florist_id', floristId).order('submitted_at', { ascending: false }).limit(1)
    );
    return list[0] ? this.withApplicationAliases(list[0]) : null;
  }

  async submitFloristApplication(data: any): Promise<FloristApplication> {
    const now = new Date().toISOString();
    const applicantId = data.applicantId || data.applicantUserId || `user-${Date.now()}`;
    const businessName = data.businessName || data.commercialName || 'Florería Nueva';
    const applicantName = data.applicantName || data.orderAgentName || 'Responsable';
    const email = data.email || data.applicantEmail || '';
    const phone = data.phone || data.applicantPhone || '';
    const whatsapp = data.whatsapp || phone;
    const floristId = data.floristId || `flor-${Date.now()}`;
    const communityId = data.communityId || DEFAULT_COMMUNITY_ID;
    const registrationMethod: RegistrationMethod = data.registrationMethod || 'public_application';
    const prepTime = data.prepTimeEstimated || data.estimatedDeliveryTime || '2 a 4 horas';
    const deliveryCommunities: string[] =
      data.deliveryCoverage || data.deliveryCommunities || [communityId];
    const allowsDelivery = data.allowsDelivery !== false;

    // 1. Crear la florería (pendiente de revisión). Las comunidades de cobertura elegidas
    //    se convierten en zonas de entrega, para que al aprobarla aparezca a los compradores.
    const existing = await this.getFloristById(floristId);
    if (!existing) {
      const deliveryZones: DeliveryZoneRule[] = allowsDelivery
        ? deliveryCommunities.map((cid) => ({
            id: `dz-${floristId}-${cid}`,
            floristId,
            communityId: cid,
            deliveryFee: DEFAULT_DELIVERY_FEE,
            estimatedDeliveryTime: prepTime,
            isActive: true,
          }))
        : [];

      await this.saveFlorist({
        id: floristId,
        ownerId: applicantId,
        commercialName: businessName,
        businessName,
        email,
        slug: businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        description: data.description || '',
        address: data.address || '',
        communityId,
        phone,
        whatsapp,
        instagram: data.instagram,
        openingHours: data.openingHours || 'Lunes a Sábado: 8:00 - 19:00',
        orderAgentName: applicantName,
        registrationMethod,
        status: 'pending_review',
        rating: 5.0,
        reviewCount: 0,
        deliveryZones,
        deliveryCoverage: deliveryCommunities,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Crear la solicitud
    const saved = await this.upsertFull<FloristApplication>('florist_applications', {
      id: `app-${Date.now()}`,
      applicantId,
      floristId,
      registrationMethod,
      status: 'pending_review',
      submittedAt: now,
      applicantName,
      applicantEmail: email,
      applicantPhone: phone,
      businessName,
      communityId,
      communityName: data.communityName,
      address: data.address || '',
      description: data.description || '',
      openingHours: data.openingHours || 'Lunes a Sábado: 8:00 - 19:00',
      whatsapp,
      phone,
      deliveryModes: data.deliveryModes || (data.allowsPickup ? ['delivery', 'pickup'] : ['delivery']),
      deliveryCommunities,
      estimatedDeliveryTime: prepTime,
      invitationId: data.invitationId,
    });
    const app = this.withApplicationAliases(saved);

    // 3. Bitácora
    await this.addAuditLog({
      applicationId: app.id,
      actorId: applicantId,
      actorName: applicantName,
      action: 'submit_application',
      previousStatus: 'draft',
      newStatus: 'pending_review',
      notes: `Solicitud enviada vía ${
        registrationMethod === 'invitation' ? 'enlace de invitación' : 'registro público "Vende con nosotros"'
      }.`,
    });

    return app;
  }

  async updateFloristApplicationStatus(
    applicationId: string,
    newStatus: FloristStatus,
    actorId: string,
    actorName: string,
    notes?: string
  ): Promise<FloristApplication> {
    const app = await this.getFloristApplicationById(applicationId);
    if (!app) throw new Error(`Solicitud no encontrada: ${applicationId}`);

    // updateFloristStatus actualiza florería + solicitud y registra la bitácora
    await this.updateFloristStatus(app.floristId, newStatus, actorId, actorName, notes);

    return (await this.getFloristApplicationById(applicationId)) ?? app;
  }

  async updateFloristApplicationData(
    applicationId: string,
    updates: Partial<FloristApplication>,
    notesOrActorId?: string,
    actorNameParam?: string
  ): Promise<FloristApplication> {
    const app = await this.getFloristApplicationById(applicationId);
    if (!app) throw new Error(`Solicitud no encontrada: ${applicationId}`);

    const now = new Date().toISOString();
    const businessName = updates.businessName || updates.commercialName || app.businessName;

    // Al corregir datos, la solicitud regresa a "pendiente de revisión"
    const saved = await this.upsertFull<FloristApplication>('florist_applications', {
      ...app,
      ...updates,
      businessName,
      status: 'pending_review',
      submittedAt: now,
      infoRequiredNotes: undefined,
    });

    const florist = await this.getFloristById(app.floristId);
    if (florist) {
      await this.saveFlorist({
        ...florist,
        commercialName: businessName,
        businessName,
        phone: updates.phone || florist.phone,
        whatsapp: updates.whatsapp || florist.whatsapp,
        openingHours: updates.openingHours || florist.openingHours,
        description: updates.description || florist.description,
        address: updates.address || florist.address,
        status: 'pending_review',
        infoRequiredNotes: undefined,
      });
    }

    const actorId = actorNameParam ? notesOrActorId || app.applicantId : app.applicantId;
    const actorName = actorNameParam || app.applicantName;
    const notes = actorNameParam
      ? 'Datos actualizados por el vendedor.'
      : notesOrActorId || 'Datos actualizados por el vendedor.';

    await this.addAuditLog({
      applicationId: app.id,
      actorId,
      actorName,
      action: 'update_info',
      previousStatus: app.status,
      newStatus: 'pending_review',
      notes,
    });

    return this.withApplicationAliases(saved);
  }

  // ===========================================================================
  // Bitácora de auditoría
  // ===========================================================================

  async getApplicationAuditLogs(applicationId?: string): Promise<ApplicationAuditLog[]> {
    return this.selectAll<ApplicationAuditLog>('application_audit_logs', (q) => {
      if (applicationId) q = q.eq('application_id', applicationId);
      return q.order('created_at', { ascending: false });
    });
  }

  async addAuditLog(log: Omit<ApplicationAuditLog, 'id' | 'createdAt'>): Promise<ApplicationAuditLog> {
    return this.upsertFull<ApplicationAuditLog>('application_audit_logs', {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    });
  }

  // ===========================================================================
  // Catálogo maestro
  // ===========================================================================

  async getCatalogProducts(): Promise<CatalogProduct[]> {
    return this.selectAll<CatalogProduct>('catalog_products', (q) => q.order('created_at'));
  }

  async getCatalogProductById(id: string): Promise<CatalogProduct | null> {
    return this.selectById<CatalogProduct>('catalog_products', id);
  }

  async saveCatalogProduct(product: CatalogProduct): Promise<CatalogProduct> {
    return this.upsertFull<CatalogProduct>('catalog_products', product);
  }

  // ===========================================================================
  // Ofertas de productos
  // ===========================================================================

  async getProductOffers(filter?: {
    floristId?: string;
    categoryId?: string;
    communityId?: string;
    query?: string;
  }): Promise<ProductOffer[]> {
    let offers = await this.selectAll<ProductOffer>('product_offers', (q) => {
      if (filter?.floristId) q = q.eq('florist_id', filter.floristId);
      return q.order('created_at');
    });

    const needsCatalog = !!filter?.categoryId || !!filter?.query?.trim();
    const catalog = needsCatalog ? await this.getCatalogProducts() : [];

    if (filter?.categoryId) {
      const ids = new Set(catalog.filter((cp) => cp.categoryId === filter.categoryId).map((cp) => cp.id));
      offers = offers.filter((o) => ids.has(o.catalogProductId));
    }

    if (filter?.communityId) {
      // Solo florerías aprobadas que entregan en esa comunidad
      const florists = await this.getFlorists();
      const validIds = new Set(
        florists
          .filter(
            (f) =>
              f.status === 'approved' &&
              f.deliveryZones.some((dz) => dz.communityId === filter.communityId && dz.isActive)
          )
          .map((f) => f.id)
      );
      offers = offers.filter((o) => validIds.has(o.floristId));
    }

    if (filter?.query?.trim()) {
      const q = filter.query.toLowerCase().trim();
      offers = offers.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          catalog.find((cp) => cp.id === o.catalogProductId)?.name.toLowerCase().includes(q)
      );
    }

    return offers.map((o) => ({ ...o, images: o.images ?? [] }));
  }

  async getProductOfferById(id: string): Promise<ProductOffer | null> {
    return this.selectById<ProductOffer>('product_offers', id);
  }

  async saveProductOffer(offer: ProductOffer): Promise<ProductOffer> {
    return this.upsertFull<ProductOffer>('product_offers', {
      ...offer,
      updatedAt: new Date().toISOString(),
    });
  }

  async updateOfferStock(id: string, newStock: number): Promise<void> {
    await this.patch('product_offers', id, {
      stock: Math.max(0, newStock),
      updatedAt: new Date().toISOString(),
    });
  }

  async toggleOfferPublish(id: string, isPublished: boolean): Promise<void> {
    await this.patch('product_offers', id, { isPublished, updatedAt: new Date().toISOString() });
  }

  async deleteProductOffer(id: string): Promise<void> {
    const { error } = await supabase.from('product_offers').delete().eq('id', id);
    if (error) throw new Error(`[Supabase] No se pudo eliminar la oferta ${id}: ${error.message}`);
  }

  // ===========================================================================
  // Pedidos
  // ===========================================================================

  async getOrders(filter?: { buyerId?: string; floristId?: string; status?: OrderStatus }): Promise<Order[]> {
    return this.selectAll<Order>('orders', (q) => {
      if (filter?.buyerId) q = q.eq('buyer_id', filter.buyerId);
      if (filter?.floristId) q = q.eq('florist_id', filter.floristId);
      if (filter?.status) q = q.eq('status', filter.status);
      return q.order('created_at', { ascending: false });
    });
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.selectById<Order>('orders', id);
  }

  async createOrder(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
  ): Promise<Order> {
    const now = new Date().toISOString();
    const base = {
      ...orderData,
      status: 'pending_contact' as OrderStatus,
      whatsappMessageSent: false,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: 'pending_contact' as OrderStatus,
          timestamp: now,
          changedBy: 'Comprador (Plataforma)',
          note: 'Pedido generado por el comprador en Lunaria.',
        },
      ],
    };

    // Folio legible tipo "LUN-4821". Si choca con uno existente, se reintenta.
    let created: Order | null = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const id = `LUN-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data, error } = await supabase
        .from('orders')
        .insert(toRow('orders', { ...base, id }))
        .select()
        .single();
      if (!error) created = fromRow<Order>('orders', data);
      else if (error.code !== '23505') {
        throw new Error(`[Supabase] No se pudo crear el pedido: ${error.message}`);
      }
    }
    if (!created) throw new Error('[Supabase] No se pudo generar un folio único para el pedido.');

    // Descontar stock y sumar ventas de cada producto
    for (const item of created.items) {
      const offer = await this.getProductOfferById(item.offerId);
      if (offer) {
        await this.patch('product_offers', offer.id, {
          stock: Math.max(0, offer.stock - item.quantity),
          salesCount: (offer.salesCount || 0) + item.quantity,
          updatedAt: now,
        });
      }
    }

    return created;
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    note?: string
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error(`Pedido no encontrado: ${orderId}`);

    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      status: newStatus,
      updatedAt: now,
      statusHistory: [...(order.statusHistory ?? []), { status: newStatus, timestamp: now, changedBy, note }],
    };
    await this.patch('orders', orderId, {
      status: updated.status,
      updatedAt: now,
      statusHistory: updated.statusHistory,
    });
    return updated;
  }

  async markWhatsAppContacted(orderId: string): Promise<void> {
    await this.patch('orders', orderId, {
      whatsappMessageSent: true,
      updatedAt: new Date().toISOString(),
    });
  }

  // ===========================================================================
  // Perfiles
  // ===========================================================================

  async getProfiles(): Promise<Profile[]> {
    const list = await this.selectAll<Profile>('profiles', (q) => q.order('created_at'));
    return list.map((p) => ({ ...p, addresses: p.addresses ?? [] }));
  }

  async getProfileById(id: string): Promise<Profile | null> {
    return this.selectById<Profile>('profiles', id);
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    return this.upsertFull<Profile>('profiles', { ...profile, updatedAt: new Date().toISOString() });
  }

  // ===========================================================================
  // Reset demo
  // ===========================================================================

  /** Borra todo y recarga los datos de ejemplo (botón "Restablecer demo"). */
  async resetToInitialSeed(): Promise<void> {
    await seedDatabase(supabase);
  }
}
