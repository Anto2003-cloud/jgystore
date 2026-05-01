import { create } from 'zustand';

interface CurrencyState {
  rate: number;
  eurRate: number;
  currency: 'USD' | 'VES';
  setRates: (usd: number, eur: number) => void;
  toggleCurrency: () => void;
  formatPrice: (priceUsd: number) => string;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rate: 489.55,
  eurRate: 528.71,
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