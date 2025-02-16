'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  return (
    <div className="nav-sticky-wrapper">
      <nav className="nav-container">
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <li><Link href="/" onClick={toggleMenu}>Home</Link></li>
          <li><Link href="/regelwerk" onClick={toggleMenu}>Regelwerk</Link></li>
          <li><Link href="/blechstatistik" onClick={toggleMenu}>Blechstatistik</Link></li>
          <li><Link href="/mitglieder" onClick={toggleMenu}>Mitglieder</Link></li>
          <li><Link href="/turnierplan" onClick={toggleMenu}>Turnierplan</Link></li>
          <li><Link href="/spielergebnisse" onClick={toggleMenu}>Spielergebnisse</Link></li>
          <li><Link href="/kontakt" onClick={toggleMenu}>Kontakt</Link></li>
        </ul>
        <button 
          className="mobile-menu-close"
          aria-label="Menü schließen"
          onClick={toggleMenu}
        />
        <button 
          className={`mobile-menu-button ${isMenuOpen ? 'active' : ''}`}
          aria-label={isMenuOpen ? "Menü schließen" : "Menü öffnen"}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
    </div>
  );
}