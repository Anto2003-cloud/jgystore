"use client";
import { useEffect } from "react";
// Ruta relativa ajustada a tu estructura src/components/layout/
import { useCurrencyStore } from "../../store/useCurrencyStore";
import api from "../../services/api";

export const DataInitializer = () => {
  // Extraemos la función setRates que guarda USD y EUR al mismo tiempo
  const setRates = useCurrencyStore((state) => state.setRates);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log(">>> [INIT] Solicitando tasas actualizadas al servidor...");
        
        // Llamamos al endpoint del dashboard que ya calculamos que devuelve 'rates'
        const response = await api.get("/dashboard/");
        
        if (response.data && response.data.rates) {
          const { USD, EUR } = response.data.rates;
          
          // Verificación de seguridad: Solo actualizamos si los valores son coherentes
          if (USD > 10 && EUR > 10) {
            console.log("✅ [INIT] Tasas recibidas con éxito:", { USD, EUR });
            setRates(USD, EUR);
          } else {
            console.warn("⚠️ [INIT] Las tasas recibidas son muy bajas, esperando sincronización...");
          }
        } else {
          console.error("❌ [INIT] El servidor no envió el objeto 'rates'.");
        }
      } catch (error) {
        console.error("❌ [INIT] Error crítico de conexión con el Backend:", error);
      }
    };

    // Ejecución inmediata al cargar la página
    initApp();

    // Re-sincronización automática cada 10 minutos para mantener la App fresca
    const interval = setInterval(initApp, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [setRates]);

  return null; // Este componente no dibuja nada, solo gestiona datos
};