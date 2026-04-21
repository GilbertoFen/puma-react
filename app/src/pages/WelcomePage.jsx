'use client';
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './WelcomePage.css';

export default function WelcomePage({ user, onBegin }) {
  return (
    <div className="page welcome-page">
      <div className="bg-mesh" />
      <Navbar showAcatlan userInitial={user.initial} />
      <div className="gold-line" />

      <main className="welcome-main">
        <div className="welcome-content">
          <h1 className="welcome-title">Bienvenido {user.nombre}</h1>
          <p className="welcome-sub">{user.carrera} · {user.semestre}</p>

          <p className="welcome-prompt">
            Responde un breve cuestionario para que la IA conozca más acerca de tus intereses
          </p>

          <button className="welcome-btn" onClick={onBegin}>
            Comenzar
          </button>
        </div>
      </main>

      <div className="gold-line" />
      <Footer />
    </div>
  );
}
