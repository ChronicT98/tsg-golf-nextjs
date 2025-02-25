import { NextRequest, NextResponse } from 'next/server';
import { MemberDetails } from '@/app/types/members';
import fs from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/auth.config';

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { member, category } = await request.json();

    // Validate input
    if (!member || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate member data
    if (!member.name || !member.hcp || !member.imageSrc) {
      return NextResponse.json(
        { error: 'Missing required member fields' },
        { status: 400 }
      );
    }

    // Read the current data file
    const dataFilePath = path.join(process.cwd(), 'app/mitglieder/data.ts');
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');

    // Parse the content to get the arrays
    const gruendungsmitgliederMatch = fileContent.match(/export const gruendungsmitglieder: MemberDetails\[\] = \[([\s\S]*?)\];/);
    const ordentlicheMitgliederMatch = fileContent.match(/export const ordentlicheMitglieder: MemberDetails\[\] = \[([\s\S]*?)\];/);
    const inMemoriamMatch = fileContent.match(/export const inMemoriam: MemberDetails\[\] = \[([\s\S]*?)\];/);

    if (!gruendungsmitgliederMatch || !ordentlicheMitgliederMatch || !inMemoriamMatch) {
      return NextResponse.json(
        { error: 'Failed to parse data file' },
        { status: 500 }
      );
    }

    // Convert the content to actual arrays
    const gruendungsmitglieder: MemberDetails[] = eval(`[${gruendungsmitgliederMatch[1]}]`);
    const ordentlicheMitglieder: MemberDetails[] = eval(`[${ordentlicheMitgliederMatch[1]}]`);
    const inMemoriam: MemberDetails[] = eval(`[${inMemoriamMatch[1]}]`);

    // Update the appropriate array
    let targetArray;
    switch (category) {
      case 'gruendungsmitglieder':
        targetArray = gruendungsmitglieder;
        break;
      case 'ordentlicheMitglieder':
        targetArray = ordentlicheMitglieder;
        break;
      case 'inMemoriam':
        targetArray = inMemoriam;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
    }

    // Find and update the member
    const index = targetArray.findIndex(m => m.name === member.name);
    if (index === -1) {
      targetArray.push(member);
    } else {
      targetArray[index] = member;
    }

    // Create the new file content
    const newContent = `// app/mitglieder/data.ts
export interface MemberDetails {
  name: string;
  hcp: string;
  spitzname?: string;
  geboren?: string;
  firma?: string;
  beruf?: string;
  handy?: string;
  email?: string;
  web?: string;
  imageSrc: string;
  verstorben?: string;
}

export const gruendungsmitglieder: MemberDetails[] = ${JSON.stringify(gruendungsmitglieder, null, 2)};

export const ordentlicheMitglieder: MemberDetails[] = ${JSON.stringify(ordentlicheMitglieder, null, 2)};

export const inMemoriam: MemberDetails[] = ${JSON.stringify(inMemoriam, null, 2)};`;

    // Write the updated content back to the file
    await fs.writeFile(dataFilePath, newContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}