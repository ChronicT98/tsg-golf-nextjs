import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

const YEARS_BLOB_PATH = 'config/years.json';

async function getYears(): Promise<number[]> {
  try {
    const { blobs } = await list({ prefix: 'config/years' });
    if (blobs.length === 0) {
      return [2021, 2022, 2023, 2024, 2025, 2026];
    }
    const response = await fetch(blobs[0].url);
    return await response.json();
  } catch {
    return [2021, 2022, 2023, 2024, 2025, 2026];
  }
}

async function saveYears(years: number[]) {
  const { blobs } = await list({ prefix: 'config/years' });
  for (const blob of blobs) await del(blob.url);
  await put(YEARS_BLOB_PATH, JSON.stringify(years), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function GET() {
  const years = await getYears();
  return NextResponse.json(years.sort((a, b) => b - a));
}

export async function POST(request: Request) {
  const { year } = await request.json();
  if (!year || typeof year !== 'number') {
    return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 });
  }
  const years = await getYears();
  if (!years.includes(year)) {
    years.push(year);
    await saveYears(years);
  }
  return NextResponse.json(years.sort((a, b) => b - a));
}

export async function DELETE(request: Request) {
  const { year } = await request.json();
  if (!year || typeof year !== 'number') {
    return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 });
  }
  const years = await getYears();
  const updated = years.filter(y => y !== year);
  await saveYears(updated);
  return NextResponse.json(updated.sort((a, b) => b - a));
}
