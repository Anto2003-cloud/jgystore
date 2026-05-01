"use client";
import { useEffect } from "react";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import api from "../../services/api";

export const DataInitializer = () => {
  const setRates = useCurrencyStore((state) => state.setRates);

  useEffect(() => {
    const initApp = async () => {
      try {
        const response = await api.get("/dashboard/");
        if (response.data && response.data.rates) {
          const { USD, EUR } = response.data.rates;
          if (USD > 1) {
            setRates(USD, EUR);
          } else {
             setTimeout(initApp, 5000); // Reintento si el servidor aún no tiene la tasa
          }
        }
      } catch (e) { console.error("Sync Error"); }
    };
    initApp();
  }, [setRates]);

  return null;
};