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
          setRates(USD, EUR);
        }
      } catch (e) { console.error("Sync Error"); }
    };
    initApp();
    const interval = setInterval(initApp, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setRates]);

  return null;
};