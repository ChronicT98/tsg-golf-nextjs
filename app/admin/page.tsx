'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/app/components/admin/file-upload';
import '@/app/styles/admin.css';

const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('adminAuthenticated') === 'true';
  }
  return false;
};

export default function AdminPage() {
  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    router.push('/admin/login');
  };
  const handleFileUpload = async (file: File, date?: string, type?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (date) formData.append('date', date);
    if (type) formData.append('type', type);

    try {
      // TODO: Implement actual file upload endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Refresh data after successful upload
      // TODO: Implement data refresh
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fehler beim Hochladen der Datei');
    }
  };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('scorecards');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Abmelden
        </button>
      </div>
      
      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'scorecards' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorecards')}
        >
          Spielergebnisse
        </button>
        <button 
          className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistik
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'scorecards' && (
          <div className="scorecards-manager">
            <h2>Spielergebnisse Verwaltung</h2>
            <div className="upload-section">
              <h3>Neue Scorecard hochladen</h3>
              <FileUpload
                onFileSelect={handleFileUpload}
                allowDateSelection={true}
                allowTypeSelection={true}
              />
            </div>
            <div className="existing-cards">
              <h3>Vorhandene Scorecards</h3>
              {/* TODO: Add existing scorecards list with edit/delete functionality */}
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="statistics-manager">
            <h2>Statistik Verwaltung</h2>
            <div className="upload-section">
              <h3>Neue Statistik hochladen</h3>
              <FileUpload
                onFileSelect={(file) => handleFileUpload(file, undefined, 'statistik')}
                allowDateSelection={false}
                allowTypeSelection={false}
              />
            </div>
            <div className="existing-statistics">
              <h3>Vorhandene Statistiken</h3>
              {/* TODO: Add existing statistics list */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}