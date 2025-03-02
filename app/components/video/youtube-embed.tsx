'use client';

import React, { useState, useEffect, useRef } from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

/**
 * YouTubeEmbed component for embedding YouTube videos
 * 
 * This component handles embedding YouTube videos using the YouTube iframe API
 * It extracts the video ID from a YouTube URL or uses the provided ID directly
 */
const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  title = 'YouTube Video',
  autoplay = false,
  className = '',
  onPlay,
  onPause
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Extract YouTube ID from URL if a full URL was provided
  const getYouTubeId = (idOrUrl: string): string => {
    // If it's already just an ID (not a URL), return it
    if (idOrUrl.length <= 12 && !idOrUrl.includes('/') && !idOrUrl.includes('.')) {
      return idOrUrl;
    }
    
    // Try to extract ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = idOrUrl.match(regExp);
    
    return (match && match[2].length === 11)
      ? match[2]
      : idOrUrl; // Return original string if no match found
  };
  
  // Get clean video ID
  const cleanVideoId = getYouTubeId(videoId);
  
  // Create YouTube embed URL with parameters
  const embedUrl = `https://www.youtube.com/embed/${cleanVideoId}?enablejsapi=1${
    autoplay ? '&autoplay=1' : ''
  }&rel=0&modestbranding=1`;
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <div className={`youtube-embed-container ${className}`}>
      {error ? (
        <div className="youtube-error">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {!isLoaded && (
            <div className="youtube-loading">
              <p>Video wird geladen...</p>
            </div>
          )}
          <iframe
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="youtube-iframe"
            onError={() => setError('Fehler beim Laden des Videos')}
          />
        </>
      )}
    </div>
  );
};

export default YouTubeEmbed;