"use client";
import React, { useEffect, useState } from "react";
// Rutas relativas para evitar errores de VS Code
import { getOrders, createOrder, updateOrderStatus, deleteOrder, updateOrder } from "../../services/api";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { 
  ClipboardList, Plus, Search, Truck, CheckCircle, 
  PackageCheck, DollarSign, Trash2, Edit, X 
} from "lucide-react";

const statusColors: any = {
  "PEDIDO": "bg-amber-100 text-amber-700 border-amber-200",
  "EN_TRANSITO": "bg-blue-100 text-blue-700 border-blue-200",
  "RECIBIDO": "bg-purple-100 text-purple-700 border-purple-200",
  "ENTREGADO": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const { formatPrice } = useCurrencyStore();
  
  const [form, setForm] = useState({
    customer_name: "",
    product_details: "",
    amount_usd: 0,
    deposit_usd: 0
  });

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error cargando encargos:", error);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  // Lógica para permitir borrar el cero en los inputs
  const handleNumericInput = (field: string, value: string) => {
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setForm({ ...form, [field]: value === "" ? 0 : Number(value) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrderId) {
        await updateOrder(editingOrderId, form);
        alert("Encargo actualizado");
      } else {
        await createOrder(form);
        alert("Encargo registrado");
      }
      resetForm();
      loadOrders();
    } catch (error) {
      alert("Error al procesar la solicitud");
    }
  };

  const resetForm = () => {
    setForm({ customer_name: "", product_details: "", amount_usd: 0, deposit_usd: 0 });
    setEditingOrderId(null);
  };

  const handleEditClick = (order: any) => {
    setEditingOrderId(order.id);
    setForm({
      customer_name: order.customer_name,
      product_details: order.product_details,
      amount_usd: order.amount_usd,
      deposit_usd: order.deposit_usd
    });
    // Scroll hacia arriba para que el usuario vea el formulario relleno
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este encargo definitivamente?")) {
      try {
        await deleteOrder(id);
        loadOrders();
      } catch (error) {
        alert("No se pudo eliminar");
      }
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateOrderStatus(id, newStatus);
      loadOrders();
    } catch (error) {
      alert("No se pudo actualizar el estado");
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold italic">Gestión de Encargos</h1>
          <p className="text-slate-500">Rastreo de pedidos personalizados y mercancía en camino.</p>
        </div>
        <ClipboardList size={40} className="text-slate-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* FORMULARIO DINÁMICO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            {editingOrderId ? <Edit size={20} className="text-amber-500" /> : <Plus size={20} className="text-emerald-500" />}
            {editingOrderId ? 'Editar Encargo' : 'Nuevo Pedido'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Cliente</label>
              <input required type="text" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Nombre del cliente" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Detalles del Producto</label>
              <textarea required className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                placeholder="Ej: Gorra Yankees Azul + Jersey Messi M" value={form.product_details} onChange={e => setForm({...form, product_details: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Precio Total ($)</label>
                <input required type="text" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={form.amount_usd === 0 ? "" : form.amount_usd} onChange={e => handleNumericInput("amount_usd", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Abono ($)</label>
                <input required type="text" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={form.deposit_usd === 0 ? "" : form.deposit_usd} onChange={e => handleNumericInput("deposit_usd", e.target.value)} placeholder="0.00" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button type="submit" className={`w-full py-4 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${editingOrderId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-950 hover:bg-emerald-600'}`}>
                {editingOrderId ? 'Guardar Cambios' : 'Crear Encargo'}
              </button>
              {editingOrderId && (
                <button type="button" onClick={resetForm} className="w-full py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200">
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LISTADO DE ENCARGOS */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar por cliente o producto..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white"
              onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="p-4">Cliente / Producto</th>
                  <th className="p-4">Finanzas</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders
                  .filter(o => o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || o.product_details.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{order.customer_name}</p>
                      <p className="text-xs text-slate-500 italic">{order.product_details}</p>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">Total: {formatPrice(order.amount_usd)}</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Abonado: {formatPrice(order.deposit_usd)}</span>
                        <span className="text-[10px] text-red-400 font-bold">Resta: {formatPrice(order.amount_usd - order.deposit_usd)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end items-center gap-1">
                        {/* Botones de Estado */}
                        <button onClick={() => handleStatusChange(order.id, "EN_TRANSITO")} title="En Tránsito" className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"><Truck size={14}/></button>
                        <button onClick={() => handleStatusChange(order.id, "RECIBIDO")} title="Recibido" className="p-1.5 hover:bg-purple-50 text-purple-500 rounded-lg"><PackageCheck size={14}/></button>
                        <button onClick={() => handleStatusChange(order.id, "ENTREGADO")} title="Entregado" className="p-1.5 hover:bg-emerald-50 text-emerald-500 rounded-lg"><CheckCircle size={14}/></button>
                        
                        <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
                        
                        {/* Botones de Gestión */}
                        <button onClick={() => handleEditClick(order)} title="Editar" className="p-1.5 hover:bg-amber-50 text-amber-500 rounded-lg"><Edit size={14}/></button>
                        <button onClick={() => handleDelete(order.id)} title="Borrar" className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
                      </div>
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