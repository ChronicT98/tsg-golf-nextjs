import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import { getServerSession } from 'next-auth';

// GET /api/officials
export async function GET() {
  try {
    const { data: officials, error } = await supabase
      .from('officials')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      throw error;
    }

    console.log('Officials data:', officials);
    return NextResponse.json(officials);
  } catch (error) {
    console.error('Error fetching officials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch officials' },
      { status: 500 }
    );
  }
}

// PUT /api/officials
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

    const official = await request.json();

    // Validate required fields
    if (!official.name || !official.role1) {
      return NextResponse.json(
        { error: 'Name und mindestens eine Rolle sind erforderlich' },
        { status: 400 }
      );
    }

    // Update or create official
    const { data, error } = await supabase
      .from('officials')
      .upsert({
        ...official,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating official:', error);
    return NextResponse.json(
      { error: 'Failed to update official' },
      { status: 500 }
    );
  }
}

// DELETE /api/officials
export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    const { error } = await supabase
      .from('officials')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting official:', error);
    return NextResponse.json(
      { error: 'Failed to delete official' },
      { status: 500 }
    );
  }
}