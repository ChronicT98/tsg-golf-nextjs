'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import '@/app/styles/fotogalerie.css';
import GalleryGrid from '@/app/components/gallery/gallery-grid';

// Types for our gallery images and categories
interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  category: string;
  order: number;
  createdAt: string;
}

interface GalleryCategory {
  id: string;
  name: string;
  images: GalleryImage[];
}

// Aktualisiertes Interface für die neue API-Antwortstruktur
interface ApiResponse {
  categories: {
    [category: string]: GalleryImage[];
  };
  metadata: {
    [categoryId: string]: {
      originalName: string;
    };
  };
}

export default function FotogaleriePage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to track preloaded images
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  // Function to preload an image
  const preloadImage = useCallback((url: string | undefined) => {
    if (!url || preloadedImages.has(url)) return; // Skip if URL is undefined or already preloaded
    
    const imgElement = document.createElement('img');
    imgElement.src = url;
    imgElement.onload = () => {
      setPreloadedImages(prev => {
        const newSet = new Set(prev);
        newSet.add(url);
        return newSet;
      });
    };
  }, [preloadedImages]);

  // Function to preload all categories' images
  const preloadAllCategories = useCallback(() => {
    if (!categories.length) return;

    // Preload first image from each category
    categories.forEach(category => {
      if (category.images && category.images.length > 0) {
        // Preload first image from each category (you could preload more if needed)
        const firstImage = category.images[0];
        if (firstImage && firstImage.src) {
          preloadImage(firstImage.src);
        }
      }
    });
  }, [categories, preloadImage]);

  // Function to preload neighboring categories
  const preloadNeighboringCategories = useCallback((currentCategoryId: string) => {
    if (!categories.length) return;
    
    // Find the index of the current category
    const currentIndex = categories.findIndex(c => c.id === currentCategoryId);
    if (currentIndex === -1) return;
    
    // Get previous and next categories
    const prevCategory = currentIndex > 0 ? categories[currentIndex - 1] : null;
    const nextCategory = currentIndex < categories.length - 1 ? categories[currentIndex + 1] : null;
    
    // Preload images from previous category
    if (prevCategory && prevCategory.images.length > 0) {
      preloadImage(prevCategory.images[0].src);
    }
    
    // Preload images from next category
    if (nextCategory && nextCategory.images.length > 0) {
      preloadImage(nextCategory.images[0].src);
    }
  }, [categories, preloadImage]);

  // Fetch images when the component mounts
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/gallery-images');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Galerie-Bilder');
        }
        
        const data: ApiResponse = await response.json();
        
        // Update categories with fetched images
        // Transform API data into our GalleryCategory format
        const newCategories: GalleryCategory[] = [];
        
        // Verarbeite die neue API-Struktur mit categories und metadata
        for (const [categoryId, images] of Object.entries(data.categories || {})) {
          // Verwende den originalen Namen aus den Metadaten, falls vorhanden
          const originalName = data.metadata?.[categoryId]?.originalName;
          
          // Verwende entweder den originalen Namen oder erzeuge einen aus der ID
          const displayName = originalName || categoryId
            // Replace hyphens with spaces
            .replace(/-/g, ' ')
            // Split into words
            .split(' ')
            // Capitalize each word and handle special German terms
            .map(word => {
              // Special case for common German terms and abbreviations
              if (word.toLowerCase() === 'tsg') return 'TSG';
              // Standard capitalization for other words
              return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
            
          newCategories.push({
            id: categoryId,
            name: displayName,
            images: images
          });
        }
        
        // Sort categories alphabetically by display name
        newCategories.sort((a, b) => a.name.localeCompare(b.name));
        
        setCategories(newCategories);
      } catch (err) {
        console.error('Error fetching gallery images:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Bilder');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  // Preload all categories when they are loaded
  useEffect(() => {
    if (categories.length > 0) {
      preloadAllCategories();
    }
  }, [categories, preloadAllCategories]);

  // Preload neighboring categories when selected category changes
  useEffect(() => {
    if (categories.length > 0 && selectedCategory) {
      preloadNeighboringCategories(selectedCategory);
    }
  }, [selectedCategory, categories, preloadNeighboringCategories]);

  // Set default category when categories change or selectedCategory is invalid
  useEffect(() => {
    // Select the first category if none is selected and categories exist
    if ((!selectedCategory || !categories.find(c => c.id === selectedCategory)) && categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Find the current category data
  const currentCategory = categories.find(
    (category) => category.id === selectedCategory
  ) || categories[0];

  return (
    <div className="fotogalerie">
      <div className="container">
        <h1>TSG Fotogalerie</h1>

        <section className="fotogalerie__section">
          <div className="fotogalerie__intro">
            <p>
              Willkommen in der TSG Fotogalerie. Hier finden Sie Bilder von Turnieren, 
              Ausflügen und gemeinsamen Feiern aus der Geschichte unserer Golfgemeinschaft.
            </p>
          </div>

          {/* Category selection buttons - only shown if categories exist */}
          {categories.length > 0 ? (
            <div className="category-selector">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`category-button ${
                    selectedCategory === category.id ? 'active' : ''
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          ) : !isLoading && !error && (
            <div className="no-categories">
              <p>Noch keine Bilder vorhanden. Bitte fügen Sie über die Adminseite Bilder hinzu.</p>
            </div>
          )}

          {/* Hidden preload div for category images */}
          <div style={{ display: 'none' }}>
            {categories.map((category) => (
              <div key={`preload-${category.id}`}>
                {category.images.slice(0, 1).map((image) => (
                  <Image 
                    key={`preload-img-${image.id}`}
                    src={image.src} 
                    alt="" 
                    width={1} 
                    height={1} 
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="loading-indicator">
              <p>Bilder werden geladen...</p>
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

          {/* Gallery grid for the selected category */}
          {!isLoading && !error && selectedCategory && currentCategory && (
            <GalleryGrid
              images={currentCategory.images}
              category={currentCategory.name}
            />
          )}

        </section>
      </div>
    </div>
  );
}