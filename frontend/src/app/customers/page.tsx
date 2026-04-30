"use client";
import React, { useEffect, useState } from "react";
import { getCustomers, createCustomer, deleteCustomer, updateCustomer } from "../../services/api";
import { Users, UserPlus, Phone, Mail, Search, Trash2, Edit } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  const loadCustomers = async () => {
    try { const data = await getCustomers(); setCustomers(data); } catch (e) {}
  };

  useEffect(() => { loadCustomers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCustomer(editingId, form);
        alert("Cliente actualizado");
      } else {
        await createCustomer(form);
        alert("Cliente registrado");
      }
      setForm({ full_name: "", phone: "", email: "" });
      setEditingId(null);
      loadCustomers();
    } catch (error) {
        alert("Error al procesar: El correo ya existe o faltan datos.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Borrar este cliente?")) {
      await deleteCustomer(id);
      loadCustomers();
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <h1 className="text-3xl font-bold italic mb-8">Base de Clientes</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            {editingId ? <Edit className="text-amber-500" /> : <UserPlus className="text-blue-600" />}
            {editingId ? "Editar Cliente" : "Nuevo Cliente"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="text" className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Nombre" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
            <input required type="text" className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Teléfono" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <input type="email" className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Correo (Opcional)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg">{editingId ? "Actualizar" : "Guardar Cliente"}</button>
            {editingId && <button type="button" onClick={() => {setEditingId(null); setForm({full_name: "", phone: "", email: ""})}} className="w-full text-slate-400 text-xs">Cancelar</button>}
          </form>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <input type="text" placeholder="Buscar cliente..." className="w-full p-4 rounded-xl border bg-white" onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase">
                <tr><th className="p-4">Nombre</th><th className="p-4">Contacto</th><th className="p-4 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y">
                {customers.filter((c:any) => c.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold">{customer.full_name}</td>
                    <td className="p-4 text-sm text-slate-500">{customer.phone}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => {setEditingId(customer.id); setForm({full_name: customer.full_name, phone: customer.phone, email: customer.email})}} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}