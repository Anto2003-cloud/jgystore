import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: "up" | "down" | "alert";
}

export const StatCard = ({ title, value, icon, description, trend }: StatCardProps) => {
  const trendColor = trend === "alert" ? "text-red-600 bg-red-100" : "text-emerald-600 bg-emerald-100";

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendColor}`}>
            {trend === "alert" ? "Atención" : "Activo"}
          </span>
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {description && <p className="text-slate-400 text-xs mt-2">{description}</p>}
    </div>
  );
};