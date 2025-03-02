'use client';

import React, { useState, useEffect } from 'react';
import '@/app/styles/videos.css';
import VideoPlayer from '@/app/components/video/video-player';

// Types for our gallery videos
interface GalleryVideo {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  category?: string;
  order?: number;
  createdAt: string;
  thumbnailSrc?: string;
  type?: 'video' | 'youtube';
  youtubeId?: string;
}

interface ApiResponse {
  videos: GalleryVideo[];
}

export default function VideosPage() {
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the selected video or null if none selected
  const selectedVideo = selectedVideoId 
    ? videos.find(video => video.id === selectedVideoId) 
    : null;

  // Set the first video as selected when videos are loaded
  useEffect(() => {
    if (videos.length > 0 && !selectedVideoId) {
      setSelectedVideoId(videos[0].id);
    }
  }, [videos, selectedVideoId]);

  // Fetch videos when the component mounts
  useEffect(() => {
    const fetchGalleryVideos = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/gallery-videos');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Video-Galerie');
        }
        
        const data: ApiResponse = await response.json();
        setVideos(data.videos || []);
      } catch (err) {
        console.error('Error fetching gallery videos:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Videos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryVideos();
  }, []);

  return (
    <div className="videos">
      <div className="container">
        <h1>TSG Videos</h1>

        <section className="videos__section">
          <div className="videos__intro">
            <p>
              Willkommen in der TSG Video-Galerie. Hier finden Sie YouTube-Videos 
              aus der Geschichte unserer Golfgemeinschaft.
            </p>
            <p>
              Die Videos können direkt über unsere Plattform angesehen werden.
              Die Administratoren können YouTube-Videos über das Admin-Dashboard hinzufügen.
            </p>
          </div>

          {/* Video title buttons */}
          {!isLoading && !error && videos.length > 0 && (
            <div className="video-buttons">
              {videos.map(video => (
                <button 
                  key={video.id}
                  className={`video-button ${selectedVideoId === video.id ? 'active' : ''}`}
                  onClick={() => setSelectedVideoId(video.id)}
                >
                  {video.alt || 'Unbenanntes Video'}
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="loading-indicator">
              <p>Videos werden geladen...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Video player - show only the selected video */}
          {!isLoading && !error && videos.length > 0 && selectedVideo && (
            <VideoPlayer
              videos={[selectedVideo]}
              category="TSG Videos"
            />
          )}
          
          {/* Empty state */}
          {!isLoading && !error && videos.length === 0 && (
            <div className="coming-soon">
              <p>Noch keine Videos verfügbar. Videos werden in Kürze hinzugefügt.</p>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}