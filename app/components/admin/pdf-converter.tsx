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

      console.log(`Converting PDF file: ${pdfFile.name}, date: ${date}, year: ${year}`);

      // First make the request to convert
      let response;
      try {
        response = await fetch('/api/convert-pdf', {
          method: 'POST',
          body: formData,
        });
      } catch (fetchError) {
        console.error('Network error during fetch:', fetchError);
        throw new Error('Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
      }

      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage = 'Konvertierung fehlgeschlagen';
        
        try {
          // Try to parse as JSON first
          const errorData = await response.clone().json();
          errorMessage = errorData.details || errorData.error || errorMessage;
          console.error('Server error (JSON):', errorData);
        } catch (_) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text();
            // Only use the text if it's reasonably short
            if (errorText && errorText.length < 500) {
              errorMessage = errorText;
            }
            console.error('Server error (text):', errorText.substring(0, 1000)); // Log only first 1000 chars
          } catch (textError) {
            console.error('Error reading response body:', textError);
          }
        }
        
        throw new Error(`Fehler bei der Konvertierung: ${errorMessage}`);
      }

      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (_) {
        console.error('Error parsing server response');
        throw new Error('Die Serverantwort konnte nicht verarbeitet werden. Bitte versuchen Sie es später erneut.');
      }

      // Validate response data
      if (!data.success) {
        throw new Error(data.error || 'Unbekannter Fehler bei der Konvertierung');
      }
      
      if (!data.url) {
        throw new Error('Die Konvertierung war erfolgreich, aber keine Bild-URL wurde zurückgegeben');
      }

      console.log('Conversion successful, downloading converted file from:', data.url);
      
      // Download the converted file
      let imageResponse;
      try {
        imageResponse = await fetch(data.url);
      } catch (fetchError) {
        console.error('Error downloading converted image:', fetchError);
        throw new Error('Fehler beim Herunterladen der konvertierten Datei');
      }
      
      if (!imageResponse.ok) {
        throw new Error(`Fehler beim Herunterladen der konvertierten Datei: ${imageResponse.status}`);
      }

      // Process the image
      const imageBlob = await imageResponse.blob();
      
      // Create preview URL with cache-busting parameter
      const timestamp = Date.now();
      const cacheUrl = `${data.url}?v=${timestamp}`;
      setPreviewUrl(cacheUrl);

      // Return as File object
      return new File([imageBlob], data.fileName || pdfFile.name.replace('.pdf', '.jpg'), {
        type: 'image/jpeg'
      });

    } catch (error) {
      console.error('Fehler beim Konvertieren der PDF:', error);
      let errorMessage = 'PDF konnte nicht konvertiert werden';
      
      if (error instanceof Error) {
        // Extract specific error messages
        if (error.message.includes('502')) {
          errorMessage = 'Der Konvertierungsservice ist momentan nicht erreichbar. Bitte versuchen Sie es in einigen Minuten erneut.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Die Konvertierung hat zu lange gedauert. Bitte versuchen Sie es mit einer kleineren Datei.';
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';
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
    setPreviewUrl(null);
    
    try {
      // Filter PDF files
      const pdfFiles = files.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length === 0) {
        setError('Keine PDF-Dateien ausgewählt');
        setIsConverting(false);
        return;
      }
      
      // Convert each PDF file
      const convertedFiles = await Promise.all(
        pdfFiles.map(file => convertPdfToJpeg(file, date, year))
      );
      
      if (convertedFiles.length > 0) {
        onConversionComplete(convertedFiles, date, year);
      } else {
        setError('Keine Dateien konnten konvertiert werden');
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