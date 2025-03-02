'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import YouTubeEmbed from '@/app/components/video/youtube-embed';

// Interface for raw video data from API
interface ApiVideoData {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  category?: string;
  order?: number;
  createdAt: string;
  thumbnailSrc?: string;
  type?: 'video' | 'youtube';
  youtubeId?: string;
}

interface Video {
  id: string;
  youtubeId?: string;
  alt: string;
  title?: string;
  order: number;
  type?: 'video' | 'youtube';
}

export default function VideoReorderManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/gallery-videos');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Videos');
        }
        
        const data = await response.json();
        const videosWithOrder = data.videos.map((video: ApiVideoData, index: number) => ({
          id: video.id,
          youtubeId: video.youtubeId,
          alt: video.alt || video.title || 'Unbenanntes Video',
          title: video.caption || video.alt,
          order: video.order || index,
          type: video.type || 'youtube'
        }));
        
        setVideos(videosWithOrder);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Videos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    // Reorder the items
    const items = Array.from(videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order property for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    // Update state
    setVideos(updatedItems);
    setMessage(null);

    // Send updates to the API
    try {
      // Only send YouTube videos for now since we're using the youtube_videos table
      const updates = updatedItems
        .filter(video => video.type === 'youtube')
        .map(video => ({
          id: video.id,
          order: video.order
        }));

      const response = await fetch('/api/gallery-videos/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Reihenfolge');
      }

      const result = await response.json();
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Reihenfolge erfolgreich aktualisiert'
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Einige Aktualisierungen konnten nicht durchgeführt werden'
        });
      }
    } catch (err) {
      console.error('Error updating video order:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Reihenfolge'
      });
    }
  };

  if (isLoading) {
    return <div className="loading">Videos werden geladen...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="video-reorder-manager">
      <h3>Video-Reihenfolge ändern</h3>
      <p className="help-text">
        Ziehen Sie die Videos, um ihre Reihenfolge auf der Video-Seite zu ändern.
        Die Änderungen werden automatisch gespeichert.
      </p>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="videos">
          {(provided) => (
            <div
              className="video-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {videos.map((video, index) => (
                <Draggable 
                  key={video.id} 
                  draggableId={video.id} 
                  index={index}
                >
                  {(provided) => (
                    <div
                      className="video-item"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div 
                        className="drag-handle"
                        {...provided.dragHandleProps}
                      >
                        ⠿
                      </div>
                      <div className="video-info">
                        <div className="video-title">{video.alt}</div>
                        <div className="video-order">Reihenfolge: {video.order}</div>
                      </div>
                      {video.youtubeId && (
                        <div className="video-preview">
                          <YouTubeEmbed 
                            videoId={video.youtubeId}
                            title={video.alt}
                            className="mini-preview"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}