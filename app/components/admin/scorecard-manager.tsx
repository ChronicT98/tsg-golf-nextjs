'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface StaticFiles {
  geld?: string;
  statistik?: string;
  blechen?: string;
}

interface SpielScorecard {
  id: string;
  date: string;
  fileName: string;
  geldFileName?: string;
}

interface YearData {
  static: StaticFiles;
  spielCards: SpielScorecard[];
}

interface ScorecardData {
  [year: string]: YearData;
}

export default function ScorecardManager() {
  const [scorecards, setScorecards] = useState<ScorecardData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<{id: string, date: string, year: string} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [yearInput, setYearInput] = useState<string>('');

  useEffect(() => {
    fetchScorecards();
    fetchYears();
  }, []);

  const fetchYears = async () => {
    const res = await fetch('/api/years');
    const data = await res.json();
    setAvailableYears(data);
  };

  const handleAddYear = async () => {
    const year = parseInt(yearInput);
    if (!year || year < 2000 || year > 2100) return;
    const res = await fetch('/api/years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year }),
    });
    setAvailableYears(await res.json());
    setYearInput('');
  };

  const handleRemoveYear = async (year: number) => {
    const res = await fetch('/api/years', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year }),
    });
    setAvailableYears(await res.json());
  };

  const fetchScorecards = async () => {
    try {
      const response = await fetch('/api/scorecards');
      if (!response.ok) throw new Error('Fehler beim Laden der Scorecards');
      const data = await response.json();
      setScorecards(data);
      // Set the most recent year as default
      const years = Object.keys(data).sort((a, b) => b.localeCompare(a));
      if (years.length > 0) setSelectedYear(years[0]);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setLoading(false);
    }
  };

  const handleDeleteClick = (year: string, card: SpielScorecard) => {
    setCardToDelete({
      id: card.id,
      date: card.date,
      year
    });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/scorecards?year=${cardToDelete.year}&id=${cardToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Fehler beim Löschen der Scorecard');
      
      // Update local state
      setScorecards(prev => {
        const updated = { ...prev };
        updated[cardToDelete.year].spielCards = updated[cardToDelete.year].spielCards.filter(
          card => card.id !== cardToDelete.id
        );
        return updated;
      });

      // Close modal
      setShowDeleteConfirm(false);
      setCardToDelete(null);
    } catch (err) {
      alert('Fehler beim Löschen der Scorecard');
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div>Lade Scorecards...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const years = Object.keys(scorecards).sort((a, b) => b.localeCompare(a));

  return (
    <div className="scorecard-manager">
      <div className="year-manager" style={{ marginBottom: '24px', padding: '16px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9' }}>
        <h4 style={{ marginTop: 0 }}>Jahre verwalten</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {availableYears.map(year => (
            <div key={year} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #ccc', borderRadius: '6px', padding: '4px 10px' }}>
              <span>{year}</span>
              <button
                onClick={() => handleRemoveYear(year)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontWeight: 'bold', fontSize: '16px', lineHeight: 1 }}
                title="Jahr entfernen"
              >×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            value={yearInput}
            onChange={e => setYearInput(e.target.value)}
            placeholder="z.B. 2027"
            style={{ width: '100px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            onKeyDown={e => e.key === 'Enter' && handleAddYear()}
          />
          <button
            onClick={handleAddYear}
            className="btn btn-primary btn-sm"
          >
            + Jahr hinzufügen
          </button>
        </div>
      </div>

      <div className="year-selector">
        <label htmlFor="year-select">Jahr auswählen: </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {selectedYear && scorecards[selectedYear] && (
        <div className="scorecards-list">
          <h4>Scorecards für {selectedYear}</h4>
          
          {scorecards[selectedYear].static.statistik && (
            <div className="statistics-card">
              <h5>Jahresstatistik</h5>
              <div className="card-preview">
                <Image
                  src={scorecards[selectedYear].static.statistik}
                  alt={`Statistik ${selectedYear}`}
                  width={200}
                  height={150}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {scorecards[selectedYear].static.blechen && (
            <div className="statistics-card">
              <h5>Blechstatistik</h5>
              <div className="card-preview">
                <Image
                  src={scorecards[selectedYear].static.blechen}
                  alt={`Blechstatistik ${selectedYear}`}
                  width={200}
                  height={150}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
          )}
          
          

          <div className="cards-grid">
            {scorecards[selectedYear].spielCards.map((card) => (
              <div key={card.id} className="scorecard-item">
                <div className="card-info">
                  <span className="card-date">{card.date}</span>
                  <div className="card-actions">
                    <button
                      onClick={() => handleDeleteClick(selectedYear, card)}
                      className="btn btn-danger btn-sm delete-button"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="card-previews">
                  <div className="preview-container">
                    <h6>Scorecard</h6>
                    <Image
                      src={card.fileName}
                      alt={`Scorecard ${card.date}`}
                      width={150}
                      height={100}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  {card.geldFileName && (
                    <div className="preview-container">
                      <h6>Geldkarte</h6>
                      <Image
                        src={card.geldFileName}
                        alt={`Geldkarte ${card.date}`}
                        width={150}
                        height={100}
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bestätigungs-Dialog für das Löschen */}
      {showDeleteConfirm && cardToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Scorecard löschen</h2>
            
            <div className="warning-message">
              <p>
                Soll die Scorecard vom <strong>{cardToDelete.date}</strong> wirklich gelöscht werden?
              </p>
              <p>
                <strong>Dies wird die Scorecard unwiderruflich löschen!</strong>
              </p>
            </div>
            
            <div className="button-group">
              <button 
                className="cancel-button" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCardToDelete(null);
                }}
                disabled={deleteLoading}
              >
                Abbrechen
              </button>
              
              <button 
                className="delete-button" 
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Wird gelöscht...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}