'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import YouTubeEmbed from './youtube-embed';

interface GalleryVideo {
  src: string;
  alt: string;
  caption?: string;
  thumbnailSrc?: string;
  type?: 'video' | 'youtube'; // Add type field to differentiate between regular videos and YouTube videos
  youtubeId?: string; // YouTube video ID
}

interface VideoPlayerProps {
  videos: GalleryVideo[];
  category?: string;
}

interface ModalState {
  isOpen: boolean;
  videoIndex: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videos, category }) => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    videoIndex: 0
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Function to handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (modalState.isOpen) {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === ' ') {
        // Space key toggles play/pause
        togglePlay();
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

  // Video playback functions
  const togglePlay = () => {
    const videoElement = modalState.isOpen ? modalVideoRef.current : videoRef.current;
    
    if (!videoElement) return;
    
    if (videoElement.paused) {
      videoElement.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Error playing video:', err);
      });
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  const pauseCurrentVideo = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    if (modalVideoRef.current && !modalVideoRef.current.paused) {
      modalVideoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Modal functions
  const openModal = () => {
    pauseCurrentVideo();
    setModalState({
      isOpen: true,
      videoIndex: 0
    });
  };

  const closeModal = () => {
    if (modalVideoRef.current && !modalVideoRef.current.paused) {
      modalVideoRef.current.pause();
      setIsPlaying(false);
    }
    
    setModalState({
      isOpen: false,
      videoIndex: 0
    });
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // If there are no videos, show a placeholder
  if (videos.length === 0) {
    return (
      <div className="coming-soon">
        <h2>{category || 'Videos'}</h2>
        <p>Noch keine Videos verfügbar. Videos werden in Kürze hinzugefügt.</p>
      </div>
    );
  }

  return (
    <div className="video-container">
      <div className="video-slide">
        <div className="video-wrapper">
          {videos[0].type === 'youtube' ? (
            // YouTube video embed with native controls
            <div className="youtube-wrapper">
              <YouTubeEmbed
                videoId={videos[0].youtubeId || videos[0].src}
                title={videos[0].alt}
                className="video-element"
              />
            </div>
          ) : (
            // Regular video with native controls
            <video
              ref={videoRef}
              src={videos[0].src}
              className="video-element"
              controls
              poster={videos[0].thumbnailSrc}
              preload="metadata"
              onError={() => console.error(`Fehler beim Laden des Videos: ${videos[0].src}`)}
            >
              Ihr Browser unterstützt das Video-Element nicht.
            </video>
          )}
        </div>
        
        {videos[0].caption && (
          <div className="video-caption">
            {videos[0].caption}
          </div>
        )}
      </div>

      {/* Modal for fullscreen video view */}
      {modalState.isOpen && (
        <div 
          className="video-modal"
          onClick={handleBackdropClick}
        >
          <div className="video-modal-content">
            {videos[0].type === 'youtube' ? (
              // YouTube video embed in modal
              <div className="youtube-modal-wrapper">
                <YouTubeEmbed
                  videoId={videos[0].youtubeId || videos[0].src}
                  title={videos[0].alt}
                  className="video-modal-player"
                  autoplay={true}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            ) : (
              // Regular video in modal
              <video
                ref={modalVideoRef}
                src={videos[0].src}
                className="video-modal-player"
                controls
                poster={videos[0].thumbnailSrc}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => console.error(`Fehler beim Laden des Modal-Videos: ${videos[0].src}`)}
              >
                Ihr Browser unterstützt das Video-Element nicht.
              </video>
            )}
            <button 
              className="video-modal-close"
              onClick={closeModal}
              aria-label="Schließen"
            >
              ✕
            </button>
            
            {videos[0].caption && (
              <div className="video-modal-caption">
                {videos[0].caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;