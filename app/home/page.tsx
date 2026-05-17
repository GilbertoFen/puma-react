'use client';
import HomePage from '../src/components/home/HomePage';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '../src/components/loaders/PageLoader';
export default function HomeRoute() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
      console.warn("No hay userData, redirigiendo...");
      router.push('/');
    }
    setLoading(false);
  }, [router]);
  if (loading || !user) {
    return (
      <div>
        <PageLoader message="Cargando PumaIA..." />
      </div>
    );
  }

  return <HomePage user={user} />;
}