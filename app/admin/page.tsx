'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import PdfConverter from '@/app/components/admin/pdf-converter';
import ScorecardManager from '@/app/components/admin/scorecard-manager';
import MemberEditor from '@/app/components/admin/member-editor';
import GalleryUpload from '@/app/components/admin/gallery-upload';
import YouTubeVideoManager from '@/app/components/admin/youtube-video-manager';
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

type AdminSection = 'scorecards' | 'members' | 'gallery' | 'videos';

export default function AdminPage() {
  const { status } = useSession();
  const [gruendungsmitglieder, setGruendungsmitglieder] = useState<MemberDetails[]>([]);
  const [ordentlicheMitglieder, setOrdentlicheMitglieder] = useState<MemberDetails[]>([]);
  const [inMemoriam, setInMemoriam] = useState<MemberDetails[]>([]);
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceCategory = result.source.droppableId;
    const destinationCategory = result.destination.droppableId;

    // Nur Reordering innerhalb der gleichen Kategorie erlauben
    if (sourceCategory !== destinationCategory) return;

    let items: MemberDetails[];
    let setItems: React.Dispatch<React.SetStateAction<MemberDetails[]>>;

    switch (sourceCategory) {
      case 'gruendungsmitglieder':
        items = [...gruendungsmitglieder];
        setItems = setGruendungsmitglieder;
        break;
      case 'ordentlicheMitglieder':
        items = [...ordentlicheMitglieder];
        setItems = setOrdentlicheMitglieder;
        break;
      case 'inMemoriam':
        items = [...inMemoriam];
        setItems = setInMemoriam;
        break;
      default:
        return;
    }

    // Element verschieben
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Neue Reihenfolge setzen
    items.forEach((item, index) => {
      item.order = index;
    });

    // State aktualisieren
    setItems(items);

    try {
      // Alle Änderungen an die API senden
      const updates = items.map((member) => ({
        id: member.id,
        order: member.order
      }));

      const response = await fetch('/api/members/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: sourceCategory,
          updates
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      // Optionally revert the state if the API call fails
    }
  };

  // Lade Mitgliederdaten
  useEffect(() => {
    async function loadMembers() {
      try {
        const response = await fetch('/api/members');
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        
        const members = await response.json();
        
        // Sortiere die Mitglieder in ihre Kategorien und nach order
        setGruendungsmitglieder(
          members
            .filter((m: MemberDetails) => m.category === 'gruendungsmitglieder')
            .sort((a: MemberDetails, b: MemberDetails) => (a.order || 0) - (b.order || 0))
        );
        setOrdentlicheMitglieder(
          members
            .filter((m: MemberDetails) => m.category === 'ordentlicheMitglieder')
            .sort((a: MemberDetails, b: MemberDetails) => (a.order || 0) - (b.order || 0))
        );
        setInMemoriam(
          members
            .filter((m: MemberDetails) => m.category === 'inMemoriam')
            .sort((a: MemberDetails, b: MemberDetails) => (a.order || 0) - (b.order || 0))
        );
      } catch (err) {
        console.error('Error loading members:', err);
      }
    }

    if (status === 'authenticated') {
      loadMembers();
    }
  }, [status]);
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
          <button
            className={`toggle-button ${activeSection === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveSection('gallery')}
          >
            Fotogalerie Verwaltung
          </button>
          <button
            className={`toggle-button ${activeSection === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveSection('videos')}
          >
            Video Verwaltung
          </button>
        </div>

        {activeSection === 'members' && (
          <div className="members-manager">
          <h2>Mitglieder Verwaltung</h2>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="member-categories">
              <div className="member-category">
                <h3>Gründungsmitglieder</h3>
                <Droppable droppableId="gruendungsmitglieder">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {gruendungsmitglieder.map((member, index) => (
                        <Draggable
                          key={member.id?.toString() || index.toString()}
                          draggableId={member.id?.toString() || index.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="member-row"
                            >
                              <span>{member.name}</span>
                              <button 
                                onClick={() => setSelectedMember({ member, category: 'gruendungsmitglieder' })}
                                className="edit-button"
                              >
                                Bearbeiten
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              <button 
                onClick={() => setSelectedMember({ member: undefined, category: 'gruendungsmitglieder' })}
                className="add-button"
              >
                + Neues Mitglied
              </button>
            </div>

              <div className="member-category">
                <h3>Mitglieder</h3>
                <Droppable droppableId="ordentlicheMitglieder">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {ordentlicheMitglieder.map((member, index) => (
                        <Draggable
                          key={member.id?.toString() || index.toString()}
                          draggableId={member.id?.toString() || index.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="member-row"
                            >
                              <span>{member.name}</span>
                              <button 
                                onClick={() => setSelectedMember({ member, category: 'ordentlicheMitglieder' })}
                                className="edit-button"
                              >
                                Bearbeiten
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              <button 
                onClick={() => setSelectedMember({ member: undefined, category: 'ordentlicheMitglieder' })}
                className="add-button"
              >
                + Neues Mitglied
              </button>
            </div>

              <div className="member-category">
                <h3>In Memoriam</h3>
                <Droppable droppableId="inMemoriam">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {inMemoriam.map((member, index) => (
                        <Draggable
                          key={member.id?.toString() || index.toString()}
                          draggableId={member.id?.toString() || index.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="member-row"
                            >
                              <span>{member.name}</span>
                              <button 
                                onClick={() => setSelectedMember({ member, category: 'inMemoriam' })}
                                className="edit-button"
                              >
                                Bearbeiten
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              <button 
                onClick={() => setSelectedMember({ member: undefined, category: 'inMemoriam' })}
                className="add-button"
              >
                + Neues Mitglied
              </button>
            </div>
          </div>
          </DragDropContext>

          {selectedMember && (
            <div className="modal-overlay">
              <div className="modal-content">
                <MemberEditor
                  member={selectedMember.member}
                  category={selectedMember.category}
                  onSave={async (updatedMember: MemberDetails) => {
                    try {
                      const response = await fetch('/api/members', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          member: updatedMember,
                          category: selectedMember.category
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
                <p>PDF-Dateien hochladen. Diese werden automatisch in JPEG konvertiert und in den entsprechenden Ordner gespeichert.</p>
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

        {activeSection === 'gallery' && (
          <div className="gallery-manager">
            <h2>Medien Verwaltung</h2>
            
            <div className="upload-tools">
              <div className="gallery-section">
                <h3>Bilder zur Fotogalerie hinzufügen</h3>
                <p>
                  Hier können Bilder für verschiedene Kategorien der Fotogalerie hochgeladen werden.
                </p>
                <GalleryUpload 
                  onUploadComplete={(results) => {
                    // Show feedback to user
                    if (results && results.length > 0) {
                      const successCount = results.filter((r: UploadResult) => r.success).length;
                      const totalCount = results.length;
                      
                      setUploadStatus({
                        message: `${successCount} von ${totalCount} Bilder erfolgreich hochgeladen.`,
                        type: successCount === totalCount ? 'success' : 'error'
                      });
                    }
                  }}
                />
                {uploadStatus.type !== 'none' && (
                  <div className={`upload-status ${uploadStatus.type}`}>
                    {uploadStatus.message.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="gallery-note">
              <h3>Hinweis</h3>
              <p>
                Die hochgeladenen Bilder werden automatisch in der Fotogalerie angezeigt und nach Kategorien sortiert.
                Um die Galerie anzusehen, besuchen Sie die <a href="/fotogalerie" target="_blank" rel="noopener noreferrer">Fotogalerie-Seite</a>.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'videos' && (
          <div className="videos-manager">
            <h2>YouTube Video Verwaltung</h2>
            
            <div className="upload-tools">
              <div className="video-section">
                <h3>YouTube Videos hinzufügen</h3>
                <p>
                  Hier können YouTube-Videos für die Video-Galerie hinzugefügt werden.
                  YouTube-URL oder Video-ID und Titel eingeben, optional eine Beschreibung hinzufügen.
                </p>
                <p>
                  Die Videos werden auf der <a href="/videos" className="text-gradient" rel="noopener noreferrer">Video-Seite</a> angezeigt.
                </p>
                <YouTubeVideoManager 
                  onAddComplete={(result) => {
                    if (result && result.success) {
                      setUploadStatus({
                        message: `YouTube-Video wurde erfolgreich hinzugefügt.`,
                        type: 'success'
                      });
                    }
                  }} 
                />
                {uploadStatus.type !== 'none' && (
                  <div className={`upload-status ${uploadStatus.type}`}>
                    {uploadStatus.message.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="gallery-note">
              <h3>Hinweis</h3>
              <p>
                Die Videos werden direkt von YouTube eingebettet und müssen daher nicht hochgeladen werden.
                Sie benötigen lediglich die YouTube-Video-URL oder Video-ID.
              </p>
              <p>
                YouTube-Video-URLs haben folgendes Format: <code>https://www.youtube.com/watch?v=XXXXXXXXXXX</code>, 
                wobei &quot;XXXXXXXXXXX&quot; die Video-ID ist.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}