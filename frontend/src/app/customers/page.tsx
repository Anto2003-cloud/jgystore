"use client";
import React, { useEffect, useState } from "react";
import { getCustomers, createCustomer, deleteCustomer, updateCustomer } from "../../services/api";
import { Users, UserPlus, Phone, Mail, Search, Trash2, Edit, Loader2 } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  const loadCustomers = async () => {
    setLoading(true);
    try { 
      const response = await getCustomers(); 
      // Si usaste el api.ts que devuelve .data, response ya son los datos
      const data = response.data || response;
      setCustomers(Array.isArray(data) ? data : []); 
    } catch (e) {
      console.error("Error al cargar clientes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // PREPARAMOS EL ENVÍO: Enviamos los datos tal cual los escribes
      const payload = {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null
      };

      if (editingId) {
        await updateCustomer(editingId, payload);
        alert("✅ Cliente actualizado");
      } else {
        await createCustomer(payload);
        alert("✅ Cliente registrado");
      }
      setForm({ full_name: "", phone: "", email: "" });
      setEditingId(null);
      loadCustomers();
    } catch (error: any) {
        // ERROR DETALLADO: El sistema te dirá exactamente qué falló (ej: Correo duplicado)
        const detail = error.response?.data?.detail;
        const errorMsg = typeof detail === 'string' ? detail : "El correo ya existe o la base de datos no está actualizada.";
        alert("❌ FALLO: " + errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Borrar este cliente?")) {
      try {
        await deleteCustomer(id);
        loadCustomers();
      } catch (e) { alert("No se pudo eliminar"); }
    }
  };

  const filtered = customers.filter((c: any) => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <h1 className="text-3xl font-bold italic mb-8 uppercase tracking-tighter text-slate-950">Base de Clientes</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* FORMULARIO DE REGISTRO */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-600">
            {editingId ? <Edit size={20} /> : <UserPlus size={20} />}
            {editingId ? "Editar Datos" : "Nuevo Registro"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre Completo</label>
              <input 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Nombre" 
                value={form.full_name} 
                onChange={e => setForm({...form, full_name: e.target.value})} // CORREGIDO: Sin mayúsculas forzadas
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Teléfono</label>
              <input 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Teléfono" 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email (Opcional)</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Email" 
                type="email" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} // CORREGIDO: Sin minúsculas forzadas
              />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
              {editingId ? "Actualizar Cambios" : "Guardar en Base de Datos"}
            </button>
            {editingId && <button type="button" onClick={() => {setEditingId(null); setForm({full_name:"", phone:"", email:""})}} className="w-full text-slate-400 text-xs mt-2 underline">Cancelar Edición</button>}
          </form>
        </div>

        {/* LISTADO DE CLIENTES */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
             <input type="text" placeholder="Buscar por nombre o teléfono..." className="w-full p-4 pl-12 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr><th className="p-6">Nombre del Cliente</th><th className="p-6">Contacto</th><th className="p-6 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={3} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-slate-400 italic">No hay registros que coincidan.</td></tr>
                ) : (
                  filtered.map((customer: any) => (
                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <span className="font-bold text-slate-800 text-sm">{customer.full_name}</span>
                      </td>
                      <td className="p-6 text-sm text-slate-500">
                        <div className="flex flex-col">
                          <span>{customer.phone}</span>
                          <span className="text-xs text-slate-300">{customer.email || 'Sin correo registrado'}</span>
                        </div>
                      </td>
                      <td className="p-6 text-right flex justify-end gap-2">
                        <button onClick={() => {setEditingId(customer.id); setForm({full_name: customer.full_name, phone: customer.phone, email: customer.email || ""})}} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Editar"><Edit size={18}/></button>
                        <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Borrar"><Trash2 size={18}/></button>
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