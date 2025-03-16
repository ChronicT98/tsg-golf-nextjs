'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { OfficialDetails } from '@/app/types/officials';
import OfficialEditor from './official-editor';
import '@/app/styles/admin.css';

export default function OfficialManager() {
  const [officials, setOfficials] = useState<OfficialDetails[]>([]);
  const [selectedOfficial, setSelectedOfficial] = useState<OfficialDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load officials from API
  const loadOfficials = async () => {
    try {
      const response = await fetch('/api/officials');
      if (!response.ok) {
        throw new Error('Failed to fetch officials');
      }
      
      const data = await response.json();
      setOfficials(data);
    } catch (error) {
      console.error('Error loading officials:', error);
      alert('Fehler beim Laden der Funktionäre');
    }
  };

  useEffect(() => {
    loadOfficials();
  }, []);

  // Save official
  const handleSaveOfficial = async (official: OfficialDetails) => {
    try {
      const response = await fetch('/api/officials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(official),
      });

      if (!response.ok) {
        throw new Error('Failed to save official');
      }

      // Reset state and reload officials
      setSelectedOfficial(null);
      setIsEditing(false);
      loadOfficials();
    } catch (error) {
      console.error('Error saving official:', error);
      alert('Fehler beim Speichern des Funktionärs');
    }
  };

  // Handle reordering
  const handleReorder = async (orderedIds: number[]) => {
    try {
      const response = await fetch('/api/officials/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder officials');
      }

      loadOfficials();
    } catch (error) {
      console.error('Error reordering officials:', error);
      alert('Fehler beim Neuordnen der Funktionäre');
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Create a new array with the updated order
    const updatedOfficials = [...officials];
    const [movedOfficial] = updatedOfficials.splice(sourceIndex, 1);
    updatedOfficials.splice(destinationIndex, 0, movedOfficial);

    // Update the order property for each official
    updatedOfficials.forEach((official, index) => {
      official.order = index;
    });

    // Update local state
    setOfficials(updatedOfficials);

    // Extract the IDs in the new order and save
    const orderedIds = updatedOfficials.map(o => o.id!);
    handleReorder(orderedIds);
  };

  return (
    <div className="admin-section">
      <h2>Funktionäre verwalten</h2>
      
      {isEditing ? (
        <OfficialEditor 
          official={selectedOfficial || undefined} 
          onSave={handleSaveOfficial}
          onCancel={() => {
            setIsEditing(false);
            setSelectedOfficial(null);
          }} 
        />
      ) : (
        <>
          <button 
            className="add-button" 
            onClick={() => {
              setSelectedOfficial(null);
              setIsEditing(true);
            }}
          >
            Neuen Funktionär hinzufügen
          </button>

          <div className="admin-list">
            <h3>Aktuelle Funktionäre</h3>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="officials">
                {(provided) => (
                  <div
                    className="officials-list"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="officials-header">
                      <span className="drag-handle-placeholder"></span>
                      <span>Name</span>
                      <span>Rolle(n)</span>
                      <span>Aktion</span>
                    </div>
                    
                    {officials.map((official, index) => (
                      <Draggable
                        key={official.id?.toString() || index.toString()}
                        draggableId={official.id?.toString() || index.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`official-item ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <div 
                              className="drag-handle" 
                              {...provided.dragHandleProps}
                            >
                              ⠿
                            </div>
                            <span className="official-name">{official.name}</span>
                            <span className="official-role">
                              {official.role1}
                              {official.role2 && (
                                <>, {official.role2}</>
                              )}
                            </span>
                            <div className="official-actions">
                              <button 
                                className="edit-button" 
                                onClick={() => {
                                  setSelectedOfficial(official);
                                  setIsEditing(true);
                                }}
                              >
                                ✏️
                              </button>
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

        </>
      )}

      <style jsx>{`
        .officials-list, .grouped-officials-list {
          margin-top: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .officials-header {
          display: grid;
          grid-template-columns: 50px 1fr 1fr 100px;
          background: #f5f5f5;
          padding: 0.75rem 1rem;
          font-weight: bold;
          align-items: center;
        }
        
        .official-item {
          display: grid;
          grid-template-columns: 50px 1fr 1fr 100px;
          padding: 0.75rem 1rem;
          border-top: 1px solid #e0e0e0;
          background: white;
          transition: background-color 0.2s;
          align-items: center;
        }
        
        .drag-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          font-size: 20px;
          color: #888;
        }
        
        .drag-handle-placeholder {
          width: 50px;
        }
        
        .official-name, .official-role {
          display: flex;
          align-items: center;
          padding: 0 5px;
        }
        
        .official-item:hover {
          background-color: #f0f7ff;
        }
        
        .official-item.dragging {
          opacity: 0.5;
        }
        
        .official-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        .edit-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .grouped-official-item {
          padding: 0.75rem 1rem;
          border-top: 1px solid #e0e0e0;
          background: white;
        }
        
        .grouped-official-item:first-child {
          border-top: none;
        }
        
        .official-roles {
          display: flex;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }
        
        .role-badge {
          background: #e0f2fe;
          color: #0369a1;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}