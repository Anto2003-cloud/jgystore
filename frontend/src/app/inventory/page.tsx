"use client";
import React, { useEffect, useState } from "react";
import { getProducts, deleteProduct } from "../../services/api";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { CurrencySwitcher } from "../../components/layout/CurrencySwitcher";
import { Plus, Package, Search, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { ProductModal } from "../../components/inventory/ProductModal";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const { formatPrice } = useCurrencyStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [productToEdit, setProductToEdit] = useState<any>(null);

  const refreshData = () => {
    getProducts().then(setProducts).catch(console.error);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((p: any) => p.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleEdit = (product: any) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleOpenNewProduct = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setProductToEdit(null), 200);
  };

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500">Gestión de stock y precios dinámicos</p>
        </div>
        <div className="flex gap-4">
          <CurrencySwitcher />
          <button 
            onClick={handleOpenNewProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar producto..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Producto</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Categoría</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Stock Total</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Precio Venta</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((product: any) => (
              <React.Fragment key={product.id}>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Package size={20} />
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{product.category}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-700">
                      {product.variations?.reduce((acc: number, v: any) => acc + v.stock, 0) || 0} und.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-emerald-600 font-bold text-lg">
                    {formatPrice(product.price_usd)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 items-center">
                      <button 
                        onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                      >
                        {expandedId === product.id ? <><ChevronUp size={16}/> Cerrar</> : <><ChevronDown size={16}/> Detalles</>}
                      </button>
                      <button onClick={() => handleEdit(product)} className="text-amber-500 hover:text-amber-700 transition-colors">
                        <Edit size={18}/>
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === product.id && (
                  <tr className="bg-blue-50/30">
                    <td colSpan={5} className="px-12 py-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {product.variations?.map((v: any) => (
                          <div key={v.id} className="bg-white p-3 rounded-xl border border-blue-100 flex justify-between items-center shadow-sm">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{v.version}</span>
                              <span className="text-sm font-bold text-blue-900">Talla {v.size}</span>
                            </div>
                            <div className={`text-xl font-black ${v.stock <= (v.min_stock_alert || 0) ? 'text-red-500' : 'text-slate-700'}`}>
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
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onRefresh={refreshData} 
        editingProduct={productToEdit} 
      />
    </div>
  );
}