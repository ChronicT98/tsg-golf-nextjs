import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
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

    // Add 2024 statistics file
    yearData['2024'].static.statistik = '/scorecard-statistik/statistik_2024.jpg';

    // Get data from blob storage for other years
    const [scorecardBlobs, geldBlobs, statistikBlobs] = await Promise.all([
      list({ prefix: 'scorecards/', token: process.env.BLOB_READ_WRITE_TOKEN }),
      list({ prefix: 'scorecard-geld/', token: process.env.BLOB_READ_WRITE_TOKEN }),
      list({ prefix: 'scorecard-statistik/', token: process.env.BLOB_READ_WRITE_TOKEN })
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

    // Process statistics files first
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