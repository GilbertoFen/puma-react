'use client'; // Agregamos esto para poder usar hooks (useState, useEffect)
import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { UNAM_LOGO, FESA_LOGO } from '../utils/img/assets';
import { useUser } from '../context/UserContext';
interface NavbarProps {
  showAcatlan?: boolean;
  userInitial?: string | null;
}

const UNAMLogo: React.FC = () => (
  <div className="logo-placeholder unam">UNAM</div>
);

const AcatlanLogo: React.FC = () => (
  <div className="logo-placeholder acatlan">FES<br />Acatlán</div>
);

export default function Navbar({
  showAcatlan = false,
  userInitial = null
}: NavbarProps) {
  // 1. Estado para almacenar la URL de la foto de perfil
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user } = useUser(); // 

  // 2. Leemos el localStorage una vez que el componente se monta
  useEffect(() => {
    const checkAvatar = () => {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setAvatarUrl(parsedUser.avatarUrl || null);
      }
    };

    // 1. Ejecutar al montar
    checkAvatar();

    // 2. Escuchar un evento personalizado que dispararemos cuando subas la foto
    window.addEventListener('avatarUpdated', checkAvatar);

    return () => window.removeEventListener('avatarUpdated', checkAvatar);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img
          src={UNAM_LOGO as string}
          alt="UNAM"
          className="navbar-logo-img"
        />
        <span className="navbar-logo-text">
          Universidad Nacional<br />Autónoma de México
        </span>
      </div>

      <div className="navbar-right">
        {showAcatlan && (
          <div className="navbar-acatlan">
            <img
              src={FESA_LOGO as string}
              alt="FES Acatlán"
              className="navbar-logo-img"
            />
            <div className="acatlan-text">
              {/* Contenido opcional */}
            </div>
          </div>
        )}

        {/* 3. Lógica del Avatar: Foto o Inicial */}
        {(avatarUrl || userInitial) && (
          <div
            className="user-avatar"
            style={{
              overflow: 'hidden',
              padding: avatarUrl ? 0 : undefined
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Perfil"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              userInitial
            )}
          </div>
        )}
      </div>
    </nav>
  );
}