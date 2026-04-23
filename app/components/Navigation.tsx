'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

export default function Navigation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Schließe Sidebar, wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar-menu');
      const menuButton = document.getElementById('sidebar-toggle');
      
      if (sidebar && menuButton && 
          !sidebar.contains(event.target as Node) && 
          !menuButton.contains(event.target as Node) &&
          isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Verhindere Scrollen, wenn Sidebar geöffnet ist
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <>
      <div className="nav-sticky-wrapper">
        <div className="sidebar-navigation">
          <div style={{ display: 'flex', alignItems: 'center', padding: '0' }}>
            <button 
              id="sidebar-toggle"
              className={`sidebar-toggle-button ${isSidebarOpen ? 'active' : ''}`}
              aria-label={isSidebarOpen ? "Menü schließen" : "Menü öffnen"}
              onClick={toggleSidebar}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay zum Schließen der Sidebar */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
      
      <nav 
        id="sidebar-menu" 
        className={`sidebar-menu ${isSidebarOpen ? 'active' : ''}`}
      >
        <div className="sidebar-header">
          <h3>Navigation</h3>
          <button 
            className="sidebar-close"
            aria-label="Sidebar schließen"
            onClick={toggleSidebar}
          >
            <span>&times;</span>
          </button>
        </div>
        
        <ul className="sidebar-menu-items">
          <li><Link href="/" onClick={toggleSidebar}>Home</Link></li>
          <li><Link href="/regelwerk" onClick={toggleSidebar}>Regelwerk</Link></li>
          <li><Link href="/mitglieder" onClick={toggleSidebar}>Mitglieder</Link></li>
          <li><Link href="/spielergebnisse" onClick={toggleSidebar}>Spielergebnisse</Link></li>
          <li><Link href="/blechstatistik" onClick={toggleSidebar}>Blechstatistik</Link></li>
          <li><Link href="/turnierplan" onClick={toggleSidebar}>Turnierplan</Link></li>
          <li><Link href="/fotogalerie" onClick={toggleSidebar}>Fotogalerie</Link></li>
          <li><Link href="/videos" onClick={toggleSidebar}>Videos</Link></li>
          <li><Link href="/kontakt" onClick={toggleSidebar}>Kontakt</Link></li>
          <li className="sidebar-admin-item"><Link href="/admin/login" onClick={toggleSidebar}>Admin</Link></li>
        </ul>
      </nav>
    </>
  );
}