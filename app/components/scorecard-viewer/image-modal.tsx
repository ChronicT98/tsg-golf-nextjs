import React, { useEffect } from 'react';
import '@/app/styles/image-modal.css';
import Image from 'next/image';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, alt, onClose }) => {
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
        <Image
          src={imageUrl}
          alt={alt}
          width={1200}
          height={1600}
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
    </div>
  );
};

export default ImageModal;