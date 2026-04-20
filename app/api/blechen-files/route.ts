import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// Helper function to parse year from filename
function parseYearFromFilename(filename: string): string | null {
  const match = filename.match(/blechen_(\d{4})\.jpg$/);
  return match ? match[1] : null;
}

export async function GET() {
  try {
    const latestFiles: Record<string, string> = {};

    const blobFiles = await list({
      prefix: 'blechen/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    blobFiles.blobs
      .filter(blob => blob.pathname.endsWith('.jpg'))
      .forEach(blob => {
        const filename = blob.pathname.split('/').pop() || '';
        const year = parseYearFromFilename(filename);
        if (year) {
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
