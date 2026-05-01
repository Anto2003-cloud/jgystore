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
        const { USD, EUR } = response.data.rates;

        if (USD > 1) {
          setRates(USD, EUR);
        } else {
          // LA TASA ESTÁ EN 0: Disparamos el comando de rescate al Backend
          console.log("⏳ Tasa en 0. Disparando rescate automático...");
          await api.post("/dashboard/refresh-rates");
          const retry = await api.get("/dashboard/");
          if (retry.data.rates.USD > 1) {
            setRates(retry.data.rates.USD, retry.data.rates.EUR);
          }
        }
      } catch (e) { console.error("Error en sincronización automática"); }
    };
    initApp();
  }, [setRates]);

  return null;
};