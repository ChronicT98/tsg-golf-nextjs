import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';

// Interface für Supabase Storage File Objekt
interface SupabaseStorageFile {
  id?: string;
  name: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

// Typen für Galeriebilder
export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  category: string;
  order: number;
  createdAt: string;
}

// Schnittstelle für die Kategorie-Metadaten
interface CategoryMetadata {
  originalName: string;
  created: string;
  lastUpdated: string;
}

// Schnittstelle für die API-Antwort
interface CategoryImagesResponse {
  images: GalleryImage[];
  metadata?: {
    originalName: string;
  };
}

// Map zum Zwischenspeichern der Kategorie-Metadaten
const categoryMetadataCache: Record<string, CategoryMetadata> = {};

/**
 * Lädt die Metadaten für eine Kategorie
 */
async function getCategoryMetadata(category: string): Promise<CategoryMetadata | null> {
  // Prüfen, ob die Metadaten bereits im Cache sind
  if (categoryMetadataCache[category]) {
    return categoryMetadataCache[category];
  }
  
  try {
    // Versuche, die metadata.json-Datei zu lesen
    const { data: metadataFile, error } = await supabase
      .storage
      .from('gallery')
      .download(`${category}/metadata.json`);
      
    if (error || !metadataFile) {
      console.log(`No metadata found for category ${category}`);
      return null;
    }
    
    // Datei in Text umwandeln und parsen
    const metadataText = await metadataFile.text();
    const metadata = JSON.parse(metadataText) as CategoryMetadata;
    
    // Im Cache speichern
    categoryMetadataCache[category] = metadata;
    
    return metadata;
  } catch (error) {
    console.error(`Error reading metadata for category ${category}:`, error);
    return null;
  }
}

/**
 * GET endpoint to fetch images for a specific category
 */
export async function GET(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    // Kategorie-ID aus den URL-Parametern abrufen
    const categoryId = params.categoryId;
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Keine Kategorie-ID angegeben' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching images for category: ${categoryId}`);
    
    // Metadaten der Kategorie laden
    const metadata = await getCategoryMetadata(categoryId);
    
    // Dateien im Kategorie-Ordner abrufen
    const { data: categoryFiles, error: filesError } = await supabase
      .storage
      .from('gallery')
      .list(categoryId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
      
    if (filesError) {
      console.error(`Error fetching files from category ${categoryId}:`, filesError);
      return NextResponse.json(
        { error: `Fehler beim Laden der Bilder für Kategorie ${categoryId}` },
        { status: 500 }
      );
    }
    
    console.log(`${categoryFiles?.length || 0} files found in category ${categoryId}`);
    
    // Filtere metadata.json aus den Dateien heraus
    const imageFiles = categoryFiles?.filter(file => file.name !== 'metadata.json') || [];
    
    if (imageFiles.length === 0) {
      console.log(`No images found in category ${categoryId}`);
      return NextResponse.json({
        images: [],
        metadata: metadata ? { originalName: metadata.originalName } : undefined
      });
    }
    
    // Konvertiere die Dateien in GalleryImage-Objekte
    const images: GalleryImage[] = imageFiles.map(file => {
      const filename = file.name || `unknown-${Date.now()}`;
      const fullPath = `${categoryId}/${filename}`;
      
      // Korrekte URL für das Supabase-Bild konstruieren
      const correctUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/${fullPath}`;
      
      return {
        id: file.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        src: correctUrl,
        alt: filename.split('.')[0], // Dateiname (ohne Erweiterung) als Alt-Text
        category: categoryId,
        order: 0,
        createdAt: file.created_at || new Date().toISOString()
      };
    });
    
    // Sortiere Bilder nach Erstellungsdatum (neueste zuerst)
    images.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Formatierte Antwort zurückgeben
    const response: CategoryImagesResponse = {
      images,
      metadata: metadata ? { originalName: metadata.originalName } : undefined
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in category images API:', error);
    return NextResponse.json(
      { error: 'Serverfehler beim Laden der Bilder' },
      { status: 500 }
    );
  }
}