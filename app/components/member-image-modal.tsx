'use client';
import { useEffect } from 'react';
import Image from 'next/image';

interface MemberImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

const MemberImageModal: React.FC<MemberImageModalProps> = ({ imageUrl, alt, onClose }) => {
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
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={alt}
            width={2000}
            height={2000}
            style={{
              width: '25vw',  // 70% der Bildschirmbreite
              height: 'auto',
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
            }}
            priority
          />
        )}
      </div>
  );
};

export default MemberImageModal;