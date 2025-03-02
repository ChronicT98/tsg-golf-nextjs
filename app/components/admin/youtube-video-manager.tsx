'use client';

import React, { useState, useEffect } from 'react';

interface YouTubeVideo {
  id?: string;
  youtubeId: string;
  title: string;
  caption?: string;
  createdAt?: string;
}

// Define proper API response type
interface YouTubeVideoResponse {
  success: boolean;
  video: {
    id: string;
    youtube_id: string;
    title: string;
    caption?: string | null;
    order_index?: number;
    created_at: string;
  };
}

interface YouTubeVideoManagerProps {
  onAddComplete?: (results: YouTubeVideoResponse) => void;
}

export default function YouTubeVideoManager({ onAddComplete }: YouTubeVideoManagerProps) {
  const [videoData, setVideoData] = useState<YouTubeVideo>({
    youtubeId: '',
    title: '',
    caption: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Function to extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    
    // If it's already just an ID (not a URL), return it
    if (url.length <= 12 && !url.includes('/') && !url.includes('.')) {
      return url;
    }
    
    // Try to extract ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Update preview when YouTube URL/ID changes
  useEffect(() => {
    const id = extractYouTubeId(videoData.youtubeId);
    setVideoPreview(id);
  }, [videoData.youtubeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVideoData(prev => ({ ...prev, [name]: value }));
    
    // Reset message when editing
    if (message) setMessage(null);
  };

  const validateForm = (): boolean => {
    // Check if YouTube ID/URL is valid
    const youtubeId = extractYouTubeId(videoData.youtubeId);
    if (!youtubeId) {
      setMessage({
        type: 'error',
        text: 'Bitte geben Sie eine gültige YouTube-URL oder Video-ID ein'
      });
      return false;
    }

    // Check if title is provided
    if (!videoData.title.trim()) {
      setMessage({
        type: 'error',
        text: 'Bitte geben Sie einen Titel für das Video ein'
      });
      return false;
    }


    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      // Extract YouTube ID if a full URL was provided
      const youtubeId = extractYouTubeId(videoData.youtubeId);
      
      const videoToSubmit = {
        ...videoData,
        youtubeId,
        type: 'youtube'
      };
      
      // Call API to save YouTube video data
      const response = await fetch('/api/gallery-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoToSubmit),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Speichern des Videos');
      }
      
      const result = await response.json();
      
      setMessage({
        type: 'success',
        text: 'Das YouTube-Video wurde erfolgreich hinzugefügt'
      });
      
      // Reset form
      setVideoData({
        youtubeId: '',
        title: '',
        caption: ''
      });
      setVideoPreview(null);
      
      // Notify parent component
      if (onAddComplete) {
        onAddComplete(result);
      }
    } catch (error) {
      console.error('Error saving YouTube video:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern des Videos'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="youtube-video-manager">
      
      <form onSubmit={handleSubmit} className="youtube-form">
        <div className="form-group">
          <label htmlFor="youtubeId">YouTube-URL oder Video-ID:</label>
          <input
            type="text"
            id="youtubeId"
            name="youtubeId"
            value={videoData.youtubeId}
            onChange={handleInputChange}
            placeholder="z.B. https://www.youtube.com/watch?v=dQw4w9WgXcQ oder dQw4w9WgXcQ"
            className="form-input"
            required
          />
          <p className="help-text">
            Die vollständige YouTube-URL oder nur die Video-ID eingeben
          </p>
        </div>
        
        <div className="form-group">
          <label htmlFor="title">Titel:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={videoData.title}
            onChange={handleInputChange}
            placeholder="Titel des Videos"
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="caption">Beschreibung (optional):</label>
          <textarea
            id="caption"
            name="caption"
            value={videoData.caption}
            onChange={handleInputChange}
            placeholder="Kurze Beschreibung des Videos"
            className="form-textarea"
            rows={3}
          />
        </div>
        
        
        {videoPreview && (
          <div className="video-preview">
            <h4>Vorschau:</h4>
            <div className="preview-container-youtube">
              <iframe
                src={`https://www.youtube.com/embed/${videoPreview}`}
                title="YouTube Video Preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="preview-iframe"
              />
            </div>
          </div>
        )}
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Video hinzufügen'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setVideoData({
                youtubeId: '',
                title: '',
                caption: ''
              });
              setVideoPreview(null);
              setMessage(null);
            }}
            disabled={isSubmitting}
          >
            Zurücksetzen
          </button>
        </div>
      </form>
    </div>
  );
}