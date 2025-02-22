import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { statSync } from 'fs';
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

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public', 'blechen');
    const files = await fs.readdir(publicDir);
    const customDates = await loadCustomDates();

    // Initialisiere Jahre mit leeren Werten
    const latestFiles: Record<string, string> = {
      '2025': '',
      '2024': '',
      '2023': '',
      '2022': ''
    };

    // Finde die neuesten Dateien basierend auf custom-dates.json und Dateinamen
    for (const year in customDates) {
      // Finde alle Blechen-Dateien für dieses Jahr
      const yearFiles = files.filter(file => {
        // Nur Blechen-Dateien berücksichtigen
        if (!file.startsWith('blechen_') || !file.endsWith('.jpg')) {
          return false;
        }
        
        // Prüfe ob die Datei in custom-dates.json für dieses Jahr existiert
        // oder ob sie neu ist (noch nicht in custom-dates.json)
        return customDates[year][file] !== undefined || 
               (file.startsWith('blechen_') && statSync(path.join(publicDir, file)).mtime.getFullYear().toString() === year);
      });

      if (yearFiles.length > 0) {
        // Sortiere nach Datum (wenn verfügbar) oder Dateiname
        const latestFile = yearFiles.sort((a, b) => {
          // Konvertiere das Datum in ein standardisiertes Format
          const dateA = customDates[year][a]?.date;
          const dateB = customDates[year][b]?.date;
          
          // Versuche das Datum zu parsen (unterstützt beide Formate: "YYYY-MM-DD" und "DD.MM.YYYY")
          const parseDate = (dateStr: string) => {
            if (!dateStr) return new Date(0);
            if (dateStr.includes('-')) return new Date(dateStr);
            const [day, month, year] = dateStr.split('.');
            return new Date(`${year}-${month}-${day}`);
          };

          const timeA = parseDate(dateA).getTime();
          const timeB = parseDate(dateB).getTime();
          
          if (timeA === timeB) {
            // Bei gleichem Datum nach Dateinamen sortieren (neuere IDs zuerst)
            return b.localeCompare(a);
          }
          return timeB - timeA; // Neuestes Datum zuerst
        })[0];

        latestFiles[year] = `/blechen/${latestFile}`;
      }
    }

    return NextResponse.json(latestFiles);
  } catch (error) {
    console.error('Error reading blechen files:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Blechen-Dateien' },
      { status: 500 }
    );
  }
}