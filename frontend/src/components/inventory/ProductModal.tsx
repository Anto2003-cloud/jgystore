"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Calculator } from "lucide-react";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { createProduct, updateProduct } from "../../services/api";

export const ProductModal = ({ isOpen, onClose, onRefresh, editingProduct }: any) => {
  const { formatPrice } = useCurrencyStore();
  
  // Estado inicial limpio
  const initialState = {
    name: "",
    category: "Futbol",
    description: "",
    base_cost_usd: 0,
    freight_cost_usd: 0,
    target_margin: 0.35,
  };

  const [baseData, setBaseData] = useState(initialState);
  const [variations, setVariations] = useState([
    { size: "S", version: "FAN", stock: 0, min_stock_alert: 2 }
  ]);

  // 🔥 ESTA ES LA CLAVE: Detecta cambios y resetea o carga datos
  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        // Cargar datos existentes para editar
        setBaseData({
          name: editingProduct.name,
          category: editingProduct.category || "Futbol",
          description: editingProduct.description || "",
          base_cost_usd: editingProduct.base_cost_usd,
          freight_cost_usd: editingProduct.freight_cost_usd,
          target_margin: editingProduct.target_margin || 0.35,
        });
        setVariations(editingProduct.variations || []);
      } else {
        // Limpiar todo para producto nuevo
        setBaseData(initialState);
        setVariations([{ size: "S", version: "FAN", stock: 0, min_stock_alert: 2 }]);
      }
    }
  }, [isOpen, editingProduct]);

  if (!isOpen) return null;

  const totalCost = Number(baseData.base_cost_usd) + Number(baseData.freight_cost_usd);
  const predictedPriceUsd = totalCost / (1 - baseData.target_margin);

  const addVariation = () => {
    setVariations([...variations, { size: "M", version: "FAN", stock: 0, min_stock_alert: 2 }]);
  };

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...baseData, variations, price_usd: predictedPriceUsd };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      
      onRefresh();
      onClose();
    } catch (error) {
      alert("Error al procesar el producto.");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header Dinámico */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800">
            {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <Calculator size={18} /> Costos y Margen
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Modelo</label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={baseData.name} 
                  onChange={e => setBaseData({...baseData, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Prenda ($)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={baseData.base_cost_usd} 
                    onChange={e => setBaseData({...baseData, base_cost_usd: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Flete ($)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={baseData.freight_cost_usd} 
                    onChange={e => setBaseData({...baseData, freight_cost_usd: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <p className="text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">Previsualización de Venta</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-black text-emerald-700">{formatPrice(predictedPriceUsd)}</p>
                    <p className="text-xs text-emerald-600">Basado en margen del {baseData.target_margin * 100}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-500">Utilidad Bruta:</p>
                    <p className="text-lg font-bold text-slate-700">${(predictedPriceUsd - totalCost).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-600">Variaciones de Talla</h3>
                <button type="button" onClick={addVariation} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-700">
                  <Plus size={14} /> Añadir Talla
                </button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {variations.map((v: any, index: number) => (
                  <div key={index} className="flex gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Talla</label>
                      <select 
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                        value={v.size} 
                        onChange={e => {
                          const newVars = [...variations];
                          newVars[index].size = e.target.value;
                          setVariations(newVars);
                        }}>
                        {["S", "M", "L", "XL", "XXL"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Versión</label>
                      <select 
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                        value={v.version}
                        onChange={e => {
                          const newVars = [...variations];
                          newVars[index].version = e.target.value;
                          setVariations(newVars);
                        }}>
                        <option value="FAN">Fan</option>
                        <option value="PLAYER">Player</option>
                        <option value="RETRO">Retro</option>
                      </select>
                    </div>
                    <div className="w-16">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Stock</label>
                      <input 
                        type="number" 
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                        value={v.stock}
                        onChange={e => {
                          const newVars = [...variations];
                          newVars[index].stock = Number(e.target.value);
                          setVariations(newVars);
                        }} 
                      />
                    </div>
                    <button type="button" onClick={() => removeVariation(index)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
              Cancelar
            </button>
            <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
              {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};