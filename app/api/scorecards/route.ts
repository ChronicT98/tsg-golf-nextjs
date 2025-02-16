import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface CustomDateEntry {
  date: string;
  geldFile?: string;
}

interface CustomDates {
  [filename: string]: CustomDateEntry;
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

const CUSTOM_DATES_PATH = path.join(process.cwd(), 'data', 'custom-dates.json');

// Hilfsfunktion zum Laden der benutzerdefinierten Daten
async function loadCustomDates(): Promise<CustomDates> {
  try {
    const data = await fs.readFile(CUSTOM_DATES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Hilfsfunktion zum Speichern der benutzerdefinierten Daten
async function saveCustomDates(dates: CustomDates) {
  const dir = path.dirname(CUSTOM_DATES_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(CUSTOM_DATES_PATH, JSON.stringify(dates, null, 2));
}

// Hilfsfunktion zum Extrahieren des Jahres aus dem Dateinamen
function getYearFromFileName(fileName: string): string {
  const yearMatch = fileName.match(/_(20\d{2})/);
  return yearMatch ? yearMatch[1] : "2024";
}

// Hilfsfunktion zum Konvertieren eines deutschen Datums in ein Date-Objekt
function germanDateToDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('.').map(num => parseInt(num, 10));
  return new Date(year, month - 1, day);
}

export async function GET() {
  try {
    const scorecardsDir = path.join(process.cwd(), 'public', 'scorecards');
    const statistikDir = path.join(process.cwd(), 'public', 'scorecard-statistik');
    const customDates = await loadCustomDates();
    
    const [scorecardFiles, statistikFiles] = await Promise.all([
      fs.readdir(scorecardsDir),
      fs.readdir(statistikDir).catch(() => [])
    ]);
    
    const yearData: ResponseData = {
      "2024": {
        static: {},
        spielCards: []
      },
      "2025": {
        static: {},
        spielCards: []
      }
    };

    // Verarbeite statische Dateien
    for (const file of statistikFiles) {
      const year = getYearFromFileName(file);
      if (yearData[year] && file.toLowerCase().includes('statistik')) {
        yearData[year].static.statistik = `/scorecard-statistik/${file}`;
      }
    }

    // Verarbeite Spiel-Dateien
    const spielFiles = scorecardFiles.filter(file => 
      file.toLowerCase().startsWith('spiel') && 
      !file.toLowerCase().includes('geld') &&
      file.toLowerCase().endsWith('.jpg')
    );

    for (const fileName of spielFiles) {
      const year = getYearFromFileName(fileName);
      if (yearData[year]) {
        const stats = await fs.stat(path.join(scorecardsDir, fileName));
        const customEntry = customDates[fileName];
        const date = customEntry ? customEntry.date : new Date(stats.mtime).toLocaleDateString('de-DE');
        const geldFileName = customEntry?.geldFile;
        
        yearData[year].spielCards.push({
          id: fileName,
          date: date,
          fileName: `/scorecards/${fileName}`,
          geldFileName: geldFileName ? `/scorecards/${geldFileName}` : undefined
        });
      }
    }

    // Sortiere die Spielkarten nach Datum für jedes Jahr
    for (const year in yearData) {
      yearData[year].spielCards.sort((a: SpielScorecard, b: SpielScorecard) => {
        const dateA = germanDateToDate(a.date);
        const dateB = germanDateToDate(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    }

    return NextResponse.json(yearData);
  } catch (error) {
    console.error('Error reading scorecards directory:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Scorecards' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { fileName, customDate, geldFile } = await request.json();
    
    if (!fileName || !customDate) {
      return NextResponse.json(
        { error: 'Dateiname und Datum sind erforderlich' },
        { status: 400 }
      );
    }

    const customDates = await loadCustomDates();
    customDates[fileName] = {
      date: customDate,
      geldFile: geldFile
    };
    await saveCustomDates(customDates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating custom date:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern des benutzerdefinierten Datums' },
      { status: 500 }
    );
  }
}