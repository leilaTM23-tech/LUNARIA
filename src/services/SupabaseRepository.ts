import { supabase } from './supabaseClient';
import { ILunariaRepository } from './repository';
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
    Profile
} from '../types';
import {
    INITIAL_COMMUNITIES,
    INITIAL_CATEGORIES,
    INITIAL_FLORISTS,
    INITIAL_CATALOG_PRODUCTS,
    INITIAL_PRODUCT_OFFERS,
    INITIAL_PROFILES,
    INITIAL_ORDERS
} from '../data/seedData';

export class SupabaseRepository implements ILunariaRepository {

    // --- INVITACIONES ---
    async getFloristInvitations(): Promise<FloristInvitation[]> {
        const { data, error } = await supabase
            .from('florist_invitations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invitations:', error);
            return [];
        }

        return data.map((item: any) => {
            const isExpired = new Date(item.expires_at) < new Date();
            const status: 'pending' | 'used' | 'revoked' | 'expired' =
                item.revoked_at ? 'revoked' : item.used_at ? 'used' : isExpired ? 'expired' : 'pending';

            return {
                id: item.id,
                token: item.token,
                tokenHash: item.token_hash,
                businessName: item.store_name,
                email: item.email,
                expiresAt: item.expires_at,
                usedAt: item.used_at,
                revokedAt: item.revoked_at,
                status,
                createdBy: item.created_by || 'system',
                createdAt: item.created_at
            };
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
        const token =
            invitationData.token ||
            `inv-${invitationData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;
        const tokenHash = invitationData.tokenHash || `hash_${token}_sha256`;
        const days = invitationData.expiresInDays || 7;
        const expiresAt =
            invitationData.expiresAt || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        const createdBy = invitationData.createdById || invitationData.createdBy || 'admin';
        const createdByName = invitationData.createdByName || 'Lic. Elena Morales';

        const { data, error } = await supabase
            .from('florist_invitations')
            .insert({
                token,
                token_hash: tokenHash,
                store_name: invitationData.businessName,
                email: invitationData.email,
                expires_at: expiresAt
            })
            .select()
            .single();

        if (error) throw error;

        const newInvitation: FloristInvitation = {
            id: data.id,
            businessName: data.store_name,
            email: data.email,
            token: data.token,
            tokenHash: data.token_hash,
            expiresAt: data.expires_at,
            createdBy,
            createdByName,
            status: 'pending',
            createdAt: data.created_at,
        };

        // Registrar en auditoría
        await this.addAuditLog({
            applicationId: `invitation-${newInvitation.id}`,
            actorId: createdBy,
            actorName: createdByName,
            action: 'create_invitation',
            notes: `Invitación creada para "${newInvitation.businessName}" (${newInvitation.email}).`,
        });

        return newInvitation;
    }

    async revokeFloristInvitation(
        id: string,
        actorId = 'user-admin-1',
        actorName = 'Lic. Elena Morales'
    ): Promise<void> {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('florist_invitations')
            .update({ revoked_at: now })
            .eq('id', id);

        if (error) throw error;

        await this.addAuditLog({
            applicationId: `invitation-${id}`,
            actorId,
            actorName,
            action: 'revoke_invitation',
            notes: `Invitación revocada por el administrador.`,
        });
    }

    async markInvitationUsed(tokenOrId: string, floristId?: string): Promise<void> {
        const now = new Date().toISOString();
        await supabase
            .from('florist_invitations')
            .update({ used_at: now })
            .or(`token.eq.${tokenOrId},id.eq.${tokenOrId}`);
    }

    // --- SOLICITUDES Y AUDITORÍA ---
    async getFloristApplications(filter?: {
        status?: FloristStatus;
        registrationMethod?: RegistrationMethod;
    }): Promise<FloristApplication[]> {
        let query = supabase.from('florist_applications').select('*, florists(*)');

        if (filter?.status) {
            query = query.eq('status', filter.status);
        }
        if (filter?.registrationMethod) {
            query = query.eq('florists.registration_method', filter.registrationMethod);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching applications:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            floristId: item.florist_id,
            applicantId: item.florists?.profile_id || 'user-demo',
            registrationMethod: item.florists?.registration_method || 'public_application',
            status: item.status,
            submittedAt: item.created_at,
            createdAt: item.created_at,
            applicantName: item.florists?.owner_name || '',
            applicantEmail: item.florists?.email || '',
            applicantPhone: item.florists?.phone || '',
            businessName: item.florists?.store_name || '',
            commercialName: item.florists?.store_name || '',
            orderAgentName: item.florists?.owner_name || '',
            email: item.florists?.email || '',
            communityId: 'comm-tlaxcala',
            communityName: 'Tlaxcala',
            address: item.florists?.address || '',
            description: '',
            openingHours: item.florists?.schedule || '',
            whatsapp: item.florists?.whatsapp || '',
            phone: item.florists?.phone || '',
            deliveryModes: ['delivery'],
            deliveryCommunities: item.florists?.coverage_municipalities || [],
            estimatedDeliveryTime: '2 a 4 horas',
            prepTimeEstimated: '2 a 4 horas',
            submittedData: item.submitted_data
        }));
    }

    async getFloristApplicationById(id: string): Promise<FloristApplication | null> {
        const apps = await this.getFloristApplications();
        return apps.find((a) => a.id === id) || null;
    }

    async getFloristApplicationByFloristId(floristId: string): Promise<FloristApplication | null> {
        const apps = await this.getFloristApplications();
        return apps.find((a) => a.floristId === floristId) || null;
    }

    async submitFloristApplication(data: any): Promise<FloristApplication> {
        // Implementación inicial o puente para inserción
        const now = new Date().toISOString();
        const floristId = data.floristId || `flor-${Date.now()}`;

        // Insertar en florists y florist_applications
        const { error: floristError } = await supabase.from('florists').insert({
            id: floristId,
            profile_id: data.applicantId || '11111111-1111-1111-1111-111111111111',
            store_name: data.businessName,
            owner_name: data.applicantName,
            email: data.email,
            phone: data.phone,
            whatsapp: data.whatsapp || data.phone,
            address: data.address,
            municipality: data.communityName || 'Apizaco',
            coverage_municipalities: data.deliveryCoverage || ['Apizaco'],
            schedule: data.openingHours || 'Lun - Sab: 9:00 - 19:00',
            registration_method: data.registrationMethod || 'public_application',
            status: 'pending_review'
        });

        if (floristError) throw floristError;

        const { data: appData, error: appError } = await supabase.from('florist_applications').insert({
            florist_id: floristId,
            submitted_data: data,
            status: 'pending_review'
        }).select().single();

        if (appError) throw appError;

        await this.addAuditLog({
            applicationId: appData.id,
            actorId: data.applicantId || 'user',
            actorName: data.applicantName,
            action: 'submit_application',
            newStatus: 'pending_review',
            notes: 'Solicitud enviada correctamente.'
        });

        return {
            id: appData.id,
            floristId,
            applicantId: data.applicantId || '',
            registrationMethod: data.registrationMethod || 'public_application',
            status: 'pending_review',
            submittedAt: now,
            createdAt: now,
            applicantName: data.applicantName,
            applicantEmail: data.email,
            applicantPhone: data.phone,
            businessName: data.businessName,
            commercialName: data.businessName,
            orderAgentName: data.applicantName,
            email: data.email,
            communityId: data.communityId || 'comm-tlaxcala',
            communityName: data.communityName || 'Tlaxcala',
            address: data.address,
            description: data.description || '',
            openingHours: data.openingHours || '',
            whatsapp: data.whatsapp || '',
            phone: data.phone,
            deliveryModes: ['delivery'],
            deliveryCommunities: data.deliveryCoverage || [],
            estimatedDeliveryTime: '2 a 4 horas',
            prepTimeEstimated: '2 a 4 horas'
        };
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

        const updatePayload: any = { status: newStatus, updated_at: new Date().toISOString() };
        if (newStatus === 'rejected' && notes) updatePayload.rejection_reason = notes;
        if (newStatus === 'suspended' && notes) updatePayload.suspension_reason = notes;
        if (newStatus === 'info_required' && notes) updatePayload.info_required_notes = notes;

        await supabase.from('florists').update(updatePayload).eq('id', app.floristId);
        await supabase.from('florist_applications').update({ status: newStatus }).eq('id', applicationId);

        let auditAction: ApplicationAuditLog['action'] = 'approve';
        if (newStatus === 'rejected') auditAction = 'reject';
        else if (newStatus === 'info_required') auditAction = 'request_info';
        else if (newStatus === 'suspended') auditAction = 'suspend';

        await this.addAuditLog({
            applicationId,
            actorId,
            actorName,
            action: auditAction,
            previousStatus: app.status,
            newStatus,
            notes
        });

        return { ...app, status: newStatus };
    }

    async updateFloristApplicationData(
        applicationId: string,
        updates: Partial<FloristApplication>,
        notesOrActorId?: string,
        actorNameParam?: string
    ): Promise<FloristApplication> {
        const app = await this.getFloristApplicationById(applicationId);
        if (!app) throw new Error(`Solicitud no encontrada: ${applicationId}`);

        await supabase.from('florist_applications').update({
            submitted_data: { ...((app as any).submittedData || {}), ...updates },
            status: 'pending_review'
        }).eq('id', applicationId);

        await supabase.from('florists').update({
            status: 'pending_review',
            info_required_notes: null,
            updated_at: new Date().toISOString()
        }).eq('id', app.floristId);

        await this.addAuditLog({
            applicationId,
            actorId: notesOrActorId || app.applicantId,
            actorName: actorNameParam || app.applicantName,
            action: 'update_info',
            previousStatus: app.status,
            newStatus: 'pending_review',
            notes: 'Datos actualizados por el vendedor.'
        });

        return { ...app, ...updates, status: 'pending_review' };
    }

    async getApplicationAuditLogs(applicationId?: string): Promise<ApplicationAuditLog[]> {
        let query = supabase.from('application_audit_logs').select('*').order('created_at', { ascending: false });
        if (applicationId) {
            query = query.eq('florist_id', applicationId.replace('invitation-', ''));
        }

        const { data, error } = await query;
        if (error) return [];

        return data.map((item: any) => ({
            id: item.id,
            applicationId: item.florist_id,
            actorId: 'system',
            actorName: item.actor_name,
            action: 'approve',
            previousStatus: item.previous_status,
            newStatus: item.new_status,
            notes: item.notes,
            createdAt: item.created_at
        }));
    }

    async addAuditLog(log: Omit<ApplicationAuditLog, 'id' | 'createdAt'>): Promise<ApplicationAuditLog> {
        const { data, error } = await supabase.from('application_audit_logs').insert({
            florist_id: log.applicationId?.replace('invitation-', '') || '11111111-1111-1111-1111-111111111111',
            actor_name: log.actorName,
            previous_status: log.previousStatus || null,
            new_status: log.newStatus,
            notes: log.notes
        }).select().single();

        if (error) throw error;

        return {
            ...log,
            id: data.id,
            createdAt: data.created_at
        };
    }

    // --- MÉTODOS DE APOLLO (HÍBRIDO SUPABASE / DEMO SEED DATA) ---
    private localProfiles: Profile[] = [...INITIAL_PROFILES];

    async getCommunities(): Promise<Community[]> { return INITIAL_COMMUNITIES; }
    async saveCommunity(c: Community): Promise<Community> { return c; }
    async toggleCommunityStatus(): Promise<void> { }
    async getCategories(): Promise<Category[]> { return INITIAL_CATEGORIES; }
    async saveCategory(c: Category): Promise<Category> { return c; }
    async getFlorists(): Promise<Florist[]> {
        const { data } = await supabase.from('florists').select('*');
        if (!data || data.length === 0) return INITIAL_FLORISTS;
        return data.map((f: any) => ({
            id: f.id,
            ownerId: f.profile_id,
            commercialName: f.store_name,
            businessName: f.store_name,
            email: f.email,
            slug: f.store_name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            description: '',
            address: f.address,
            communityId: 'comm-tlaxcala',
            phone: f.phone,
            whatsapp: f.whatsapp,
            openingHours: f.schedule,
            orderAgentName: f.owner_name,
            registrationMethod: f.registration_method,
            status: f.status,
            rating: 5.0,
            reviewCount: 0,
            deliveryZones: [],
            deliveryCoverage: f.coverage_municipalities,
            rejectionReason: f.rejection_reason,
            suspensionReason: f.suspension_reason,
            infoRequiredNotes: f.info_required_notes,
            createdAt: f.created_at,
            updatedAt: f.updated_at
        }));
    }
    async getFloristById(id: string): Promise<Florist | null> {
        const list = await this.getFlorists();
        return list.find(f => f.id === id) || null;
    }
    async getFloristByOwnerId(ownerId: string): Promise<Florist | null> {
        const list = await this.getFlorists();
        return list.find(f => f.ownerId === ownerId) || null;
    }
    async saveFlorist(f: Florist): Promise<Florist> { return f; }
    async updateFloristStatus(id: string, status: FloristStatus, options?: any, name?: string, notes?: string): Promise<void> {
        await this.updateFloristApplicationStatus(id, status, 'admin', name || 'Leilani TM', notes);
    }
    async updateDeliveryZones(): Promise<void> { }
    async getCatalogProducts(): Promise<CatalogProduct[]> { return INITIAL_CATALOG_PRODUCTS; }
    async getCatalogProductById(id: string): Promise<CatalogProduct | null> {
        return INITIAL_CATALOG_PRODUCTS.find(p => p.id === id) || null;
    }
    async saveCatalogProduct(p: CatalogProduct): Promise<CatalogProduct> { return p; }
    async getProductOffers(): Promise<ProductOffer[]> { return INITIAL_PRODUCT_OFFERS; }
    async getProductOfferById(id: string): Promise<ProductOffer | null> {
        return INITIAL_PRODUCT_OFFERS.find(o => o.id === id) || null;
    }
    async saveProductOffer(o: ProductOffer): Promise<ProductOffer> { return o; }
    async updateOfferStock(): Promise<void> { }
    async toggleOfferPublish(): Promise<void> { }
    async deleteProductOffer(): Promise<void> { }
    async getOrders(): Promise<Order[]> { return INITIAL_ORDERS; }
    async getOrderById(id: string): Promise<Order | null> {
        return INITIAL_ORDERS.find(o => o.id === id) || null;
    }
    async createOrder(o: any): Promise<Order> { return o; }
    async updateOrderStatus(): Promise<any> { }
    async markWhatsAppContacted(): Promise<void> { }

    // --- GESTIÓN DE PERFILES / USUARIOS ---
    async getProfiles(): Promise<Profile[]> {
        try {
            const { data, error } = await supabase.from('profiles').select('*');
            if (!error && data && data.length > 0) {
                const sbProfiles: Profile[] = data.map((item: any) => ({
                    id: item.id,
                    email: item.email,
                    fullName: item.full_name || item.fullName || '',
                    phone: item.phone || '',
                    role: item.role || 'buyer',
                    avatarUrl: item.avatar_url,
                    floristId: item.florist_id,
                    addresses: item.addresses || [],
                    createdAt: item.created_at || new Date().toISOString(),
                    updatedAt: item.updated_at || new Date().toISOString()
                }));

                // Garantizar que Leilani TM y perfiles administradores estén siempre presentes
                for (const seed of this.localProfiles) {
                    if (!sbProfiles.some(p => p.id === seed.id || p.email.toLowerCase() === seed.email.toLowerCase())) {
                        sbProfiles.unshift(seed);
                    }
                }
                return sbProfiles;
            }
        } catch (e) {
            console.warn('Consulta a Supabase profiles no disponible, usando locales:', e);
        }

        return this.localProfiles;
    }

    async getProfileById(id: string): Promise<Profile | null> {
        const list = await this.getProfiles();
        return list.find(p => p.id === id) || null;
    }

    async saveProfile(p: Profile): Promise<Profile> {
        const index = this.localProfiles.findIndex(item => item.id === p.id);
        if (index >= 0) {
            this.localProfiles[index] = p;
        } else {
            this.localProfiles.push(p);
        }

        try {
            await supabase.from('profiles').upsert({
                id: p.id,
                email: p.email,
                full_name: p.fullName,
                phone: p.phone,
                role: p.role,
                avatar_url: p.avatarUrl,
                florist_id: p.floristId,
                updated_at: new Date().toISOString()
            });
        } catch (e) {
            console.warn('No se pudo sincronizar profile con Supabase (posible RLS):', e);
        }

        return p;
    }

    async resetToInitialSeed(): Promise<void> {
        this.localProfiles = [...INITIAL_PROFILES];
    }
}