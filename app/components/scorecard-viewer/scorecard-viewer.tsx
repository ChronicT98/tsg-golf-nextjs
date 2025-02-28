import React, { useState, useEffect } from 'react';
import '@/app/styles/GolfScorecard.css';
import '@/app/styles/spielergebnisse.css';
import ImageModal from './image-modal';
import Image from 'next/image';
import { useCallback } from 'react';

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
  const years = ['2025', '2024', '2023', '2022', '2021'];
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    imageUrl: '',
    alt: ''
  });
  // State to track preloaded images
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  // Function to preload an image
  const preloadImage = useCallback((url: string | undefined) => {
    if (!url || preloadedImages.has(url)) return; // Skip if URL is undefined or already preloaded
    
    const imgElement = document.createElement('img');
    imgElement.src = url;
    imgElement.onload = () => {
      setPreloadedImages(prev => {
        const newSet = new Set(prev);
        newSet.add(url);
        return newSet;
      });
    };
  }, [preloadedImages]);

  // Function to preload neighboring years' images
  const preloadNeighboringYears = useCallback((currentYear: string) => {
    if (!data) return;

    // Get the index of the current year in the years array
    const currentIndex = years.indexOf(currentYear);
    
    // Preload the previous year (if exists)
    if (currentIndex > 0) {
      const prevYear = years[currentIndex - 1];
      if (data[prevYear]?.static?.statistik) {
        preloadImage(data[prevYear].static.statistik);
      }
    }
    
    // Preload the next year (if exists)
    if (currentIndex < years.length - 1) {
      const nextYear = years[currentIndex + 1];
      if (data[nextYear]?.static?.statistik) {
        preloadImage(data[nextYear].static.statistik);
      }
    }
  }, [data, preloadImage, years]);

  // Function to preload neighboring dates' scorecards
  const preloadNeighboringDates = useCallback((currentDate: string) => {
    if (!data || !selectedYear || !currentDate) return;
    
    const yearData = data[selectedYear];
    if (!yearData || !yearData.spielCards.length) return;
    
    // Find the index of the current date in the spielCards array
    const sortedCards = [...yearData.spielCards].sort((a, b) => {
      const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('.');
        return new Date(`${year}-${month}-${day}`);
      };
      return parseDate(a.date).getTime() - parseDate(b.date).getTime();
    });
    
    const currentIndex = sortedCards.findIndex(card => card.date === currentDate);
    if (currentIndex === -1) return;
    
    // Preload the previous date's scorecards (if exists)
    if (currentIndex > 0) {
      const prevCard = sortedCards[currentIndex - 1];
      preloadImage(prevCard.fileName);
      if (prevCard.geldFileName) {
        preloadImage(prevCard.geldFileName);
      }
    }
    
    // Preload the next date's scorecards (if exists)
    if (currentIndex < sortedCards.length - 1) {
      const nextCard = sortedCards[currentIndex + 1];
      preloadImage(nextCard.fileName);
      if (nextCard.geldFileName) {
        preloadImage(nextCard.geldFileName);
      }
    }
  }, [data, selectedYear, preloadImage]);

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

  // Preload images when data is loaded or selected year changes
  useEffect(() => {
    if (data && selectedYear) {
      // Preload statistics image for current year
      if (data[selectedYear]?.static?.statistik) {
        preloadImage(data[selectedYear].static.statistik);
      }
      
      // Preload neighboring years
      preloadNeighboringYears(selectedYear);
    }
  }, [data, selectedYear, preloadImage, preloadNeighboringYears]);

  // Preload images when selected date changes
  useEffect(() => {
    if (data && selectedYear && selectedDate) {
      // Find the current card
      const currentCard = data[selectedYear].spielCards.find(card => card.date === selectedDate);
      
      if (currentCard) {
        // Ensure current card images are loaded with high priority
        // (They should already be loaded by the time this effect runs,
        // but this ensures they're prioritized)
        preloadImage(currentCard.fileName);
        if (currentCard.geldFileName) {
          preloadImage(currentCard.geldFileName);
        }
        
        // Preload neighboring dates
        preloadNeighboringDates(selectedDate);
      }
    }
  }, [data, selectedYear, selectedDate, preloadImage, preloadNeighboringDates]);

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
    // Dynamische Buttons für alle Jahre
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
            {/* Invisible preload div for date buttons */}
            <div style={{ display: 'none' }}>
              {currentYearData.spielCards.map((card) => (
                <div key={`preload-${card.id}`}>
                  <img src={card.fileName} alt="" />
                  {card.geldFileName && <img src={card.geldFileName} alt="" />}
                </div>
              ))}
            </div>
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
                              priority={selectedDate === card.date}
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
                          priority={selectedDate === card.date}
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
                  priority={true}
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