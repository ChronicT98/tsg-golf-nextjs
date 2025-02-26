import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { config } from 'dotenv';

// Lade .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGES_DIR = join(process.cwd(), 'public', 'images');
const BUCKET_NAME = 'member-images';

async function uploadImages() {
  try {
    // Lese alle Bilder aus dem Verzeichnis
    const files = readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );

    console.log(`Found ${imageFiles.length} images to upload`);

    // Upload jedes Bild
    for (const file of imageFiles) {
      const filePath = join(IMAGES_DIR, file);
      const fileContent = readFileSync(filePath);

      console.log(`Uploading ${file}...`);

      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(file, fileContent, {
          contentType: `image/${extname(file).slice(1)}`,
          upsert: true
        });

      if (error) {
        console.error(`Error uploading ${file}:`, error);
        continue;
      }

      console.log(`Successfully uploaded ${file}`);
    }

    // Aktualisiere die Datenbank mit den neuen URLs
    for (const file of imageFiles) {
      const oldPath = `/images/${file}`; // Der ursprüngliche Pfad in der Datenbank
      const { data: publicUrlData } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(file);

      if (!publicUrlData.publicUrl) {
        console.error(`Could not get public URL for ${file}`);
        continue;
      }

      console.log(`Generated URL for ${file}: ${publicUrlData.publicUrl}`);

      // Direkt die URL in der Datenbank aktualisieren
      const { error: updateError } = await supabase
        .from('members')
        .update({ 'imagesrc': publicUrlData.publicUrl })
        .eq('imagesrc', oldPath);

      if (updateError) {
        console.error(`Error updating URL for ${file}:`, updateError);
        continue;
      }

      console.log(`Updated database URL for ${file}`);
    }

    console.log('Successfully updated all database URLs');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

uploadImages();