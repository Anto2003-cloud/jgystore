"use client";
import React, { useEffect, useState } from "react";
import { getTransactions, createTransaction, deleteFinance, updateFinance } from "../../services/api";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { Plus, ArrowUpCircle, ArrowDownCircle, DollarSign, Receipt, PieChart, Trash2, Edit } from "lucide-react";

export default function FinancePage() {
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { formatPrice } = useCurrencyStore();
  const [form, setForm] = useState({ type: "GASTO", category: "Flete", amount_usd: 0, description: "" });

  const loadData = () => getTransactions().then(setTransactions).catch(console.error);
  useEffect(() => { loadData(); }, []);

  const handleNumericInput = (val: string) => {
    setForm({ ...form, amount_usd: val === "" ? 0 : Number(val) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFinance(editingId, form);
        alert("Registro actualizado");
      } else {
        await createTransaction(form);
        alert("Registro guardado");
      }
      setForm({ type: "GASTO", category: "Flete", amount_usd: 0, description: "" });
      setEditingId(null);
      loadData();
    } catch (error) { alert("Error al procesar"); }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Borrar este movimiento?")) {
      await deleteFinance(id);
      loadData();
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <h1 className="text-3xl font-bold mb-8 italic">Gestión de Caja</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            {editingId ? <Edit className="text-amber-500" /> : <Plus className="text-blue-600" />}
            {editingId ? "Editar Registro" : "Nuevo Registro"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({...form, type: 'INVERSION'})} className={`p-2 rounded-lg text-xs font-bold ${form.type === 'INVERSION' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>INVERSIÓN</button>
                <button type="button" onClick={() => setForm({...form, type: 'GASTO'})} className={`p-2 rounded-lg text-xs font-bold ${form.type === 'GASTO' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>GASTO</button>
            </div>
            <select className="w-full p-3 bg-slate-50 border rounded-xl" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="Flete">Flete</option>
                <option value="Publicidad">Publicidad</option>
                <option value="Inversión">Inversión</option>
                <option value="Otros">Otros</option>
            </select>
            <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Monto $" value={form.amount_usd === 0 ? "" : form.amount_usd} onChange={e => handleNumericInput(e.target.value)} />
            <textarea className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100">{editingId ? "Guardar Cambios" : "Registrar en Caja"}</button>
            {editingId && <button type="button" onClick={() => {setEditingId(null); setForm({type: "GASTO", category: "Flete", amount_usd: 0, description: ""})}} className="w-full text-slate-400 text-xs">Cancelar Edición</button>}
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase">
              <tr><th className="p-4">Fecha</th><th className="p-4">Concepto</th><th className="p-4 text-right">Monto</th><th className="p-4 text-right">Acciones</th></tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-slate-700">{tx.description}</td>
                  <td className={`p-4 text-right font-black ${tx.type === 'INVERSION' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'GASTO' ? '-' : '+'} {formatPrice(tx.amount_usd)}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => {setEditingId(tx.id); setForm({type: tx.type, category: tx.category, amount_usd: tx.amount_usd, description: tx.description})}} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={16}/></button>
                    <button onClick={() => handleDelete(tx.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}