"use client";
import { useEffect, useState } from "react";
// Usamos rutas relativas para evitar errores en VS Code
import { getDashboardMetrics } from "../../services/api";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { StatCard } from "../../components/dashboard/StatCard";
import { CurrencySwitcher } from "../../components/layout/CurrencySwitcher";
// Añadimos Zap para el icono de la brecha
import { ShoppingCart, DollarSign, TrendingUp, AlertTriangle, Zap } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const { formatPrice, setRate, rate } = useCurrencyStore();

  // --- LÓGICA DEL ARQUITECTO: DIFERENCIAL CAMBIARIO ---
  // Puedes ajustar este valor según el promedio de Binance/Monitor
  const p2pRate = 56.50; 
  const differential = rate > 0 ? ((p2pRate - rate) / rate) * 100 : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metrics = await getDashboardMetrics();
        setData(metrics);
        
        if (metrics.rate_used) {
          setRate(metrics.rate_used);
        }
      } catch (error) {
        console.error("Error cargando métricas:", error);
      }
    };
    fetchData();
  }, [setRate]);

  if (!data) return <div className="p-10 text-center font-bold text-slate-600">Cargando Dashboard de Jgystore...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel Jgystore</h1>
          <p className="text-slate-500">Resumen de ventas y estado operativo real</p>
        </div>
        <CurrencySwitcher />
      </div>

      {/* Tarjetas Principales + Widget de Brecha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Ventas Totales" 
          value={formatPrice(data.financials.total_revenue_usd)} 
          icon={<ShoppingCart className="text-emerald-600" />} 
          description="Ingreso bruto acumulado"
        />
        
        <StatCard 
          title="Utilidad Neta" 
          value={formatPrice(data.financials.net_profit_usd)} 
          icon={<TrendingUp className="text-blue-600" />} 
          trend="up"
          description={`Margen real: ${data.financials.margin_percentage}%`}
        />

        {/* WIDGET DE BRECHA CAMBIARIA (Tarea 3 de AI Studio) */}
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-amber-800 text-xs font-black uppercase tracking-wider">Brecha Cambiaria</span>
            <Zap size={18} className="text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600 leading-none">
              {differential.toFixed(2)}%
            </p>
            <p className="text-[10px] text-amber-700 font-bold mt-1">BCV vs Paralelo ({p2pRate} Bs.)</p>
          </div>
        </div>

        <StatCard 
          title="Alertas de Stock" 
          value={data.low_stock.length} 
          icon={<AlertTriangle className="text-red-500" />} 
          trend={data.low_stock.length > 0 ? "alert" : undefined}
          description="Variaciones críticas"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabla de Ranking */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
            ⭐ Top 5 Más Vendidos
          </h2>
          <div className="space-y-4">
            {data.best_sellers.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0">
                <span className="text-slate-900 font-semibold">{item.product_name}</span>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{item.total_sold} und.</div>
                  <div className="text-xs text-slate-500 font-medium">{formatPrice(item.revenue_usd)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Alertas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4 text-red-600 flex items-center gap-2">
            ⚠️ Alertas de Stock
          </h2>
          <div className="space-y-4">
            {data.low_stock.length === 0 ? (
              <p className="text-slate-900 font-medium bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                No hay productos críticos hoy.
              </p>
            ) : (
              data.low_stock.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-red-50 p-3 rounded-xl border border-red-100">
                  <div>
                    <span className="font-bold block text-sm text-red-950">{item.product_name}</span>
                    <span className="text-xs text-red-700">Talla: {item.size} - {item.version}</span>
                  </div>
                  <div className="text-red-700 font-black px-3 py-1 bg-white rounded-lg shadow-sm">
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