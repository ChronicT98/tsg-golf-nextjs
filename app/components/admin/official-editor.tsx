'use client';

import { useState, useEffect } from 'react';
import { OfficialDetails } from '@/app/types/officials';
import '@/app/styles/admin.css';

interface OfficialEditorProps {
  official?: OfficialDetails;
  onSave: (updatedOfficial: OfficialDetails) => void;
  onCancel: () => void;
}

export default function OfficialEditor({ official, onSave, onCancel }: OfficialEditorProps) {
  const [formData, setFormData] = useState<OfficialDetails>({
    name: '',
    role1: '',
    role2: '',
  });

  useEffect(() => {
    if (official) {
      setFormData(official);
    }
  }, [official]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation of required fields
    if (!formData.name || !formData.role1) {
      alert('Bitte fülle Name und mindestens eine Rolle aus.');
      return;
    }
    
    // Save the official
    onSave(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="admin-editor">
      <h2>{official ? 'Funktionär bearbeiten' : 'Neuer Funktionär'}</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role1">Rolle/Funktion 1 *</label>
          <input
            type="text"
            id="role1"
            name="role1"
            value={formData.role1}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role2">Rolle/Funktion 2 (optional)</label>
          <input
            type="text"
            id="role2"
            name="role2"
            value={formData.role2 || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="save-button">
            Speichern
          </button>
          <button type="button" onClick={onCancel} className="cancel-button">
            Abbrechen
          </button>
          {official && official.id && (
            <button 
              type="button" 
              onClick={() => {
                if (window.confirm(`Möchten Sie diese Rolle wirklich löschen?`)) {
                  // Delete the official
                  fetch('/api/officials', {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: official.id }),
                  })
                    .then(response => {
                      if (!response.ok) throw new Error('Failed to delete official');
                      onCancel(); // Close dialog
                      window.location.reload(); // Reload page
                    })
                    .catch(error => {
                      console.error('Error deleting official:', error);
                      alert('Fehler beim Löschen des Funktionärs');
                    });
                }
              }}
              className="delete-button"
            >
              🗑️
            </button>
          )}
        </div>
      </form>
    </div>
  );
}