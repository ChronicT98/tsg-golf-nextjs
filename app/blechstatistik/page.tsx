'use client';
import '@/app/styles/blechstatistik.css';
import '@/app/styles/GolfScorecard.css';
import { useState, useEffect, useCallback, useMemo } from 'react';
import ImageModal from '@/app/components/scorecard-viewer/image-modal';
import Image from 'next/image';

export default function Blechstatistik() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const years = useMemo(() => ['2025', '2024', '2023', '2022', '2021'], []);
  const [latestFiles, setLatestFiles] = useState<Record<string, string>>({});
  const [modalState, setModalState] = useState({
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
  
  // Function to preload all year images
  const preloadAllYearImages = useCallback(() => {
    if (!latestFiles || Object.keys(latestFiles).length === 0) return;
    
    // Preload all year images
    years.forEach(year => {
      if (latestFiles[year]) {
        preloadImage(latestFiles[year]);
      }
    });
  }, [latestFiles, preloadImage, years]);

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
  
  // Preload all year images when latestFiles data is loaded
  useEffect(() => {
    if (Object.keys(latestFiles).length > 0) {
      preloadAllYearImages();
    }
  }, [latestFiles, preloadAllYearImages]);

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
              onClick={() => {
                setSelectedYear(year);
                // Ensure this year's image is preloaded
                if (latestFiles[year]) {
                  preloadImage(latestFiles[year]);
                }
              }}
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
          
          {/* Hidden div for preloading images */}
          <div style={{ display: 'none' }}>
            {Object.entries(latestFiles)
              .filter(([_, url]) => url && url.trim() !== '') // Filter out empty or undefined URLs
              .map(([year, url]) => (
                <Image 
                  key={`preload-${year}`}
                  src={url}
                  alt={`Preload ${year}`}
                  width={1}
                  height={1}
                />
              ))}
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