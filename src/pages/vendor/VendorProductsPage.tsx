import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../services/repository';
import { ProductOffer, CatalogProduct, Florist } from '../../types';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const VendorProductsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const floristId = currentUser.floristId || 'flor-1';
  const navigate = useNavigate();

  const [florist, setFlorist] = useState<Florist | null>(null);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      setLoading(true);
      try {
        const [fl, myOffers, cpList] = await Promise.all([
          repository.getFloristById(floristId),
          repository.getProductOffers({ floristId }),
          repository.getCatalogProducts(),
        ]);
        setFlorist(fl);
        setOffers(myOffers);
        setCatalog(cpList);
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, [floristId]);

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    await repository.toggleOfferPublish(id, !currentStatus);
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isPublished: !currentStatus } : o))
    );
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Deseas eliminar esta oferta de tu catálogo?')) {
      await repository.deleteProductOffer(id);
      setOffers((prev) => prev.filter((o) => o.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAE3D9] gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5A735E] mb-1">
            Catálogo Comercial
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Mis Productos ({offers.length})
          </h1>
          <p className="text-xs text-[#7A736E] mt-1">
            Gestiona precios, descripciones, stock y visibilidad de tus ramos en Lunaria.
          </p>
        </div>

        <Link
          to="/vendedor/producto/nuevo"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear nuevo producto</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#8A8179]">Cargando tus productos...</div>
      ) : florist && florist.status !== 'approved' ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-amber-200 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Publicación Restringida
            </span>
            <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">
              Tu florería aún no está aprobada
            </h2>
            <p className="text-xs text-[#665E58] leading-relaxed">
              El estado actual de tu registro es{' '}
              <strong className="text-amber-900">
                {florist.status === 'pending_review'
                  ? 'Pendiente de revisión'
                  : florist.status === 'info_required'
                  ? 'Información requerida'
                  : florist.status === 'rejected'
                  ? 'Rechazado'
                  : florist.status === 'suspended'
                  ? 'Suspendido'
                  : florist.status}
              </strong>
              . Solo las florerías aprobadas y activas pueden publicar arreglos en Lunaria.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/vendedor"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B25E5C] text-white text-xs font-semibold rounded-xl hover:bg-[#9E4D48] transition-colors"
            >
              <span>Consultar estado en el panel principal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE3D9] max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#EEF3EE] text-[#5A735E] flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">Sin productos publicados</h2>
          <p className="text-xs text-[#7A736E]">
            Comienza publicando tu primera oferta de flores para que los compradores en Tlaxcala puedan ordenar.
          </p>
          <Link
            to="/vendedor/producto/nuevo"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#2C2825] text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear producto</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#EAE3D9] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3D9] bg-[#FAF8F5] text-[#8A8179]">
                  <th className="py-3 px-4 font-semibold">Producto</th>
                  <th className="py-3 px-4 font-semibold">Precio ($MXN)</th>
                  <th className="py-3 px-4 font-semibold">Stock</th>
                  <th className="py-3 px-4 font-semibold">Preparación</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {offers.map((offer) => {
                  const cp = catalog.find((c) => c.id === offer.catalogProductId);
                  const img = offer.images[0] || cp?.defaultImageUrl || '';
                  return (
                    <tr key={offer.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={offer.title}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 object-cover rounded-lg bg-[#FAF8F5] border border-[#EAE3D9] shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-[#2C2825] line-clamp-1">{offer.title}</div>
                            <div className="text-[11px] text-[#8A8179] truncate">{cp?.name}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 tabular-nums font-semibold text-[#2C2825]">
                        ${offer.price.toLocaleString('es-MX')} MXN
                        {offer.comparePrice && (
                          <span className="block text-[10px] text-[#A8A199] line-through">
                            ${offer.comparePrice.toLocaleString('es-MX')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold tabular-nums ${
                            offer.stock === 0
                              ? 'text-rose-700'
                              : offer.stock < 5
                              ? 'text-amber-700'
                              : 'text-[#5A735E]'
                          }`}
                        >
                          {offer.stock} pzas
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#665E58]">{offer.preparationTime}</td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleTogglePublish(offer.id, offer.isPublished)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer ${
                            offer.isPublished
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {offer.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{offer.isPublished ? 'Publicado' : 'Borrador'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/vendedor/producto/${offer.id}/editar`}
                            className="p-1.5 text-[#5C534E] hover:text-[#2C2825] hover:bg-slate-100 rounded-lg"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(offer.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
