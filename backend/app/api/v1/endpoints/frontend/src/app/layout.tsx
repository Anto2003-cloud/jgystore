// src/app/layout.tsx
"use client";
import React from "react";
import "./globals.css";
import { usePathname } from 'next/navigation';

// Importaciones de tus componentes actuales
import { Sidebar } from "../components/Sidebar"; 
import { DataInitializer } from "../components/layout/DataInitializer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  /**
   * LÓGICA DE ARQUITECTURA: 
   * Definimos las rutas que pertenecen al "corazón" del sistema.
   * Si la URL empieza por cualquiera de estas, el Sidebar debe mostrarse.
   */
  const appRoutes = ['/dashboard', '/inventory', '/sales'];
  const isAppPage = appRoutes.some(path => pathname.startsWith(path));

  return (
    <html lang="es">
      <body className="bg-slate-50 font-sans antialiased text-slate-900">
        {/* El inicializador de datos (Tasa BCV) corre siempre en segundo plano */}
        <DataInitializer />

        <div className="flex">
          {/* 1. Sidebar CONDICIONAL: 
              Solo se renderiza si estamos en una página interna del sistema. 
          */}
          {isAppPage && <Sidebar />}

          {/* 2. Área de Contenido Principal:
              - Si es una página del sistema (isAppPage):
                Aplica margen izquierdo (ml-64) para no taparse con el sidebar y padding (p-8).
              - Si NO es una página del sistema (Login o Raíz):
                Se centra totalmente en pantalla y aplica un fondo oscuro (bg-slate-950).
          */}
          <main 
            className={`flex-1 min-h-screen transition-all duration-300 ${
              isAppPage 
                ? 'ml-64 p-8 bg-slate-50' 
                : 'flex items-center justify-center bg-slate-950 p-0'
            }`}
          >
            <div className={`${isAppPage ? 'max-w-[1400px] mx-auto' : 'w-full flex justify-center'}`}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}