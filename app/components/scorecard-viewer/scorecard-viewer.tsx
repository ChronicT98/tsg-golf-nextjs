import React, { useState, useEffect } from 'react';
import '@/app/styles/GolfScorecard.css';
import ImageModal from './image-modal';

interface SpielScorecard {
  id: string;
  date: string;
  fileName: string;
  geldFileName?: string;
}

interface ModalState {
  isOpen: boolean;
  imageUrl: string;
  alt: string;
}

interface StaticFiles {
  geld: string | undefined;
  statistik: string | undefined;
}

interface YearData {
  static: StaticFiles;
  spielCards: SpielScorecard[];
}

interface ScorecardData {
  [year: string]: YearData;
}

const ScorecardViewer: React.FC = () => {
  const [data, setData] = useState<ScorecardData | null>(null);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    imageUrl: '',
    alt: ''
  });

  const openModal = (imageUrl: string, alt: string) => {
    setModalState({
      isOpen: true,
      imageUrl,
      alt
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      imageUrl: '',
      alt: ''
    });
  };

  useEffect(() => {
    const fetchScorecards = async () => {
      try {
        const response = await fetch('/api/scorecards');
        if (!response.ok) throw new Error('Fehler beim Laden der Scorecards');
        const fetchedData = await response.json();
        setData(fetchedData);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Scorecards');
        setIsLoading(false);
      }
    };

    fetchScorecards();
    const intervalId = setInterval(fetchScorecards, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return <div className="loading-indicator">Laden...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!data) {
    return <div className="loading-indicator">Keine Daten gefunden</div>;
  }

  const currentYearData = data[selectedYear];

  return (
    <div className="scorecard-container">
 {/* Jahr Auswahl */}
<div className="year-selector">
<button
    onClick={() => {
      setSelectedYear('2025');
      setSelectedDate(null); // Setzt das ausgewählte Datum zurück
    }}
    className={`year-button ${selectedYear === '2025' ? 'active' : ''}`}
  >
    Meisterschaft 2025
  </button>
  <button
    onClick={() => {
      setSelectedYear('2024');
      setSelectedDate(null); // Setzt das ausgewählte Datum zurück
    }}
    className={`year-button ${selectedYear === '2024' ? 'active' : ''}`}
  >
    Meisterschaft 2024
  </button>
</div>

      {currentYearData ? (
        <div className="content-grid">
          {/* Datumsbuttons */}
          <div className="button-grid">
            {currentYearData.spielCards.map((scorecard) => (
              <button
                key={scorecard.id}
                onClick={() => setSelectedDate(scorecard.date)}
                className={`date-button ${
                  selectedDate === scorecard.date 
                    ? 'date-button-active' 
                    : 'date-button-inactive'
                }`}
              >
                {scorecard.date}
              </button>
            ))}
          </div>

          {/* Bildanzeige */}
          <div className="image-container">
            {selectedDate ? (
              <>
                {currentYearData.spielCards
                  .filter(card => card.date === selectedDate)
                  .map(card => (
                    <div key={card.id} className="selected-scorecard-container">
                      {card.geldFileName && (
                        <img
                          src={card.geldFileName}
                          alt="Geldübersicht"
                          className="scorecard-image-geld clickable-image"
                          onClick={() => openModal(card.geldFileName!, "Geldübersicht")}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              openModal(card.geldFileName!, "Geldübersicht");
                            }
                          }}
                        />
                      )}
                      <img
                        src={card.fileName}
                        alt={`Spielergebnis vom ${card.date}`}
                        className="scorecard-image clickable-image"
                        onClick={() => openModal(card.fileName, `Spielergebnis vom ${card.date}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            openModal(card.fileName, `Spielergebnis vom ${card.date}`);
                          }
                        }}
                      />
                    </div>
                  ))}
              </>
            ) : (
              currentYearData.static.statistik && (
                <img
                  src={currentYearData.static.statistik}
                  alt="Statistik"
                  className="scorecard-image-stat clickable-image"
                  onClick={() => openModal(currentYearData.static.statistik!, "Statistik")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openModal(currentYearData.static.statistik!, "Statistik");
                    }
                  }}
                />
              )
            )}
          </div>
        </div>
      ) : (
        <div className="no-data-message">
          Noch keine Daten für {selectedYear} verfügbar.
        </div>
      )}
      {modalState.isOpen && (
        <ImageModal
          imageUrl={modalState.imageUrl}
          alt={modalState.alt}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ScorecardViewer;