'use client';

import React, { useState, useRef, DragEvent } from 'react';

interface UploadResult {
  success: boolean;
  fileName: string;
  error?: string;
}

interface GalleryUploadProps {
  onUploadComplete?: (results: UploadResult[]) => void;
}

export default function GalleryUpload({ onUploadComplete }: GalleryUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    results?: UploadResult[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    if (items) {
      handleItems(Array.from(items));
    }
  };

  const handleItems = async (items: DataTransferItem[]) => {
    const files: File[] = [];
    
    const processEntry = async (entry: FileSystemEntry) => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => {
          (entry as FileSystemFileEntry).file(resolve);
        });
        const lowerName = file.name.toLowerCase();
        
        // Check if this is an image file
        if (file.type.startsWith('image/') || 
            lowerName.endsWith('.jpg') || 
            lowerName.endsWith('.jpeg') ||
            lowerName.endsWith('.png') ||
            lowerName.endsWith('.gif')) {
          files.push(file);
        }
      }
    };

    await Promise.all(
      items.map(item => processEntry(item.webkitGetAsEntry() as FileSystemEntry))
    );

    if (files.length === 0) {
      alert('Bitte nur Bilder hochladen (JPG, PNG, GIF).');
      return;
    }

    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    // Validate category
    if (!customCategory.trim()) {
      setCategoryError('Bitte geben Sie eine Kategorie ein');
      return;
    }
    
    setIsUploading(true);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      
      selectedFiles.forEach(file => {
        formData.append('file', file);
      });
      
      // Speichere den originalen Kategorienamen für die Anzeige
      const originalCategoryName = customCategory.trim();
      
      // Create a URL-friendly version of the category using the same standardized format as the API
      // This ensures consistent category naming between upload and display
      const safeCategory = originalCategoryName.toLowerCase().replace(/[^a-z0-9äöüß]/g, '-');
      
      // Show the user what category name will be used
      console.log(`Using category name: ${safeCategory} (Original: "${originalCategoryName}")`);
      
      formData.append('category', safeCategory);
      formData.append('originalCategoryName', originalCategoryName);
      
      const response = await fetch('/api/gallery-images', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Hochladen');
      }
      
      const data = await response.json();
      
      if (data.results) {
        const successCount = data.results.filter((r: UploadResult) => r.success).length;
        const totalCount = data.results.length;
        
        setUploadResult({
          success: successCount === totalCount,
          message: `${successCount} von ${totalCount} Dateien erfolgreich hochgeladen.`,
          results: data.results
        });
        
        if (onUploadComplete) {
          onUploadComplete(data.results);
        }
        
        // Reset form if successful
        if (successCount === totalCount) {
          setSelectedFiles([]);
          setCustomCategory(''); // Reset the category input as well
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unbekannter Fehler beim Hochladen'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  return (
    <div className="gallery-upload-container">
      
      <div className="form-group">
        <label htmlFor="category">Kategorie:</label>
        <input
          type="text"
          id="category"
          value={customCategory}
          onChange={(e) => {
            setCustomCategory(e.target.value);
            setCategoryError('');
          }}
          placeholder="Neue Kategorie eingeben (z.B. Turniere 2024)"
          className="category-input"
        />
        {categoryError && <p className="error-message">{categoryError}</p>}
      </div>
      
      <div
        className={`file-upload ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {selectedFiles.length === 0 ? (
          <div className="upload-instructions">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="primary-text">Bilder hier ablegen oder klicken zum Auswählen</p>
            <p className="secondary-text">Erlaubte Dateitypen: JPG, PNG, GIF (Mehrfachauswahl möglich)</p>
          </div>
        ) : (
          <div className="preview-container">
            <div className="files-preview">
              {selectedFiles.slice(0, 3).map((file, index) => (
                <div key={index} className="file-item">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="file-name">{file.name}</p>
                </div>
              ))}
              {selectedFiles.length > 3 && (
                <p className="more-files">+{selectedFiles.length - 3} weitere Bilder</p>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) {
            const files = Array.from(e.target.files).filter(file => 
              file.type.startsWith('image/') || 
              file.name.toLowerCase().endsWith('.jpg') ||
              file.name.toLowerCase().endsWith('.jpeg') ||
              file.name.toLowerCase().endsWith('.png') ||
              file.name.toLowerCase().endsWith('.gif')
            );
            if (files.length > 0) {
              setSelectedFiles(files);
            } else {
              alert('Bitte nur Bilder hochladen (JPG, PNG, GIF).');
            }
          }
        }}
      />

      {selectedFiles.length > 0 && (
        <div className="upload-actions">
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedFiles([])}
            disabled={isUploading}
          >
            Zurücksetzen
          </button>
        </div>
      )}

      {uploadResult && (
        <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
          <p>{uploadResult.message}</p>
          {uploadResult.results && !uploadResult.success && (
            <ul className="error-list">
              {uploadResult.results
                .filter((r: UploadResult) => !r.success)
                .map((r: UploadResult, i: number) => (
                  <li key={i}>
                    {r.fileName}: {r.error}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}