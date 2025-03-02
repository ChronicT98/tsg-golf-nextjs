'use client';

import React, { useEffect, useState } from 'react';
import '@/app/styles/image-modal.css';
import Image from 'next/image';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, alt, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Großansicht: ${alt}`}
    >
      <div>
        <button
          onClick={onClose}
          aria-label="Schließen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLoading && !hasError && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Bild wird geladen...</p>
          </div>
        )}

        {hasError ? (
          <div className="error-message">
            <p>Fehler beim Laden des Bildes</p>
            <button onClick={onClose} className="btn btn-secondary">
              Schließen
            </button>
          </div>
        ) : (
          imageUrl.endsWith('.pdf') ? (
            <object
              data={imageUrl}
              type="application/pdf"
              style={{ width: '100%', height: '100%', maxWidth: '1200px', maxHeight: '1600px' }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error('Failed to load PDF:', imageUrl);
                setHasError(true);
                setIsLoading(false);
              }}
            >
              <p>PDF konnte nicht geladen werden</p>
            </object>
          ) : (
            <Image
              src={imageUrl}
              alt={alt}
              width={1200}
              height={1600}
              style={{ objectFit: 'contain' }}
              priority
              onLoadingComplete={() => setIsLoading(false)}
              onError={() => {
                console.error('Failed to load image:', imageUrl);
                setHasError(true);
                setIsLoading(false);
              }}
            />
          )
        )}
      </div>
    </div>
  );
};

export default ImageModal;