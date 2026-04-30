"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Package, ShoppingCart, 
  LogOut, Wallet, ClipboardList, Users 
} from 'lucide-react';
import { useCurrencyStore } from '../store/useCurrencyStore';

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
  const { rate, eurRate } = useCurrencyStore(); // Traemos AMBAS tasas reales

  const handleLogout = () => {
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-slate-950 text-white h-screen flex flex-col fixed left-0 top-0 shadow-2xl z-50">
      <div className="p-8 flex flex-col items-center border-b border-slate-800">
        <div className="mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <img src="/logo-jgy.png" alt="Logo" className="w-16 h-16 object-contain" />
        </div>
        <h2 className="text-xl font-bold tracking-tighter uppercase italic">JGYSTORE</h2>
        <span className="text-[10px] text-emerald-500 font-bold uppercase">Sport Ecosystem</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
        {menuItems.map((item) => (
          <Link key={item.path} href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === item.path ? "bg-emerald-500 text-black font-bold" : "text-slate-400 hover:text-white"
            }`}>
            {item.icon} <span className="text-sm">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-3">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-slate-400 uppercase font-bold tracking-wider">BCV USD</span>
          <span className="text-emerald-500 font-mono font-bold text-sm">
            {rate > 1 ? `${rate.toFixed(2)} Bs.` : "---"}
          </span>
        </div>

        <div className="flex justify-between items-center text-[10px] pb-3">
          <span className="text-slate-400 uppercase font-bold tracking-wider">BCV EUR</span>
          <span className="text-blue-400 font-mono font-bold text-sm">
            {/* AQUÍ YA NO HAY MULTIPLICACIÓN, ES EL VALOR REAL DE LA DB */}
            {eurRate > 1 ? `${eurRate.toFixed(2)} Bs.` : "---"}
          </span>
        </div>
        
        <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 text-sm w-full p-2 rounded-lg hover:bg-slate-900 border-t border-slate-800 pt-4">
          <LogOut size={18}/> <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};