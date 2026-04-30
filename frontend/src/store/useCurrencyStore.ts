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
  rate: 486.20,
  eurRate: 525.09,
  currency: 'USD',
  setRates: (usd, eur) => set({ rate: usd, eurRate: eur }),
  toggleCurrency: () => set((state) => ({ 
    currency: state.currency === 'USD' ? 'VES' : 'USD' 
  })),
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