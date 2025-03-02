'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface GallerySliderProps {
  images: GalleryImage[];
  category: string;
}

interface ModalState {
  isOpen: boolean;
  imageIndex: number;
}

const GallerySlider: React.FC<GallerySliderProps> = ({ images, category }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    imageIndex: 0
  });

  // Function to handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (modalState.isOpen) {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        navigateModal('prev');
      } else if (e.key === 'ArrowRight') {
        navigateModal('next');
      }
    }
  }, [modalState.isOpen]);

  // Add event listener for keyboard navigation
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Function to prevent body scrolling when modal is open
  useEffect(() => {
    if (modalState.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalState.isOpen]);

  // Slider navigation functions
  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Modal functions
  const openModal = (index: number) => {
    setModalState({
      isOpen: true,
      imageIndex: index
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      imageIndex: 0
    });
  };

  const navigateModal = (direction: 'prev' | 'next') => {
    setModalState((prev) => {
      const newIndex = direction === 'prev'
        ? (prev.imageIndex === 0 ? images.length - 1 : prev.imageIndex - 1)
        : (prev.imageIndex === images.length - 1 ? 0 : prev.imageIndex + 1);
      
      return {
        ...prev,
        imageIndex: newIndex
      };
    });
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // If there are no images, show a placeholder
  if (images.length === 0) {
    return (
      <div className="coming-soon">
        <h2>{category}</h2>
        <p>Noch keine Bilder verfügbar. Bilder werden in Kürze hinzugefügt.</p>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-slider">
        <div 
          className="gallery-slides"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={`slide-${index}`} className="gallery-slide">
              {/* Standard HTML img statt Next.js Image für Supabase-Bilder */}
              <img
                src={image.src}
                alt={image.alt}
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  maxHeight: '600px',
                  cursor: 'pointer',
                  objectFit: 'cover'
                }}
                onClick={() => openModal(index)}
                onError={() => console.error(`Fehler beim Laden des Bildes: ${image.src}`)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Slider controls */}
      <div className="slider-controls">
        <button 
          className="slider-arrow"
          onClick={goToPrevSlide}
          aria-label="Vorheriges Bild"
        >
          &#8592;
        </button>
        <button 
          className="slider-arrow"
          onClick={goToNextSlide}
          aria-label="Nächstes Bild"
        >
          &#8594;
        </button>
      </div>

      {/* Slider dots */}
      <div className="slider-dots">
        {images.map((_, index) => (
          <div
            key={`dot-${index}`}
            className={`slider-dot ${currentSlide === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                goToSlide(index);
              }
            }}
            aria-label={`Gehe zu Bild ${index + 1}`}
          />
        ))}
      </div>

      {/* Image caption */}
      {images[currentSlide]?.caption && (
        <div className="gallery-caption">
          {images[currentSlide].caption}
        </div>
      )}

      {/* Modal for larger image view */}
      {modalState.isOpen && (
        <div 
          className="gallery-modal"
          onClick={handleBackdropClick}
        >
          <div className="gallery-modal-content">
            {/* Auch im Modal natives img-Tag verwenden */}
            <img
              src={images[modalState.imageIndex].src}
              alt={images[modalState.imageIndex].alt}
              className="gallery-modal-image"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
              onError={() => console.error(`Fehler beim Laden des Modal-Bildes: ${images[modalState.imageIndex].src}`)}
            />
            <button 
              className="gallery-modal-close"
              onClick={closeModal}
              aria-label="Schließen"
            >
              ✕
            </button>
            <div className="gallery-modal-nav">
              <button 
                className="gallery-modal-prev"
                onClick={() => navigateModal('prev')}
                aria-label="Vorheriges Bild"
              >
                &#8592;
              </button>
              <button 
                className="gallery-modal-next"
                onClick={() => navigateModal('next')}
                aria-label="Nächstes Bild"
              >
                &#8594;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GallerySlider;