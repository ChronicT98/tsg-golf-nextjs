'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import PdfConverter from '@/app/components/admin/pdf-converter';
import ScorecardManager from '@/app/components/admin/scorecard-manager';

interface UploadResult {
  success: boolean;
  fileName: string;
  error?: string;
}
import '@/app/styles/admin.css';

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'none';
  }>({ message: '', type: 'none' });

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
    
    setUploadStatus({ message: 'Dateien werden hochgeladen...', type: 'none' });
    const formData = new FormData();
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Check results for any failures
      const results: UploadResult[] = data.results || [];
      const failures = results.filter((r) => !r.success);
      
      if (failures.length > 0) {
        const failureMessages = failures
          .map((f) => `${f.fileName}: ${f.error}`)
          .join('\n');
        setUploadStatus({
          message: `Einige Dateien konnten nicht hochgeladen werden:\n${failureMessages}`,
          type: 'error'
        });
      } else {
        setUploadStatus({
          message: 'Alle Dateien wurden erfolgreich hochgeladen!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus({
        message: error instanceof Error ? error.message : 'Fehler beim Hochladen der Dateien',
        type: 'error'
      });
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

          <div className="upload-tools">
            <div className="converter-section">
              <h3>PDF Hochladen und Konvertieren</h3>
              <p>Lade PDF-Dateien hoch. Diese werden automatisch in JPEG konvertiert und in den entsprechenden Ordner gespeichert.</p>
              <PdfConverter onConversionComplete={handleFileUpload} />
              {uploadStatus.type !== 'none' && (
                <div className={`upload-status ${uploadStatus.type}`}>
                  {uploadStatus.message.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="existing-cards">
            <h3>Vorhandene Scorecards</h3>
            <ScorecardManager />
          </div>
        </div>
      </div>
    </div>
  );
}