import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Helper function to determine target directory - aligned with migration paths
function getTargetDirectory(filename: string): string {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('blechen')) {
    return 'blechen';
  } else if (lowerFilename.includes('statistik')) {
    return 'scorecard-statistik';
  } else if (lowerFilename.includes('geld')) {
    return 'scorecard-geld';
  } else if (lowerFilename.includes('spiel')) {
    return 'scorecards';
  } else {
    throw new Error('Unrecognized file type');
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const date = formData.get('date') as string | null;
    const year = formData.get('year') as string || new Date().getFullYear().toString();

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Keine Dateien hochgeladen' },
        { status: 400 }
      );
    }

    const results: Array<{ success: boolean; fileName: string; path?: string; error?: string }> = [];

    // Sort files by type
    const sortedFiles = files.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      if (aName.includes('statistik') && !bName.includes('statistik')) return -1;
      if (!aName.includes('statistik') && bName.includes('statistik')) return 1;
      if (aName.includes('blechen') && !bName.includes('blechen')) return -1;
      if (!aName.includes('blechen') && bName.includes('blechen')) return 1;
      if (aName.includes('geld') && !bName.includes('geld')) return -1;
      if (!aName.includes('geld') && bName.includes('geld')) return 1;
      
      return aName.localeCompare(bName);
    });

    // Format date for filename (DD.MM.YYYY)
    const formatDateForFilename = (dateStr: string) => {
      if (!dateStr) return '';
      if (dateStr.includes('.')) {
        return dateStr; // Already in correct format
      }
      if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
      }
      return dateStr;
    };

    // Process files
    for (const file of sortedFiles) {
      try {
        const baseFilename = file.name.toLowerCase();
        let fileName: string;

        // Skip files that were already processed
        if (baseFilename.match(/_([\d.]+)\.jpg$/)) {
          console.log('Skipping already processed file:', file.name);
          continue;
        }

        // Determine file name and process file
        if (baseFilename.includes('statistik')) {
          fileName = `statistik_${year}.jpg`;
        } else if (baseFilename.includes('blechen')) {
          fileName = `blechen_${year}.jpg`;
        } else if (baseFilename.includes('geld') || baseFilename.includes('spiel')) {
          const prefix = baseFilename.includes('geld') ? 'geld' : 'spiel';
          const dateStr = formatDateForFilename(date || '');
          
          // Use the full date for all years
          fileName = `${prefix}_${dateStr}.jpg`;
        } else {
          console.warn('Unrecognized file type:', file.name);
          continue;
        }

        // For direct image uploads
        const targetPath = `${getTargetDirectory(fileName)}/${fileName}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        if (buffer.length === 0) {
          throw new Error('File is empty');
        }

        if (file.type === 'application/pdf') {
          // Handle PDF conversion
          const pdfFormData = new FormData();
          pdfFormData.append('file', file);
          pdfFormData.append('date', date || '');
          pdfFormData.append('year', year);

          const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
          const host = request.headers.get('host') || 'localhost:3000';
          const response = await fetch(`${protocol}://${host}/api/convert-pdf`, {
            method: 'POST',
            body: pdfFormData,
          });

          if (!response.ok) {
            let errorMessage = 'Failed to convert PDF file';
            try {
              // Try to parse the error response as JSON
              const errorData = await response.clone().json();
              errorMessage = errorData.error || errorData.details || errorMessage;
            } catch (jsonError) {
              // If JSON parsing fails, try to get the response as text
              try {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
                console.error('PDF conversion error (text):', errorText);
              } catch (textError) {
                console.error('Error reading error response:', textError);
              }
            }
            throw new Error(errorMessage);
          }

          // Parse the successful response
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Error parsing convert-pdf response:', jsonError);
            throw new Error('Die Serverantwort konnte nicht verarbeitet werden');
          }
          if (!data.success) {
            throw new Error(data.error || 'PDF conversion failed');
          }

          results.push({
            success: true,
            fileName: data.fileName,
            path: data.url
          });
          
          // Skip further processing for this file - PDF already converted and uploaded
          continue;
        }

        // Upload the file to blob storage
        const blob = await put(targetPath, buffer, {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'image/jpeg',
          token: process.env.BLOB_READ_WRITE_TOKEN
        });

        // Add cache-busting query parameter to URL
        const cacheBustUrl = `${blob.url}?v=${Date.now()}`;
        console.log('Cache-busted URL:', cacheBustUrl);

        // Verify upload
        const verifyResponse = await fetch(blob.url);
        if (!verifyResponse.ok) {
          throw new Error(`Failed to verify upload: ${verifyResponse.status}`);
        }

        results.push({
          success: true,
          fileName: fileName,
          path: cacheBustUrl
        });

      } catch (error) {
        console.error('Error processing file:', file.name, error);
        results.push({
          success: false,
          fileName: file.name,
          error: 'Fehler bei der Verarbeitung der Datei'
        });
      }
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Datei' },
      { status: 500 }
    );
  }
}