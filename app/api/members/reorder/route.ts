import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';

export async function PUT(request: Request) {
  try {
    const { category, updates } = await request.json();

    // Aktualisiere jeden Member einzeln
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          order: update.order,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating member order:', error);
    return NextResponse.json(
      { error: 'Failed to update member order' },
      { status: 500 }
    );
  }
}