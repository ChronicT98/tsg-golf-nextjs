import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { customAlphabet } from 'nanoid';

interface CustomDateEntry {
  date: string;
  geldFile?: string;
}

interface YearData {
  [fileName: string]: CustomDateEntry;
}

interface CustomDates {
  [year: string]: YearData;
}

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

    const results = [];
    const batchId = nanoid(); // Generate one ID for the entire batch

    // First, sort files by type to ensure consistent processing order
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

    // Process files in sorted order
    for (const file of sortedFiles) {
      try {
        const baseFilename = file.name.toLowerCase();
        let fileName: string;
        let fileType: 'statistik' | 'blechen' | 'geld' | 'spiel' | null = null;

        // Extract number from filename (e.g., "spiel_01.jpg" -> "01")
        const numberMatch = baseFilename.match(/[_-](\d+)\./);
        const fileNumber = numberMatch ? numberMatch[1] : null;

        // Determine file type and generate filename
        if (baseFilename.includes('statistik')) {
          fileType = 'statistik';
          fileName = `statistik_${fileNumber || year}.jpg`;
        } else if (baseFilename.includes('blechen')) {
          fileType = 'blechen';
          fileName = `blechen_${fileNumber || batchId}.jpg`;
        } else if (baseFilename.includes('geld')) {
          fileType = 'geld';
          fileName = `geld_${fileNumber || batchId}.jpg`;
        } else if (baseFilename.includes('spiel')) {
          fileType = 'spiel';
          fileName = `spiel_${fileNumber || batchId}.jpg`;
        } else {
          console.warn('Unrecognized file type:', file.name);
          continue;
        }

        // Upload to Vercel Blob Storage
        const targetPath = `${getTargetDirectory(fileName)}/${fileName}`;
        const blob = await put(targetPath, file, {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'image/jpeg'
        });

        // Add to results only if we actually uploaded a file
        results.push({
          success: true,
          fileName,
          path: blob.url
        });

        // Update custom-dates.json for all files with a date
        if (date && fileName) {
          const customDatesPath = 'data/custom-dates.json';
          let customDates: CustomDates = {};

          // Read existing custom dates
          try {
            const existing = await import('@/data/custom-dates.json');
            customDates = existing.default;
          } catch {
            // File doesn't exist or is empty, use empty object
          }

          // Update custom dates with year information
          const yearData = customDates[year] || {};

          // Update custom dates based on file type
          switch (fileType) {
            case 'statistik':
            case 'blechen':
              customDates = {
                ...customDates,
                [year]: {
                  ...yearData,
                  [fileName]: {
                    date: date
                  }
                }
              };
              break;
            
            case 'spiel':
              // For spiel files, look for matching geld file
              const geldFileName = fileNumber ? `geld_${fileNumber}.jpg` : `geld_${batchId}.jpg`;
              const hasMatchingGeld = sortedFiles.some(f => {
                const fName = f.name.toLowerCase();
                if (!fName.includes('geld')) return false;
                
                // Try to match by number first
                const fNumber = fName.match(/[_-](\d+)\./)?.[1];
                if (fNumber && fileNumber) {
                  return fNumber === fileNumber;
                }
                
                // Fallback to name comparison
                return fName.replace('geld', '').toLowerCase() === 
                       baseFilename.replace('spiel', '').toLowerCase();
              });
              
              customDates = {
                ...customDates,
                [year]: {
                  ...yearData,
                  [fileName]: {
                    date: date,
                    ...(hasMatchingGeld ? { geldFile: geldFileName } : {})
                  }
                }
              };
              break;
          }

          // Save updated custom dates
          const fs = require('fs/promises');
          const path = require('path');
          await fs.mkdir(path.dirname(customDatesPath), { recursive: true });
          await fs.writeFile(
            customDatesPath,
            JSON.stringify(customDates, null, 2)
          );
        }

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