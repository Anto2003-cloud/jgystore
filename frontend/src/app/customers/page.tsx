"use client";
import React, { useEffect, useState } from "react";
import { getCustomers, createCustomer, deleteCustomer, updateCustomer } from "../../services/api";
import { Users, UserPlus, Phone, Mail, Search, Trash2, Edit, X, AlertCircle } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  const loadCustomers = async () => {
    setLoading(true);
    try { 
      const response = await getCustomers(); 
      // Accedemos a response.data y le decimos que es un array (any[])
      setCustomers(response.data as any[]); 
    } catch (e) {
      console.error("Error al cargar clientes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const resetForm = () => {
    setForm({ full_name: "", phone: "", email: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCustomer(editingId, form);
        alert("✅ Cliente actualizado con éxito");
      } else {
        await createCustomer(form);
        alert("✅ Cliente registrado con éxito");
      }
      resetForm();
      loadCustomers();
    } catch (error: any) {
        // LÓGICA DE ARQUITECTO: Extraemos el error real del backend
        const serverMessage = error.response?.data?.detail;
        const finalMsg = typeof serverMessage === "string" 
          ? serverMessage 
          : "Error de validación. Revisa que el correo sea único.";
        
        alert("❌ ERROR: " + finalMsg);
    }
  };

  const handleEditClick = (customer: any) => {
    setEditingId(customer.id);
    setForm({
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.")) {
      try {
        await deleteCustomer(id);
        loadCustomers();
        alert("Cliente eliminado");
      } catch (error) {
        alert("No se pudo eliminar el cliente.");
      }
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold italic text-slate-900 uppercase tracking-tighter">Base de Clientes</h1>
          <p className="text-slate-500">Gestión de contactos y base de datos de Jgystore.</p>
        </div>
        <Users size={40} className="text-slate-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* PANEL DE FORMULARIO */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit sticky top-8">
          <div className="flex items-center gap-2 mb-6 text-blue-600">
            {editingId ? <Edit size={24} /> : <UserPlus size={24} />}
            <h2 className="text-lg font-bold">{editingId ? "Editar Cliente" : "Nuevo Cliente"}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Completo</label>
              <input 
                required type="text" 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ej: JUAN PEREZ"
                value={form.full_name} 
                onChange={e => setForm({...form, full_name: e.target.value.toUpperCase()})} 
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">WhatsApp / Teléfono</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  required type="text" 
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="0412..."
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email (Opcional)</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="usuario@correo.com"
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value.toLowerCase()})} 
                />
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-wider shadow-lg transition-all ${
                editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100 text-white' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 text-white'
              }`}>
                {editingId ? "Actualizar Datos" : "Guardar en Base de Datos"}
              </button>
              
              {editingId && (
                <button type="button" onClick={resetForm} className="w-full py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200">
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LISTADO DE CLIENTES */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Buscar cliente por nombre o teléfono..." 
              className="w-full p-4 pl-12 rounded-2xl border border-slate-100 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="p-6">Ficha del Cliente</th>
                  <th className="p-6">Información de Contacto</th>
                  <th className="p-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={3} className="p-20 text-center text-slate-400 font-bold italic">Cargando base de datos...</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={3} className="p-20 text-center text-slate-400">No hay clientes registrados aún.</td></tr>
                ) : (
                  customers
                    .filter((c:any) => c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
                    .map((customer: any) => (
                      <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black">
                              {customer.full_name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-800 uppercase text-sm">{customer.full_name}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                              <Phone size={12} className="text-emerald-500" /> {customer.phone}
                            </span>
                            {customer.email && (
                              <span className="text-xs text-slate-400 flex items-center gap-2 italic">
                                <Mail size={12} /> {customer.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleEditClick(customer)} 
                                className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                title="Editar Cliente"
                              >
                                <Edit size={18}/>
                              </button>
                              <button 
                                onClick={() => handleDelete(customer.id)} 
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Eliminar Cliente"
                              >
                                <Trash2 size={18}/>
                              </button>
                          </div>
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