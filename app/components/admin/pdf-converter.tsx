'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import FileUpload from './file-upload';

interface PdfConverterProps {
  onConversionComplete: (files: File[], date?: string, year?: string) => void;
}

export default function PdfConverter({ onConversionComplete }: PdfConverterProps): React.ReactElement {
  const [isConverting, setIsConverting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

    const convertPdfToJpeg = async (pdfFile: File, date?: string, year?: string): Promise<File> => {
      try {
        const formData = new FormData();
        formData.append('file', pdfFile);
        if (date) formData.append('date', date);
        if (year) formData.append('year', year);

        const response = await fetch('/api/convert-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.details || data.error || 'Konvertierung fehlgeschlagen';
        console.error('Konvertierungsfehler:', data);
        throw new Error(errorMessage);
      }
      
      // Download the converted file from CloudConvert
      const imageResponse = await fetch(data.url);
      if (!imageResponse.ok) {
        throw new Error('Fehler beim Herunterladen der konvertierten Datei');
      }

      const imageBlob = await imageResponse.blob();
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(imageBlob);
      setPreviewUrl(previewUrl);

      // Return as File object
      return new File([imageBlob], data.filename || pdfFile.name.replace('.pdf', '.jpg'), {
        type: 'image/jpeg'
      });

    } catch (error) {
      console.error('Fehler beim Konvertieren der PDF:', error);
      let errorMessage = 'PDF konnte nicht konvertiert werden';
      
      if (error instanceof Error) {
        // Versuche, spezifische Fehlermeldungen zu extrahieren
        if (error.message.includes('502')) {
          errorMessage = 'Der Konvertierungsservice ist momentan nicht erreichbar. Bitte versuchen Sie es in einigen Minuten erneut.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Die Konvertierung hat zu lange gedauert. Bitte versuchen Sie es mit einer kleineren Datei.';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  const handlePdfSelect = async (files: File[], date?: string, year?: string) => {
    setIsConverting(true);
    setError(null);
    
    try {
      const convertedFiles = await Promise.all(
        files
          .filter(file => file.type === 'application/pdf')
          .map(file => convertPdfToJpeg(file, date, year))
      );
      
      if (convertedFiles.length > 0) {
        onConversionComplete(convertedFiles);
      } else {
        setError('Keine PDF-Dateien gefunden');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Konvertierung');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="pdf-converter">
      <h3>PDF zu JPEG Konverter (CloudConvert)</h3>
      
      <FileUpload
        onFileSelect={handlePdfSelect}
        acceptedTypes={['application/pdf']}
        allowDateSelection={true}
        allowYearSelection={true}
      />

      {isConverting && (
        <div className="converting-status">
          <div className="spinner"></div>
          <p>Konvertiere PDF mit CloudConvert...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {previewUrl && !isConverting && (
        <div className="preview-container">
          <h4>Vorschau:</h4>
          <div style={{ position: 'relative', width: '100%', maxWidth: '800px', height: 'auto', aspectRatio: '1/1.414' }}>
            <Image 
              src={previewUrl} 
              alt="Konvertierte PDF"
              fill
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .pdf-converter {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
        }

        .converting-status {
          margin: 20px 0;
          text-align: center;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          color: red;
          margin: 10px 0;
          padding: 10px;
          border: 1px solid red;
          border-radius: 4px;
          background-color: #fff5f5;
        }

        .preview-container {
          margin-top: 20px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        h4 {
          margin: 0 0 10px 0;
          color: #666;
        }

        p {
          margin: 0 0 20px 0;
          color: #666;
        }
      `}</style>
    </div>
  );
}