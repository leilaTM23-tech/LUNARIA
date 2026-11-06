import React, { useState, useEffect } from 'react';
import { repository } from '../../services/repository';
import { Category, CatalogProduct, ProductOffer, Florist } from '../../types';
import { Sparkles, Layers, Plus, Package, Store, Check } from 'lucide-react';

export const AdminCatalogPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [florists, setFlorists] = useState<Florist[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'catalog' | 'inventory'>('categories');
  const [loading, setLoading] = useState(true);

  // Modal para agregar categoría
  const [showAddCat, setShowAddCat] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cats, cp, offs, fls] = await Promise.all([
          repository.getCategories(),
          repository.getCatalogProducts(),
          repository.getProductOffers(),
          repository.getFlorists(),
        ]);
        setCategories(cats);
        setCatalogProducts(cp);
        setOffers(offs);
        setFlorists(fls);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: catName,
      slug: catName.toLowerCase().replace(/\s+/g, '-'),
      description: catDesc,
      order: categories.length + 1,
    };

    await repository.saveCategory(newCat);
    setCategories([...categories, newCat]);
    setShowAddCat(false);
    setCatName('');
    setCatDesc('');
    setNotice(`Categoría "${newCat.name}" agregada con éxito.`);
    setTimeout(() => setNotice(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8C3D38] mb-1">
            Estructura Floral
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Gestión de Catálogo y Categorías
          </h1>
          <p className="text-xs text-[#7A736E] mt-1">
            Supervisa las 9 categorías oficiales, tipos maestros de ramos y el inventario de todas las florerías.
          </p>
        </div>

        {notice && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE3D9] pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-[#8C3D38] text-white shadow-xs'
              : 'text-[#665E58] hover:bg-[#FAF8F5]'
          }`}
        >
          Categorías Oficiales ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-[#8C3D38] text-white shadow-xs'
              : 'text-[#665E58] hover:bg-[#FAF8F5]'
          }`}
        >
          Diseños Maestros ({catalogProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-[#8C3D38] text-white shadow-xs'
              : 'text-[#665E58] hover:bg-[#FAF8F5]'
          }`}
        >
          Inventario Global por Florería ({offers.length} ofertas)
        </button>
      </div>

      {/* Tab 1: Categorías */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-lg font-semibold text-[#2C2825]">
              Categorías Maestras del Marketplace
            </h3>
            <button
              onClick={() => setShowAddCat(!showAddCat)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#FAF0ED] text-[#8C3D38] rounded-xl text-xs font-semibold hover:bg-[#8C3D38] hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir categoría</span>
            </button>
          </div>

          {showAddCat && (
            <form onSubmit={handleAddCategory} className="bg-white p-5 rounded-2xl border border-[#EAE3D9] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Nombre de la categoría *</label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="ej. Arreglos para Graduación"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Descripción</label>
                  <input
                    type="text"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="ej. Ramos con togas y flores alegres"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-3 py-1.5 text-xs text-[#7A736E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8C3D38] text-white text-xs font-semibold rounded-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const count = catalogProducts.filter((p) => p.categoryId === cat.id).length;
              return (
                <div key={cat.id} className="bg-white p-5 rounded-2xl border border-[#EAE3D9] shadow-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-sm text-[#2C2825]">{cat.name}</span>
                    <span className="text-[11px] text-[#5A735E] font-medium bg-[#EEF3EE] px-2 py-0.5 rounded">
                      {count} diseños
                    </span>
                  </div>
                  <p className="text-xs text-[#7A736E] leading-relaxed">{cat.description}</p>
                  <div className="text-[10px] text-[#A8A199] pt-1">Slug: {cat.slug}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Diseños Maestros */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalogProducts.map((cp) => {
              const cat = categories.find((c) => c.id === cp.categoryId);
              const floristOffers = offers.filter((o) => o.catalogProductId === cp.id);
              return (
                <div key={cp.id} className="bg-white p-5 rounded-2xl border border-[#EAE3D9] shadow-xs flex gap-4">
                  <img
                    src={cp.defaultImageUrl}
                    alt={cp.name}
                    className="w-20 h-20 rounded-xl object-cover bg-[#FAF8F5] border border-[#EAE3D9] shrink-0"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="text-[11px] font-semibold text-[#B25E5C]">{cat?.name}</div>
                    <h4 className="font-semibold text-sm text-[#2C2825]">{cp.name}</h4>
                    <p className="text-xs text-[#7A736E] line-clamp-2">{cp.description}</p>
                    <div className="pt-2 text-[11px] text-[#5A735E] font-medium">
                      Ofrecido por {floristOffers.length} {floristOffers.length === 1 ? 'florería' : 'florerías'} en Tlaxcala
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Inventario Global por Florería */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-[#EAE3D9] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3D9] bg-[#FAF8F5] text-[#8A8179]">
                  <th className="py-3 px-4 font-semibold">Florería de Tlaxcala</th>
                  <th className="py-3 px-4 font-semibold">Producto Ofrecido</th>
                  <th className="py-3 px-4 font-semibold">Precio al Público</th>
                  <th className="py-3 px-4 font-semibold">Stock</th>
                  <th className="py-3 px-4 font-semibold">Tiempo Estimado</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {offers.map((offer) => {
                  const fl = florists.find((f) => f.id === offer.floristId);
                  return (
                    <tr key={offer.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4 font-semibold text-[#2C2825]">
                        {fl?.commercialName || offer.floristId}
                      </td>
                      <td className="py-3 px-4 text-[#4A443F] font-medium">{offer.title}</td>
                      <td className="py-3 px-4 tabular-nums font-semibold text-[#2C2825]">
                        ${offer.price.toLocaleString('es-MX')} MXN
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        <span
                          className={`font-semibold ${
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
                      <td className="py-3 px-4 text-[#7A736E]">{offer.preparationTime}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            offer.isPublished
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {offer.isPublished ? 'Publicado' : 'Borrador'}
                        </span>
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
