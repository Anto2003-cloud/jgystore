import { create } from 'zustand';

interface CurrencyState {
  rate: number;
  currency: 'USD' | 'VES';
  setRate: (rate: number) => void;
  toggleCurrency: () => void;
  formatPrice: (priceUsd: number) => string;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rate: 1, // Este valor lo actualizaremos luego con tu API
  currency: 'USD',
  setRate: (rate) => set({ rate }),
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