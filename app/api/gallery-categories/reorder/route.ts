import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/app/utils/supabase';

interface CategoryOrderUpdate {
  id: string;    // Kategorie-ID (der Ordnername)
  order: number; // Neue Reihenfolge
  originalName?: string; // Optional: Anzeigename der Kategorie
}

interface ReorderRequest {
  updates: CategoryOrderUpdate[];
}

interface CategoryData {
  id: number;        // DB Primary Key 
  category_id: string; // Kategorie-ID (Ordnername)
  original_name: string | null; // Anzeigename
  order_index: number; // Reihenfolge
}

/**
 * GET endpoint to retrieve all gallery categories with their order
 */
export async function GET() {
  try {
    // Kategorien aus der Datenbank abrufen
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('*')
      .order('order_index');
      
    if (error) {
      throw error;
    }
    
    // Formatiere die Antwort in ein passendes Format für den Client
    const orderMap: Record<string, number> = {};
    const nameMap: Record<string, string> = {};
    
    (data as CategoryData[]).forEach(category => {
      orderMap[category.category_id] = category.order_index;
      if (category.original_name) {
        nameMap[category.category_id] = category.original_name;
      }
    });
    
    return NextResponse.json({
      order: orderMap,
      names: nameMap,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving category order:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Kategorie-Reihenfolge' },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update the order of gallery categories
 */
export async function PUT(request: Request) {
  try {
    const payload: ReorderRequest = await request.json();
    
    if (!payload.updates || !Array.isArray(payload.updates)) {
      return NextResponse.json(
        { error: 'Ungültige Anfrage: Updates erforderlich' },
        { status: 400 }
      );
    }
    
    // Vorbereiten der Datenbankoperationen
    const updatePromises = payload.updates.map(async (update) => {
      // Prüfen, ob die Kategorie bereits existiert
      const { data: existingCategory, error: checkError } = await supabase
        .from('gallery_categories')
        .select('id')
        .eq('category_id', update.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = Not found
        throw checkError;
      }
      
      if (existingCategory) {
        // Kategorie existiert, aktualisieren
        const { error: updateError } = await supabaseAdmin
          .from('gallery_categories')
          .update({ 
            order_index: update.order,
            updated_at: new Date().toISOString(),
            // Aktualisiere original_name nur, wenn vorhanden
            ...(update.originalName ? { original_name: update.originalName } : {})
          })
          .eq('category_id', update.id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        // Kategorie existiert nicht, erstellen
        const { error: insertError } = await supabaseAdmin
          .from('gallery_categories')
          .insert({
            category_id: update.id,
            order_index: update.order,
            original_name: update.originalName || update.id.replace(/-/g, ' ')
          });
          
        if (insertError) {
          throw insertError;
        }
      }
      
      return true;
    });
    
    // Alle Aktualisierungen durchführen
    await Promise.all(updatePromises);
    
    return NextResponse.json({ 
      success: true,
      message: 'Kategorie-Reihenfolge erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Error handling categories reorder:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message.replace(/[\"\'\\\n\r\t]/g, '') : 
      'Unbekannter Fehler beim Aktualisieren der Kategorie-Reihenfolge';
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren der Kategorie-Reihenfolge',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}