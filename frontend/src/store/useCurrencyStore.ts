import { create } from 'zustand';

interface CurrencyState {
  rate: number;      // Tasa USD
  eurRate: number;   // Tasa EUR
  currency: 'USD' | 'VES';
  setRates: (usd: number, eur: number) => void;
  toggleCurrency: () => void;
  formatPrice: (priceUsd: number) => string;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  // VALORES INICIALES ACTUALIZADOS SEGÚN BCV REAL
  rate: 487.11,
  eurRate: 569.76,
  currency: 'USD',

  // Actualiza ambas tasas al recibir datos de la API
  setRates: (usd, eur) => set({ rate: usd, eurRate: eur }),

  // Cambia entre $ y Bs.
  toggleCurrency: () => set((state) => ({ 
    currency: state.currency === 'USD' ? 'VES' : 'USD' 
  })),

  // Formateador de moneda dinámico
  formatPrice: (priceUsd: number) => {
    const { currency, rate } = get();
    if (currency === 'VES') {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
      }).format(priceUsd * rate);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceUsd);
  },
}));