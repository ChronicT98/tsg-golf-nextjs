import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
    const scorecardsDir = path.join(process.cwd(), 'public', 'scorecards');
    const statistikDir = path.join(process.cwd(), 'public', 'scorecard-statistik');
    const customDates = await loadCustomDates();
    const years = ['2025', '2024', '2023', '2022'];
    
    const [scorecardFiles, statistikFiles] = await Promise.all([
      fs.readdir(scorecardsDir),
      fs.readdir(statistikDir).catch(() => [])
    ]);
    
    const yearData: ResponseData = {};
    years.forEach(year => {
      yearData[year] = {
        static: {},
        spielCards: []
      };
    });

    // Verarbeite statische Dateien
    for (const file of statistikFiles) {
      if (file.toLowerCase().includes('statistik')) {
        // Finde das Jahr aus dem Dateinamen oder custom-dates.json
        const year = getYearFromFileOrDate(file, customDates);
        // Wenn das Jahr in yearData existiert, füge die Statistik hinzu
        if (yearData[year]) {
          yearData[year].static.statistik = `/scorecard-statistik/${file}`;
        }
      }
    }

    // Verarbeite alle JPG-Dateien
    const spielFiles = scorecardFiles.filter(file => {
      const lowerFile = file.toLowerCase();
      // Nur spiel_ Dateien
      if (lowerFile.startsWith('spiel_') && lowerFile.endsWith('.jpg')) {
        return true;
      }
      // Oder Dateien aus custom-dates.json, die keine geld-Dateien sind
      for (const year in customDates) {
        const fileData = customDates[year][file];
        if (fileData && !file.toLowerCase().includes('geld')) {
          return true;
        }
      }
      return false;
    });

    for (const fileName of spielFiles) {
      const year = getYearFromFileOrDate(fileName, customDates);
      if (yearData[year]) {
        const stats = await fs.stat(path.join(scorecardsDir, fileName));
        const customEntry = customDates[year]?.[fileName];
        const date = customEntry ? customEntry.date : new Date(stats.mtime).toLocaleDateString('de-DE');
        const geldFileName = customEntry?.geldFile;
        
        yearData[year].spielCards.push({
          id: fileName,
          date: date,
          fileName: `/scorecards/${fileName}`,
          geldFileName: geldFileName ? `/scorecard-geld/${geldFileName}` : undefined
        });
      }
    }

    // Sortiere die Spielkarten nach Datum für jedes Jahr
    for (const year in yearData) {
      yearData[year].spielCards.sort((a: SpielScorecard, b: SpielScorecard) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
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

// Hilfsfunktion zum Konvertieren des Datums in DD.MM.YYYY Format
function formatDateToDDMMYYYY(dateStr: string): string {
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }
  return dateStr; // Bereits im korrekten Format
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