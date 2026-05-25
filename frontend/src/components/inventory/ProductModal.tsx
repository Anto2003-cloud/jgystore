"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Calculator } from "lucide-react";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { createProduct, updateProduct } from "../../services/api";

export const ProductModal = ({ isOpen, onClose, onRefresh, editingProduct }: any) => {
  const { formatPrice } = useCurrencyStore();
  
  const initialState = {
    name: "",
    category: "Futbol",
    description: "",
    base_cost_usd: "0", // Ahora lo manejamos como string para los decimales
    freight_cost_usd: "0",
    target_margin: 0.35,
  };

  const [baseData, setBaseData] = useState(initialState);
  const [variations, setVariations] = useState([
    { size: "S", version: "FAN", stock: "0", min_stock_alert: 2 }
  ]);

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setBaseData({
          name: editingProduct.name,
          category: editingProduct.category || "Futbol",
          description: editingProduct.description || "",
          base_cost_usd: String(editingProduct.base_cost_usd),
          freight_cost_usd: String(editingProduct.freight_cost_usd),
          target_margin: editingProduct.target_margin || 0.35,
        });
        setVariations(editingProduct.variations.map((v: any) => ({...v, stock: String(v.stock)})) || []);
      } else {
        setBaseData(initialState);
        setVariations([{ size: "S", version: "FAN", stock: "0", min_stock_alert: 2 }]);
      }
    }
  }, [isOpen, editingProduct]);

  if (!isOpen) return null;

  // LÓGICA CORREGIDA PARA PERMITIR DECIMALES (PUNTO Y COMA)
  const handleNumericInput = (field: string, value: string, index?: number) => {
    // Reemplazamos coma por punto por si el usuario usa el teclado numérico con coma
    const cleanValue = value.replace(',', '.');

    // Permitir: vacío, solo números, o números con un solo punto decimal
    if (cleanValue !== "" && !/^\d*\.?\d*$/.test(cleanValue)) return;

    if (index !== undefined) {
      const newVars = [...variations];
      // @ts-ignore
      newVars[index][field] = cleanValue;
      setVariations(newVars);
    } else {
      setBaseData({ ...baseData, [field]: cleanValue });
    }
  };

  // Los cálculos siguen funcionando porque Number() entiende los strings
  const totalCost = Number(baseData.base_cost_usd) + Number(baseData.freight_cost_usd);
  const predictedPriceUsd = totalCost / (1 - baseData.target_margin);

  const addVariation = () => {
    setVariations([...variations, { size: "M", version: "FAN", stock: "0", min_stock_alert: 2 }]);
  };

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: baseData.name,
        category: baseData.category,
        description: baseData.description || "",
        base_cost_usd: Number(baseData.base_cost_usd),
        freight_cost_usd: Number(baseData.freight_cost_usd),
        target_margin: Number(baseData.target_margin),
        is_active: true,
        variations: variations.map(v => ({
          size: String(v.size),
          version: String(v.version).toUpperCase(), 
          stock: Number(v.stock),
          min_stock_alert: Number(v.min_stock_alert || 2)
        }))
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      
      onRefresh();
      onClose();
      alert("¡Producto guardado exitosamente!");
    } catch (error: any) {
      const serverMsg = error.response?.data?.detail || "Sin respuesta del servidor";
      const finalMsg = typeof serverMsg === 'object' ? JSON.stringify(serverMsg) : serverMsg;
      alert("EL SERVIDOR DIJO: " + finalMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 italic">
            {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <Calculator size={18} /> Finanzas del Producto
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Modelo</label>
                <input 
                  required type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={baseData.name} 
                  onChange={e => setBaseData({...baseData, name: e.target.value})} 
                  placeholder="Ej: Jersey Venezuela 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Costo Prenda ($)</label>
                  <input 
                    required type="text"
                    inputMode="decimal"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                    value={baseData.base_cost_usd === "0" ? "" : baseData.base_cost_usd} 
                    onChange={e => handleNumericInput("base_cost_usd", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Costo Flete ($)</label>
                  <input 
                    required type="text"
                    inputMode="decimal"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                    value={baseData.freight_cost_usd === "0" ? "" : baseData.freight_cost_usd} 
                    onChange={e => handleNumericInput("freight_cost_usd", e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Sección de Precio Sugerido */}
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                <p className="text-emerald-800 text-[10px] font-black uppercase tracking-[0.1em] mb-2">Precio de Venta Sugerido</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-3xl font-black text-emerald-700 leading-none">{formatPrice(predictedPriceUsd)}</p>
                    <p className="text-[10px] text-emerald-600 mt-1 font-bold">Margen del {(baseData.target_margin * 100).toFixed(0)}% Aplicado</p>
                  </div>
                  <div className="text-right border-l border-emerald-200 pl-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Utilidad</p>
                    <p className="text-xl font-bold text-slate-700">${(predictedPriceUsd - totalCost).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna de Variaciones */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-semibold text-blue-600">Stock por Tallas</h3>
                <button type="button" onClick={addVariation} className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-full font-bold uppercase hover:bg-blue-700 transition-all flex items-center gap-1">
                  <Plus size={12} /> Añadir Talla
                </button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {variations.map((v: any, index: number) => (
                  <div key={index} className="flex gap-2 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 group transition-all hover:border-blue-200">
                    <div className="flex-1">
                      <label className="text-[9px] uppercase font-black text-slate-400 mb-1 block">Talla</label>
                      <select 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" 
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
                      <label className="text-[9px] uppercase font-black text-slate-400 mb-1 block">Versión</label>
                      <select 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" 
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
                    <div className="w-20">
                      <label className="text-[9px] uppercase font-black text-slate-400 mb-1 block">Stock</label>
                      <input 
                        type="text"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-center text-blue-600 outline-none" 
                        value={v.stock === "0" ? "" : v.stock}
                        onChange={e => handleNumericInput("stock", e.target.value, index)}
                        placeholder="0"
                      />
                    </div>
                    <button type="button" onClick={() => removeVariation(index)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-wider hover:bg-slate-200 transition-all">
              Cancelar
            </button>
            <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
              {editingProduct ? 'Actualizar Cambios' : 'Finalizar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};