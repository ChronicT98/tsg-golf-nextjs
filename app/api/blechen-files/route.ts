import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// Helper function to parse year from filename
function parseYearFromFilename(filename: string): string | null {
  const match = filename.match(/blechen_(\d{4})\.jpg$/);
  return match ? match[1] : null;
}

export async function GET() {
  try {
    // Initialize years with empty values
    const latestFiles: Record<string, string> = {
      '2025': '',
      '2024': '',
      '2023': '',
      '2022': ''
    };

    // List all files in the blechen directory from blob storage
    const blobFiles = await list({ 
      prefix: 'blechen/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    // Process each blechen file
    blobFiles.blobs
      .filter(blob => blob.pathname.endsWith('.jpg'))
      .forEach(blob => {
        const filename = blob.pathname.split('/').pop() || '';
        const year = parseYearFromFilename(filename);
        
        if (year && latestFiles.hasOwnProperty(year)) {
          latestFiles[year] = blob.url;
        }
      });

    return NextResponse.json(latestFiles);
  } catch (error) {
    console.error('Error reading blechen files:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Blechen-Dateien' },
      { status: 500 }
    );
  }
}