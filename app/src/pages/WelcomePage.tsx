'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './WelcomePage.css';
import { studentService } from '../services/student.service';
import { StudentProfile, UserData } from '../types';

interface WelcomePageProps {
  user: UserData;
  onBegin: (fullProfile: StudentProfile) => void;
}

export default function WelcomePage({ user, onBegin }: WelcomePageProps) {
  console.log('Datos del usuario recibidos en WelcomePage:', user);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user?.cuenta) {
      studentService.getProfileByAccount(user.cuenta)
        .then((data) => setProfile(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user?.cuenta]);


  if (loading) return <div className="loading-state">Cargando perfil...</div>;
  if (!profile) return <div>No se pudo cargar la información.</div>;

  return (
    <div className="page welcome-page">
      <div className="bg-mesh" />
      <Navbar showAcatlan userInitial={profile.fullName.charAt(0)} />
      <div className="gold-line" />

      <main className="welcome-main">
        <div className="welcome-content">
          <h1 className="welcome-title">Bienvenido {profile.fullName}</h1>
          <p className="welcome-sub">
            {profile.academicInfo.career} · {profile.academicInfo.semester} Semestre
          </p>

          <p className="welcome-prompt">
            Responde un breve cuestionario para que la IA conozca más acerca de tus intereses
          </p>

          <button
            className="welcome-btn"
            onClick={() => profile && onBegin(profile)}>
            Comenzar
          </button>
        </div>
      </main>

      <div className="gold-line" />
      <Footer />
    </div>
  );
}