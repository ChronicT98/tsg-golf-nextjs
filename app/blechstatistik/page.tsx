'use client';
import '@/app/styles/blechstatistik.css';
import { useState } from 'react';
import Image from 'next/image';
import ImageModal from '@/app/components/scorecard-viewer/image-modal';

export default function Blechstatistik() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [modalState, setModalState] = useState({
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

  return (
    <div className="blechstatistik">
      <div className="container">
        <h1>Blechstatistik</h1>
        
        <div className="year-selector">
          <button 
            className={`year-button ${selectedYear === '2024' ? 'active' : ''}`}
            onClick={() => setSelectedYear('2024')}
          >
            Blechstatistik 2024
          </button>
          <button 
            className={`year-button ${selectedYear === '2025' ? 'active' : ''}`}
            onClick={() => setSelectedYear('2025')}
          >
            Blechstatistik 2025
          </button>
        </div>

        <div className="blech-content">
          {selectedYear === '2024' ? (
            <div className="blech-image-container">
              <div
                className="clickable-image"
                role="button"
                tabIndex={0}
                onClick={() => openModal('/blechen/blechen_29.jpg', 'Blechstatistik 2024')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    openModal('/blechen/blechen_29.jpg', 'Blechstatistik 2024');
                  }
                }}
              >
                <Image
                  src="/blechen/blechen_29.jpg"
                  alt="Blechstatistik 2024"
                  width={1200}
                  height={800}
                  priority
                  className="blech-image"
                />
              </div>
            </div>
          ) : (
            <div className="coming-soon">
              <h2>Blechstatistik 2025</h2>
              <p>Die Statistik für 2025 wird im Laufe des Jahres verfügbar sein.</p>
            </div>
          )}
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