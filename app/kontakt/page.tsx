'use client';
import '@/app/styles/kontakt.css';
import { useState } from 'react';

export default function KontaktPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    betreff: '',
    nachricht: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In future: Handle form submission
    window.location.href = `mailto:tobi.kafka@gmail.com?subject=${encodeURIComponent(formData.betreff)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.nachricht}`)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="kontakt">
      <div className="container">
        <h1 className="kontakt__title">Kontakt</h1>
        
        <div className="kontakt__content">
          <div className="kontakt__info-section">
            <h2 className="kontakt__subtitle">Ihre Ansprechpartner</h2>
            <div className="kontakt__info-grid">
              <div className="kontakt__info-card">
                <h3>Präsident</h3>
                <p>Christian Kafka</p>
                <p className="kontakt__info-role">Vereinsleitung & Organisation</p>
                <a href="mailto:christian.kafka@tsg-golf.at">Email senden</a>
              </div>
              
              <div className="kontakt__info-card">
                <h3>Webmaster</h3>
                <p>Tobias Kafka</p>
                <p className="kontakt__info-role">Website & Technische Fragen</p>
                <a href="mailto:tobias.kafka@tsg-golf.at">Email senden</a>
              </div>
              
              <div className="kontakt__info-card">
                <h3>Turnier Organisator</h3>
                <p>Peter Konrad</p>
                <p className="kontakt__info-role">Finanzen & Mitgliedsbeiträge</p>
                <a href="mailto:ernst.aigner@tsg-golf.at">Email senden</a>
              </div>
            </div>
          </div>

          <div className="kontakt__form-section">
            <h2 className="kontakt__subtitle">Kontaktformular</h2>
            <p className="kontakt__form-intro">
              Haben Sie Fragen oder Anliegen? Nutzen Sie unser Kontaktformular - wir melden uns zeitnah bei Ihnen zurück.
            </p>
            <form className="kontakt__form" onSubmit={handleSubmit}>
              <div className="kontakt__form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="kontakt__input"
                />
              </div>

              <div className="kontakt__form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="kontakt__input"
                />
              </div>

              <div className="kontakt__form-group">
                <label htmlFor="betreff">Betreff</label>
                <input
                  type="text"
                  id="betreff"
                  name="betreff"
                  value={formData.betreff}
                  onChange={handleChange}
                  required
                  className="kontakt__input"
                />
              </div>

              <div className="kontakt__form-group">
                <label htmlFor="nachricht">Nachricht</label>
                <textarea
                  id="nachricht"
                  name="nachricht"
                  value={formData.nachricht}
                  onChange={handleChange}
                  required
                  className="kontakt__textarea"
                  rows={5}
                />
              </div>

              <button type="submit" className="kontakt__submit">
                Nachricht senden
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}