'use client';

import React, { useState, useEffect } from 'react';
import { MemberDetails, MemberData } from '@/app/types/members';

export default function MemberEditor() {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<keyof MemberData>('gruendungsmitglieder');
  const [editingMember, setEditingMember] = useState<MemberDetails | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    try {
      const response = await fetch('/api/members');
      if (!response.ok) throw new Error('Fehler beim Laden der Mitgliederdaten');
      const data = await response.json();
      setMemberData(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setLoading(false);
    }
  };

  const [savingMember, setSavingMember] = useState(false);

  const startEditing = (member: MemberDetails, index: number) => {
    setEditingMember({ ...member });
    setEditingIndex(index);
  };

  const saveEdit = async () => {
    if (!memberData || editingMember === null || editingIndex === null) return;

    setSavingMember(true);
    try {
      const newData = { ...memberData };
      newData[activeCategory][editingIndex] = editingMember;

      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });

      if (!response.ok) throw new Error('Fehler beim Speichern');

      setMemberData(newData);
      setEditingMember(null);
      setEditingIndex(null);
    } catch (err) {
      alert('Fehler beim Speichern der Änderungen');
      console.error(err);
    } finally {
      setSavingMember(false);
    }
  };

  const cancelEdit = () => {
    setEditingMember(null);
    setEditingIndex(null);
  };

  const updateEditingMember = (field: keyof MemberDetails, value: string) => {
    if (!editingMember) return;
    setEditingMember({ ...editingMember, [field]: value });
  };

  if (loading) return <div>Lade Mitgliederdaten...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!memberData) return <div>Keine Daten verfügbar</div>;

  return (
    <div className="member-editor">
      <h2>Mitglieder bearbeiten</h2>
      
      <div className="editor-controls">
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value as keyof MemberData)}
          className="category-selector"
        >
          <option value="gruendungsmitglieder">Gründungsmitglieder</option>
          <option value="ordentlicheMitglieder">Ordentliche Mitglieder</option>
          <option value="inMemoriam">In Memoriam</option>
        </select>

      </div>

      <div className="members-list">
        {memberData[activeCategory].map((member, index) => (
          <div key={member.name} className="member-item">
            {editingIndex === index ? (
              <div className="member-edit-form">
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={editingMember?.name || ''}
                    onChange={(e) => updateEditingMember('name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Handicap:</label>
                  <input
                    type="text"
                    value={editingMember?.hcp || ''}
                    onChange={(e) => updateEditingMember('hcp', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Spitzname:</label>
                  <input
                    type="text"
                    value={editingMember?.spitzname || ''}
                    onChange={(e) => updateEditingMember('spitzname', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Geboren:</label>
                  <input
                    type="text"
                    value={editingMember?.geboren || ''}
                    onChange={(e) => updateEditingMember('geboren', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Firma/Beruf:</label>
                  <input
                    type="text"
                    value={editingMember?.firma || editingMember?.beruf || ''}
                    onChange={(e) => {
                      if (activeCategory === 'gruendungsmitglieder') {
                        updateEditingMember('firma', e.target.value);
                      } else {
                        updateEditingMember('beruf', e.target.value);
                      }
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Handy:</label>
                  <input
                    type="text"
                    value={editingMember?.handy || ''}
                    onChange={(e) => updateEditingMember('handy', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="text"
                    value={editingMember?.email || ''}
                    onChange={(e) => updateEditingMember('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Website:</label>
                  <input
                    type="text"
                    value={editingMember?.web || ''}
                    onChange={(e) => updateEditingMember('web', e.target.value)}
                  />
                </div>
                {activeCategory === 'inMemoriam' && (
                  <div className="form-group">
                    <label>Verstorben:</label>
                    <input
                      type="text"
                      value={editingMember?.verstorben || ''}
                      onChange={(e) => updateEditingMember('verstorben', e.target.value)}
                    />
                  </div>
                )}
                <div className="edit-actions">
                  <button 
                    onClick={saveEdit} 
                    className="save-edit" 
                    disabled={savingMember}
                  >
                    {savingMember ? 'Wird gespeichert...' : 'Speichern'}
                  </button>
                  <button onClick={cancelEdit} className="cancel-edit">Abbrechen</button>
                </div>
              </div>
            ) : (
              <div className="member-display">
                <h3>{member.name}</h3>
                <p>Handicap: {member.hcp}</p>
                {member.spitzname && <p>Spitzname: {member.spitzname}</p>}
                <button onClick={() => startEditing(member, index)} className="edit-button">
                  Bearbeiten
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .member-editor {
          padding: 20px;
        }

        .editor-controls {
          margin-bottom: 20px;
        }

        .category-selector {
          padding: 8px;
          font-size: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
        }

        .members-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .member-item {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 4px;
        }

        .member-display {
          position: relative;
        }

        .edit-button {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 5px 10px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .member-edit-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .edit-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .save-edit, .cancel-edit {
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          border: none;
        }

        .save-edit {
          background-color: #4CAF50;
          color: white;
          transition: all 0.3s ease;
        }

        .save-edit:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .cancel-edit {
          background-color: #757575;
          color: white;
        }
      `}</style>
    </div>
  );
}