import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';
import { dateMapping2024 } from '@/app/utils/dateMapping';

interface SpielScorecard {
  id: string;
  date: string;
  fileName: string;
  geldFileName?: string;
}

interface StaticFiles {
  geld?: string;
  statistik?: string;
  blechen?: string;
}

interface YearData {
  static: StaticFiles;
  spielCards: SpielScorecard[];
}

interface ResponseData {
  [year: string]: YearData;
}


// Helper function to parse date from dynamic filenames (_DD.MM.YYYY)
function parseDynamicDate(filename: string): { date: string; year: string } | null {
  const match = filename.match(/_(\d{2}\.\d{2}\.\d{4})\.jpg$/);
  if (match) {
    const dateStr = match[1];
    const year = dateStr.split('.')[2];
    return {
      date: dateStr,
      year
    };
  }
  return null;
}

// Helper function to get URL path from full URL
function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
  } catch (e) {
    return url;
  }
}

export async function GET() {
  try {
    // Initialize empty response structure
    const yearData: ResponseData = {};

    // Initialize 2024 with empty structure
    yearData['2024'] = {
      static: {},
      spielCards: []
    };

    // Add fixed 2024 data
    Object.entries(dateMapping2024).forEach(([fileNumber, date]) => {
      const spielCard: SpielScorecard = {
        id: `spiel_${fileNumber}`,
        date: date,
        fileName: `/scorecards/spiel_${fileNumber}.jpg`,
        geldFileName: `/scorecard-geld/geld_${fileNumber}.jpg`
      };
      yearData['2024'].spielCards.push(spielCard);
    });

    // Add 2024 static files
    yearData['2024'].static.statistik = '/scorecard-statistik/statistik_2024.jpg';
    yearData['2024'].static.blechen = '/blechen/blechen_2024.jpg';

    // Get data from blob storage for other years
    const [scorecardBlobs, geldBlobs, statistikBlobs, blechenBlobs] = await Promise.all([
      list({ prefix: 'scorecards/', token: process.env.BLOB_READ_WRITE_TOKEN }),
      list({ prefix: 'scorecard-geld/', token: process.env.BLOB_READ_WRITE_TOKEN }),
      list({ prefix: 'scorecard-statistik/', token: process.env.BLOB_READ_WRITE_TOKEN }),
      list({ prefix: 'blechen/', token: process.env.BLOB_READ_WRITE_TOKEN })
    ]);

    // Create a map of geld files by date for dynamic years
    const geldFilesByDate = new Map<string, string>();
    geldBlobs.blobs
      .filter(blob => blob.pathname.endsWith('.jpg'))
      .forEach(blob => {
        const filename = blob.pathname.split('/').pop() || '';
        const dateInfo = parseDynamicDate(filename);
        if (dateInfo && dateInfo.year !== '2024') {
          geldFilesByDate.set(dateInfo.date, blob.url);
        }
      });

    // Process Blechstatistik files
    blechenBlobs?.blobs
      .filter(blob => blob.pathname.endsWith('.jpg'))
      .forEach(blob => {
        const filename = blob.pathname.split('/').pop() || '';
        const yearMatch = filename.match(/blechen_(\d{4})\.jpg$/);
        if (yearMatch) {
          const year = yearMatch[1];
          if (!yearData[year]) {
            yearData[year] = {
              static: {},
              spielCards: []
            };
          }
          yearData[year].static.blechen = blob.url;
        }
      });

    // Process statistics files
    statistikBlobs?.blobs
      .filter(blob => blob.pathname.endsWith('.jpg'))
      .forEach(blob => {
        const filename = blob.pathname.split('/').pop() || '';
        const yearMatch = filename.match(/statistik_(\d{4})\.jpg$/);
        if (yearMatch) {
          const year = yearMatch[1];
          // Initialize year data if it doesn't exist
          if (!yearData[year]) {
            yearData[year] = {
              static: {},
              spielCards: []
            };
          }
          yearData[year].static.statistik = blob.url;
        }
      });

    // Process spiel files
    scorecardBlobs.blobs
      .filter(blob => blob.pathname.endsWith('.jpg'))
      .forEach(blob => {
        const filename = blob.pathname.split('/').pop() || '';
        const dateInfo = parseDynamicDate(filename);
        
        if (dateInfo && dateInfo.year !== '2024') {
          // Initialize year data if it doesn't exist
          if (!yearData[dateInfo.year]) {
            yearData[dateInfo.year] = {
              static: {},
              spielCards: []
            };
          }

          const spielCard: SpielScorecard = {
            id: filename,
            date: dateInfo.date,
            fileName: blob.url,
            geldFileName: geldFilesByDate.get(dateInfo.date)
          };
          
          yearData[dateInfo.year].spielCards.push(spielCard);
        }
      });

    // Sort spielCards by date for each year
    Object.values(yearData).forEach(year => {
      year.spielCards.sort((a, b) => {
        const parseDate = (dateStr: string) => {
          const [day, month, year] = dateStr.split('.');
          return new Date(`${year}-${month}-${day}`);
        };
        return parseDate(a.date).getTime() - parseDate(b.date).getTime();
      });
    });

    return NextResponse.json(yearData);
  } catch (error) {
    console.error('Error fetching scorecards:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Scorecards' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const id = searchParams.get('id');

    if (!year || !id) {
      return NextResponse.json(
        { error: 'Jahr und ID sind erforderlich' },
        { status: 400 }
      );
    }

    // For 2024, we don't delete from blob storage as these are static files
    if (year === '2024') {
      return NextResponse.json({ success: true });
    }

    // For other years, delete from blob storage
    const [scorecardBlobs, geldBlobs] = await Promise.all([
      list({ prefix: 'scorecards/', token: process.env.BLOB_READ_WRITE_TOKEN }),
      list({ prefix: 'scorecard-geld/', token: process.env.BLOB_READ_WRITE_TOKEN })
    ]);

    // Find the scorecard blob
    const scorecardBlob = scorecardBlobs.blobs.find(blob => 
      blob.pathname.endsWith(id)
    );

    if (!scorecardBlob) {
      return NextResponse.json(
        { error: 'Scorecard nicht gefunden' },
        { status: 404 }
      );
    }

    // Delete the scorecard from blob storage
    await del(getPathFromUrl(scorecardBlob.url), { token: process.env.BLOB_READ_WRITE_TOKEN });

    // Find and delete corresponding geld file if it exists
    const dateInfo = parseDynamicDate(id);
    if (dateInfo) {
      const geldBlob = geldBlobs.blobs.find(blob => {
        const filename = blob.pathname.split('/').pop() || '';
        return filename.includes(dateInfo.date);
      });

      if (geldBlob) {
        await del(getPathFromUrl(geldBlob.url), { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scorecard:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Scorecard' },
      { status: 500 }
    );
  }
}