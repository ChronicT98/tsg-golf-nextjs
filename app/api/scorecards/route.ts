import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

interface CustomDateEntry {
  date: string;
  geldFile?: string;
}

interface FileData {
  [filename: string]: CustomDateEntry;
}

interface CustomDates {
  [year: string]: FileData;
}

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

// Hilfsfunktion zum Laden der benutzerdefinierten Daten
async function loadCustomDates(): Promise<CustomDates> {
  try {
    const { list } = await import('@vercel/blob');
    console.log('Listing blobs with data/ prefix...');
    const customDatesBlob = await list({ prefix: 'data/' });
    
    console.log('Found blobs:', customDatesBlob.blobs.map(b => b.pathname));
    const customDatesFile = customDatesBlob.blobs.find(blob => blob.pathname === 'data/custom-dates.json');
    
    if (!customDatesFile) {
      console.error('custom-dates.json not found in blob storage');
      throw new Error('custom-dates.json not found');
    }

    console.log('Found custom-dates.json at:', customDatesFile.url);
    const response = await fetch(customDatesFile.url);
    
    if (!response.ok) {
      console.error('Failed to fetch custom-dates.json:', response.status, response.statusText);
      throw new Error(`Failed to load custom dates: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully loaded custom dates with years:', Object.keys(data));
    return data;
  } catch (error) {
    console.error('Error loading custom dates:', error);
    // Instead of returning empty object, throw error to trigger 500 response
    throw error;
  }
}

// Hilfsfunktion zum Extrahieren des Jahres aus dem Dateinamen oder Datum
function getYearFromFileOrDate(fileName: string, customDates: CustomDates): string {
  // Zuerst in custom-dates.json nachschauen
  for (const year in customDates) {
    if (customDates[year][fileName]) {
      return year;
    }
  }
  
  // Dann nach Jahr im Dateinamen suchen
  const yearMatch = fileName.match(/_(20\d{2})/);
  return yearMatch ? yearMatch[1] : "2024";
}

// Hilfsfunktion zum Konvertieren eines Datums in ein Date-Objekt
function parseDate(dateStr: string): Date {
  // Prüfen ob deutsches Datumsformat (DD.MM.YYYY)
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
  }
  // ISO Format (YYYY-MM-DD)
  return new Date(dateStr);
}

export async function GET() {
  try {
    let customDates: CustomDates;
    try {
      customDates = await loadCustomDates();
    } catch (error) {
      console.error('Failed to load custom dates:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der benutzerdefinierten Daten' },
        { status: 500 }
      );
    }
    const years = ['2025', '2024', '2023', '2022'];
    
    // Initialize year data
    const yearData: ResponseData = {};
    years.forEach(year => {
      yearData[year] = {
        static: {},
        spielCards: []
      };
    });

    // List all files from blob storage
    const [scorecardBlobs, statistikBlobs, geldBlobs] = await Promise.all([
      list({ prefix: 'scorecards/' }),
      list({ prefix: 'scorecard-statistik/' }),
      list({ prefix: 'scorecard-geld/' })
    ]);

    // Process statistik files
    for (const blob of statistikBlobs.blobs) {
      const fileName = blob.pathname.split('/').pop() || '';
      if (fileName.toLowerCase().includes('statistik')) {
        const year = getYearFromFileOrDate(fileName, customDates);
        if (yearData[year]) {
          yearData[year].static.statistik = blob.url;
        }
      }
    }

    // Process scorecard files
    for (const blob of scorecardBlobs.blobs) {
      const fileName = blob.pathname.split('/').pop() || '';
      if (fileName.toLowerCase().startsWith('spiel_') && fileName.toLowerCase().endsWith('.jpg')) {
        const year = getYearFromFileOrDate(fileName, customDates);
        if (yearData[year]) {
          const customEntry = customDates[year]?.[fileName];
          const date = customEntry?.date || new Date().toLocaleDateString('de-DE');
          const geldFileName = customEntry?.geldFile;
          
          // Find matching geld file URL if it exists
          let geldFileUrl;
          if (geldFileName) {
            const matchingGeldBlob = geldBlobs.blobs.find(
              geldBlob => geldBlob.pathname.endsWith(geldFileName)
            );
            if (matchingGeldBlob) {
              geldFileUrl = matchingGeldBlob.url;
            }
          }

          yearData[year].spielCards.push({
            id: fileName,
            date: date,
            fileName: blob.url,
            geldFileName: geldFileUrl
          });
        }
      }
    }

    // Sort spielCards by date for each year
    for (const year in yearData) {
      yearData[year].spielCards.sort((a: SpielScorecard, b: SpielScorecard) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    }

    return NextResponse.json(yearData);
  } catch (error) {
    console.error('Error fetching from blob storage:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Scorecards' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { fileName, customDate, geldFile, year } = await request.json();
    
    if (!fileName || !customDate || !year) {
      return NextResponse.json(
        { error: 'Dateiname, Datum und Jahr sind erforderlich' },
        { status: 400 }
      );
    }

    // Stelle sicher, dass das Datum im DD.MM.YYYY Format ist
    let formattedDate = customDate;
    if (customDate.includes('-')) {
      const [year, month, day] = customDate.split('-');
      formattedDate = `${day}.${month}.${year}`;
    }

    const customDates = await loadCustomDates();
    if (!customDates[year]) {
      customDates[year] = {};
    }
    customDates[year][fileName] = {
      date: formattedDate,
      geldFile: geldFile
    };

    // Update custom-dates.json through API
    const response = await fetch('/api/update-custom-dates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customDates)
    });

    if (!response.ok) {
      throw new Error('Failed to update custom dates');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating custom date:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern des benutzerdefinierten Datums' },
      { status: 500 }
    );
  }
}