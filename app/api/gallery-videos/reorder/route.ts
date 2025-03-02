import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabase';

interface OrderUpdate {
  id: string;
  order: number;
}

/**
 * PUT endpoint to update the order_index of videos
 */
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const updates: OrderUpdate[] = data.updates;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen Updates bereitgestellt' },
        { status: 400 }
      );
    }

    console.log('Updating video order:', updates);

    // Process each update one by one to ensure proper error handling
    const results = [];
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') {
        results.push({
          id: update.id,
          success: false,
          error: 'Ungültige Daten: ID und order sind erforderlich'
        });
        continue;
      }

      // Update the video's order_index
      const { data, error } = await supabaseAdmin
        .from('youtube_videos')
        .update({ order_index: update.order })
        .eq('id', update.id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating video ${update.id}:`, error);
        results.push({
          id: update.id,
          success: false,
          error: error.message
        });
      } else {
        results.push({
          id: update.id,
          success: true,
          data
        });
      }
    }

    return NextResponse.json({
      results,
      success: results.every(r => r.success)
    });
  } catch (error) {
    console.error('Error handling video reordering:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message : 'Unbekannter Fehler';
    
    return NextResponse.json(
      { 
        error: 'Fehler bei der Verarbeitung des Requests',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}