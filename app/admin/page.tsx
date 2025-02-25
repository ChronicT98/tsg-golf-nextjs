'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import PdfConverter from '@/app/components/admin/pdf-converter';
import ScorecardManager from '@/app/components/admin/scorecard-manager';
import MemberEditor from '@/app/components/admin/member-editor';
import { gruendungsmitglieder, ordentlicheMitglieder, inMemoriam } from '@/app/mitglieder/data';
import type { MemberDetails } from '@/app/types/members';

interface UploadResult {
  success: boolean;
  fileName: string;
  error?: string;
}
import '@/app/styles/admin.css';

interface SelectedMember {
  member?: MemberDetails;
  category: 'gruendungsmitglieder' | 'ordentlicheMitglieder' | 'inMemoriam';
}

type AdminSection = 'scorecards' | 'members';

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('scorecards');
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
        <div className="section-toggles">
          <button
            className={`toggle-button ${activeSection === 'scorecards' ? 'active' : ''}`}
            onClick={() => setActiveSection('scorecards')}
          >
            Spielergebnisse Verwaltung
          </button>
          <button
            className={`toggle-button ${activeSection === 'members' ? 'active' : ''}`}
            onClick={() => setActiveSection('members')}
          >
            Mitglieder Verwaltung
          </button>
        </div>

        {activeSection === 'members' && (
          <div className="members-manager">
          <h2>Mitglieder Verwaltung</h2>
          <div className="member-categories">
            <div className="member-category">
              <h3>Gründungsmitglieder</h3>
              {gruendungsmitglieder.map((member) => (
                <div key={member.name} className="member-row">
                  <span>{member.name}</span>
                  <button 
                    onClick={() => setSelectedMember({ member, category: 'gruendungsmitglieder' })}
                    className="edit-button"
                  >
                    Bearbeiten
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setSelectedMember({ member: undefined, category: 'gruendungsmitglieder' })}
                className="add-button"
              >
                + Neues Mitglied
              </button>
            </div>

            <div className="member-category">
              <h3>Mitglieder</h3>
              {ordentlicheMitglieder.map((member) => (
                <div key={member.name} className="member-row">
                  <span>{member.name}</span>
                  <button 
                    onClick={() => setSelectedMember({ member, category: 'ordentlicheMitglieder' })}
                    className="edit-button"
                  >
                    Bearbeiten
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setSelectedMember({ member: undefined, category: 'ordentlicheMitglieder' })}
                className="add-button"
              >
                + Neues Mitglied
              </button>
            </div>

            <div className="member-category">
              <h3>In Memoriam</h3>
              {inMemoriam.map((member) => (
                <div key={member.name} className="member-row">
                  <span>{member.name}</span>
                  <button 
                    onClick={() => setSelectedMember({ member, category: 'inMemoriam' })}
                    className="edit-button"
                  >
                    Bearbeiten
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setSelectedMember({ member: undefined, category: 'inMemoriam' })}
                className="add-button"
              >
                + Neues Mitglied
              </button>
            </div>
          </div>

          {selectedMember && (
            <div className="modal-overlay">
              <div className="modal-content">
                <MemberEditor
                  member={selectedMember.member}
                  category={selectedMember.category}
                  onSave={async (updatedMember, category) => {
                    try {
                      const response = await fetch('/api/members', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          member: updatedMember,
                          category,
                        }),
                      });

                      if (!response.ok) {
                        throw new Error('Failed to update member');
                      }

                      setSelectedMember(null);
                      window.location.reload();
                    } catch (error) {
                      console.error('Error saving member:', error);
                      alert('Fehler beim Speichern des Mitglieds');
                    }
                  }}
                  onCancel={() => setSelectedMember(null)}
                />
              </div>
            </div>
          )}
        </div>

        )}

        {activeSection === 'scorecards' && (
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
        )}
      </div>
    </div>
  );
}