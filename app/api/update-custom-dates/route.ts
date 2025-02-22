import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const customDates = await request.json();

    // Upload the updated custom-dates.json to blob storage
    const blob = await put('data/custom-dates.json', JSON.stringify(customDates, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json'
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error('Error updating custom-dates.json:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der benutzerdefinierten Daten' },
      { status: 500 }
    );
  }
}