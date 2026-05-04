'use client'; 
import HomePage from '../src/components/home/HomePage';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeRoute() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Verificamos qué hay en el localStorage
    const rawData = localStorage.getItem('userData');
    console.log("Datos encontrados en localStorage:", rawData);

    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        setUser(parsed);
      } catch (e) {
        console.error("Error parseando userData:", e);
        router.push('/');
      }
    } else {
      // 2. Si después de un intento no hay nada, regresamos al login
      console.warn("No hay userData, redirigiendo...");
      router.push('/');
    }
    setLoading(false);
  }, [router]);

  // Si después de cargar NO hay usuario, esto se queda en azul. 
  // Por eso el router.push('/') es vital.
  if (loading || !user) {
    return (
      <div style={{ 
        background: '#0b1733', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#bb8800',
        gap: '10px'
      }}>
        <div className="spinner"></div> {/* Agrega un spinner CSS si tienes */}
        <span>Cargando portal...</span>
      </div>
    );
  }

  return <HomePage user={user} />;
}