import { NextRequest, NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';
import { Readable } from 'stream';
import { put, del, list } from '@vercel/blob';

interface ApiErrorResponse {
  response?: {
    data?: unknown;
  };
  message?: string;
}

// Helper function to determine target directory - aligned with migration paths
function getTargetDirectory(filename: string): string {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('blechen')) {
    return 'blechen';
  } else if (lowerFilename.includes('statistik')) {
    return 'scorecard-statistik';
  } else if (lowerFilename.includes('geld')) {
    return 'scorecard-geld';
  } else if (lowerFilename.includes('spiel')) {
    return 'scorecards';
  } else {
    throw new Error('Unrecognized file type');
  }
}

// Initialize CloudConvert with live mode API key
const apiKey = process.env.CLOUDCONVERT_API_KEY;
if (!apiKey) {
  throw new Error('CloudConvert API key is not set');
}
const cloudConvert = new CloudConvert(apiKey); // Live mode (sandbox disabled)

// Helper function to convert Buffer to Stream
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const date = formData.get('date') as string | null;
    const year = formData.get('year') as string || new Date().getFullYear().toString();

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei gefunden' },
        { status: 400 }
      );
    }

    console.log('Creating conversion job for file:', file.name);

    const baseFilename = file.name.toLowerCase();

    // Determine output filename based on file type
    let fileName: string;
    let fileType: 'statistik' | 'blechen' | 'geld' | 'spiel' | null = null;

    if (baseFilename.includes('statistik')) {
      fileType = 'statistik';
      fileName = `statistik_${year}.jpg`;
    } else if (baseFilename.includes('blechen')) {
      fileType = 'blechen';
      fileName = `blechen_${year}.jpg`;
    } else if (baseFilename.includes('geld')) {
      fileType = 'geld';
      // Convert date from YYYY-MM-DD to DD.MM.YYYY format
      const formattedDate = date && date.includes('-') 
        ? date.split('-').reverse().join('.')
        : (date || '');
      
      // Ensure date is provided for geld files - but don't log warning for already processed files
      if (!formattedDate) {
        // Only show error if this isn't a converted file
        if (!file.name.match(/\.pdf$/i)) {
          console.warn(`Fehlendes Datum für geld-Datei: ${file.name}`);
          return NextResponse.json(
            { error: 'Bitte ein Datum für die geld-Datei auswählen' },
            { status: 400 }
          );
        }
      }
      
      fileName = `geld_${formattedDate}.jpg`;
    } else if (baseFilename.includes('spiel')) {
      fileType = 'spiel';
      // Convert date from YYYY-MM-DD to DD.MM.YYYY format
      const formattedDate = date && date.includes('-') 
        ? date.split('-').reverse().join('.')
        : (date || '');
      
      // Ensure date is provided for spiel files - but don't log warning for already processed files
      if (!formattedDate) {
        // Only show error if this isn't a converted file
        if (!file.name.match(/\.pdf$/i)) {
          console.warn(`Fehlendes Datum für spiel-Datei: ${file.name}`);
          return NextResponse.json(
            { error: 'Bitte ein Datum für die spiel-Datei auswählen' },
            { status: 400 }
          );
        }
      }
      
      fileName = `spiel_${formattedDate}.jpg`;
    } else {
      return NextResponse.json(
        { error: 'Unbekannter Dateityp' },
        { status: 400 }
      );
    }

    // Create a job with upload, convert, and export tasks
    const job = await cloudConvert.jobs.create({
      tasks: {
        'upload-my-file': {
          operation: 'import/upload'
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'upload-my-file',
          output_format: 'jpg',
          engine: 'imagemagick',
          input_format: 'pdf',
          page_range: '1',
          density: '150', // Reduzierte Auflösung für stabilere Konvertierung
          quality: '100', // Leicht reduzierte Qualität für kleinere Dateigröße
          filename: fileName,
          fit: 'max',
          strip: true, // Entfernt Metadaten für kleinere Dateigröße
        },
      'trim-whitespace': {
      operation: 'command',
      input: 'convert-my-file',
      engine: 'imagemagick',
      command: 'convert',
      arguments: '/input/convert-my-file/*.jpg -trim +repage /output/trimmed.jpg'
    },
    'optimize-size': {
    operation: 'command',
    input: 'trim-whitespace',
    engine: 'imagemagick',
    command: 'convert',
    arguments: '/input/trim-whitespace/*.jpg -strip -quality 100 -resize 1200x -interlace Plane /output/optimized.jpg'
  },
        'export-my-file': {
          operation: 'export/url',
          input: 'optimize-size',
          inline: false,
          archive_multiple_files: false
        }
      }
    });

    console.log('Job created:', job.id);

    // Add retry logic for file upload
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`Upload attempt ${retryCount + 1} of ${maxRetries}`);
        
        // Get the upload task
        const uploadTask = job.tasks.find(task => task.name === 'upload-my-file');
        if (!uploadTask) {
          throw new Error('Upload task not found in job');
        }

        // Convert File to Stream for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = bufferToStream(buffer);

        // Upload with timeout
        await Promise.race([
          cloudConvert.tasks.upload(uploadTask, stream, file.name),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 30000)
          )
        ]);

        console.log('File uploaded successfully');
        break; // Success, exit retry loop
      } catch (uploadError: unknown) {
        retryCount++;
        console.error(`Upload attempt ${retryCount} failed:`, uploadError);
        
        if (retryCount === maxRetries) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
          throw new Error(`Failed after ${maxRetries} attempts: ${errorMessage}`);
        }
        
        // Wait before retrying (exponential backoff)
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Wait for job completion
    console.log('Waiting for job completion');
    const completedJob = await cloudConvert.jobs.wait(job.id);
    console.log('Job completed:', completedJob.status);

    // Find the export task
    const exportTask = completedJob.tasks.find(task => task.name === 'export-my-file');
    if (!exportTask) {
      console.error('Export task not found in completed job');
      throw new Error('Export task not found');
    }

    // Check if the export task has a result
    if (!exportTask.result?.files?.length) {
      console.error('No files in export task result');
      throw new Error('No files in export task result');
    }

    const exportedFile = exportTask.result.files[0];
    if (!exportedFile?.url) {
      console.error('No URL in export task result file');
      throw new Error('Konvertierte Datei nicht gefunden');
    }

    console.log('Downloading converted file from:', exportedFile.url);

    // Download the converted file from CloudConvert
    const convertedFileResponse = await fetch(exportedFile.url);
    if (!convertedFileResponse.ok) {
      throw new Error('Failed to download converted file');
    }

    const convertedFileBuffer = await convertedFileResponse.arrayBuffer();
    const targetPath = `${getTargetDirectory(fileName)}/${fileName}`;

    // Für statistik und blechen: Prüfen ob eine Datei mit dem Jahr bereits existiert und explizit löschen
    if (fileType === 'statistik' || fileType === 'blechen') {
      const existingFiles = await list({
        prefix: getTargetDirectory(fileName),
        token: process.env.BLOB_READ_WRITE_TOKEN
      });

      // Suche nach existierender Datei mit gleichem Jahr
      const existingFile = existingFiles.blobs.find(blob => {
        const existingFileName = blob.pathname.split('/').pop() || '';
        return existingFileName.includes(`${fileType}_${year}`);
      });

      // Wenn eine Datei existiert, explizit löschen
      if (existingFile) {
        console.log(`Deleting existing file: ${existingFile.pathname}`);
        try {
          await del(existingFile.url, {
            token: process.env.BLOB_READ_WRITE_TOKEN
          });
          console.log(`Successfully deleted file: ${existingFile.pathname}`);
        } catch (deleteError) {
          console.error(`Error deleting file ${existingFile.pathname}:`, deleteError);
          // Continue with upload even if deletion fails
        }
      }
    }

    // Jetzt erst die Upload-Meldung ausgeben, nachdem alte Dateien gelöscht wurden
    console.log('Uploading converted file to Blob storage:', targetPath);

    // Upload to Vercel Blob storage in the correct directory
    const blob = await put(targetPath, Buffer.from(convertedFileBuffer), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/jpeg',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log('File uploaded to Blob storage:', blob.url);

    // Add cache-busting query parameter to URL
    const cacheBustUrl = `${blob.url}?v=${Date.now()}`;
    console.log('Cache-busted URL:', cacheBustUrl);

    // Return success response with cache-busting URL
    return NextResponse.json({
      success: true,
      fileName,
      url: cacheBustUrl
    });

  } catch (error) {
    // Detailed error logging
    console.error('Detailed conversion error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: error
    });

    // Check if it's an Axios error with response data
    const axiosError = error as ApiErrorResponse;
    if (axiosError.response?.data) {
      console.error('API Error Response:', axiosError.response.data);
    }

    // Create a generic error message that won't cause JSON parsing issues
    const safeErrorMessage = 'Fehler bei der Konvertierung: ' + 
      (error instanceof Error ? error.message.replace(/["\\]/g, '') : 'Unbekannter Fehler');
    
    return NextResponse.json({ 
      error: 'Fehler bei der Konvertierung',
      details: safeErrorMessage
    }, { 
      status: 500
    });
  }
}