"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Lock, User, LogIn } from "lucide-react";

// Usamos la instancia de axios configurada en services
import api from "../../services/api"; 

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Preparamos los datos en formato URL Encoded (lo que pide OAuth2 en FastAPI)
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
      // 2. IMPORTANTE: Quitamos el "/api/v1" porque ya debería estar en el baseURL de tu instancia api
      // La ruta final según el main.py del Arquitecto es /auth/login
      const response = await api.post("/auth/login", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (response.data.access_token) {
        const token = response.data.access_token;
        
        // 3. Guardamos la cookie (usando el método directo que sugirió el Arquitecto o js-cookie)
        document.cookie = `auth_token=${token}; path=/; max-age=28800; samesite=lax`;
        
        // Redirigimos al dashboard
        // Usamos window.location para un refresco total o router.push
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Error en login:", err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError("Usuario o contraseña incorrectos");
        } else if (err.response.status === 404) {
          setError("Error 404: Ruta no encontrada. Revisa los prefijos en el backend.");
        } else {
          setError("Error: " + (err.response.data?.detail || "Problema en el servidor"));
        }
      } else {
        setError("No se pudo conectar con el servidor. ¿Está encendido?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">JGYSTORE</h1>
          <p className="text-slate-500 text-sm italic">Sport Ecosystem</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-4 text-center font-bold border border-red-100 italic animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Usuario (admin)" 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-slate-900 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-slate-900 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 mt-6 disabled:bg-slate-400 disabled:shadow-none"
          >
            {loading ? "Verificando..." : (
              <>
                <LogIn size={20} /> Acceder al Sistema
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 flex flex-col items-center gap-1">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            Antonio Pérez & Alejandro Pérez
          </p>
          <p className="text-slate-300 text-[9px] uppercase tracking-tighter font-medium">
            Trabajo De Grado  Ingeniería Informática • 2026
          </p>
        </div>
      </div>
    </div>
  );
}