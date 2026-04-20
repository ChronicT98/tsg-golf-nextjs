'use client';
import '@/app/styles/blechstatistik.css';
import '@/app/styles/GolfScorecard.css';
import { useState, useEffect, useCallback } from 'react';
import ImageModal from '@/app/components/scorecard-viewer/image-modal';
import Image from 'next/image';

export default function Blechstatistik() {
  const [selectedYear, setSelectedYear] = useState('');
  const [years, setYears] = useState<string[]>([]);
  const [latestFiles, setLatestFiles] = useState<Record<string, string>>({});
  const [modalState, setModalState] = useState({
    isOpen: false,
    imageUrl: '',
    alt: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filesRes, yearsRes] = await Promise.all([
          fetch('/api/blechen-files'),
          fetch('/api/years'),
        ]);
        const files = await filesRes.json();
        const yearNumbers: number[] = await yearsRes.json();
        const yearStrings = yearNumbers.map(y => y.toString());
        setLatestFiles(files);
        setYears(yearStrings);
        setSelectedYear(yearStrings[0] ?? '');
      } catch (error) {
        console.error('Error fetching blechen data:', error);
      }
    };

    fetchData();
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
              <Image
                src={latestFiles[selectedYear]}
                alt={`Blechstatistik ${selectedYear}`}
                width={800}
                height={1200}
                priority
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