import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import { getServerSession } from 'next-auth';

// GET /api/members
export async function GET() {
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      throw error;
    }

    console.log('Members data:', members);
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// PUT /api/members
export async function PUT(request: Request) {
  try {
    // Überprüfen der Authentifizierung
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { member, category } = await request.json();

    // Validiere erforderliche Felder
    if (!member.name || !member.hcp || !member.imagesrc) {
      return NextResponse.json(
        { error: 'Name, Handicap und Bild URL sind erforderlich' },
        { status: 400 }
      );
    }

    // Aktualisieren oder Erstellen des Mitglieds
    const { data, error } = await supabase
      .from('members')
      .upsert({
        ...member,
        category,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/members
export async function DELETE(request: Request) {
  try {
    // Überprüfen der Authentifizierung
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}