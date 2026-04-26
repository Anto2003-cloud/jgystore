"use client";
import React from "react";
import "./globals.css";
import { usePathname } from 'next/navigation';

// Importaciones según tu estructura actual
import { Sidebar } from "../components/Sidebar"; 
import { DataInitializer } from "../components/layout/DataInitializer";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();
  
  // Definimos si estamos en la página de login
  const isLoginPage = pathname === '/login';

  return (
    <html lang="es">
      <body className="bg-slate-50 font-sans">
        {/* El inicializador de datos (Tasa BCV, etc.) siempre corre de fondo */}
        <DataInitializer />

        <div className="flex">
          {/* 1. Solo mostramos el Sidebar si NO estamos en el login */}
          {!isLoginPage && <Sidebar />}

          {/* 2. Ajustamos el margen y el centrado dinámicamente */}
          <main 
            className={`flex-1 min-h-screen transition-all duration-300 ${
              isLoginPage 
                ? 'flex items-center justify-center bg-slate-950' // Si es login: centrado y fondo oscuro
                : 'ml-64 p-8' // Si es el sistema: margen para el sidebar y padding
            }`}
          >
            <div className={`${!isLoginPage ? 'max-w-[1400px] mx-auto' : 'w-full'}`}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}