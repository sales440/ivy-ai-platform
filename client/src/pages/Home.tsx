import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Home page - Redirects to ROPA Dashboard v2
 */
export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the new ROPA Dashboard v2
    setLocation("/ropa-v2");
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Cargando ROPA Dashboard...</p>
      </div>
    </div>
  );
}
