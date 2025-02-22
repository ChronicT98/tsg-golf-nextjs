import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { customAlphabet } from 'nanoid';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';

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

const execAsync = promisify(exec);
const nanoid = customAlphabet('1234567890abcdef', 10);

// Helper function to ensure directory exists
async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// Helper function to convert PDF to JPG using ImageMagick
async function pdfToImage(pdfPath: string, outputPath: string): Promise<void> {
  await execAsync(`convert -density 300 "${pdfPath}[0]" -quality 85 -trim "${outputPath}"`);
}

// Helper function to process image
async function processImage(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .jpeg({ quality: 85 })
    .trim() // Automatically remove whitespace
    .toBuffer();
}

// Helper function to determine target directory
function getTargetDirectory(filename: string): string {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('blechen')) {
    return 'blechen';
  } else if (lowerFilename.includes('statistik')) {
    return 'scorecard-statistik';
  } else if (lowerFilename.includes('geld')) {
    return 'scorecard-geld';
  } else {
    return 'scorecards';
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
    const publicDir = path.join(process.cwd(), 'public');
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
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const tempDir = path.join(process.cwd(), 'temp');
        await ensureDir(tempDir);

        const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        let imageBuffer: Buffer;

        if (isPDF) {
          // Save PDF temporarily
          const tempPdfPath = path.join(tempDir, `${nanoid()}.pdf`);
          const tempJpgPath = path.join(tempDir, `${nanoid()}.jpg`);
          await writeFile(tempPdfPath, buffer);

          // Convert PDF to JPG
          await pdfToImage(tempPdfPath, tempJpgPath);
          
          // Read the converted image
          imageBuffer = await sharp(tempJpgPath)
            .jpeg({ quality: 85 })
            .trim()
            .toBuffer();

          // Clean up temp files
          await execAsync(`rm "${tempPdfPath}" "${tempJpgPath}"`);
        } else {
          // Process existing image
          imageBuffer = await processImage(buffer);
        }

        // Determine target directory based on filename
        const targetDir = path.join(publicDir, getTargetDirectory(file.name));
        await ensureDir(targetDir);

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

    // Ensure target directory exists
    await ensureDir(targetDir);

        // Save processed image only if fileName is not empty
        if (fileName) {
          const filePath = path.join(targetDir, fileName);
          await writeFile(filePath, imageBuffer);

          // Add to results only if we actually saved a file
          results.push({
            success: true,
            fileName,
            path: `/${path.relative(publicDir, filePath).replace(/\\/g, '/')}`
          });
        }

        // Update custom-dates.json for all files with a date
        if (date && fileName) {
          const customDatesPath = path.join(process.cwd(), 'data', 'custom-dates.json');
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

      // Ensure data directory exists
      await ensureDir(path.dirname(customDatesPath));

          // Save updated custom dates
          await writeFile(
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