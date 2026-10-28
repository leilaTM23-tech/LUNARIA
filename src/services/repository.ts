import {
  Profile,
  Florist,
  Community,
  Category,
  CatalogProduct,
  ProductOffer,
  Order,
  OrderStatus,
  DeliveryZoneRule,
  FloristStatus,
  RegistrationMethod,
  FloristInvitation,
  FloristApplication,
  ApplicationAuditLog,
} from '../types';
import {
  INITIAL_COMMUNITIES,
  INITIAL_CATEGORIES,
  INITIAL_FLORISTS,
  INITIAL_CATALOG_PRODUCTS,
  INITIAL_PRODUCT_OFFERS,
  INITIAL_PROFILES,
  INITIAL_ORDERS,
  INITIAL_INVITATIONS,
  INITIAL_APPLICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';

/**
 * Interface de Repositorio desacoplada.
 * Permite sustituir la implementación local DEMO por Supabase sin alterar los componentes visuales.
 */
export interface ILunariaRepository {
  // Comunidades
  getCommunities(): Promise<Community[]>;
  saveCommunity(community: Community): Promise<Community>;
  toggleCommunityStatus(id: string, isActive: boolean): Promise<void>;

  // Categorías
  getCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<Category>;

  // Florerías
  getFlorists(): Promise<Florist[]>;
  getFloristById(id: string): Promise<Florist | null>;
  getFloristByOwnerId(ownerId: string): Promise<Florist | null>;
  saveFlorist(florist: Florist): Promise<Florist>;
  updateFloristStatus(
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
    actorName?: string,
    notes?: string
  ): Promise<void>;
  updateDeliveryZones(floristId: string, zones: DeliveryZoneRule[]): Promise<void>;

  // Invitaciones para Florerías
  getFloristInvitations(): Promise<FloristInvitation[]>;
  getFloristInvitationByToken(token: string): Promise<FloristInvitation | null>;
  createFloristInvitation(invitationData: {
    businessName: string;
    email: string;
    expiresInDays?: number;
    expiresAt?: string;
    token?: string;
    tokenHash?: string;
    createdBy?: string;
    createdById?: string;
    createdByName?: string;
  }): Promise<FloristInvitation>;
  revokeFloristInvitation(id: string, actorId?: string, actorName?: string): Promise<void>;
  markInvitationUsed(token: string, floristId?: string): Promise<void>;

  // Solicitudes de Florerías (Applications)
  getFloristApplications(filter?: {
    status?: FloristStatus;
    registrationMethod?: RegistrationMethod;
  }): Promise<FloristApplication[]>;
  getFloristApplicationById(id: string): Promise<FloristApplication | null>;
  getFloristApplicationByFloristId(floristId: string): Promise<FloristApplication | null>;
  submitFloristApplication(
    data: any
  ): Promise<FloristApplication>;
  updateFloristApplicationStatus(
    applicationId: string,
    newStatus: FloristStatus,
    actorId: string,
    actorName: string,
    notes?: string
  ): Promise<FloristApplication>;
  updateFloristApplicationData(
    applicationId: string,
    updates: Partial<FloristApplication>,
    notesOrActorId?: string,
    actorName?: string
  ): Promise<FloristApplication>;

  // Bitácora de Auditoría
  getApplicationAuditLogs(applicationId?: string): Promise<ApplicationAuditLog[]>;
  addAuditLog(log: Omit<ApplicationAuditLog, 'id' | 'createdAt'>): Promise<ApplicationAuditLog>;

  // Catálogo Maestro
  getCatalogProducts(): Promise<CatalogProduct[]>;
  getCatalogProductById(id: string): Promise<CatalogProduct | null>;
  saveCatalogProduct(product: CatalogProduct): Promise<CatalogProduct>;

  // Ofertas de Productos por Florería
  getProductOffers(filter?: {
    floristId?: string;
    categoryId?: string;
    communityId?: string;
    query?: string;
  }): Promise<ProductOffer[]>;
  getProductOfferById(id: string): Promise<ProductOffer | null>;
  saveProductOffer(offer: ProductOffer): Promise<ProductOffer>;
  updateOfferStock(id: string, newStock: number): Promise<void>;
  toggleOfferPublish(id: string, isPublished: boolean): Promise<void>;
  deleteProductOffer(id: string): Promise<void>;

  // Pedidos
  getOrders(filter?: { buyerId?: string; floristId?: string; status?: OrderStatus }): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<Order>;
  updateOrderStatus(orderId: string, newStatus: OrderStatus, changedBy: string, note?: string): Promise<Order>;
  markWhatsAppContacted(orderId: string): Promise<void>;

  // Perfiles de Usuario
  getProfiles(): Promise<Profile[]>;
  getProfileById(id: string): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<Profile>;

  // Reset demo
  resetToInitialSeed(): Promise<void>;
}

const STORAGE_KEYS = {
  COMMUNITIES: 'lunaria_demo_communities_v1',
  CATEGORIES: 'lunaria_demo_categories_v1',
  FLORISTS: 'lunaria_demo_florists_v1',
  CATALOG_PRODUCTS: 'lunaria_demo_catalog_products_v1',
  PRODUCT_OFFERS: 'lunaria_demo_product_offers_v1',
  PROFILES: 'lunaria_demo_profiles_v1',
  ORDERS: 'lunaria_demo_orders_v1',
  INVITATIONS: 'lunaria_demo_invitations_v1',
  APPLICATIONS: 'lunaria_demo_applications_v1',
  AUDIT_LOGS: 'lunaria_demo_audit_logs_v1',
};

class LocalStorageRepository implements ILunariaRepository {
  private getStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }

  // --- COMUNIDADES ---
  async getCommunities(): Promise<Community[]> {
    return this.getStorage<Community[]>(STORAGE_KEYS.COMMUNITIES, INITIAL_COMMUNITIES);
  }

  async saveCommunity(community: Community): Promise<Community> {
    const list = await this.getCommunities();
    const index = list.findIndex((c) => c.id === community.id);
    let updated: Community[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = community;
    } else {
      updated = [...list, community];
    }
    this.setStorage(STORAGE_KEYS.COMMUNITIES, updated);
    return community;
  }

  async toggleCommunityStatus(id: string, isActive: boolean): Promise<void> {
    const list = await this.getCommunities();
    const updated = list.map((c) => (c.id === id ? { ...c, isActive } : c));
    this.setStorage(STORAGE_KEYS.COMMUNITIES, updated);
  }

  // --- CATEGORÍAS ---
  async getCategories(): Promise<Category[]> {
    return this.getStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  async saveCategory(category: Category): Promise<Category> {
    const list = await this.getCategories();
    const index = list.findIndex((c) => c.id === category.id);
    let updated: Category[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = category;
    } else {
      updated = [...list, category];
    }
    this.setStorage(STORAGE_KEYS.CATEGORIES, updated);
    return category;
  }

  // --- FLORERÍAS ---
  async getFlorists(): Promise<Florist[]> {
    return this.getStorage<Florist[]>(STORAGE_KEYS.FLORISTS, INITIAL_FLORISTS);
  }

  async getFloristById(id: string): Promise<Florist | null> {
    const florists = await this.getFlorists();
    return florists.find((f) => f.id === id) || null;
  }

  async getFloristByOwnerId(ownerId: string): Promise<Florist | null> {
    const florists = await this.getFlorists();
    return florists.find((f) => f.ownerId === ownerId) || null;
  }

  async saveFlorist(florist: Florist): Promise<Florist> {
    const list = await this.getFlorists();
    const index = list.findIndex((f) => f.id === florist.id);
    let updated: Florist[];
    const now = new Date().toISOString();
    const toSave = { ...florist, updatedAt: now };
    if (index >= 0) {
      updated = [...list];
      updated[index] = toSave;
    } else {
      updated = [...list, toSave];
    }
    this.setStorage(STORAGE_KEYS.FLORISTS, updated);
    return toSave;
  }

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
    const list = await this.getFlorists();
    const florist = list.find((f) => f.id === id);
    if (!florist) return;

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

    const updatedFlorist: Florist = {
      ...florist,
      status,
      updatedAt: now,
      approvedAt: status === 'approved' ? now : florist.approvedAt,
      rejectedAt: status === 'rejected' ? now : florist.rejectedAt,
      suspendedAt: status === 'suspended' ? now : florist.suspendedAt,
      rejectionReason: status === 'rejected' ? notes || florist.rejectionReason : florist.rejectionReason,
      suspensionReason: status === 'suspended' ? notes || florist.suspensionReason : florist.suspensionReason,
      infoRequiredNotes: status === 'info_required' ? notes || florist.infoRequiredNotes : florist.infoRequiredNotes,
    };

    const updatedList = list.map((f) => (f.id === id ? updatedFlorist : f));
    this.setStorage(STORAGE_KEYS.FLORISTS, updatedList);

    // Sincronizar solicitud (FloristApplication) asociada si existe
    const apps = await this.getFloristApplications();
    const appIndex = apps.findIndex((a) => a.floristId === id);
    if (appIndex >= 0) {
      const app = apps[appIndex];
      const updatedApp: FloristApplication = {
        ...app,
        status,
        reviewedBy: actorId || app.reviewedBy,
        reviewedAt: now,
        reviewNotes: notes || app.reviewNotes,
        infoRequiredNotes: status === 'info_required' ? notes : app.infoRequiredNotes,
      };
      apps[appIndex] = updatedApp;
      this.setStorage(STORAGE_KEYS.APPLICATIONS, apps);

      // Registrar auditoría
      let auditAction: ApplicationAuditLog['action'] = 'approve';
      if (status === 'rejected') auditAction = 'reject';
      else if (status === 'info_required') auditAction = 'request_info';
      else if (status === 'suspended') auditAction = 'suspend';
      else if (status === 'approved' && previousStatus === 'suspended') auditAction = 'reactivate';

      await this.addAuditLog({
        applicationId: app.id,
        actorId,
        actorName,
        action: auditAction,
        previousStatus,
        newStatus: status,
        notes,
      });
    }
  }

  async updateDeliveryZones(floristId: string, zones: DeliveryZoneRule[]): Promise<void> {
    const list = await this.getFlorists();
    const updated = list.map((f) =>
      f.id === floristId ? { ...f, deliveryZones: zones, updatedAt: new Date().toISOString() } : f
    );
    this.setStorage(STORAGE_KEYS.FLORISTS, updated);
  }

  // --- INVITACIONES ---
  async getFloristInvitations(): Promise<FloristInvitation[]> {
    const list = this.getStorage<FloristInvitation[]>(STORAGE_KEYS.INVITATIONS, INITIAL_INVITATIONS);
    return list.map((inv) => {
      const isExpired = new Date(inv.expiresAt) < new Date();
      const status: 'pending' | 'used' | 'revoked' | 'expired' =
        inv.revokedAt ? 'revoked' : inv.usedAt ? 'used' : isExpired ? 'expired' : 'pending';
      return { ...inv, status: inv.status || status };
    });
  }

  async getFloristInvitationByToken(token: string): Promise<FloristInvitation | null> {
    const invitations = await this.getFloristInvitations();
    return invitations.find((inv) => inv.token === token) || null;
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
    const list = await this.getFloristInvitations();
    const token =
      invitationData.token ||
      `inv-${invitationData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;
    const tokenHash = invitationData.tokenHash || `hash_${token}_sha256`;
    const days = invitationData.expiresInDays || 7;
    const expiresAt =
      invitationData.expiresAt || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const createdBy = invitationData.createdById || invitationData.createdBy || 'admin';
    const createdByName = invitationData.createdByName || 'Administrador General';

    const newInvitation: FloristInvitation = {
      id: `inv-${Date.now()}`,
      businessName: invitationData.businessName,
      email: invitationData.email,
      token,
      tokenHash,
      expiresAt,
      createdBy,
      createdByName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const updated = [newInvitation, ...list];
    this.setStorage(STORAGE_KEYS.INVITATIONS, updated);

    // Auditoría
    await this.addAuditLog({
      applicationId: `invitation-${newInvitation.id}`,
      actorId: createdBy,
      actorName: createdByName,
      action: 'create_invitation',
      notes: `Invitación creada para "${newInvitation.businessName}" (${newInvitation.email}). Vence el ${new Date(
        newInvitation.expiresAt
      ).toLocaleDateString('es-MX')}.`,
    });

    return newInvitation;
  }

  async revokeFloristInvitation(
    id: string,
    actorId = 'user-admin-1',
    actorName = 'Lic. Elena Morales'
  ): Promise<void> {
    const list = await this.getFloristInvitations();
    const target = list.find((i) => i.id === id);
    const now = new Date().toISOString();
    const updated = list.map((inv) =>
      inv.id === id ? { ...inv, revokedAt: now, status: 'revoked' as const } : inv
    );
    this.setStorage(STORAGE_KEYS.INVITATIONS, updated);

    if (target) {
      await this.addAuditLog({
        applicationId: `invitation-${target.id}`,
        actorId,
        actorName,
        action: 'revoke_invitation',
        notes: `Invitación para "${target.businessName}" revocada por el administrador.`,
      });
    }
  }

  async markInvitationUsed(tokenOrId: string, floristId?: string): Promise<void> {
    const list = await this.getFloristInvitations();
    const now = new Date().toISOString();
    const updated = list.map((inv) =>
      inv.token === tokenOrId || inv.id === tokenOrId
        ? { ...inv, usedAt: now, status: 'used' as const }
        : inv
    );
    this.setStorage(STORAGE_KEYS.INVITATIONS, updated);
  }

  // --- SOLICITUDES DE FLOREÍAS (APPLICATIONS) ---
  async getFloristApplications(filter?: {
    status?: FloristStatus;
    registrationMethod?: RegistrationMethod;
  }): Promise<FloristApplication[]> {
    let apps = this.getStorage<FloristApplication[]>(
      STORAGE_KEYS.APPLICATIONS,
      INITIAL_APPLICATIONS
    );
    if (filter?.status) {
      apps = apps.filter((a) => a.status === filter.status);
    }
    if (filter?.registrationMethod) {
      apps = apps.filter((a) => a.registrationMethod === filter.registrationMethod);
    }
    return apps.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  async getFloristApplicationById(id: string): Promise<FloristApplication | null> {
    const apps = await this.getFloristApplications();
    return apps.find((a) => a.id === id) || null;
  }

  async getFloristApplicationByFloristId(floristId: string): Promise<FloristApplication | null> {
    const apps = await this.getFloristApplications();
    return apps.find((a) => a.floristId === floristId) || null;
  }

  async submitFloristApplication(
    data: any
  ): Promise<FloristApplication> {
    const list = await this.getFloristApplications();
    const now = new Date().toISOString();
    const applicantId = data.applicantId || data.applicantUserId || `user-${Date.now()}`;
    const businessName = data.businessName || data.commercialName || 'Florería Nueva';
    const applicantName = data.applicantName || data.orderAgentName || 'Responsable';
    const email = data.email || data.applicantEmail || '';
    const phone = data.phone || data.applicantPhone || '';
    const whatsapp = data.whatsapp || phone;
    const floristId = data.floristId || `flor-${Date.now()}`;

    const newApp: FloristApplication = {
      id: `app-${Date.now()}`,
      applicantId,
      floristId,
      registrationMethod: data.registrationMethod || 'public_application',
      status: 'pending_review',
      submittedAt: now,
      createdAt: now,
      applicantName,
      applicantEmail: email,
      applicantPhone: phone,
      businessName,
      commercialName: businessName,
      orderAgentName: applicantName,
      email,
      communityId: data.communityId || 'comm-tlaxcala',
      communityName: data.communityName || 'Tlaxcala',
      address: data.address || '',
      description: data.description || '',
      openingHours: data.openingHours || 'Lunes a Sábado: 8:00 - 19:00',
      whatsapp,
      phone,
      deliveryModes: data.deliveryModes || (data.allowsPickup ? ['delivery', 'pickup'] : ['delivery']),
      deliveryCommunities: data.deliveryCoverage || data.deliveryCommunities || [data.communityId || 'comm-tlaxcala'],
      estimatedDeliveryTime: data.prepTimeEstimated || data.estimatedDeliveryTime || '2 a 4 horas',
      prepTimeEstimated: data.prepTimeEstimated || data.estimatedDeliveryTime || '2 a 4 horas',
      invitationId: data.invitationId,
    };

    const updated = [newApp, ...list];
    this.setStorage(STORAGE_KEYS.APPLICATIONS, updated);

    // Crear o actualizar la entidad Florist correspondiente para que exista de inmediato
    const existingFlorist = await this.getFloristById(floristId);
    if (!existingFlorist) {
      const newFlorist: Florist = {
        id: floristId,
        ownerId: applicantId,
        commercialName: businessName,
        businessName,
        email,
        slug: businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        description: data.description || '',
        address: data.address || '',
        communityId: data.communityId || 'comm-tlaxcala',
        phone,
        whatsapp,
        openingHours: data.openingHours || 'Lunes a Sábado: 8:00 - 19:00',
        orderAgentName: applicantName,
        registrationMethod: newApp.registrationMethod,
        status: 'pending_review',
        rating: 5.0,
        reviewCount: 0,
        deliveryZones: [],
        deliveryCoverage: newApp.deliveryCommunities,
        createdAt: now,
        updatedAt: now,
      };
      await this.saveFlorist(newFlorist);
    }

    // Registrar en auditoría
    await this.addAuditLog({
      applicationId: newApp.id,
      actorId: newApp.applicantId,
      actorName: newApp.applicantName,
      action: 'submit_application',
      previousStatus: 'draft',
      newStatus: newApp.status,
      notes: `Solicitud enviada vía ${
        newApp.registrationMethod === 'invitation' ? 'enlace de invitación' : 'registro público "Vende con nosotros"'
      }.`,
    });

    return newApp;
  }

  async updateFloristApplicationStatus(
    applicationId: string,
    newStatus: FloristStatus,
    actorId: string,
    actorName: string,
    notes?: string
  ): Promise<FloristApplication> {
    const apps = await this.getFloristApplications();
    const appIndex = apps.findIndex((a) => a.id === applicationId);
    if (appIndex === -1) {
      throw new Error(`Solicitud no encontrada: ${applicationId}`);
    }

    const app = apps[appIndex];
    const previousStatus = app.status;
    const now = new Date().toISOString();

    const updatedApp: FloristApplication = {
      ...app,
      status: newStatus,
      reviewedBy: actorId,
      reviewedAt: now,
      reviewNotes: notes || app.reviewNotes,
      infoRequiredNotes: newStatus === 'info_required' ? notes : app.infoRequiredNotes,
    };

    apps[appIndex] = updatedApp;
    this.setStorage(STORAGE_KEYS.APPLICATIONS, apps);

    // Sincronizar estado en la entidad Florist
    await this.updateFloristStatus(app.floristId, newStatus, actorId, actorName, notes);

    return updatedApp;
  }

  async updateFloristApplicationData(
    applicationId: string,
    updates: Partial<FloristApplication>,
    notesOrActorId?: string,
    actorNameParam?: string
  ): Promise<FloristApplication> {
    const apps = await this.getFloristApplications();
    const appIndex = apps.findIndex((a) => a.id === applicationId);
    if (appIndex === -1) {
      throw new Error(`Solicitud no encontrada: ${applicationId}`);
    }

    const app = apps[appIndex];
    const updatedApp: FloristApplication = {
      ...app,
      ...updates,
      status: 'pending_review', // Al actualizar datos regresa a pendiente de revisión
      submittedAt: new Date().toISOString(),
      infoRequiredNotes: undefined,
    };

    apps[appIndex] = updatedApp;
    this.setStorage(STORAGE_KEYS.APPLICATIONS, apps);

    // Sincronizar floristería
    const florist = await this.getFloristById(app.floristId);
    if (florist) {
      await this.saveFlorist({
        ...florist,
        commercialName: updates.businessName || updates.commercialName || florist.commercialName,
        phone: updates.phone || florist.phone,
        whatsapp: updates.whatsapp || florist.whatsapp,
        openingHours: updates.openingHours || florist.openingHours,
        description: updates.description || florist.description,
        address: updates.address || florist.address,
        status: 'pending_review',
        infoRequiredNotes: undefined, // Limpiar requerimientos
      });
    }

    const actorId = actorNameParam ? notesOrActorId || app.applicantId : app.applicantId;
    const actorName = actorNameParam || app.applicantName;
    const notes = actorNameParam ? 'Datos actualizados por el vendedor.' : notesOrActorId || 'Datos actualizados por el vendedor.';

    await this.addAuditLog({
      applicationId: app.id,
      actorId,
      actorName,
      action: 'update_info',
      previousStatus: app.status,
      newStatus: 'pending_review',
      notes,
    });

    return updatedApp;
  }

  // --- BITÁCORA DE AUDITORÍA ---
  async getApplicationAuditLogs(applicationId?: string): Promise<ApplicationAuditLog[]> {
    let logs = this.getStorage<ApplicationAuditLog[]>(
      STORAGE_KEYS.AUDIT_LOGS,
      INITIAL_AUDIT_LOGS
    );
    if (applicationId) {
      logs = logs.filter((l) => l.applicationId === applicationId);
    }
    return logs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async addAuditLog(log: Omit<ApplicationAuditLog, 'id' | 'createdAt'>): Promise<ApplicationAuditLog> {
    const list = await this.getApplicationAuditLogs();
    const newLog: ApplicationAuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newLog, ...list];
    this.setStorage(STORAGE_KEYS.AUDIT_LOGS, updated);
    return newLog;
  }

  // --- CATÁLOGO MAESTRO ---
  async getCatalogProducts(): Promise<CatalogProduct[]> {
    return this.getStorage<CatalogProduct[]>(
      STORAGE_KEYS.CATALOG_PRODUCTS,
      INITIAL_CATALOG_PRODUCTS
    );
  }

  async getCatalogProductById(id: string): Promise<CatalogProduct | null> {
    const list = await this.getCatalogProducts();
    return list.find((p) => p.id === id) || null;
  }

  async saveCatalogProduct(product: CatalogProduct): Promise<CatalogProduct> {
    const list = await this.getCatalogProducts();
    const index = list.findIndex((p) => p.id === product.id);
    let updated: CatalogProduct[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = product;
    } else {
      updated = [...list, product];
    }
    this.setStorage(STORAGE_KEYS.CATALOG_PRODUCTS, updated);
    return product;
  }

  // --- OFERTAS DE PRODUCTOS ---
  async getProductOffers(filter?: {
    floristId?: string;
    categoryId?: string;
    communityId?: string;
    query?: string;
  }): Promise<ProductOffer[]> {
    let offers = this.getStorage<ProductOffer[]>(
      STORAGE_KEYS.PRODUCT_OFFERS,
      INITIAL_PRODUCT_OFFERS
    );
    const catalog = await this.getCatalogProducts();
    const florists = await this.getFlorists();

    if (filter?.floristId) {
      offers = offers.filter((o) => o.floristId === filter.floristId);
    }

    if (filter?.categoryId) {
      const productIdsInCategory = new Set(
        catalog.filter((cp) => cp.categoryId === filter.categoryId).map((cp) => cp.id)
      );
      offers = offers.filter((o) => productIdsInCategory.has(o.catalogProductId));
    }

    if (filter?.communityId) {
      // Filtrar ofertas cuyas florerías entreguen en la comunidad especificada y estén aprobadas
      const validFloristIds = new Set(
        florists
          .filter(
            (f) =>
              f.status === 'approved' &&
              f.deliveryZones.some((dz) => dz.communityId === filter.communityId && dz.isActive)
          )
          .map((f) => f.id)
      );
      offers = offers.filter((o) => validFloristIds.has(o.floristId));
    }

    if (filter?.query && filter.query.trim().length > 0) {
      const q = filter.query.toLowerCase().trim();
      offers = offers.filter((o) => {
        const titleMatch = o.title.toLowerCase().includes(q);
        const descMatch = o.description.toLowerCase().includes(q);
        const catalogMatch = catalog
          .find((cp) => cp.id === o.catalogProductId)
          ?.name.toLowerCase()
          .includes(q);
        return titleMatch || descMatch || catalogMatch;
      });
    }

    return offers;
  }

  async getProductOfferById(id: string): Promise<ProductOffer | null> {
    const offers = await this.getProductOffers();
    return offers.find((o) => o.id === id) || null;
  }

  async saveProductOffer(offer: ProductOffer): Promise<ProductOffer> {
    const list = await this.getProductOffers();
    const index = list.findIndex((o) => o.id === offer.id);
    let updated: ProductOffer[];
    const now = new Date().toISOString();
    const toSave = { ...offer, updatedAt: now };
    if (index >= 0) {
      updated = [...list];
      updated[index] = toSave;
    } else {
      updated = [...list, toSave];
    }
    this.setStorage(STORAGE_KEYS.PRODUCT_OFFERS, updated);
    return toSave;
  }

  async updateOfferStock(id: string, newStock: number): Promise<void> {
    const list = await this.getProductOffers();
    const updated = list.map((o) =>
      o.id === id ? { ...o, stock: Math.max(0, newStock), updatedAt: new Date().toISOString() } : o
    );
    this.setStorage(STORAGE_KEYS.PRODUCT_OFFERS, updated);
  }

  async toggleOfferPublish(id: string, isPublished: boolean): Promise<void> {
    const list = await this.getProductOffers();
    const updated = list.map((o) =>
      o.id === id ? { ...o, isPublished, updatedAt: new Date().toISOString() } : o
    );
    this.setStorage(STORAGE_KEYS.PRODUCT_OFFERS, updated);
  }

  async deleteProductOffer(id: string): Promise<void> {
    const list = await this.getProductOffers();
    const updated = list.filter((o) => o.id !== id);
    this.setStorage(STORAGE_KEYS.PRODUCT_OFFERS, updated);
  }

  // --- PEDIDOS ---
  async getOrders(filter?: {
    buyerId?: string;
    floristId?: string;
    status?: OrderStatus;
  }): Promise<Order[]> {
    let orders = this.getStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);

    if (filter?.buyerId) {
      orders = orders.filter((o) => o.buyerId === filter.buyerId);
    }
    if (filter?.floristId) {
      orders = orders.filter((o) => o.floristId === filter.floristId);
    }
    if (filter?.status) {
      orders = orders.filter((o) => o.status === filter.status);
    }

    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOrderById(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.id === id) || null;
  }

  async createOrder(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
  ): Promise<Order> {
    const orders = await this.getOrders();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `LUN-${randomNum}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: newId,
      status: 'pending_contact',
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: 'pending_contact',
          timestamp: now,
          changedBy: 'Comprador (Plataforma)',
          note: 'Pedido generado por el comprador en Lunaria.',
        },
      ],
      whatsappMessageSent: false,
    };

    const updated = [newOrder, ...orders];
    this.setStorage(STORAGE_KEYS.ORDERS, updated);

    // Reducir stock de cada producto en la oferta
    for (const item of newOrder.items) {
      const offer = await this.getProductOfferById(item.offerId);
      if (offer) {
        await this.updateOfferStock(offer.id, Math.max(0, offer.stock - item.quantity));
      }
    }

    return newOrder;
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    note?: string
  ): Promise<Order> {
    const orders = await this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      throw new Error(`Pedido no encontrado: ${orderId}`);
    }

    const order = orders[orderIndex];
    const now = new Date().toISOString();
    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      updatedAt: now,
      statusHistory: [
        ...order.statusHistory,
        {
          status: newStatus,
          timestamp: now,
          changedBy,
          note,
        },
      ],
    };

    orders[orderIndex] = updatedOrder;
    this.setStorage(STORAGE_KEYS.ORDERS, orders);
    return updatedOrder;
  }

  async markWhatsAppContacted(orderId: string): Promise<void> {
    const orders = await this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex >= 0) {
      orders[orderIndex].whatsappMessageSent = true;
      orders[orderIndex].updatedAt = new Date().toISOString();
      this.setStorage(STORAGE_KEYS.ORDERS, orders);
    }
  }

  // --- PERFILES ---
  async getProfiles(): Promise<Profile[]> {
    return this.getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  async getProfileById(id: string): Promise<Profile | null> {
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === id) || null;
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    const list = await this.getProfiles();
    const index = list.findIndex((p) => p.id === profile.id);
    let updated: Profile[];
    const now = new Date().toISOString();
    const toSave = { ...profile, updatedAt: now };
    if (index >= 0) {
      updated = [...list];
      updated[index] = toSave;
    } else {
      updated = [...list, toSave];
    }
    this.setStorage(STORAGE_KEYS.PROFILES, updated);
    return toSave;
  }

  // --- RESET DEMO ---
  async resetToInitialSeed(): Promise<void> {
    this.setStorage(STORAGE_KEYS.COMMUNITIES, INITIAL_COMMUNITIES);
    this.setStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.setStorage(STORAGE_KEYS.FLORISTS, INITIAL_FLORISTS);
    this.setStorage(STORAGE_KEYS.CATALOG_PRODUCTS, INITIAL_CATALOG_PRODUCTS);
    this.setStorage(STORAGE_KEYS.PRODUCT_OFFERS, INITIAL_PRODUCT_OFFERS);
    this.setStorage(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    this.setStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    this.setStorage(STORAGE_KEYS.INVITATIONS, INITIAL_INVITATIONS);
    this.setStorage(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
    this.setStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }
}

// Instancia singleton para la aplicación
export const repository: ILunariaRepository = new LocalStorageRepository();
