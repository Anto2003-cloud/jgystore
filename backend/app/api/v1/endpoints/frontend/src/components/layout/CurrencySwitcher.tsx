"use client";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { DollarSign, RefreshCw, Loader2 } from "lucide-react";

export const CurrencySwitcher = () => {
  const { currency, toggleCurrency, rate } = useCurrencyStore();

  // Si la tasa es 1, significa que aún no ha cargado (o es el valor inicial)
  const isRateLoaded = rate > 1;

  return (
    <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 border-r pr-4">
        <span className="text-slate-400 font-normal">BCV:</span>
        {isRateLoaded ? (
          <span className="text-blue-600 animate-in fade-in tracking-tight">
            {rate.toFixed(2)} Bs.
          </span>
        ) : (
          <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
        )}
      </div>
      <button
        onClick={toggleCurrency}
        disabled={!isRateLoaded}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold transition-all ${
          currency === 'USD' 
          ? "bg-emerald-100 text-emerald-700" 
          : "bg-blue-100 text-blue-700"
        }`}
      >
        {currency === 'USD' ? <DollarSign size={14}/> : <RefreshCw size={14}/>}
        {currency}
      </button>
    </div>
  );
};