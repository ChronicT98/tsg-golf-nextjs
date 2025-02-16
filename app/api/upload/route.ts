import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { customAlphabet } from 'nanoid';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';

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
  } else {
    return 'scorecards';
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const date = formData.get('date') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Keine Dateien hochgeladen' },
        { status: 400 }
      );
    }
    const publicDir = path.join(process.cwd(), 'public');
    const results = [];

    for (const file of files) {
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

        // Generate filename
        const id = nanoid();
        const baseFilename = file.name.toLowerCase();
        let fileName: string;

        if (baseFilename.includes('geld')) {
          fileName = `geld_${id}.jpg`;
        } else if (baseFilename.includes('statistik')) {
          fileName = `statistik_${new Date().getFullYear()}.jpg`;
        } else if (baseFilename.includes('blechen')) {
          fileName = `blechen_${id}.jpg`;
        } else {
          fileName = `spiel_${id}.jpg`;
        }

    // Ensure target directory exists
    await ensureDir(targetDir);

        // Save processed image
        const filePath = path.join(targetDir, fileName);
        await writeFile(filePath, imageBuffer);

        // Update custom-dates.json if it's a scorecard and has a date
        if (!fileName.includes('statistik') && !fileName.includes('blechen') && date) {
      const customDatesPath = path.join(process.cwd(), 'data', 'custom-dates.json');
      let customDates = {};

          // Read existing custom dates
          try {
            const existing = await import('@/data/custom-dates.json');
            customDates = existing.default;
          } catch {
            // File doesn't exist or is empty, use empty object
          }

          // Update custom dates
          customDates = {
            ...customDates,
            [fileName]: {
              date: date,
              ...(fileName.includes('geld') ? { geldFile: fileName } : {})
            }
          };

      // Ensure data directory exists
      await ensureDir(path.dirname(customDatesPath));

          // Save updated custom dates
          await writeFile(
            customDatesPath,
            JSON.stringify(customDates, null, 2)
          );
        }

        results.push({
          success: true,
          fileName,
          path: `/${path.relative(publicDir, filePath).replace(/\\/g, '/')}`
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