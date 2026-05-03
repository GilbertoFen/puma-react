// ./app/home/page.tsx
'use client'; 
import HomePage from '../src/components/home/HomePage';
import { useState, useEffect } from 'react';

export default function HomeRoute() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Recuperamos el usuario que guardamos en el login
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user) {
    return <div style={{ background: '#0b1733', minHeight: '100vh' }} />;
  }

  return <HomePage user={user} />;
}