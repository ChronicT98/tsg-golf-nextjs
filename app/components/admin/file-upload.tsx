'use client';

import React, { useState, useRef, DragEvent } from 'react';

interface FileUploadProps {
  onFileSelect: (files: File[], date?: string, year?: string) => void;
  acceptedTypes?: string[];
  allowDateSelection?: boolean;
  allowYearSelection?: boolean;
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'],
  allowDateSelection = true,
  allowYearSelection = true,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
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
    const seenNames = new Set<string>();
    
    const processEntry = async (entry: FileSystemEntry) => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => {
          (entry as FileSystemFileEntry).file(resolve);
        });
        const lowerName = file.name.toLowerCase();
        
        // Check if this is a valid file type
        if (acceptedTypes.includes(file.type) || 
            lowerName.endsWith('.jpg') || 
            lowerName.endsWith('.jpeg') ||
            lowerName.endsWith('.pdf')) {
          
          // Extract type prefix and number
          const typeMatch = lowerName.match(/(statistik|blechen|geld|spiel)_(\d+)/i);
          if (typeMatch) {
            const [, type, number] = typeMatch;
            const key = `${type.toLowerCase()}_${number}`;
            
            // If we haven't seen this combination before, add it
            if (!seenNames.has(key)) {
              seenNames.add(key);
              files.push(file);
            }
          }
        }
      }
    };

    await Promise.all(
      items.map(item => processEntry(item.webkitGetAsEntry() as FileSystemEntry))
    );

    if (files.length === 0) {
      alert('Bitte nur PDF oder JPG-Dateien hochladen.');
      return;
    }

    // Sort files by type to ensure consistent order
    const sortedFiles = files.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Sort by file type first
      if (aName.includes('statistik') && !bName.includes('statistik')) return -1;
      if (!aName.includes('statistik') && bName.includes('statistik')) return 1;
      if (aName.includes('blechen') && !bName.includes('blechen')) return -1;
      if (!aName.includes('blechen') && bName.includes('blechen')) return 1;
      if (aName.includes('geld') && !bName.includes('geld')) return -1;
      if (!aName.includes('geld') && bName.includes('geld')) return 1;
      
      // Then by name
      return aName.localeCompare(bName);
    });

    setSelectedFiles(sortedFiles);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onFileSelect(selectedFiles, formatDate(selectedDate), selectedYear);
      // Reset form
      setSelectedFiles([]);
      setSelectedDate('');
      setSelectedYear(new Date().getFullYear().toString());
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-container">
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="primary-text">Dateien hier ablegen oder klicken zum Auswählen</p>
            <p className="secondary-text">Erlaubte Dateitypen: PDF, JPG (Mehrfachauswahl möglich)</p>
          </div>
        ) : (
          <div className="preview-container">
            <div className="files-preview">
              {selectedFiles.map((file, index) => (
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <p className="file-name">{file.name}</p>
                </div>
              ))}
              {selectedFiles.length > 3 && (
                <p className="more-files">+{selectedFiles.length - 3} weitere Dateien</p>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept={acceptedTypes.join(',')}
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) {
            const files = Array.from(e.target.files).filter(file => 
              acceptedTypes.includes(file.type) || 
              file.name.toLowerCase().endsWith('.pdf') ||
              file.name.toLowerCase().endsWith('.jpg') ||
              file.name.toLowerCase().endsWith('.jpeg')
            );
            if (files.length > 0) {
              setSelectedFiles(files);
            } else {
              alert('Bitte nur PDF oder JPG-Dateien hochladen.');
            }
          }
        }}
      />

      {selectedFiles.length > 0 && (
        <div className="file-details">
          {allowYearSelection && (
            <div className="form-group">
              <label htmlFor="year">Jahr:</label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                required
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          )}
          {allowDateSelection && (
            <div className="form-group">
              <label htmlFor="date">Datum:</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={allowDateSelection && !selectedDate}
          >
            Hochladen
          </button>
        </div>
      )}
    </div>
  );
}