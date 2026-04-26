"use client";
import React, { forwardRef } from "react";

interface ReceiptProps {
  sale: {
    items: any[];
    totalUsd: number;
    totalBs: number;
    rate: number;
    date: string;
    saleId?: string | number;
  };
}

export const ReceiptTicket = forwardRef<HTMLDivElement, ReceiptProps>(({ sale }, ref) => {
  return (
    <div ref={ref} className="p-8 bg-white text-black w-[80mm] font-mono text-sm leading-tight">
      {/* Header */}
      <div className="text-center border-b border-dashed border-black pb-4 mb-4">
        <h2 className="text-xl font-black italic">JGYSTORE</h2>
        <p className="text-[10px]">RIF: J-12345678-9</p>
        <p className="text-[10px]">C.C. City Market, Caracas</p>
        <p className="text-[10px]">Instagram: @jgystore</p>
      </div>

      {/* Info Venta */}
      <div className="mb-4 text-[10px]">
        <p>FECHA: {new Date(sale.date).toLocaleString()}</p>
        <p>TICKET: #000{sale.saleId || "PEND"}</p>
        <p>TASA BCV: {sale.rate.toFixed(2)} Bs.</p>
      </div>

      {/* Tabla de Items */}
      <table className="w-full mb-4 border-b border-dashed border-black">
        <thead>
          <tr className="text-left border-b border-black">
            <th className="pb-1">DESCRIPCIÓN</th>
            <th className="pb-1 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx} className="text-[11px]">
              <td className="py-1 uppercase">
                {item.name} <br />
                <span className="text-[9px]">TALLA: {item.size} | {item.version} (x{item.quantity})</span>
              </td>
              <td className="py-1 text-right self-start">
                ${(item.price_usd * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="space-y-1">
        <div className="flex justify-between font-bold">
          <span>TOTAL USD:</span>
          <span>${sale.totalUsd.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-black border-t border-black pt-1">
          <span>TOTAL BS:</span>
          <span>{sale.totalBs.toFixed(2)} Bs.</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[9px]">
        <p className="font-bold">¡GRACIAS POR TU COMPRA!</p>
        <p>Calidad Deportiva para Campeones</p>
        <div className="mt-4 border-t border-dashed border-black pt-2">
          *** Sin cambio ni devolución pasadas 48h ***
        </div>
      </div>
    </div>
  );
});

ReceiptTicket.displayName = "ReceiptTicket";