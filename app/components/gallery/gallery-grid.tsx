'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
  category: string;
}

interface ModalState {
  isOpen: boolean;
  imageIndex: number;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, category }) => {
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
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

  // Function to handle keyboard navigation for modal
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

  // Set a thumbnail image as the featured image
  const setAsFeatured = (index: number) => {
    setFeaturedImageIndex(index);
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
    <div className="gallery-grid-container">
      {/* Featured image */}
      <div className="gallery-featured">
        <Image
          src={images[featuredImageIndex].src}
          alt={images[featuredImageIndex].alt}
          width={600}
          height={400}
          className="featured-image"
          style={{ 
            maxWidth: '100%',
            maxHeight: '70vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer'
          }}
          onClick={() => openModal(featuredImageIndex)}
          onError={() => console.error(`Fehler beim Laden des Bildes: ${images[featuredImageIndex].src}`)}
        />
        
        {/* Caption for featured image */}
        {images[featuredImageIndex]?.caption && (
          <div className="gallery-caption">
            {images[featuredImageIndex].caption}
          </div>
        )}
      </div>

      {/* Thumbnail grid */}
      <div className="gallery-thumbnails">
        {images.map((image, index) => (
          <div 
            key={`thumbnail-${index}`} 
            className={`gallery-thumbnail ${featuredImageIndex === index ? 'active' : ''}`}
            onClick={() => setAsFeatured(index)}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image
                src={image.src}
                alt={image.alt}
                fill={true}
                sizes="128px"
                style={{ objectFit: 'cover' }}
                onError={() => console.error(`Fehler beim Laden des Thumbnails: ${image.src}`)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Modal for larger image view */}
      {modalState.isOpen && (
        <div 
          className="gallery-modal"
          onClick={handleBackdropClick}
        >
          <div className="gallery-modal-content">
            <div className="gallery-modal-image-container">
              {/* Using standard img tag instead of Next.js Image for better compatibility with lightbox modals */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
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

export default GalleryGrid;