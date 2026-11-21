/**
 * Pruebas de flujo contra Supabase usando el MISMO repositorio que usa la app.
 * Cubre: lecturas, compra completa, alta y aprobación de florería, invitaciones,
 * CRUD de productos y catálogos.
 *
 * ⚠️ Escribe en la base y al final la restablece con los datos de ejemplo.
 * Uso: npm run test:flows
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

let passed = 0;
let failed = 0;

function check(name: string, condition: unknown, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${detail !== undefined ? `  →  ${JSON.stringify(detail)}` : ''}`);
  }
}

function section(title: string) {
  console.log(`\n▶ ${title}`);
}

async function main() {
  // Import dinámico: supabaseClient debe leer process.env DESPUÉS de dotenv
  const { SupabaseRepository } = await import('../src/services/SupabaseRepository');
  const { generateWhatsAppOrderUrl } = await import('../src/utils/whatsapp');
  const repo = new SupabaseRepository();
  const COMMUNITY = 'com-tlaxcala-centro';
  const stamp = Date.now();

  console.log('🧪 Pruebas de flujo Lunaria contra Supabase');
  console.log('   (se restablecerán los datos de ejemplo antes y después)');
  await repo.resetToInitialSeed();

  // ---------------------------------------------------------------------------
  section('1. Lecturas básicas');
  const communities = await repo.getCommunities();
  const categories = await repo.getCategories();
  const florists = await repo.getFlorists();
  const offers = await repo.getProductOffers();
  const profiles = await repo.getProfiles();
  check('12 comunidades', communities.length === 12, communities.length);
  check('9 categorías ordenadas por "order"',
    categories.length === 9 && categories.every((c, i) => i === 0 || categories[i - 1].order <= c.order));
  check('7 florerías con zonas de entrega (array)', florists.length === 7 && florists.every((f) => Array.isArray(f.deliveryZones)));
  check('22 ofertas con precio numérico', offers.length === 22 && offers.every((o) => typeof o.price === 'number'));
  check('15 perfiles con direcciones (array)', profiles.length === 15 && profiles.every((p) => Array.isArray(p.addresses)));

  const inCommunity = await repo.getProductOffers({ communityId: COMMUNITY });
  check(`Filtro por comunidad (${COMMUNITY}) devuelve ofertas`, inCommunity.length > 0, inCommunity.length);
  const byCategory = await repo.getProductOffers({ categoryId: categories[0].id });
  check('Filtro por categoría no truena', Array.isArray(byCategory));
  const byQuery = await repo.getProductOffers({ query: 'rosa' });
  check('Búsqueda "rosa" encuentra ofertas', byQuery.length > 0, byQuery.length);

  const invitations = await repo.getFloristInvitations();
  check('Invitaciones con estado calculado', invitations.every((i) => !!i.status), invitations.map((i) => i.status));
  const apps = await repo.getFloristApplications();
  check('Solicitudes con alias (commercialName/email)', apps.every((a) => a.commercialName === a.businessName && a.email === a.applicantEmail));

  // ---------------------------------------------------------------------------
  section('2. Compra completa (bug: pedido sin id)');
  const buyer = profiles.find((p) => p.id === 'user-buyer-mariana')!;
  const offer = inCommunity.find((o) => o.isPublished && o.stock >= 2)!;
  const florist = (await repo.getFloristById(offer.floristId))!;
  const catalogProduct = (await repo.getCatalogProductById(offer.catalogProductId))!;
  const zone = florist.deliveryZones.find((dz) => dz.communityId === COMMUNITY)!;

  const order = await repo.createOrder({
    buyerId: buyer.id,
    buyerName: buyer.fullName,
    buyerPhone: buyer.phone,
    buyerEmail: buyer.email,
    floristId: florist.id,
    floristName: florist.commercialName,
    floristPhone: florist.phone,
    floristWhatsapp: florist.whatsapp,
    items: [{
      id: `item-${stamp}`,
      offerId: offer.id,
      catalogProductId: catalogProduct.id,
      productTitle: offer.title,
      unitPrice: offer.price,
      quantity: 2,
      subtotal: offer.price * 2,
      floristId: florist.id,
      floristName: florist.commercialName,
      productImage: offer.images[0] || catalogProduct.defaultImageUrl,
    }],
    totalAmount: offer.price * 2 + zone.deliveryFee,
    deliveryFee: zone.deliveryFee,
    deliveryMethod: 'delivery',
    deliveryAddress: buyer.addresses[0],
    deliveryCommunityId: COMMUNITY,
    deliveryCommunityName: 'Tlaxcala Centro',
    cardMessage: 'Prueba automática',
    status: 'pending_contact',
    whatsappMessageSent: false,
  });
  check('Pedido creado con folio LUN-XXXX', /^LUN-\d{4}$/.test(order.id), order.id);
  check('Pedido trae historial inicial', order.statusHistory?.length === 1);

  const waUrl = generateWhatsAppOrderUrl(order);
  check('Mensaje de WhatsApp incluye el folio (no #undefined)',
    decodeURIComponent(waUrl).includes(`#${order.id}`) && !waUrl.includes('undefined'));

  const persisted = await repo.getOrderById(order.id);
  check('Pedido persistido en la base', persisted?.id === order.id && persisted.items.length === 1);
  const buyerOrders = await repo.getOrders({ buyerId: buyer.id });
  check('Aparece en "Mis pedidos" del comprador', buyerOrders.some((o) => o.id === order.id));
  const floristOrders = await repo.getOrders({ floristId: florist.id });
  check('Aparece en pedidos de la florería', floristOrders.some((o) => o.id === order.id));

  const offerAfter = (await repo.getProductOfferById(offer.id))!;
  check('Stock descontado en 2', offerAfter.stock === offer.stock - 2, { antes: offer.stock, despues: offerAfter.stock });
  check('Ventas incrementadas en 2', offerAfter.salesCount === offer.salesCount + 2);

  const updated = await repo.updateOrderStatus(order.id, 'confirmed_by_vendor', florist.orderAgentName, 'Confirmado');
  const reread = (await repo.getOrderById(order.id))!;
  check('Cambio de estado persistido', reread.status === 'confirmed_by_vendor' && updated.status === 'confirmed_by_vendor');
  check('Historial con 2 entradas', reread.statusHistory.length === 2);
  await repo.markWhatsAppContacted(order.id);
  check('Marcado como contactado por WhatsApp', (await repo.getOrderById(order.id))!.whatsappMessageSent === true);

  // ---------------------------------------------------------------------------
  section('3. Alta pública de florería → aprobación (bugs: aprobar y visibilidad)');
  const newFloristId = `flor-test-${stamp}`;
  const newUserId = `user-test-${stamp}`;
  // Mismo payload que envía SellWithUsPage
  const app = await repo.submitFloristApplication({
    floristId: newFloristId,
    applicantId: newUserId,
    registrationMethod: 'public_application',
    commercialName: 'Florería de Prueba',
    orderAgentName: 'Ana Prueba',
    email: 'prueba@example.com',
    phone: '2461112233',
    whatsapp: '522461112233',
    instagram: '@prueba',
    communityId: COMMUNITY,
    communityName: 'Tlaxcala Centro',
    address: 'Calle Falsa 123',
    description: 'Florería creada por la prueba automática',
    openingHours: 'Lun-Sab 9-19',
    allowsDelivery: true,
    allowsPickup: true,
    deliveryCoverage: [COMMUNITY],
    prepTimeEstimated: '3 horas',
  });
  check('Solicitud creada con nombre correcto', app.businessName === 'Florería de Prueba' && app.applicantName === 'Ana Prueba');
  let nf = (await repo.getFloristById(newFloristId))!;
  check('Florería creada en pending_review', nf?.status === 'pending_review');
  check('Comunidad válida (no "comm-tlaxcala")', nf.communityId === COMMUNITY);
  check('Zonas de entrega generadas desde la cobertura', nf.deliveryZones.length === 1 && nf.deliveryZones[0].communityId === COMMUNITY);

  // Pedir información → el vendedor corrige → vuelve a pendiente
  await repo.updateFloristStatus(newFloristId, 'info_required', {
    adminNotes: 'Falta foto del local', actorId: 'user-admin-leilani', actorName: 'Leilani TM',
  });
  nf = (await repo.getFloristById(newFloristId))!;
  check('Admin pide información (info_required)', nf.status === 'info_required' && nf.infoRequiredNotes === 'Falta foto del local');
  await repo.updateFloristApplicationData(app.id, { description: 'Descripción corregida' }, newUserId, 'Ana Prueba');
  nf = (await repo.getFloristById(newFloristId))!;
  const appAfterFix = (await repo.getFloristApplicationById(app.id))!;
  check('Corrección regresa a pending_review', nf.status === 'pending_review' && appAfterFix.status === 'pending_review');
  check('Notas de información requerida se limpian', !nf.infoRequiredNotes && !appAfterFix.infoRequiredNotes);

  // Aprobar exactamente como lo hace AdminFloristsPage (id de FLORERÍA + objeto de opciones)
  let approveError: unknown = null;
  try {
    await repo.updateFloristStatus(newFloristId, 'approved', {
      adminNotes: 'Todo en orden', actorId: 'user-admin-leilani', actorName: 'Leilani TM',
    });
  } catch (e) {
    approveError = (e as Error).message;
  }
  check('Aprobar florería no lanza error', approveError === null, approveError);
  nf = (await repo.getFloristById(newFloristId))!;
  check('Florería aprobada con fecha', nf.status === 'approved' && !!nf.approvedAt);
  check('Solicitud sincronizada a approved', (await repo.getFloristApplicationById(app.id))!.status === 'approved');
  const logs = await repo.getApplicationAuditLogs(app.id);
  check('Bitácora: submit → request_info → update_info → approve',
    ['submit_application', 'request_info', 'update_info', 'approve'].every((a) => logs.some((l) => l.action === a)),
    logs.map((l) => l.action));

  // La florería aprobada ya ofrece productos en su comunidad
  await repo.saveProductOffer({
    id: `offer-test-${stamp}`,
    catalogProductId: catalogProduct.id,
    floristId: newFloristId,
    title: 'Ramo de prueba',
    description: 'Oferta creada por la prueba',
    price: 499,
    stock: 5,
    images: [],
    preparationTime: '2 horas',
    sameDayDelivery: true,
    isPublished: true,
    salesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const visible = await repo.getProductOffers({ communityId: COMMUNITY });
  check('Florería nueva visible para compradores de su comunidad', visible.some((o) => o.floristId === newFloristId));

  // ---------------------------------------------------------------------------
  section('4. Invitaciones');
  const inv = await repo.createFloristInvitation({
    businessName: 'Invitada Test', email: 'invitada@example.com',
    createdById: 'user-admin-leilani', createdByName: 'Leilani TM',
  });
  const byToken = await repo.getFloristInvitationByToken(inv.token);
  check('Invitación creada y encontrada por token (pending)', byToken?.id === inv.id && byToken.status === 'pending');
  await repo.markInvitationUsed(inv.token);
  check('Invitación marcada como usada', (await repo.getFloristInvitationByToken(inv.token))?.status === 'used');
  const inv2 = await repo.createFloristInvitation({ businessName: 'Revocada Test', email: 'rev@example.com' });
  await repo.revokeFloristInvitation(inv2.id, 'user-admin-leilani', 'Leilani TM');
  check('Invitación revocada', (await repo.getFloristInvitationByToken(inv2.token))?.status === 'revoked');
  check('Token inexistente devuelve null', (await repo.getFloristInvitationByToken('no-existe')) === null);

  // ---------------------------------------------------------------------------
  section('5. Panel de florería: productos e inventario');
  const testOfferId = `offer-test-${stamp}`;
  await repo.updateOfferStock(testOfferId, 12);
  check('Actualizar stock', (await repo.getProductOfferById(testOfferId))?.stock === 12);
  await repo.updateOfferStock(testOfferId, -3);
  check('Stock negativo se limita a 0', (await repo.getProductOfferById(testOfferId))?.stock === 0);
  await repo.toggleOfferPublish(testOfferId, false);
  check('Despublicar oferta', (await repo.getProductOfferById(testOfferId))?.isPublished === false);
  await repo.deleteProductOffer(testOfferId);
  check('Eliminar oferta', (await repo.getProductOfferById(testOfferId)) === null);

  const zones = [...nf.deliveryZones, {
    id: `dz-${newFloristId}-extra`, floristId: newFloristId, communityId: communities[1].id,
    deliveryFee: 80, estimatedDeliveryTime: '4 horas', isActive: true,
  }];
  await repo.updateDeliveryZones(newFloristId, zones);
  check('Actualizar zonas de entrega', (await repo.getFloristById(newFloristId))?.deliveryZones.length === 2);

  // ---------------------------------------------------------------------------
  section('6. Panel de admin: comunidades, categorías y perfiles');
  const comm = communities[0];
  await repo.toggleCommunityStatus(comm.id, !comm.isActive);
  check('Activar/desactivar comunidad', (await repo.getCommunities()).find((c) => c.id === comm.id)?.isActive === !comm.isActive);
  await repo.saveCategory({ ...categories[0], name: 'Categoría editada' });
  check('Editar categoría', (await repo.getCategories()).find((c) => c.id === categories[0].id)?.name === 'Categoría editada');
  await repo.saveProfile({ ...buyer, phone: '246 000 0000' });
  check('Editar perfil', (await repo.getProfileById(buyer.id))?.phone === '246 000 0000');

  // ---------------------------------------------------------------------------
  section('Limpieza');
  await repo.resetToInitialSeed();
  check('Datos de ejemplo restablecidos', (await repo.getOrders()).length === 7);

  console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pruebas OK, ${failed} fallidas\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\n💥 Error inesperado:', err);
  process.exit(1);
});
