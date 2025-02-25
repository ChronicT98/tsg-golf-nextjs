import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { put, list, del } from '@vercel/blob';
import { gruendungsmitglieder, ordentlicheMitglieder, inMemoriam } from '@/app/mitglieder/data';

// Default data from static files
const defaultData = {
  gruendungsmitglieder,
  ordentlicheMitglieder,
  inMemoriam
};

export async function GET(request: NextRequest) {
  try {
    // Try to get the custom data from blob storage
    const { blobs } = await list({
      prefix: 'members/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const memberDataBlob = blobs.find(blob => blob.pathname === 'members/data.json');

    if (memberDataBlob) {
      const blobResponse = await fetch(memberDataBlob.url);
      const customData = await blobResponse.json();
      const response = NextResponse.json(customData);
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    }

    // If no custom data exists, return the default data with cache control
    const response = NextResponse.json(defaultData);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('Error fetching member data:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Mitgliederdaten' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Check if file exists and delete it first
    const { blobs } = await list({
      prefix: 'members/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const existingBlob = blobs.find(blob => blob.pathname === 'members/data.json');
    if (existingBlob) {
      await del(existingBlob.url, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
    }

    // Save new version to blob storage
    await put('members/data.json', JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    // Revalidate the members page and admin page
    revalidatePath('/mitglieder');
    revalidatePath('/admin');
    
    const response = NextResponse.json({ success: true });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('Error saving member data:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Mitgliederdaten' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Delete the custom data and revert to default
    const { blobs } = await list({
      prefix: 'members/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const memberDataBlob = blobs.find(blob => blob.pathname === 'members/data.json');
    if (memberDataBlob) {
      await del(memberDataBlob.url, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member data:', error);
    return NextResponse.json(
      { error: 'Fehler beim Zurücksetzen der Mitgliederdaten' },
      { status: 500 }
    );
  }
}