"use client";
import { useEffect } from "react";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import api from "../../services/api";

export const DataInitializer = () => {
  const setRate = useCurrencyStore((state) => state.setRate);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Consultamos el endpoint de dashboard que centraliza la tasa del BCV
        const response = await api.get("/dashboard/");
        
        // El Arquitecto pide validar que rate_used exista en la respuesta
        if (response.data && response.data.rate_used) {
          const tasaServidor = response.data.rate_used;
          
          console.log("✅ Sincronizando tasa desde el servidor:", tasaServidor);
          setRate(tasaServidor);
        } else {
          console.warn("⚠️ El dashboard no devolvió 'rate_used'. Revisa el backend.");
        }
      } catch (error) {
        // Si hay un error (ej. 401 Unauthorized), el sistema no se rompe
        console.error("❌ Error al sincronizar tasa inicial:", error);
      }
    };

    initApp();
    
    // Opcional: Re-sincronizar cada 15 minutos para mantener la tasa al día
    const interval = setInterval(initApp, 15 * 60 * 1000);
    return () => clearInterval(interval);

  }, [setRate]);

  return null; // Componente de lógica pura, no renderiza interfaz
};