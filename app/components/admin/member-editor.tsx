'use client';

import { useState, useEffect } from 'react';
import { MemberDetails } from '@/app/types/members';
import Image from 'next/image';
import '@/app/styles/admin.css';
import { supabase } from '@/app/utils/supabase';

// Funktion zum Hochladen des Bildes
const uploadMemberImage = async (file: File, memberId: string): Promise<string | null> => {
  try {
    // Generiere einen eindeutigen Dateinamen basierend auf memberId und Timestamp
    const fileName = `${memberId}_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `members/${fileName}`;
    
    // Datei in ArrayBuffer umwandeln
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Hochladen zur Supabase Storage
    const { error } = await supabase.storage
      .from('memberimages') // Der Name deines Supabase Storage Buckets
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Fehler beim Hochladen des Bildes:', error);
      return null;
    }
    
    // Öffentliche URL für das Bild generieren
    const { data: { publicUrl } } = supabase.storage
      .from('memberimages')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (err) {
    console.error('Fehler beim Bildupload:', err);
    return null;
  }
};

// Komponente für den Bildupload
const ImageUploadField = ({ onImageUploaded }: { onImageUploaded: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      setUploadError('Bitte wähle eine Bilddatei aus.');
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    
    // Temporäre ID für Dateibenennung
    const tempId = 'temp_' + Date.now();
    
    try {
      const imageUrl = await uploadMemberImage(file, tempId);
      if (imageUrl) {
        onImageUploaded(imageUrl);
      } else {
        setUploadError('Fehler beim Hochladen des Bildes.');
      }
    } catch (err) {
      console.error('Upload fehlgeschlagen:', err);
      setUploadError('Upload fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="image-upload-field">
      <label htmlFor="member-image" className="upload-button">
        {uploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
        <input
          type="file"
          id="member-image"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>
      {uploadError && <p className="error-message">{uploadError}</p>}
      
      <style jsx>{`
        .image-upload-field {
          margin-top: 0.5rem;
        }
        .upload-button {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: #1a73e8;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .upload-button:hover {
          background: #1557b0;
        }
        .error-message {
          color: #dc3545;
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

interface MemberEditorProps {
  member?: MemberDetails;
  category: 'gruendungsmitglieder' | 'ordentlicheMitglieder' | 'inMemoriam';
  onSave: (updatedMember: MemberDetails) => void;
  onCancel: () => void;
}

export default function MemberEditor({ member, category, onSave, onCancel }: MemberEditorProps) {
  const [formData, setFormData] = useState<MemberDetails>({
    name: '',
    hcp: '',
    imagesrc: '',
    category: category,
    spitzname: '',
    geboren: '',
    beruf: '',
    handy: '',
    email: '',
    web: '',
    verstorben: '',
  });

  useEffect(() => {
    if (member) {
      setFormData(member);
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Stelle sicher, dass die Kategorie gesetzt ist
    const updatedMember = {
      ...formData,
      category
    };
    onSave(updatedMember);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handler für erfolgreichen Bildupload
  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({
      ...prev,
      imagesrc: url
    }));
  };

  return (
    <div className="admin-editor">
      <h2>{member ? 'Mitglied bearbeiten' : 'Neues Mitglied'}</h2>
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
          <label htmlFor="hcp">Handicap *</label>
          <input
            type="text"
            id="hcp"
            name="hcp"
            value={formData.hcp}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="spitzname">Spitzname</label>
          <input
            type="text"
            id="spitzname"
            name="spitzname"
            value={formData.spitzname || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="geboren">Geboren</label>
          <input
            type="text"
            id="geboren"
            name="geboren"
            value={formData.geboren || ''}
            onChange={handleInputChange}
            placeholder="DD.MM.YYYY"
          />
        </div>

        <div className="form-group">
          <label htmlFor="beruf">Beruf</label>
          <input
            type="text"
            id="beruf"
            name="beruf"
            value={formData.beruf || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="handy">Handy</label>
          <input
            type="text"
            id="handy"
            name="handy"
            value={formData.handy || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="web">Website</label>
          <input
            type="text"
            id="web"
            name="web"
            value={formData.web || ''}
            onChange={handleInputChange}
          />
        </div>

        {category === 'inMemoriam' && (
          <div className="form-group">
            <label htmlFor="verstorben">Verstorben</label>
            <input
              type="text"
              id="verstorben"
              name="verstorben"
              value={formData.verstorben || ''}
              onChange={handleInputChange}
              placeholder="DD.MM.YYYY"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="imagesrc">Bild URL *</label>
          <input
            type="text"
            id="imagesrc"
            name="imagesrc"
            value={formData.imagesrc}
            onChange={handleInputChange}
            required
          />
          <p className="help-text" style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            Du kannst entweder eine URL manuell eingeben oder das Bild direkt hochladen:
          </p>
          
          {/* Hier die neue Komponente einfügen */}
          <ImageUploadField onImageUploaded={handleImageUploaded} />
        </div>

        {formData.imagesrc && (
          <div className="image-preview">
            <Image
              src={formData.imagesrc}
              alt={formData.name || 'Vorschau'}
              width={100}
              height={100}
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <div className="button-group">
          <button type="submit" className="save-button">
            Speichern
          </button>
          <button type="button" onClick={onCancel} className="cancel-button">
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
