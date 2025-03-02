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

  useEffect(() => {
    fetchScorecards();
  }, []);

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