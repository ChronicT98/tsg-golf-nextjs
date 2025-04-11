import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';

// Schnittstelle für die Kategorie-Metadaten in Storage
interface CategoryMetadata {
  originalName: string;
  created: string;
  lastUpdated: string;
}

// Schnittstelle für die API-Antwort
interface CategoriesResponse {
  categories: {
    id: string;
    name: string;
  }[];
}

// Type für die Kategorie-Daten aus der Datenbank
interface CategoryOrderData {
  id: number;
  category_id: string;
  original_name: string | null;
  order_index: number;
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
 * GET endpoint to fetch gallery categories without images
 */
export async function GET() {
  try {
    console.log('Fetching gallery categories from Supabase storage...');
    
    // Lade die Kategorie-Reihenfolge-Daten aus der Datenbank
    const categoriesOrder = await loadCategoryOrderFromDB();
    
    // Alle Ordner im gallery-Bucket erhalten
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
        // Alternative Ansätze versuchen
      } else {
        // In Supabase storage sind Ordner typischerweise ohne Dateiendung
        categories = bucketFolders
          ?.filter(item => !item.name.includes('.') || (item.metadata && typeof item.metadata === 'object'))
          .map(folder => folder.name) || [];
          
        console.log('Found categories via folder detection:', categories);
      }
      
      // Alternative Ansätze, wenn keine Kategorien gefunden wurden
      if (categories.length === 0) {
        console.log('Trying alternative approach to discover categories...');
        
        try {
          // Alle Elemente aus dem Root-Verzeichnis holen
          const { data: allItems } = await supabase
            .storage
            .from('gallery')
            .list('', { limit: 1000 });
            
          // Potenzielle Ordner identifizieren
          const potentialFolders = allItems
            ?.filter(item => !item.name.includes('.'))
            .map(item => item.name) || [];
            
          console.log('Potential folders found:', potentialFolders);
          
          // Prüfen, welche tatsächlich Ordner sind
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
    
    // Wenn keine Kategorien gefunden, leere Liste zurückgeben
    if (categories.length === 0) {
      return NextResponse.json({ categories: [] });
    }
    
    // Metadaten für alle Kategorien laden und formatieren
    const categoriesWithMetadata = await Promise.all(
      categories.map(async (categoryId) => {
        const metadata = await getCategoryMetadata(categoryId);
        return {
          id: categoryId,
          name: metadata?.originalName || categoryId
            // Formatiere den Kategorienamen, wenn kein Original-Name gefunden wurde
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => {
              if (word.toLowerCase() === 'tsg') return 'TSG';
              return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ')
        };
      })
    );
    
    // Sortiere die Kategorien nach der benutzerdefinierten Reihenfolge
    let sortedCategories: { id: string; name: string }[];
    
    if (Object.keys(categoriesOrder).length > 0) {
      // Kategorien mit definierter Reihenfolge und ohne Reihenfolge gruppieren
      const categoriesWithOrder = categoriesWithMetadata.filter(cat => 
        categoriesOrder[cat.id] !== undefined
      );
      
      const categoriesWithoutOrder = categoriesWithMetadata.filter(cat => 
        categoriesOrder[cat.id] === undefined
      );
      
      // Nach definierter Reihenfolge sortieren
      categoriesWithOrder.sort((a, b) => 
        (categoriesOrder[a.id] || 0) - (categoriesOrder[b.id] || 0)
      );
      
      // Sortierte und unsortierte Kategorien kombinieren
      sortedCategories = [...categoriesWithOrder, ...categoriesWithoutOrder];
      
      console.log('Categories sorted by custom order');
    } else {
      // Alphabetisch sortieren, wenn keine benutzerdefinierte Reihenfolge vorhanden
      sortedCategories = categoriesWithMetadata.sort((a, b) => a.name.localeCompare(b.name));
      console.log('Categories sorted alphabetically');
    }

    // Formatierte Antwort zurückgeben
    const response: CategoriesResponse = {
      categories: sortedCategories
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in gallery categories API:', error);
    return NextResponse.json(
      { error: 'Serverfehler beim Laden der Kategorien' },
      { status: 500 }
    );
  }
}