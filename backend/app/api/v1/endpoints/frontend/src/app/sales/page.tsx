"use client";
import { useState, useEffect, useRef } from "react"; // Añadido useRef
import { getProducts, registerSale } from "../../services/api";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { ShoppingCart, Search, Trash2, CheckCircle } from "lucide-react";
import { useReactToPrint } from "react-to-print"; // Librería de impresión
import { ReceiptTicket } from "../../components/sales/ReceiptTicket";// Tu nuevo componente

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSaleData, setLastSaleData] = useState<any>(null); // Guardar datos para el ticket
  
  const componentRef = useRef<HTMLDivElement>(null); // Referencia al ticket
  const formatPrice = useCurrencyStore((state: any) => state.formatPrice);
  const rate = useCurrencyStore((state: any) => state.rate);

  // Configuración de la función de impresión
  // Configuración de la función de impresión corregida
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });
 

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

  const addToCart = (product: any, variation: any) => {
    if (variation.stock <= 0) return alert("Sin stock disponible");
    
    const exists = cart.find(item => item.variation_id === variation.id);
    if (exists) {
      setCart(cart.map(item => 
        item.variation_id === variation.id 
        ? { ...item, quantity: item.quantity + 1 } 
        : item
      ));
    } else {
      setCart([...cart, {
        variation_id: variation.id,
        name: product.name,
        size: variation.size,
        version: variation.version,
        price_usd: product.price_usd,
        quantity: 1
      }]);
    }
  };

  const totalUsd = cart.reduce((acc, item) => acc + (item.price_usd * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const payload = {
        items: cart.map(item => ({ variation_id: item.variation_id, quantity: item.quantity })),
        customer_id: null
      };

      const response = await registerSale(payload);

      // 1. Preparamos los datos del ticket ANTES de limpiar el carrito
      setLastSaleData({
        items: [...cart],
        totalUsd: totalUsd,
        totalBs: totalUsd * rate,
        rate: rate,
        date: new Date().toISOString(),
        saleId: response.id // Usamos el ID que viene del backend
      });

      alert("Venta registrada con éxito");
      setCart([]);
      getProducts().then(setProducts); 

      // 2. Esperamos un momento a que el ticket se "dibuje" y lanzamos la impresión
      setTimeout(() => {
        handlePrint();
      }, 500);

    } catch (error) {
      alert("Error al procesar la venta");
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900">
      {/* LADO IZQUIERDO: Catálogo */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Punto de Venta</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar prenda..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-10">
          {products
            .filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((product: any) => (
              <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-sm mb-2">{product.name}</h3>
                <div className="space-y-2">
                  {product.variations.map((v: any) => (
                    <button 
                      key={v.id}
                      onClick={() => addToCart(product, v)}
                      disabled={v.stock <= 0}
                      className="w-full flex justify-between items-center p-2 text-xs bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100 disabled:opacity-50"
                    >
                      <span>{v.size} - {v.version}</span>
                      <span className="font-bold text-blue-600">{v.stock} disp.</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* LADO DERECHO: Carrito */}
      <div className="w-96 bg-white shadow-2xl flex flex-col p-6">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <ShoppingCart className="text-blue-600" />
          <h2 className="text-xl font-bold">Carrito</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start bg-slate-50 p-3 rounded-xl">
              <div>
                <p className="font-bold text-sm">{item.name}</p>
                <p className="text-[10px] text-slate-500">{item.size} | {item.version} x{item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">{formatPrice(item.price_usd * item.quantity)}</p>
                <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t pt-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total USD</span>
            <span className="font-bold">${totalUsd.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-2xl font-black">
            <span>Total</span>
            <span className="text-emerald-600">{formatPrice(totalUsd)}</span>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg shadow-blue-200"
          >
            <CheckCircle size={20} /> Finalizar Venta
          </button>
        </div>
      </div>

      {/* COMPONENTE DE IMPRESIÓN OCULTO */}
      <div className="hidden">
        {lastSaleData && (
          <ReceiptTicket ref={componentRef} sale={lastSaleData} />
        )}
      </div>
    </div>
  );
}