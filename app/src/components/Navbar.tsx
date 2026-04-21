import React from 'react';
import './Navbar.css';
import { UNAM_LOGO, FESA_LOGO } from '../utils/img/assets';

// Definimos la interfaz correctamente
interface NavbarProps {
  showAcatlan?: boolean;
  userInitial?: string | null;
}

// Estos componentes podrías moverlos a archivos separados si crecen, 
// por ahora los tipamos como React.FC (Functional Components)
const UNAMLogo: React.FC = () => (
  <div className="logo-placeholder unam">UNAM</div>
);

const AcatlanLogo: React.FC = () => (
  <div className="logo-placeholder acatlan">FES<br/>Acatlán</div>
);

export default function Navbar({ 
  showAcatlan = false, 
  userInitial = null 
}: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img
          src={UNAM_LOGO as string} // Hacemos un cast a string por seguridad
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
            {/* Aquí podrías invocar <AcatlanLogo /> si necesitas el texto */}
            <div className="acatlan-text">
              {/* Contenido opcional */}
            </div>
          </div>
        )}
        
        {userInitial && (
          <div className="user-avatar">
            {userInitial}
          </div>
        )}
      </div>
    </nav>
  );
}