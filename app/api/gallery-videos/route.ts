import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/app/utils/supabase';

// Types for gallery videos
export interface GalleryVideo {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  category: string;
  order: number;
  createdAt: string;
  thumbnailSrc?: string;
  type?: 'video' | 'youtube'; // Type of video: regular or YouTube
  youtubeId?: string; // YouTube video ID for YouTube videos
}

// Interface for our response format
interface GalleryResponse {
  [category: string]: GalleryVideo[];
}

/**
 * GET endpoint to fetch all gallery videos as a flat list
 */
export async function GET() {
  try {
    console.log('Fetching gallery videos from Supabase...');
    
    // Create empty response
    const emptyResponse = { videos: [] };
    
    // For backwards compatibility
    const categories = ['turniere', 'ausfluge', 'feiern', 'historisch'];
    
    // 1. Get all YouTube videos from the database
    console.log('Fetching YouTube videos from database...');
    const { data: youtubeVideos, error: youtubeError } = await supabase
      .from('youtube_videos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (youtubeError) {
      console.error('Error fetching YouTube videos:', youtubeError);
    }
    
    console.log(`Found ${youtubeVideos?.length || 0} YouTube videos in database`);
    
    // 2. Get all regular videos from storage (as in the original implementation)
    // Array for all found videos
    const allFiles: Array<{file: any, category: string}> = [];
    
    // Fetch files for each known category
    for (const category of categories) {
      console.log(`Searching for videos in category: ${category}`);
      
      // Get files in category folder
      const { data: categoryFiles, error: filesError } = await supabase
        .storage
        .from('videos')
        .list(category, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
        
      if (filesError) {
        console.error(`Error fetching videos from category ${category}:`, filesError);
        continue; // Continue to next folder
      }
      
      console.log(`${categoryFiles?.length || 0} videos found in category ${category}:`, 
        categoryFiles?.map(f => f.name));
      
      // Filter only video files (mp4, webm, etc.)
      const videoFiles = categoryFiles?.filter(file => {
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.mp4') || 
               fileName.endsWith('.webm') || 
               fileName.endsWith('.ogg') ||
               fileName.endsWith('.mov');
      });
      
      // Add files to total list with category info
      videoFiles?.forEach(file => {
        allFiles.push({
          file,
          category
        });
      });
    }
    
    console.log(`Total ${allFiles.length} regular videos found in all categories`);
    
    // Convert regular video files to GalleryVideo format
    const regularVideos: GalleryVideo[] = allFiles.map(item => {
      const { file, category } = item;
      
      // Ensure filename exists
      const filename = file.name || `unknown-${Date.now()}`;
      
      // Full path for video: category/filename
      const fullPath = `${category}/${filename}`;
      console.log(`Processing video: ${fullPath}`);
      
      // Construct correct URL for Supabase video
      const correctUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${fullPath}`;
      console.log(`Generated video URL: ${correctUrl}`);
      
      // Thumbnail URL (if available)
      const baseName = filename.substring(0, filename.lastIndexOf('.'));
      let thumbnailSrc = undefined;
      
      // Create gallery video object
      return {
        id: file.id || `video-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        src: correctUrl,
        alt: filename.split('.')[0], // Filename (without extension) as alt text
        caption: filename.split('.')[0], // Filename as caption
        category,
        order: 0,
        createdAt: file.created_at || new Date().toISOString(),
        thumbnailSrc,
        type: 'video' // Mark as regular video
      };
    });
    
    // Convert YouTube videos to GalleryVideo format - mapping from snake_case DB columns
    const formattedYoutubeVideos: GalleryVideo[] = (youtubeVideos || []).map(video => ({
      id: video.id,
      src: video.youtube_id, // Store youtube ID as src for compatibility
      alt: video.title,
      caption: video.caption || video.title,
      category: video.category || '', // For backward compatibility
      order: video.order_index || 0,
      createdAt: video.created_at,
      type: 'youtube',
      youtubeId: video.youtube_id
    }));
    
    // Combine both types of videos
    const videos: GalleryVideo[] = [...regularVideos, ...formattedYoutubeVideos];
    
    console.log(`Total combined videos: ${videos.length} (${regularVideos.length} regular + ${formattedYoutubeVideos.length} YouTube)`);
    
    // If no videos found, return empty array
    if (videos.length === 0) {
      console.log('No videos found in Supabase');
      return NextResponse.json(emptyResponse);
    }

    // Detailed logging for debugging
    console.log('All videos found:', videos.map(video => ({
      id: video.id,
      src: video.src,
      alt: video.alt
    })));
    
    // Sort all videos by creation date (newest first)
    videos.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error in video gallery API:', error);
    return NextResponse.json(
      { error: 'Serverfehler beim Laden der Video-Galerie' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to handle both video uploads and YouTube video data
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle file uploads (original functionality)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('file') as File[];
      const category = formData.get('category') as string || 'other';
      
      // Validate category name: lowercase, alphanumeric
      const safeCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: 'Keine Dateien hochgeladen' },
          { status: 400 }
        );
      }

      const results: Array<{ success: boolean; fileName: string; path?: string; error?: string }> = [];

      for (const file of files) {
        try {
          // Validate file type is video
          if (!file.type.startsWith('video/')) {
            throw new Error('Nur Videodateien sind erlaubt');
          }
          
          // Generate file path in the format category/filename.ext
          const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
          const timestamp = Date.now();
          const uniqueFileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
          const filePath = `${safeCategory}/${uniqueFileName}`;
          
          // Convert file to ArrayBuffer then to Buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          if (buffer.length === 0) {
            throw new Error('Datei ist leer');
          }

          // Upload to Supabase storage
          const { error: uploadError } = await supabase
            .storage
            .from('videos')
            .upload(filePath, buffer, {
              contentType: file.type,
              upsert: false
            });

          if (uploadError) {
            throw new Error(uploadError.message);
          }

          // Construct the correct URL
          const correctUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${filePath}`;

          results.push({
            success: true,
            fileName: file.name,
            path: correctUrl
          });
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          results.push({
            success: false,
            fileName: file.name,
            error: error instanceof Error ? error.message : 'Fehler bei der Verarbeitung der Datei'
          });
        }
      }

      return NextResponse.json({ results });
    } 
    // Handle YouTube video data (new functionality)
    else if (contentType.includes('application/json')) {
      const videoData = await request.json();
      
      // Validate required fields
      if (!videoData.youtubeId) {
        return NextResponse.json(
          { error: 'YouTube-ID ist erforderlich' },
          { status: 400 }
        );
      }
      
      if (!videoData.title) {
        return NextResponse.json(
          { error: 'Titel ist erforderlich' },
          { status: 400 }
        );
      }
      
      // Insert YouTube video data into database without category - using service role for admin operations
      const { data, error } = await supabaseAdmin
        .from('youtube_videos')
        .insert({
          youtube_id: videoData.youtubeId,
          title: videoData.title,
          caption: videoData.caption || null,
          order_index: videoData.order || 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving YouTube video:', error);
        return NextResponse.json(
          { error: 'Fehler beim Speichern des YouTube-Videos: ' + error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        video: data
      });
    }
    
    // Unknown content type
    return NextResponse.json(
      { error: 'Nicht unterstützter Content-Type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling video/YouTube data:', error);
    
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