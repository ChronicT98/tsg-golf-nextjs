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

  // Modal functions - wrapped in useCallback to avoid recreation on each render
  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      imageIndex: 0
    });
  }, []);

  const navigateModal = useCallback((direction: 'prev' | 'next') => {
    setModalState((prev) => {
      const newIndex = direction === 'prev'
        ? (prev.imageIndex === 0 ? images.length - 1 : prev.imageIndex - 1)
        : (prev.imageIndex === images.length - 1 ? 0 : prev.imageIndex + 1);
      
      return {
        ...prev,
        imageIndex: newIndex
      };
    });
  }, [images.length]);

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
  }, [modalState.isOpen, closeModal, navigateModal]);

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
              {/* Next.js Image für optimierte Bildanzeige */}
              <div className="gallery-image-container" style={{ position: 'relative', width: '100%', height: '600px' }}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  style={{ 
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => openModal(index)}
                  onError={() => console.error(`Fehler beim Laden des Bildes: ${image.src}`)}
                />
              </div>
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
            {/* Next.js Image auch im Modal verwenden */}
            <div className="gallery-modal-image-container" style={{ position: 'relative', width: '100%', height: '90vh' }}>
              <Image
                src={images[modalState.imageIndex].src}
                alt={images[modalState.imageIndex].alt}
                fill={true}
                sizes="100vw"
                className="gallery-modal-image"
                style={{ 
                  objectFit: 'contain'
                }}
                priority={true}
                onError={() => console.error(`Fehler beim Laden des Modal-Bildes: ${images[modalState.imageIndex].src}`)}
              />
            </div>
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