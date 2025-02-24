import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const newCustomDates = await request.json();
    const dataDir = path.join(process.cwd(), 'data');
    const customDatesPath = path.join(dataDir, 'custom-dates.json');

    // Read existing content for comparison
    let existingContent;
    try {
      const fileContent = await readFile(customDatesPath, 'utf-8');
      existingContent = JSON.parse(fileContent);
      console.log('Successfully read existing custom-dates.json');
    } catch (error) {
      console.log('No existing custom-dates.json found, starting fresh');
      existingContent = {
        "2022": {},
        "2023": {},
        "2024": {},
        "2025": {}
      };
    }

    // Compare and log changes
    console.log('\n=== Custom Dates Update Summary ===');
    for (const year of Object.keys(newCustomDates)) {
      const existingEntries = Object.keys(existingContent[year] || {});
      const newEntries = Object.keys(newCustomDates[year] || {});
      
      const addedEntries = newEntries.filter(entry => !existingEntries.includes(entry));
      const updatedEntries = newEntries.filter(entry => 
        existingEntries.includes(entry) && 
        JSON.stringify(existingContent[year][entry]) !== JSON.stringify(newCustomDates[year][entry])
      );
      
      if (addedEntries.length > 0) {
        console.log(`\nNew entries for ${year}:`);
        addedEntries.forEach(entry => {
          console.log(`  + ${entry}: ${JSON.stringify(newCustomDates[year][entry])}`);
        });
      }
      
      if (updatedEntries.length > 0) {
        console.log(`\nUpdated entries for ${year}:`);
        updatedEntries.forEach(entry => {
          console.log(`  ~ ${entry}:`);
          console.log(`    From: ${JSON.stringify(existingContent[year][entry])}`);
          console.log(`    To:   ${JSON.stringify(newCustomDates[year][entry])}`);
        });
      }
    }
    
    // First update local file
    console.log('\nUpdating local file...');
    await writeFile(customDatesPath, JSON.stringify(newCustomDates, null, 2), 'utf-8');
    console.log('Successfully updated local file');
    
    // Then update blob storage
    console.log('Updating blob storage...');
    const blob = await put('data/custom-dates.json', JSON.stringify(newCustomDates, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log('Successfully updated blob storage at:', blob.url);
    console.log('=== Update Complete ===\n');

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      changes: {
        message: 'Updates successful. Check server logs for detailed changes.'
      }
    });
  } catch (error) {
    console.error('Error updating custom-dates.json:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der benutzerdefinierten Daten' },
      { status: 500 }
    );
  }
}