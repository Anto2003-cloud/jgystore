"use client";
import { useEffect, useState } from "react";
import { getDashboardMetrics } from "../../services/api";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { StatCard } from "../../components/dashboard/StatCard";
import { CurrencySwitcher } from "../../components/layout/CurrencySwitcher";
import { ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const { formatPrice, setRate, rate } = useCurrencyStore();

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

  if (!data) return <div className="p-10 text-center">Cargando Dashboard...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panel Jgystore</h1>
          <p className="text-slate-500">Resumen de ventas y estado operativo</p>
        </div>
        <CurrencySwitcher />
      </div>

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Ventas Totales" 
          value={formatPrice(data.financials.total_revenue_usd)} 
          icon={<ShoppingCart />} 
          description="Ingreso bruto acumulado"
        />
        <StatCard 
          title="Utilidad Neta" 
          value={formatPrice(data.financials.net_profit_usd)} 
          icon={<TrendingUp />} 
          trend="up"
          description={`Margen real: ${data.financials.margin_percentage}%`}
        />
        
       <StatCard 
          title="Tasa de Cambio" 
          value={data?.rate_used ? `${data.rate_used} Bs.` : (rate > 1 ? `${rate} Bs.` : "Cargando...")}
          icon={<DollarSign className="h-4 w-4 text-blue-600" />}
          description="Sincronizado con BCV"
        />

        <StatCard 
          title="Alertas de Stock" 
          value={data.low_stock.length} 
          icon={<AlertTriangle />} 
          trend={data.low_stock.length > 0 ? "alert" : undefined}
          description="Variaciones por debajo del mínimo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabla de Ranking */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold mb-4 text-slate-800">Top 5 Más Vendidos</h2>
          <div className="space-y-4">
            {data.best_sellers.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center border-b pb-2">
                {/* Texto del nombre del producto más oscuro */}
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold mb-4 text-red-600">Alertas de Stock</h2>
          <div className="space-y-4">
            {data.low_stock.length === 0 ? (
              /* CAMBIO AQUÍ: text-slate-900 para que sea visible */
              <p className="text-slate-900 font-medium bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                No hay productos críticos.
              </p>
            ) : (
              data.low_stock.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                  <div>
                    <span className="font-bold block text-sm text-red-950">{item.product_name}</span>
                    <span className="text-xs text-red-700">Talla: {item.size} - {item.version}</span>
                  </div>
                  <div className="text-red-700 font-black">{item.current_stock} en stock</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}