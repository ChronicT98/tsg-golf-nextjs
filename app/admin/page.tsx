'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import FileUpload from '@/app/components/admin/file-upload';
import '@/app/styles/admin.css';

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading || status === 'loading') {
    return <div>Loading...</div>;
  }

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/admin/login');
  };

  const handleFileUpload = async (files: File[], date?: string, year?: string) => {
    if (files.length === 0) return;
    
    const formData = new FormData();
    // Append all files to formData
    files.forEach(file => {
      formData.append('file', file);
    });
    if (date) formData.append('date', date);
    if (year) formData.append('year', year);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Refresh the page to show new uploads
      router.refresh();
      // Add a small delay to ensure server has processed changes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fehler beim Hochladen der Datei');
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Abmelden
        </button>
      </div>
      
      <div className="admin-content">
        <div className="scorecards-manager">
          <h2>Spielergebnisse Verwaltung</h2>
          <div className="upload-section">
            <h3>Neue Scorecard hochladen</h3>
            <FileUpload
              onFileSelect={handleFileUpload}
              allowDateSelection={true}
              allowYearSelection={true}
            />
          </div>
          <div className="existing-cards">
            <h3>Vorhandene Scorecards</h3>
            {/* TODO: Add existing scorecards list with edit/delete functionality */}
          </div>
        </div>
      </div>
    </div>
  );
}