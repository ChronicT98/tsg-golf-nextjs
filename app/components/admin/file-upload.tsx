'use client';

import React, { useState, useRef, DragEvent } from 'react';
import Image from 'next/image';

interface FileUploadProps {
  onFileSelect: (files: File[], date?: string) => void;
  acceptedTypes?: string[];
  allowDateSelection?: boolean;
  allowTypeSelection?: boolean;
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = ['application/pdf'],
  allowDateSelection = true,
  allowTypeSelection = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
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
        if (acceptedTypes.includes(file.type)) {
          files.push(file);
        }
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          reader.readEntries(resolve);
        });
        await Promise.all(entries.map(processEntry));
      }
    };

    await Promise.all(
      items.map(item => processEntry(item.webkitGetAsEntry() as FileSystemEntry))
    );

    if (files.length === 0) {
      alert('Bitte nur PDF-Dateien hochladen.');
      return;
    }

    setSelectedFiles(files);
    // Preview first few files
    const previews = await Promise.all(
      files.slice(0, 3).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
    setPreviewUrls(previews);
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onFileSelect(selectedFiles, selectedDate);
      // Reset form
      setSelectedFiles([]);
      setSelectedDate('');
      setPreviewUrls([]);
    }
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
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
            <p className="primary-text">Datei hier ablegen oder klicken zum Auswählen</p>
            <p className="secondary-text">Erlaubte Dateitypen: PDF (Ordner Upload möglich)</p>
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
        className="hidden"
        accept={acceptedTypes.join(',')}
        multiple
        {...{ directory: "", webkitdirectory: "", mozdirectory: "" } as any}
        onChange={(e) => {
          if (e.target.files) {
            const files = Array.from(e.target.files).filter(file => 
              acceptedTypes.includes(file.type) || 
              file.name.toLowerCase().endsWith('.pdf')
            );
            if (files.length > 0) {
              setSelectedFiles(files);
            } else {
              alert('Bitte nur PDF-Dateien hochladen.');
            }
          }
        }}
        style={{ display: 'none' }}
      />

      {selectedFiles.length > 0 && (
        <div className="file-details">
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