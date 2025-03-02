'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface CategoryData {
  id: string;        // Die Kategorie-ID (Ordnername)
  originalName: string; // Der anzuzeigende Name
  order: number;     // Die Reihenfolge
}

export default function GalleryCategoryReorderManager() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Hole alle Kategorien aus der Gallery API
        const response = await fetch('/api/gallery-images');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Kategorien');
        }
        
        const data = await response.json();
        
        // Hole die aktuelle Kategoriereihenfolge aus der Datenbank über den API-Endpunkt
        const orderResponse = await fetch('/api/gallery-categories/reorder');
        
        // Standardwerte für die Ordnung
        let categoryOrder: Record<string, number> = {};
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          categoryOrder = orderData.order || {};
        }
        
        // Extrahiere Kategorien aus der API-Antwort
        const categoriesWithOrder = Object.keys(data.categories).map((categoryId, index) => {
          const category: CategoryData = {
            id: categoryId,
            originalName: data.metadata[categoryId]?.originalName || categoryId.replace(/-/g, ' '),
            // Verwende die bestehende Reihenfolge oder setze den Index als Standardwert
            order: categoryOrder[categoryId] !== undefined ? categoryOrder[categoryId] : index
          };
          return category;
        });
        
        // Sortiere nach bestehender Reihenfolge
        categoriesWithOrder.sort((a, b) => a.order - b.order);
        
        setCategories(categoriesWithOrder);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kategorien');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    // Elemente neu anordnen
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Aktualisiere die order-Eigenschaft für jedes Element
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    // Aktualisiere den State
    setCategories(updatedItems);
    setMessage(null);

    // Sende Updates an die API
    try {
      const updates = updatedItems.map(category => ({
        id: category.id,
        order: category.order,
        originalName: category.originalName
      }));

      const response = await fetch('/api/gallery-categories/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Kategorie-Reihenfolge');
      }

      const result = await response.json();
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Kategorie-Reihenfolge erfolgreich aktualisiert'
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Einige Aktualisierungen konnten nicht durchgeführt werden'
        });
      }
    } catch (err) {
      console.error('Error updating category order:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Kategorie-Reihenfolge'
      });
    }
  };

  if (isLoading) {
    return <div className="loading">Kategorien werden geladen...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="category-reorder-manager">
      <h3>Kategorie-Reihenfolge ändern</h3>
      <p className="help-text">
        Ziehen Sie die Kategorien, um ihre Reihenfolge auf der Fotogalerie-Seite zu ändern.
        Die Änderungen werden automatisch gespeichert.
      </p>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <div
              className="category-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {categories.map((category, index) => (
                <Draggable 
                  key={category.id} 
                  draggableId={category.id} 
                  index={index}
                >
                  {(provided) => (
                    <div
                      className="category-item"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div 
                        className="drag-handle"
                        {...provided.dragHandleProps}
                      >
                        ⠿
                      </div>
                      <div className="category-info">
                        <div className="category-name">{category.originalName}</div>
                        <div className="category-id">(ID: {category.id})</div>
                      </div>
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