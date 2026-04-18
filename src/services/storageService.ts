import { supabase } from '@/integrations/supabase/client';

// Define the bucket name for document storage
const DOCUMENTS_BUCKET = 'documents';

/**
 * Initialize the storage service
 * This function checks if the documents bucket exists
 * Note: The bucket should be created by an admin through the Supabase dashboard
 */
export const initializeStorage = async () => {
  try {
    // Check if the documents bucket exists by trying to list files in it
    // This is a more reliable way to check if the bucket exists and if we have access to it
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .list();

    if (error) {
      if (error.message === 'Bucket not found' || error.statusCode === '404') {
        console.error(`Documents bucket '${DOCUMENTS_BUCKET}' not found.`);
        console.error('Please create the bucket in the Supabase dashboard:');
        console.error('1. Go to https://app.supabase.io/');
        console.error('2. Select your project');
        console.error('3. Go to Storage in the sidebar');
        console.error('4. Click "New Bucket"');
        console.error('5. Enter "documents" as the bucket name');
        console.error('6. Configure access permissions as needed');
        console.error('7. Click "Create bucket"');
        return false;
      }

      console.error('Error checking storage bucket:', error);
      return false;
    }

    console.log(`Documents bucket '${DOCUMENTS_BUCKET}' found.`);
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

/**
 * Upload a file to the documents bucket
 * @param file The file to upload
 * @param path The path to store the file at
 * @returns The URL of the uploaded file
 */
export const uploadFile = async (file: File, path: string): Promise<string | null> => {
  try {
    // Make sure the bucket exists
    const bucketExists = await initializeStorage();
    if (!bucketExists) {
      console.error('Cannot upload file: documents bucket does not exist');
      console.error('Please create the bucket in the Supabase dashboard');
      return null;
    }

    // Upload the file
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      if (error.message === 'Bucket not found' || error.statusCode === '404') {
        console.error('Error: Bucket not found. Please create the "documents" bucket in the Supabase dashboard.');
        return null;
      }

      console.error('Error uploading file:', error);
      return null;
    }

    // Return the path
    return data.path;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

/**
 * Get a signed URL for a file
 * @param path The path of the file
 * @returns The signed URL
 */
export const getSignedUrl = async (path: string): Promise<string | null> => {
  try {
    // Make sure the bucket exists
    await initializeStorage();

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(path, 60 * 60); // 1 hour expiry

    if (error) {
      // If the bucket doesn't exist, log a message
      if (error.message === 'Bucket not found' || error.statusCode === '404') {
        console.log(`Bucket '${DOCUMENTS_BUCKET}' not found. Please create it in the Supabase dashboard.`);
        return null;
      }

      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
};

/**
 * Download a file
 * @param path The path of the file
 * @returns The file data
 */
export const downloadFile = async (path: string): Promise<Blob | null> => {
  try {
    // Make sure the bucket exists
    await initializeStorage();

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(path);

    if (error) {
      // If the bucket doesn't exist, log a message
      if (error.message === 'Bucket not found' || error.statusCode === '404') {
        console.log(`Bucket '${DOCUMENTS_BUCKET}' not found. Please create it in the Supabase dashboard.`);
        return null;
      }

      console.error('Error downloading file:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
};

/**
 * Delete a file
 * @param path The path of the file
 * @returns Whether the deletion was successful
 */
export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    // Make sure the bucket exists
    await initializeStorage();

    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([path]);

    if (error) {
      // If the bucket doesn't exist, log a message
      if (error.message === 'Bucket not found' || error.statusCode === '404') {
        console.log(`Bucket '${DOCUMENTS_BUCKET}' not found. Please create it in the Supabase dashboard.`);
        return false;
      }

      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};
