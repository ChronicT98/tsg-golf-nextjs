import { put } from '@vercel/blob';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const directories = [
  'scorecards',
  'blechen',
  'scorecard-statistik',
  'scorecard-geld'
];

const token = "vercel_blob_rw_4JhTLIdImLkNd86E_NHGv4mFk3TGUDN4vOhFbWQ4V1Yvow3";

async function* getFiles(dir: string): AsyncGenerator<string> {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

async function migrateFiles() {
  console.log('Starting migration to Vercel Blob Storage...');
  let totalFiles = 0;
  let successfulUploads = 0;
  
  for (const directory of directories) {
    const dirPath = path.join(process.cwd(), 'public', directory);
    console.log(`\nProcessing directory: ${directory}`);

    try {
      for await (const filePath of getFiles(dirPath)) {
        const fileName = path.basename(filePath);
        // Skip .DS_Store files
        if (fileName === '.DS_Store') continue;
        
        const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
        totalFiles++;
        
        try {
          console.log(`Reading file: ${fileName}`);
          const fileBuffer = await readFile(filePath);
          
          console.log(`Uploading to blob storage: ${relativePath}`);
          const blob = await put(relativePath, fileBuffer, {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'image/jpeg',
            token
          });

          console.log(`Successfully uploaded: ${blob.url}`);
          successfulUploads++;
        } catch (error) {
          console.error(`Error processing file ${fileName}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error processing directory ${directory}:`, error);
    }
  }

  console.log('\nMigration Summary:');
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Successfully uploaded: ${successfulUploads}`);
  console.log(`Failed uploads: ${totalFiles - successfulUploads}`);
  console.log('\nMigration complete!');
}

// Run the migration
migrateFiles().catch(console.error);