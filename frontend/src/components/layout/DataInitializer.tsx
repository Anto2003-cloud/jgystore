"use client";
import { useEffect } from "react";
// Ruta relativa ajustada para tu estructura de carpetas
import { useCurrencyStore } from "../../store/useCurrencyStore";
import api from "../../services/api";

export const DataInitializer = () => {
  // Extraemos la función setRates del cerebro (Zustand)
  const setRates = useCurrencyStore((state) => state.setRates);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log("Sincronizando divisas con el servidor...");
        // Pedimos los datos al Dashboard (que ya incluye las tasas frescas)
        const response = await api.get("/dashboard/");
        
        if (response.data && response.data.rates) {
          const { USD, EUR } = response.data.rates;
          
          // Guardamos en el estado global (Zustand)
          setRates(USD, EUR);
          console.log("✅ Divisas sincronizadas:", { USD, EUR });
        } else if (response.data.rate_used) {
            // Fallback por si la API envía la estructura simple
            setRates(response.data.rate_used, response.data.rate_used * 1.08);
        }
      } catch (error) {
        console.error("❌ Error de comunicación con la API de Jgystore:", error);
      }
    };

    // 1. Sincronización inmediata al cargar la pestaña
    initApp();

    // 2. Re-sincronización automática cada 15 minutos mientras la web esté abierta
    const interval = setInterval(initApp, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [setRates]);

  return null; // Componente lógico, no renderiza nada en pantalla
};