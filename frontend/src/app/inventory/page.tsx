"use client";
import React, { useEffect, useState } from "react";
import { getProducts, deleteProduct } from "../../services/api";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { ProductModal } from "../../components/inventory/ProductModal";
import { Plus, Package, Search, Trash2, Edit, ChevronDown, ChevronUp } from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { formatPrice } = useCurrencyStore();

  const loadData = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro? El producto se desactivará.")) {
      await deleteProduct(id);
      loadData();
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold italic">Inventario</h1>
          <p className="text-slate-500 text-sm">Gestión de stock y precios dinámicos en tiempo real.</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" placeholder="Buscar por nombre de equipo o jugador..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-5">Producto / Categoría</th>
              <th className="px-6 py-5 text-center">Stock Total</th>
              <th className="px-6 py-5">Precio Venta</th>
              <th className="px-6 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.map((product: any) => (
              <React.Fragment key={product.id}>
                <tr className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 uppercase text-sm">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-black text-sm ${
                      (product.variations?.reduce((acc: any, v: any) => acc + v.stock, 0) || 0) < 5 
                      ? 'text-red-500' : 'text-slate-600'
                    }`}>
                      {product.variations?.reduce((acc: any, v: any) => acc + v.stock, 0) || 0} und.
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-emerald-600 font-black text-lg leading-none">{formatPrice(product.price_usd)}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Ref: ${product.price_usd}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        {expandedId === product.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                      </button>
                      <button onClick={() => handleEdit(product)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><Edit size={18}/></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>

                {/* DETALLE EXPANDIDO */}
                {expandedId === product.id && (
                  <tr className="bg-slate-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <td colSpan={4} className="px-12 py-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {product.variations?.map((v: any) => (
                          <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-1">{v.version}</span>
                              <span className="text-base font-bold text-slate-700">Talla {v.size}</span>
                            </div>
                            <div className={`text-xl font-black ${v.stock < 3 ? 'text-red-500' : 'text-blue-600'}`}>
                              {v.stock}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-medium">
            No se encontraron productos en el inventario.
          </div>
        )}
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={loadData} 
        editingProduct={editingProduct} 
      />
    </div>
  );
}