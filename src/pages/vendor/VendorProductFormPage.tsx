import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../services/repository';
import { ProductOffer, CatalogProduct, Florist } from '../../types';
import { getFloralSvg } from '../../data/flowerImages';
import { ArrowLeft, Save, Sparkles, Plus, X, Lock } from 'lucide-react';

export const VendorProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const floristId = currentUser.floristId || 'flor-1';

  const isEditing = Boolean(id);

  const [florist, setFlorist] = useState<Florist | null>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(650);
  const [comparePrice, setComparePrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState(10);
  const [preparationTime, setPreparationTime] = useState('1 a 2 horas');
  const [sameDayDelivery, setSameDayDelivery] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [options, setOptions] = useState<string[]>([
    'Tarjeta con dedicatoria manuscrita',
    'Listón satinado de cortesía',
  ]);
  const [newOption, setNewOption] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function initForm() {
      setLoading(true);
      try {
        const [fl, cpList] = await Promise.all([
          repository.getFloristById(floristId),
          repository.getCatalogProducts(),
        ]);
        setFlorist(fl);
        setCatalog(cpList);

        if (isEditing && id) {
          const existing = await repository.getProductOfferById(id);
          if (existing) {
            setSelectedCatalogId(existing.catalogProductId);
            setTitle(existing.title);
            setDescription(existing.description);
            setPrice(existing.price);
            setComparePrice(existing.comparePrice);
            setStock(existing.stock);
            setPreparationTime(existing.preparationTime);
            setSameDayDelivery(existing.sameDayDelivery);
            setIsPublished(existing.isPublished);
            if (existing.customizationOptions) {
              setOptions(existing.customizationOptions);
            }
          }
        } else {
          if (cpList.length > 0) {
            setSelectedCatalogId(cpList[0].id);
            setTitle(`${cpList[0].name} — Especial`);
            setDescription(cpList[0].description);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    initForm();
  }, [id, isEditing]);

  const handleCatalogSelectChange = (catId: string) => {
    setSelectedCatalogId(catId);
    const found = catalog.find((c) => c.id === catId);
    if (found && !isEditing) {
      setTitle(`${found.name}`);
      setDescription(found.description);
    }
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || price <= 0) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const offerId = isEditing && id ? id : `off-${Date.now()}`;

      // Determinar imagen ilustrativa según el catálogo
      const chosenCatalog = catalog.find((c) => c.id === selectedCatalogId);
      const defaultImg = chosenCatalog?.defaultImageUrl || getFloralSvg('roses');

      const offerToSave: ProductOffer = {
        id: offerId,
        catalogProductId: selectedCatalogId,
        floristId,
        title,
        description,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        stock: Number(stock),
        images: [defaultImg],
        preparationTime,
        sameDayDelivery,
        isPublished,
        salesCount: 0,
        customizationOptions: options,
        createdAt: isEditing ? now : now,
        updatedAt: now,
      };

      await repository.saveProductOffer(offerToSave);
      navigate('/vendedor/productos');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#8A8179]">Cargando formulario...</div>;
  }

  if (florist && florist.status !== 'approved') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">
          Creación de ofertas bloqueada
        </h2>
        <p className="text-xs text-[#665E58] leading-relaxed max-w-md mx-auto">
          No puedes dar de alta nuevos arreglos florales porque tu florería se encuentra en estado{' '}
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
          . Una vez que la administración apruebe tu solicitud podrás gestionar todo tu catálogo.
        </p>
        <div className="pt-2">
          <Link
            to="/vendedor"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B25E5C] text-white text-xs font-semibold rounded-xl hover:bg-[#9E4D48]"
          >
            <span>Volver a la pantalla de seguimiento</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9] flex items-center justify-between">
        <div>
          <Link
            to="/vendedor/productos"
            className="inline-flex items-center gap-1 text-xs text-[#8A8179] hover:text-[#2C2825] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a mis productos</span>
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-[#2C2825]">
            {isEditing ? 'Editar Producto / Oferta' : 'Crear Nueva Oferta Floral'}
          </h1>
          <p className="text-xs text-[#7A736E] mt-0.5">
            Define los detalles de tu arreglo, precio en pesos y tiempos de entrega.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProduct} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-xs space-y-6">
        {/* Catálogo Maestro Base */}
        <div>
          <label className="block text-xs font-semibold text-[#2C2825] mb-1">
            Tipo floral base del catálogo maestro *
          </label>
          <select
            value={selectedCatalogId}
            onChange={(e) => handleCatalogSelectChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
          >
            {catalog.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.name} (Recomendado: {cp.recommendedOccasion})
              </option>
            ))}
          </select>
          <span className="text-[11px] text-[#8A8179] block mt-1">
            Vincula tu producto al catálogo general de Tlaxcala para que los compradores puedan encontrarlo en búsquedas y filtros.
          </span>
        </div>

        {/* Título comercial de la oferta */}
        <div>
          <label className="block text-xs font-semibold text-[#2C2825] mb-1">
            Título comercial visible en tienda *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ej. Ramo de Rosas Blush con Eucalipto y Papel Coreano"
            className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-[#2C2825] mb-1">
            Descripción de tu arreglo floral
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalla cantidad de botones, follajes frescos, tipo de envoltura..."
            className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
          />
        </div>

        {/* Precios y Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#2C2825] mb-1">Precio ($MXN) *</label>
            <input
              type="number"
              required
              min={50}
              step={10}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2C2825] mb-1">Precio anterior / tachado ($MXN)</label>
            <input
              type="number"
              min={0}
              step={10}
              value={comparePrice || ''}
              onChange={(e) => setComparePrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Opcional"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2C2825] mb-1">Stock disponible *</label>
            <input
              type="number"
              required
              min={0}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            />
          </div>
        </div>

        {/* Tiempos de preparación y entrega el mismo día */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#2C2825] mb-1">Tiempo de preparación estimado</label>
            <select
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            >
              <option value="1 hora">1 hora (Express)</option>
              <option value="1 a 2 horas">1 a 2 horas (Estándar)</option>
              <option value="2 a 3 horas">2 a 3 horas</option>
              <option value="24 horas de anticipación">24 horas de anticipación (Bajo pedido)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-2 pb-2">
            <label className="flex items-center gap-2 text-xs text-[#2C2825] cursor-pointer">
              <input
                type="checkbox"
                checked={sameDayDelivery}
                onChange={(e) => setSameDayDelivery(e.target.checked)}
                className="rounded accent-[#5A735E]"
              />
              <span className="font-semibold">Disponible para entrega el mismo día</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#2C2825] cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded accent-[#5A735E]"
              />
              <span className="font-semibold">Publicar inmediatamente en el catálogo</span>
            </label>
          </div>
        </div>

        {/* Opciones de personalización */}
        <div className="pt-4 border-t border-[#F2ECE4] space-y-3">
          <label className="block text-xs font-semibold text-[#2C2825]">
            Opciones de personalización incluidas
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="ej. Tarjeta dedicatoria con sobre sellado, lazo color a elegir..."
              className="flex-1 px-3.5 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825]"
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="px-4 py-2 bg-[#FAF0ED] text-[#B25E5C] text-xs font-semibold rounded-xl hover:bg-[#B25E5C] hover:text-white transition-colors"
            >
              Agregar
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {options.map((opt, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] text-xs text-[#5C534E] rounded-lg border border-[#EAE3D9]"
              >
                <span>{opt}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOption(i)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="pt-4 border-t border-[#F2ECE4] flex items-center justify-end gap-3">
          <Link
            to="/vendedor/productos"
            className="px-4 py-2.5 text-xs text-[#7A736E] hover:text-[#2C2825]"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando oferta...' : 'Guardar y publicar'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
