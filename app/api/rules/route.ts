import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/app/utils/supabase';

// Types for rule data
export interface Rule {
  id: string;
  section: string; // 'Präambel' or 'Regelwerk'
  number: string | null; // Rule number like '§1', '§2', etc. (NULL for preamble)
  title: string; // Rule title/heading
  content: string; // Rule content
  order_index: number; // For ordering rules
  created_at: string;
  updated_at: string;
}

/**
 * GET endpoint to fetch all rules
 */
export async function GET() {
  try {
    console.log('Fetching rules from Supabase...');
    
    // Get all rules from the database, ordered by order_index
    const { data: rules, error } = await supabase
      .from('rules')
      .select('*')
      .order('order_index', { ascending: true });
      
    if (error) {
      console.error('Error fetching rules:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Regeln' },
        { status: 500 }
      );
    }
    
    console.log(`Found ${rules?.length || 0} rules in database`);
    
    // If no rules found, return empty array
    if (!rules || rules.length === 0) {
      console.log('No rules found in Supabase');
      return NextResponse.json({ rules: [] });
    }

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error in rules API:', error);
    return NextResponse.json(
      { error: 'Serverfehler beim Laden der Regeln' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to create a new rule
 */
export async function POST(request: Request) {
  try {
    const ruleData = await request.json();
    
    // Validate required fields
    if (!ruleData.section) {
      return NextResponse.json(
        { error: 'Bereich ist erforderlich' },
        { status: 400 }
      );
    }
    
    if (!ruleData.title) {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
        { status: 400 }
      );
    }
    
    if (!ruleData.content) {
      return NextResponse.json(
        { error: 'Inhalt ist erforderlich' },
        { status: 400 }
      );
    }
    
    // Get current time for timestamps
    const now = new Date().toISOString();
    
    // Get the highest order_index to place the new rule at the end
    const { data: highestOrderRule, error: orderError } = await supabase
      .from('rules')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .single();
      
    let nextOrderIndex = 0;
    if (!orderError && highestOrderRule) {
      nextOrderIndex = (highestOrderRule.order_index || 0) + 1;
    }
    
    // Insert rule into database - using service role for admin operations
    const { data, error } = await supabaseAdmin
      .from('rules')
      .insert({
        section: ruleData.section,
        number: ruleData.number || null,
        title: ruleData.title,
        content: ruleData.content,
        order_index: ruleData.order_index !== undefined ? ruleData.order_index : nextOrderIndex,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving rule:', error);
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Regel: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      rule: data
    });
  } catch (error) {
    console.error('Error handling rule data:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message.replace(/[\"\'\\\n\r\t]/g, '') : 
      'Unbekannter Fehler';
    
    return NextResponse.json(
      { 
        error: 'Fehler bei der Verarbeitung des Requests',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update an existing rule
 */
export async function PUT(request: Request) {
  try {
    const ruleData = await request.json();
    
    if (!ruleData.id) {
      return NextResponse.json(
        { error: 'Rule ID ist erforderlich' },
        { status: 400 }
      );
    }
    
    // Get current time for updated_at timestamp
    const now = new Date().toISOString();
    
    // Update rule in database - using service role for admin operations
    const { data, error } = await supabaseAdmin
      .from('rules')
      .update({
        section: ruleData.section,
        number: ruleData.number || null,
        title: ruleData.title,
        content: ruleData.content,
        order_index: ruleData.order_index,
        updated_at: now
      })
      .eq('id', ruleData.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating rule:', error);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Regel: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      rule: data
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message.replace(/[\"\'\\\n\r\t]/g, '') : 
      'Unbekannter Fehler';
    
    return NextResponse.json(
      { 
        error: 'Fehler bei der Aktualisierung der Regel',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to delete a rule
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID ist erforderlich' },
        { status: 400 }
      );
    }
    
    // Delete rule from database - using service role for admin operations
    const { error } = await supabaseAdmin
      .from('rules')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting rule:', error);
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Regel: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Regel erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Error deleting rule:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message.replace(/[\"\'\\\n\r\t]/g, '') : 
      'Unbekannter Fehler';
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Löschen der Regel',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint to reorder rules
 */
export async function PATCH(request: Request) {
  try {
    const updates = await request.json();
    
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Ungültiges Format für Aktualisierungen' },
        { status: 400 }
      );
    }
    
    // Validate updates format
    for (const update of updates) {
      if (!update.id || update.order_index === undefined) {
        return NextResponse.json(
          { error: 'Jede Aktualisierung muss eine ID und einen order_index haben' },
          { status: 400 }
        );
      }
    }
    
    // Update each rule's order_index
    const updatePromises = updates.map(update => 
      supabaseAdmin
        .from('rules')
        .update({ order_index: update.order_index, updated_at: new Date().toISOString() })
        .eq('id', update.id)
    );
    
    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors updating rule order:', errors);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Regelreihenfolge' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Regelreihenfolge erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Error reordering rules:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message.replace(/[\"\'\\\n\r\t]/g, '') : 
      'Unbekannter Fehler';
    
    return NextResponse.json(
      { 
        error: 'Fehler bei der Neuordnung der Regeln',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}