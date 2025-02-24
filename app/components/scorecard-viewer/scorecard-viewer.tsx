import React, { useState, useEffect } from 'react';
import '@/app/styles/GolfScorecard.css';
import '@/app/styles/spielergebnisse.css';
import ImageModal from './image-modal';
import Image from 'next/image';

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

// Hardcodierte Daten für 2024
const dates2024 = [
  '19.03.2024', '26.03.2024', '02.04.2024', '09.04.2024', '16.04.2024',
  '30.04.2024', '07.05.2024', '14.05.2024', '21.05.2024', '28.05.2024',
  '04.06.2024', '18.06.2024', '25.06.2024', '02.07.2024', '09.07.2024',
  '16.07.2024', '23.07.2024', '30.07.2024', '13.08.2024', '20.08.2024',
  '27.08.2024', '03.09.2024', '10.09.2024', '24.09.2024', '01.10.2024'
];

const ScorecardViewer: React.FC = () => {
  const [data, setData] = useState<ScorecardData | null>(null);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const years = ['2025', '2024', '2023', '2022'];
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

  // Funktion zum Rendern der Datumsbuttons
  const renderDateButtons = () => {
    if (selectedYear === '2024') {
      // Hardcodierte Buttons für 2024
      return dates2024.map((date) => (
        <button
          key={date}
          onClick={() => setSelectedDate(date)}
          className={`date-button ${
            selectedDate === date 
              ? 'date-button-active' 
              : 'date-button-inactive'
          }`}
        >
          {date}
        </button>
      ));
    }

    // Dynamische Buttons für andere Jahre
    return currentYearData.spielCards.map((card) => (
      <button
        key={card.date}
        onClick={() => setSelectedDate(card.date)}
        className={`date-button ${
          selectedDate === card.date 
            ? 'date-button-active' 
            : 'date-button-inactive'
        }`}
      >
        {card.date}
      </button>
    ));
  };

  return (
    <div className="scorecard-container">
      {/* Jahr Auswahl */}
      <div className="year-selector">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => {
              setSelectedYear(year);
              setSelectedDate(null);
            }}
            className={`year-button ${selectedYear === year ? 'active' : ''}`}
          >
            Meisterschaft {year}
          </button>
        ))}
      </div>
      {currentYearData && currentYearData.spielCards.length > 0 ? (
        <div className="content-grid">
          {/* Datumsbuttons */}
          <div className="button-grid">
            {renderDateButtons()}
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
                        <div className="image-wrapper">
                          {card.geldFileName.endsWith('.pdf') ? (
                            <object
                              data={card.geldFileName}
                              type="application/pdf"
                              className="scorecard-image-geld clickable-image"
                              style={{ width: '800px', height: '1200px' }}
                              onClick={() => openModal(card.geldFileName!, "Geldübersicht")}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  openModal(card.geldFileName!, "Geldübersicht");
                                }
                              }}
                            >
                              <p>PDF konnte nicht geladen werden</p>
                            </object>
                          ) : (
                            <Image
                              src={card.geldFileName}
                              alt="Geldübersicht"
                              width={800}
                              height={1200}
                              className="scorecard-image-geld clickable-image"
                              onClick={() => openModal(card.geldFileName!, "Geldübersicht")}
                              role="button"
                              tabIndex={0}
                              onError={(e) => {
                                console.error('Error loading Geld image:', card.geldFileName);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  openModal(card.geldFileName!, "Geldübersicht");
                                }
                              }}
                              loading="lazy"
                            />
                          )}
                        </div>
                      )}
                      <div className="image-wrapper">
                        <Image
                          src={card.fileName}
                          alt={`Spielergebnis vom ${card.date}`}
                          width={800}
                          height={1200}
                          className="scorecard-image clickable-image"
                          onClick={() => openModal(card.fileName, `Spielergebnis vom ${card.date}`)}
                          role="button"
                          tabIndex={0}
                          onError={(e) => {
                            console.error('Error loading Spiel image:', card.fileName);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              openModal(card.fileName, `Spielergebnis vom ${card.date}`);
                            }
                          }}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ))}
              </>
            ) : (
              currentYearData.static.statistik && (
                <Image
                  src={currentYearData.static.statistik}
                  alt="Statistik"
                  width={800}
                  height={1200}
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
        <div className="coming-soon">
          <h2>Meisterschaft {selectedYear}</h2>
          <p>Noch keine Statistik verfügbar.</p>
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