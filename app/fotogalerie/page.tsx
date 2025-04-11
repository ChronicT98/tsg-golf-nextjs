'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
}

interface CategoryImagesResponse {
  images: GalleryImage[];
  metadata?: {
    originalName: string;
  };
}

interface CategoriesResponse {
  categories: GalleryCategory[];
}

export default function FotogaleriePage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryImages, setCategoryImages] = useState<Record<string, GalleryImage[]>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lade nur Kategorien beim ersten Laden
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        setError(null);
        
        const response = await fetch('/api/gallery-categories');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Galerie-Kategorien');
        }
        
        const data: CategoriesResponse = await response.json();
        setCategories(data.categories);
        
        // Wähle die erste Kategorie als Standard, wenn vorhanden
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id);
        }
      } catch (err) {
        console.error('Error fetching gallery categories:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kategorien');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Lade Bilder nur für die ausgewählte Kategorie
  useEffect(() => {
    if (!selectedCategory) return;
    
    // Wenn wir die Bilder für diese Kategorie bereits geladen haben, nicht erneut laden
    if (categoryImages[selectedCategory]) return;
    
    const fetchCategoryImages = async () => {
      try {
        setIsLoadingImages(true);
        
        const response = await fetch(`/api/gallery-images/${selectedCategory}`);
        if (!response.ok) {
          throw new Error(`Fehler beim Laden der Bilder für ${selectedCategory}`);
        }
        
        const data: CategoryImagesResponse = await response.json();
        
        setCategoryImages(prevImages => ({
          ...prevImages,
          [selectedCategory]: data.images
        }));
      } catch (err) {
        console.error(`Error fetching images for category ${selectedCategory}:`, err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Bilder');
      } finally {
        setIsLoadingImages(false);
      }
    };
    
    fetchCategoryImages();
  }, [selectedCategory, categoryImages]);

  // Preload benachbarte Kategorien für schnellere Navigation
  const preloadNeighboringCategories = useCallback(() => {
    if (!selectedCategory || categories.length === 0) return;
    
    // Finde den Index der aktuellen Kategorie
    const currentIndex = categories.findIndex(c => c.id === selectedCategory);
    if (currentIndex === -1) return;
    
    // Bestimme vorherige und nächste Kategorie
    const prevCategory = currentIndex > 0 ? categories[currentIndex - 1] : null;
    const nextCategory = currentIndex < categories.length - 1 ? categories[currentIndex + 1] : null;
    
    // Preload in niedriger Priorität
    const preloadCategory = async (categoryId: string) => {
      // Überprüfe, ob wir diese Kategorie bereits geladen haben
      if (categoryImages[categoryId]) return;
      
      try {
        const response = await fetch(`/api/gallery-images/${categoryId}`);
        if (!response.ok) return;
        
        const data: CategoryImagesResponse = await response.json();
        
        setCategoryImages(prevImages => ({
          ...prevImages,
          [categoryId]: data.images
        }));
      } catch (error) {
        console.error(`Error preloading category ${categoryId}:`, error);
      }
    };
    
    // Verzögertes Preloading, damit es nicht die Hauptkategorie beeinträchtigt
    setTimeout(() => {
      if (prevCategory) preloadCategory(prevCategory.id);
    }, 2000);
    
    setTimeout(() => {
      if (nextCategory) preloadCategory(nextCategory.id);
    }, 3000);
  }, [selectedCategory, categories, categoryImages]);

  // Preload benachbarte Kategorien, wenn die Hauptkategorie geladen ist
  useEffect(() => {
    if (!isLoadingImages && categoryImages[selectedCategory]) {
      preloadNeighboringCategories();
    }
  }, [isLoadingImages, categoryImages, selectedCategory, preloadNeighboringCategories]);

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
          ) : !isLoadingCategories && !error && (
            <div className="no-categories">
              <p>Noch keine Bilder vorhanden. Bitte fügen Sie über die Adminseite Bilder hinzu.</p>
            </div>
          )}

          {/* Loading states */}
          {isLoadingCategories && (
            <div className="loading-indicator">
              <p>Kategorien werden geladen...</p>
            </div>
          )}
          
          {!isLoadingCategories && isLoadingImages && (
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
          {!isLoadingCategories && !isLoadingImages && !error && selectedCategory && 
           categoryImages[selectedCategory] && categoryImages[selectedCategory].length > 0 && (
            <GalleryGrid
              images={categoryImages[selectedCategory]}
              category={categories.find(c => c.id === selectedCategory)?.name || ''}
            />
          )}
          
          {/* No images in this category */}
          {!isLoadingCategories && !isLoadingImages && !error && selectedCategory && 
           categoryImages[selectedCategory] && categoryImages[selectedCategory].length === 0 && (
            <div className="no-images">
              <p>Keine Bilder in dieser Kategorie vorhanden.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}