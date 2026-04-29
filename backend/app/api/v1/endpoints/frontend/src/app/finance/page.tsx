"use client";
import React, { useEffect, useState } from "react";
// Rutas relativas corregidas para tu estructura
import { getTransactions, createTransaction } from "../../services/api";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  DollarSign, 
  Receipt, 
  PieChart 
} from "lucide-react";

export default function FinancePage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrencyStore();

  // Estado para el formulario de registro
  const [form, setForm] = useState({
    type: "GASTO",
    category: "Flete",
    amount_usd: 0,
    description: ""
  });

  const loadData = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount_usd <= 0) return alert("El monto debe ser mayor a 0");

    try {
      await createTransaction(form);
      // Limpiamos el formulario tras guardar con éxito
      setForm({ type: "GASTO", category: "Flete", amount_usd: 0, description: "" });
      loadData();
      alert("Registro financiero guardado correctamente.");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar el registro.");
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 italic">Gestión de Caja</h1>
        <p className="text-slate-500">Control de inversiones, fletes y gastos operativos de Jgystore.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL IZQUIERDO: FORMULARIO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Receipt size={20} className="text-blue-600" /> Nuevo Registro
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Selector de Tipo (Entrada/Salida) */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Flujo</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "INVERSION" })}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    form.type === "INVERSION" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-transparent"
                  } border`}
                >
                  INVERSIÓN (+)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "GASTO" })}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    form.type === "GASTO" ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-50 text-slate-400 border-transparent"
                  } border`}
                >
                  GASTO / FLETE (-)
                </button>
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
              <select 
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="Flete">Flete (Envío Internacional)</option>
                <option value="Publicidad">Publicidad (Instagram/Ads)</option>
                <option value="Inversión">Inversión de Socios</option>
                <option value="Local">Local / Servicios</option>
                <option value="Empaques">Empaques y Etiquetas</option>
                <option value="Otros">Otros Gastos</option>
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monto ($ USD)</label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" step="0.01" required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.amount_usd}
                  onChange={e => setForm({ ...form, amount_usd: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción</label>
              <textarea 
                required
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24"
                placeholder="Ej: Pago de flete lote Real Madrid..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <Plus size={20} /> Guardar Movimiento
            </button>
          </form>
        </div>

        {/* PANEL DERECHO: TABLA DE HISTORIAL */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <PieChart size={20} className="text-blue-600" /> Historial Reciente
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-slate-400">
                <tr>
                  <th className="p-4 text-[10px] font-bold uppercase">Fecha</th>
                  <th className="p-4 text-[10px] font-bold uppercase">Concepto</th>
                  <th className="p-4 text-[10px] font-bold uppercase">Categoría</th>
                  <th className="p-4 text-[10px] font-bold uppercase text-right">Monto ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-400">Cargando...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-400">No hay movimientos.</td></tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {tx.type === "INVERSION" ? (
                            <ArrowUpCircle size={18} className="text-emerald-500" />
                          ) : (
                            <ArrowDownCircle size={18} className="text-red-500" />
                          )}
                          <span className="font-semibold text-slate-700">{tx.description}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase">
                          {tx.category}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-bold ${tx.type === "INVERSION" ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === "GASTO" ? "-" : "+"} {formatPrice(tx.amount_usd)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}