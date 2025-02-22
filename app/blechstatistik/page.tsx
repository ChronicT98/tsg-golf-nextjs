'use client';
import '@/app/styles/blechstatistik.css';
import { useState, useEffect, useCallback } from 'react';
import ImageModal from '@/app/components/scorecard-viewer/image-modal';

export default function Blechstatistik() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const years = ['2025', '2024', '2023', '2022'];
  const [latestFiles, setLatestFiles] = useState<Record<string, string>>({});
  const [modalState, setModalState] = useState({
    isOpen: false,
    imageUrl: '',
    alt: ''
  });

  useEffect(() => {
    const fetchLatestFiles = async () => {
      try {
        const response = await fetch('/api/blechen-files');
        const data = await response.json();
        setLatestFiles(data);
      } catch (error) {
        console.error('Error fetching blechen files:', error);
      }
    };

    fetchLatestFiles();
  }, []);

  const openModal = useCallback((imageUrl: string, alt: string) => {
    setModalState({
      isOpen: true,
      imageUrl,
      alt
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      imageUrl: '',
      alt: ''
    });
  }, []);

  return (
    <div className="blechstatistik">
      <div className="container">
        <h1>Blechstatistik</h1>
        
        <div className="year-selector">
          {years.map((year) => (
            <button
              key={year}
              className={`year-button ${selectedYear === year ? 'active' : ''}`}
              onClick={() => setSelectedYear(year)}
            >
              Blechstatistik {year}
            </button>
          ))}
        </div>

        <div className="blech-content">
          <div className="blech-image-container">
            {latestFiles[selectedYear] ? (
              <img
                src={latestFiles[selectedYear]}
                alt={`Blechstatistik ${selectedYear}`}
                className="scorecard-image-stat clickable-image"
                onClick={() => openModal(latestFiles[selectedYear], `Blechstatistik ${selectedYear}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    openModal(latestFiles[selectedYear], `Blechstatistik ${selectedYear}`);
                  }
                }}
              />
            ) : (
              <div className="coming-soon">
                <h2>Blechstatistik {selectedYear}</h2>
                <p>Noch keine Statistik verfügbar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {modalState.isOpen && (
        <ImageModal
          imageUrl={modalState.imageUrl}
          alt={modalState.alt}
          onClose={closeModal}
        />
      )}
    </div>
  );
}