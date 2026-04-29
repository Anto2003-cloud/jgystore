"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// Importamos Users para el módulo CRM de Clientes
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  LogOut, 
  Wallet, 
  ClipboardList, 
  Users 
} from 'lucide-react';
import { useCurrencyStore } from '../store/useCurrencyStore';

const menuItems = [
  { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/dashboard' },
  { name: 'Inventario', icon: <Package size={20}/>, path: '/inventory' },
  { name: 'Punto de Venta', icon: <ShoppingCart size={20}/>, path: '/sales' },
  { name: 'Finanzas', icon: <Wallet size={20}/>, path: '/finance' },
  { name: 'Encargos', icon: <ClipboardList size={20}/>, path: '/orders' },
  { name: 'Clientes', icon: <Users size={20}/>, path: '/customers' }, // <-- NUEVO MÓDULO CRM
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { rate } = useCurrencyStore(); 

  const handleLogout = () => {
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-slate-950 text-white h-screen flex flex-col fixed left-0 top-0 shadow-2xl z-50">
      
      {/* Logo y Branding */}
      <div className="p-8 flex flex-col items-center border-b border-slate-800">
        <div className="mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <img 
            src="/logo-jgy.png" 
            alt="Logo Jgystore" 
            className="w-16 h-16 object-contain"
          />
        </div>
        <h2 className="text-xl font-bold tracking-tighter text-white uppercase italic">JGYSTORE</h2>
        <span className="text-[10px] text-emerald-500 font-bold tracking-[0.2em] uppercase text-center">
          Sport Ecosystem
        </span>
      </div>

      {/* Navegación - Con scroll si hay muchos items */}
      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
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

      {/* Footer: Tasas y Logout */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-3">
        
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-slate-400 uppercase font-bold tracking-wider text-[9px]">BCV USD</span>
          <span className="text-emerald-500 font-mono font-bold text-sm">
            {rate > 1 ? `${rate.toFixed(2)} Bs.` : "---"}
          </span>
        </div>

        <div className="flex justify-between items-center text-[10px] pb-3">
          <span className="text-slate-400 uppercase font-bold tracking-wider text-[9px]">BCV EUR</span>
          <span className="text-blue-400 font-mono font-bold text-sm">
            {rate > 1 ? `${(rate * 1.08).toFixed(2)} Bs.` : "---"}
          </span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-slate-400 hover:text-red-400 text-sm transition-colors w-full p-2 rounded-lg hover:bg-slate-900 border-t border-slate-800 pt-4"
        >
          <LogOut size={18}/> 
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};