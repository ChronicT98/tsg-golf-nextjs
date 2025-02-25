'use client';

import { useState, useEffect } from 'react';
import { MemberDetails } from '@/app/types/members';
import Image from 'next/image';
import '@/app/styles/admin.css';

interface MemberEditorProps {
  member?: MemberDetails;
  category: 'gruendungsmitglieder' | 'ordentlicheMitglieder' | 'inMemoriam';
  onSave: (updatedMember: MemberDetails, category: string) => void;
  onCancel: () => void;
}

export default function MemberEditor({ member, category, onSave, onCancel }: MemberEditorProps) {
  const [formData, setFormData] = useState<MemberDetails>({
    name: '',
    hcp: '',
    imageSrc: '',
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
    onSave(formData, category);
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
          <label htmlFor="imageSrc">Bild URL *</label>
          <input
            type="text"
            id="imageSrc"
            name="imageSrc"
            value={formData.imageSrc}
            onChange={handleInputChange}
            required
          />
        </div>

        {formData.imageSrc && (
          <div className="image-preview">
            <Image
              src={formData.imageSrc}
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