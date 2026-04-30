"use client";
import React, { useEffect, useState } from "react";
// Rutas relativas para evitar errores en VS Code
import { getDashboardMetrics } from "../../services/api";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { StatCard } from "../../components/dashboard/StatCard";
import { CurrencySwitcher } from "../../components/layout/CurrencySwitcher";
import { 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Activity,
  ArrowRight
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  // Importamos setRates (en plural) para actualizar USD y EUR al mismo tiempo
  const { formatPrice, setRates, rate } = useCurrencyStore();

  // --- LÓGICA DE BRECHA REALISTA ---
  // Ajustamos el paralelo a un valor por encima del BCV (aprox +10%)
  const p2pRate = 515.20; 
  const differential = rate > 0 ? ((p2pRate - rate) / rate) * 100 : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metrics = await getDashboardMetrics();
        setData(metrics);
        
        // Sincronizamos ambas tasas en el Store Global
        if (metrics.rates) {
          setRates(metrics.rates.USD, metrics.rates.EUR);
        } else if (metrics.rate_used) {
          // Fallback por si la API envía la estructura vieja
          setRates(metrics.rate_used, metrics.rate_used * 1.08);
        }
      } catch (error) {
        console.error("Error cargando métricas:", error);
      }
    };
    fetchData();
  }, [setRates]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Activity className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="font-bold text-slate-600">Sincronizando con Jgystore Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight italic">Panel de Control</h1>
          <p className="text-slate-500">Resumen operativo y financiero en tiempo real</p>
        </div>
        <CurrencySwitcher />
      </div>

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Ventas Totales" 
          value={formatPrice(data.financials.total_revenue_usd)} 
          icon={<ShoppingCart className="text-emerald-600" />} 
          description="Ingreso bruto acumulado"
        />
        
        <StatCard 
          title="Utilidad Neta Real" 
          value={formatPrice(data.financials.net_profit_usd)} 
          icon={<TrendingUp className="text-blue-600" />} 
          trend="up"
          description={`Margen limpio: ${data.financials.margin_percentage}%`}
        />

        {/* WIDGET DE BRECHA CAMBIARIA MEJORADO */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-amber-400 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Zap size={20} className="text-amber-500 fill-amber-500" />
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${differential > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {differential > 0 ? 'ALERTA' : 'ESTABLE'}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Brecha Cambiaria</h3>
            <p className="text-3xl font-black text-slate-900 leading-none mt-1">
              {differential.toFixed(2)}%
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1">
              BCV vs Paralelo <ArrowRight size={10} /> {p2pRate} Bs.
            </p>
          </div>
        </div>

        <StatCard 
          title="Alertas de Stock" 
          value={data.low_stock.length} 
          icon={<AlertTriangle className="text-red-500" />} 
          trend={data.low_stock.length > 0 ? "alert" : undefined}
          description="Variaciones por reponer"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabla de Ranking */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              <Activity size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Top 5 Más Vendidos</h2>
          </div>
          <div className="space-y-4">
            {data.best_sellers.length === 0 ? (
              <p className="text-center py-10 text-slate-400 italic">No hay datos de ventas disponibles.</p>
            ) : (
              data.best_sellers.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-slate-200">#{idx + 1}</span>
                    <span className="text-slate-900 font-bold uppercase text-sm">{item.product_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-900">{item.total_sold} und.</div>
                    <div className="text-[10px] text-emerald-600 font-black">{formatPrice(item.revenue_usd)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lista de Alertas */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-600 rounded-lg text-white shadow-lg shadow-red-200">
              <AlertTriangle size={18} />
            </div>
            <h2 className="text-lg font-bold text-red-600">Stock Crítico</h2>
          </div>
          <div className="space-y-4">
            {data.low_stock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <PackageCheck size={48} className="text-slate-300 mb-2" />
                <p className="text-slate-900 font-medium">Todo el inventario está al día.</p>
              </div>
            ) : (
              data.low_stock.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-red-50/50 p-4 rounded-2xl border border-red-100">
                  <div>
                    <span className="font-black block text-sm text-red-950 uppercase">{item.product_name}</span>
                    <span className="text-[10px] text-red-700 font-bold">TALLA: {item.size} — {item.version}</span>
                  </div>
                  <div className="text-red-700 font-black text-xl px-4 py-2 bg-white rounded-xl shadow-sm border border-red-50">
                    {item.current_stock}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componente de ayuda visual
function PackageCheck({ size, className }: { size: number, className: string }) {
  return <ShoppingCart size={size} className={className} />;
}