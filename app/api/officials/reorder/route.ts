import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import { getServerSession } from 'next-auth';

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderedIds } = await request.json();

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'Ordered IDs array is required' },
        { status: 400 }
      );
    }

    // Update order for each ID
    const updatePromises = orderedIds.map((id, index) => 
      supabase
        .from('officials')
        .update({ order: index + 1 })
        .eq('id', id)
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering officials:', error);
    return NextResponse.json(
      { error: 'Failed to reorder officials' },
      { status: 500 }
    );
  }
}