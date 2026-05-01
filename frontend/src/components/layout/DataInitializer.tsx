"use client";
import { useEffect } from "react";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import api from "../../services/api";

export const DataInitializer = () => {
  const { setRates, rate } = useCurrencyStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        const response = await api.get("/dashboard/");
        if (response.data && response.data.rates) {
          const { USD, EUR } = response.data.rates;
          
          if (USD > 10) {
            console.log("✅ Tasas sincronizadas:", { USD, EUR });
            setRates(USD, EUR);
          } else {
            // Si el servidor mandó 0 o 1, reintentamos en 3 segundos
            console.log("⏳ Tasa aún no lista, reintentando...");
            setTimeout(initApp, 3000);
          }
        }
      } catch (e) {
        console.error("Error de conexión");
      }
    };

    initApp();
  }, [setRates]);

  return null;
};