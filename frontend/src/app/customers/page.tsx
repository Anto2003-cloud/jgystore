"use client";
import React, { useEffect, useState } from "react";
import { getCustomers, createCustomer } from "../../services/api";
import { Users, Plus, UserPlus, Phone, Mail, Search } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { loadCustomers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer(form);
      setForm({ full_name: "", phone: "", email: "" });
      loadCustomers();
      alert("Cliente registrado correctamente");
    } catch (error) { alert("Error al registrar cliente"); }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold italic text-slate-900">Base de Clientes</h1>
          <p className="text-slate-500">Gestiona la información y contacto de tus compradores.</p>
        </div>
        <Users size={40} className="text-slate-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Formulario */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" /> Nuevo Cliente
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
              <input required type="text" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono / WhatsApp</label>
              <input required type="text" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</label>
              <input type="email" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              Guardar Cliente
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar cliente por nombre..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-white"
              onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4 text-center">Puntos JGY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers
                  .filter(c => c.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{customer.full_name}</td>
                    <td className="p-4">
                      <div className="text-sm flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-slate-600"><Phone size={14}/> {customer.phone}</span>
                        <span className="flex items-center gap-2 text-slate-400 text-xs"><Mail size={14}/> {customer.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">
                        {customer.points} pts
                      </span>
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