import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';

// Interface for Supabase Storage File object
interface SupabaseStorageFile {
  id?: string;
  name: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

// Types for gallery images
export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  category: string;
  order: number;
  createdAt: string;
}

// Schnittstelle für die Metadaten-Map
interface CategoryMetadataMap {
  [categoryId: string]: {
    originalName: string;
  };
}

// Interface for our response format with separated categories and metadata
interface GalleryResponse {
  categories: {
    [category: string]: GalleryImage[];
  };
  metadata: CategoryMetadataMap;
}

// Schnittstelle für die Kategorie-Metadaten in Storage
interface CategoryMetadata {
  originalName: string;
  created: string;
  lastUpdated: string;
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
 * Speichert die Metadaten für eine Kategorie
 */
async function saveCategoryMetadata(category: string, metadata: CategoryMetadata): Promise<boolean> {
  try {
    // Metadaten als JSON-Zeichenkette speichern
    const metadataJson = JSON.stringify(metadata, null, 2);
    
    // Als Datei in den Kategorie-Ordner hochladen
    const { error } = await supabase
      .storage
      .from('gallery')
      .upload(`${category}/metadata.json`, metadataJson, {
        contentType: 'application/json',
        upsert: true // Überschreiben, falls die Datei bereits existiert
      });
      
    if (error) {
      console.error(`Error saving metadata for category ${category}:`, error);
      return false;
    }
    
    // Im Cache aktualisieren
    categoryMetadataCache[category] = metadata;
    
    return true;
  } catch (error) {
    console.error(`Error saving metadata for category ${category}:`, error);
    return false;
  }
}

// Type für die Kategorie-Daten aus der Datenbank
interface CategoryOrderData {
  id: number;
  category_id: string;
  original_name: string | null;
  order_index: number;
}

/**
 * Lädt die Kategorie-Daten aus der Datenbank
 */
async function loadCategoryOrderFromDB(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('category_id, order_index')
      .order('order_index');
      
    if (error) {
      console.error('Error loading category order from DB:', error);
      return {};
    }
    
    const orderMap: Record<string, number> = {};
    (data as CategoryOrderData[]).forEach(category => {
      orderMap[category.category_id] = category.order_index;
    });
    
    return orderMap;
  } catch (error) {
    console.error('Error in loadCategoryOrderFromDB:', error);
    return {};
  }
}

/**
 * GET endpoint to fetch gallery images grouped by category
 */
export async function GET() {
  try {
    console.log('Fetching gallery images from Supabase storage...');
    
    // Initialize empty gallery response with new structure
    const galleryByCategory: GalleryResponse = {
      categories: {},
      metadata: {}
    };
    
    // Lade die Kategorie-Reihenfolge-Daten aus der Datenbank
    const categoriesOrder = await loadCategoryOrderFromDB();
    
    // Approach 1: Get all folders directly
    let categories: string[] = [];
    
    try {
      const { data: bucketFolders, error: foldersError } = await supabase
        .storage
        .from('gallery')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
        
      if (foldersError) {
        console.error('Error fetching gallery folders:', foldersError);
        // Continue with alternative approach instead of returning error
      } else {
        // In Supabase storage, folders typically have .metadata property or no file extension
        categories = bucketFolders
          ?.filter(item => !item.name.includes('.') || (item.metadata && typeof item.metadata === 'object'))
          .map(folder => folder.name) || [];
          
        console.log('Found categories via folder detection:', categories);
      }
      
      // Approach 2: If no categories found, try to discover by listing root and checking what gives successful results
      if (categories.length === 0) {
        console.log('Trying alternative approach to discover categories...');
        
        try {
          // Get all items from root to identify potential folders
          const { data: allItems } = await supabase
            .storage
            .from('gallery')
            .list('', { limit: 1000 });
            
          // Extract potential folder names (they won't have file extensions)
          const potentialFolders = allItems
            ?.filter(item => !item.name.includes('.'))
            .map(item => item.name) || [];
            
          console.log('Potential folders found:', potentialFolders);
          
          // Check which ones are actually folders by trying to list their contents
          const folderPromises = potentialFolders.map(async (folderName) => {
            try {
              const { data, error } = await supabase
                .storage
                .from('gallery')
                .list(folderName);
                
              if (!error && data && data.length > 0) {
                console.log(`Confirmed folder: ${folderName} with ${data.length} items`);
                return folderName;
              }
            } catch (err) {
              console.error(`Error checking folder ${folderName}:`, err);
            }
            return null;
          });
          
          const folderResults = await Promise.all(folderPromises);
          const confirmedFolders = folderResults.filter(name => name !== null) as string[];
          
          categories = [...new Set([...categories, ...confirmedFolders])];
        } catch (listError) {
          console.error('Error in alternative approach:', listError);
        }
      }
    } catch (error) {
      console.error('Error discovering categories:', error);
    }
      
    console.log('Discovered categories:', categories);
    
    // If no categories found, return empty response
    if (categories.length === 0) {
      return NextResponse.json({
        categories: {},
        metadata: {}
      });
    }
    
    // Lade die Metadaten für alle Kategorien
    for (const categoryId of categories) {
      const metadata = await getCategoryMetadata(categoryId);
      if (metadata) {
        galleryByCategory.metadata[categoryId] = {
          originalName: metadata.originalName
        };
      } else {
        galleryByCategory.metadata[categoryId] = {
          originalName: categoryId.replace(/-/g, ' ')
        };
      }
    }
    
    // Array für alle gefundenen Bilder
    const allFiles: Array<{file: SupabaseStorageFile, category: string}> = [];
    
    // Für jede bekannte Kategorie die Dateien abrufen
    for (const category of categories) {
      console.log(`Suche Bilder in Kategorie: ${category}`);
      
      // Dateien im Kategorie-Ordner abrufen (ohne Schrägstriche, da das erwiesenermaßen funktioniert)
      const { data: categoryFiles, error: filesError } = await supabase
        .storage
        .from('gallery')
        .list(category, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
        
      if (filesError) {
        console.error(`Error fetching files from category ${category}:`, filesError);
        continue; // Zum nächsten Ordner weitergehen
      }
      
      console.log(`${categoryFiles?.length || 0} Bilder in Kategorie ${category} gefunden:`, 
        categoryFiles?.map(f => f.name));
      
      // Dateien zur Gesamtliste hinzufügen mit Kategorie-Info
      categoryFiles?.forEach(file => {
        // Überspringen der metadata.json Datei
        if (file.name !== 'metadata.json') {
          allFiles.push({
            file,
            category
          });
        }
      });
    }
    
    console.log(`Insgesamt ${allFiles.length} Bilder in allen Kategorien gefunden`);
    
    // Wenn keine Dateien gefunden wurden, leere Kategorien zurückgeben
    if (allFiles.length === 0) {
      console.log('Keine Bilder in Supabase gefunden');
      return NextResponse.json(galleryByCategory);
    }
    
    // Debug all files we gathered from different folders
    console.log(`Verarbeite ${allFiles.length} gefundene Bilder...`);
    
    // Convert allFiles to GalleryImage format
    const images: GalleryImage[] = allFiles.map(item => {
      const { file, category } = item;
      
      // Sicherstellen, dass der Dateiname vorhanden ist
      const filename = file.name || `unknown-${Date.now()}`;
      
      // Vollständiger Pfad für das Bild: Kategorie/Dateiname
      const fullPath = `${category}/${filename}`;
      console.log(`Verarbeite Bild: ${fullPath}`);
      
      // Korrekte URL für das Supabase-Bild konstruieren
      // Beispiel: https://qeevsipplmosdujltokq.supabase.co/storage/v1/object/public/gallery/turniere/1740839476778-TSGler_Lienz_2014.jpg
      const correctUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/${fullPath}`;
      console.log(`Erzeugte Bild-URL: ${correctUrl}`);
      
      // Galeriebild-Objekt erstellen
      return {
        id: file.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        src: correctUrl,
        alt: filename.split('.')[0], // Dateiname (ohne Erweiterung) als Alt-Text
        category,
        order: 0,
        createdAt: file.created_at || new Date().toISOString()
      };
    });

    // Initialize each discovered category with an empty array
    categories.forEach(category => {
      if (category) {
        galleryByCategory.categories[category] = [];
      }
    });
    
    // Detailed logging for debugging
    console.log('All images found:', images.map(img => ({
      id: img.id,
      src: img.src,
      category: img.category,
      alt: img.alt
    })));
    
    // Sort images into categories
    images.forEach(image => {
      const category = image.category.toLowerCase();
      console.log(`Processing image with category: "${category}"`);
      
      // Add to appropriate category
      if (!galleryByCategory.categories[category]) {
        galleryByCategory.categories[category] = [];
      }
      
      galleryByCategory.categories[category].push(image);
      console.log(`Added image to category: "${category}"`);
    });
    
    // Log the final category structure
    console.log('Gallery categories after processing:', Object.keys(galleryByCategory.categories).map(key => {
      return {
        category: key,
        count: galleryByCategory.categories[key].length,
        originalName: galleryByCategory.metadata[key]?.originalName || key
      };
    }));
    
    // Sort images within each category by creation date (newest first)
    for (const category in galleryByCategory.categories) {
      galleryByCategory.categories[category].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    // Vorbereiten einer sortierten Kategorien-Map, um die Kategorien in der richtigen Reihenfolge zurückzugeben
    const orderedResponse: GalleryResponse = {
      categories: {},
      metadata: galleryByCategory.metadata
    };
    
    // Sortiere die Kategorien nach der benutzerdefinierten Reihenfolge, falls vorhanden
    const categoryKeys = Object.keys(galleryByCategory.categories);
    let sortedCategoryKeys: string[];
    
    if (Object.keys(categoriesOrder).length > 0) {
      // Kategorien mit definierter Reihenfolge gruppieren
      const keysWithOrder = categoryKeys.filter(key => 
        categoriesOrder[key] !== undefined
      );
      
      // Kategorien ohne definierte Reihenfolge (werden am Ende angefügt)
      const keysWithoutOrder = categoryKeys.filter(key => 
        categoriesOrder[key] === undefined
      );
      
      // Sortiere die Kategorien mit definierter Reihenfolge
      keysWithOrder.sort((a, b) => 
        (categoriesOrder[a] || 0) - (categoriesOrder[b] || 0)
      );
      
      // Verbinde die sortierten Kategorien mit denen ohne Reihenfolge
      sortedCategoryKeys = [...keysWithOrder, ...keysWithoutOrder];
      
      console.log('Kategorien in benutzerdefinierter Reihenfolge:', sortedCategoryKeys);
    } else {
      // Keine Reihenfolge definiert, verwende alphabetische Sortierung
      sortedCategoryKeys = categoryKeys.sort();
      console.log('Kategorien in alphabetischer Reihenfolge:', sortedCategoryKeys);
    }
    
    // Übertrage die Kategorien in der richtigen Reihenfolge
    sortedCategoryKeys.forEach(category => {
      orderedResponse.categories[category] = galleryByCategory.categories[category];
    });

    return NextResponse.json(orderedResponse);
  } catch (error) {
    console.error('Error in gallery API:', error);
    return NextResponse.json(
      { error: 'Serverfehler beim Laden der Galerie' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to upload gallery images
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const category = formData.get('category') as string || 'other';
    const originalCategoryName = formData.get('originalCategoryName') as string || category;
    
    // Validate category name: lowercase, alphanumeric with German umlauts allowed, non-alphanumeric chars become hyphens
    const safeCategory = category.trim().toLowerCase().replace(/[^a-z0-9äöüß]/g, '-');
    
    console.log(`Processing category: ${safeCategory} (Original: "${originalCategoryName}")`);
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Keine Dateien hochgeladen' },
        { status: 400 }
      );
    }

    // Speichere die Kategorie-Metadaten
    const now = new Date().toISOString();
    
    // Prüfe, ob bereits Metadaten existieren
    let metadata = await getCategoryMetadata(safeCategory);
    
    if (metadata) {
      // Aktualisiere nur das Datum der letzten Änderung
      metadata.lastUpdated = now;
    } else {
      // Erstelle neue Metadaten
      metadata = {
        originalName: originalCategoryName,
        created: now,
        lastUpdated: now
      };
    }
    
    // Speichere die Metadaten
    await saveCategoryMetadata(safeCategory, metadata);

    const results: Array<{ success: boolean; fileName: string; path?: string; error?: string }> = [];

    for (const file of files) {
      try {
        // Generate file path in the format category/filename.ext
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = `${safeCategory}/${uniqueFileName}`;
        
        // Convert file to ArrayBuffer then to Base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        if (buffer.length === 0) {
          throw new Error('Datei ist leer');
        }

        // Upload to Supabase storage
        const { error: uploadError } = await supabase
          .storage
          .from('gallery')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Get the public URL
        supabase
          .storage
          .from('gallery')
          .getPublicUrl(filePath);
          
        // Construct the URL in the same format as the GET endpoint
        const correctUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/${filePath}`;

        results.push({
          success: true,
          fileName: file.name,
          path: correctUrl
        });
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        results.push({
          success: false,
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Fehler bei der Verarbeitung der Datei'
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error handling gallery upload:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message.replace(/[\"\'\\\n\r\t]/g, '') : 
      'Unbekannter Fehler beim Hochladen';
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Speichern der Datei',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}