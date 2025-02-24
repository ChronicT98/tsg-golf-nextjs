import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { customAlphabet } from 'nanoid';
import { getFileNumberFor2024Date } from '@/app/utils/dateMapping';

const nanoid = customAlphabet('1234567890abcdef', 10);

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
    const batchId = nanoid();

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
          
          if (year === '2024') {
            // For 2024, use file numbers
            const fileNumber = getFileNumberFor2024Date(dateStr);
            if (!fileNumber) {
              throw new Error(`Invalid date for 2024: ${dateStr}`);
            }
            fileName = `${prefix}_${fileNumber}.jpg`;
          } else {
            // For other years, use the full date
            fileName = `${prefix}_${dateStr}.jpg`;
          }
        } else {
          console.warn('Unrecognized file type:', file.name);
          continue;
        }

        let blobUrl: string;

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
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.details || 'Failed to convert PDF file');
          }

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || 'PDF conversion failed');
          }

          results.push({
            success: true,
            fileName: data.fileName,
            path: data.url
          });
          continue;
        }

        // For direct image uploads
        const targetPath = `${getTargetDirectory(fileName)}/${fileName}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        if (buffer.length === 0) {
          throw new Error('File is empty');
        }

        const blob = await put(targetPath, buffer, {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'image/jpeg',
          token: process.env.BLOB_READ_WRITE_TOKEN
        });

        blobUrl = blob.url;

        // Verify upload
        const verifyResponse = await fetch(blobUrl);
        if (!verifyResponse.ok) {
          throw new Error(`Failed to verify upload: ${verifyResponse.status}`);
        }

        results.push({
          success: true,
          fileName: fileName,
          path: blobUrl
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