import React from 'react';
import Link from 'next/link';
import './Footer.css';

interface FooterProps {
  appName?: string;
}

export default function Footer({ appName = 'PUMA IA' }: FooterProps) {
  return (
    <footer className="footer">
      <Link href="/faqs" className="footer-help" title="Ayuda y preguntas frecuentes">
        ?
      </Link>
      
      <a href="/faqs">¿Qué es {appName}?</a>
      <a href="https://www.unam.mx/" target="_blank" rel="noopener noreferrer">
        Información legal
      </a>
      <a href="https://www.unam.mx/" target="_blank" rel="noopener noreferrer">
        Página oficial UNAM
      </a>
    </footer>
  );
}