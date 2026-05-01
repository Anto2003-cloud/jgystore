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
        
        // Extraemos el objeto rates que contiene USD y EUR
        if (response.data && response.data.rates) {
          const { USD, EUR } = response.data.rates;
          console.log("✅ Tasas sincronizadas:", { USD, EUR });
          setRates(USD, EUR);
        }
      } catch (error) {
        console.error("❌ Error al sincronizar tasas:", error);
      }
    };

    initApp();
    const interval = setInterval(initApp, 10 * 60 * 1000); // Cada 10 min
    return () => clearInterval(interval);
  }, [setRates]);

  return null;
};