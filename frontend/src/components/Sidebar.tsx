"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  LogOut, 
  Wallet, 
  ClipboardList, 
  Users,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useCurrencyStore } from '../store/useCurrencyStore';
import api from '../services/api';

const menuItems = [
  { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/dashboard' },
  { name: 'Inventario', icon: <Package size={20}/>, path: '/inventory' },
  { name: 'Punto de Venta', icon: <ShoppingCart size={20}/>, path: '/sales' },
  { name: 'Finanzas', icon: <Wallet size={20}/>, path: '/finance' },
  { name: 'Encargos', icon: <ClipboardList size={20}/>, path: '/orders' },
  { name: 'Clientes', icon: <Users size={20}/>, path: '/customers' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { rate, eurRate } = useCurrencyStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRefreshRates = async () => {
    setIsSyncing(true); // <--- CORREGIDO: true en minúscula
    try {
      await api.post('/dashboard/refresh-rates');
      alert("Tasas actualizadas con el BCV");
      window.location.reload();
    } catch (error) {
      console.error("Error al sincronizar:", error);
      alert("El servidor del BCV no responde.");
    } finally {
      setIsSyncing(false); // <--- CORREGIDO: false en minúscula
    }
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/login');
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <aside className="w-64 bg-slate-950 text-white h-screen flex flex-col fixed left-0 top-0 shadow-2xl z-50">
      
      <div className="p-8 flex flex-col items-center border-b border-slate-800">
        <div className="mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <img 
            src="/logo-jgy.png" 
            alt="Logo Jgystore" 
            className="w-16 h-16 object-contain"
          />
        </div>
        <h2 className="text-xl font-bold tracking-tighter text-white uppercase italic text-center leading-none">JGYSTORE</h2>
        <span className="text-[10px] text-emerald-500 font-bold tracking-[0.2em] uppercase text-center mt-2">
          Sport Ecosystem
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                ? "bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20" 
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase">Estado en Vivo</span>
          </div>
          <button 
            onClick={handleRefreshRates}
            disabled={isSyncing}
            className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all ${isSyncing ? 'opacity-50' : ''}`}
          >
            <RefreshCw size={12} className={`text-emerald-500 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 uppercase font-bold">BCV USD</span>
                <span className="text-emerald-500 font-mono font-bold text-sm">
                    {rate > 1 ? `${rate.toFixed(2)} Bs.` : "---"}
                </span>
            </div>

            <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 uppercase font-bold">BCV EUR</span>
                <span className="text-blue-400 font-mono font-bold text-sm">
                    {eurRate > 1 ? `${eurRate.toFixed(2)} Bs.` : "---"}
                </span>
            </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-slate-400 hover:text-red-400 text-sm transition-colors w-full p-2 rounded-lg hover:bg-slate-900 mt-2"
        >
          <LogOut size={18}/> 
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};