import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Uppy imports
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';

// Import Uppy styles
import '@uppy/core/dist/style.min.css';

// Define the bucket name for document storage
const DOCUMENTS_BUCKET = 'documents';

interface UppyUploaderProps {
  onUploadSuccess: (filePath: string, fileName: string, fileType: string, fileSize: number) => void;
  onUploadError: (error: Error) => void;
  documentType?: string;
}

const UppyUploader: React.FC<UppyUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  documentType,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [uppy, setUppy] = useState<Uppy | null>(null);

  useEffect(() => {
    // Initialize Uppy when the component mounts
    const uppyInstance = new Uppy({
      id: 'document-uploader',
      autoProceed: false,
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxNumberOfFiles: 1,
        allowedFileTypes: ['.pdf'],
      },
      locale: {
        strings: {
          dropPasteFiles: t('documents.dragAndDrop'),
          browseFiles: t('documents.browse'),
          uploadComplete: t('documents.uploadComplete'),
          uploadFailed: t('documents.uploadFailed'),
          dataUploadedOfTotal: '%{complete} ' + t('documents.of') + ' %{total}',
          xFilesSelected: {
            0: '%{smart_count} ' + t('documents.fileSelected'),
            1: '%{smart_count} ' + t('documents.filesSelected'),
          },
        },
      },
    });

    // Get the service URL and headers for Supabase Storage
    const getSupabaseUploadParams = async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        // Check if the bucket exists by trying to list files in it
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
            throw new Error(`Storage bucket "${DOCUMENTS_BUCKET}" does not exist. Please create it in the Supabase dashboard.`);
          }

          console.error('Error checking storage bucket:', error);
          throw new Error('Error checking storage bucket');
        }

        // Generate a unique file path
        const fileId = uuidv4();

        // Get the service URL for Supabase Storage
        const supabaseUrl = supabase.supabaseUrl;
        // Make sure the URL doesn't have a trailing slash
        const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
        const serviceUrl = `${baseUrl}/storage/v1/object/${DOCUMENTS_BUCKET}`;

        // Get the authorization header
        const { data: authData } = await supabase.auth.getSession();
        const authToken = authData?.session?.access_token;

        if (!authToken) {
          throw new Error('Authentication token not available');
        }

        return {
          serviceUrl,
          authToken,
          fileId,
        };
      } catch (error) {
        console.error('Error getting Supabase upload params:', error);
        throw error;
      }
    };

    // Configure XHR Upload plugin
    uppyInstance.use(XHRUpload, {
      endpoint: '', // Will be set dynamically for each file
      headers: {}, // Will be set dynamically for each file
      formData: false, // Don't use FormData, send the file directly
      fieldName: 'file',
      timeout: 60000, // 60 seconds timeout
      withCredentials: false, // Don't send cookies
      responseType: 'json',
      getResponseData(responseText, response) {
        console.log('Response received:', { responseText, status: response.status });
        try {
          if (responseText) {
            return JSON.parse(responseText);
          }
          return { path: null };
        } catch (err) {
          console.error('Error parsing response:', err);
          return { path: null };
        }
      },
    });

    // Handle file added event
    uppyInstance.on('file-added', (file) => {
      console.log('File added:', file.name);
    });

    // Handle upload event
    uppyInstance.on('upload', async (data) => {
      try {
        console.log('Upload event triggered with files:', data.fileIDs.length);

        const { serviceUrl, authToken, fileId } = await getSupabaseUploadParams();
        console.log('Supabase upload params:', {
          serviceUrl,
          authToken: authToken ? `${authToken.substring(0, 10)}...` : 'null',
          fileId
        });

        // For each file being uploaded
        data.fileIDs.forEach((fileID) => {
          const file = uppyInstance.getFile(fileID);
          console.log('Processing file:', {
            id: fileID,
            name: file.name,
            type: file.type,
            size: file.size
          });

          // Set the endpoint and headers for this file
          const fileName = encodeURIComponent(file.name);
          const filePath = `${user?.id}/${fileId}-${fileName}`;
          const endpoint = `${serviceUrl}/${filePath}`;

          console.log('Uploading to endpoint:', endpoint);

          // Update the XHR Upload options for this file
          const xhrOptions = {
            endpoint,
            headers: {
              Authorization: `Bearer ${authToken}`,
              'x-upsert': 'true',
              'Content-Type': file.type || 'application/pdf',
              'Cache-Control': 'max-age=3600',
              'Accept': 'application/json',
              'Pragma': 'no-cache',
            },
            method: 'POST',
            withCredentials: false,
          };

          console.log('Setting XHR options:', xhrOptions);

          uppyInstance.setFileState(fileID, {
            xhrUpload: xhrOptions,
            meta: {
              ...file.meta,
              filePath,
            },
          });
        });
      } catch (error) {
        console.error('Error preparing upload:', error);
        uppyInstance.cancelAll();
        if (error instanceof Error) {
          onUploadError(error);
        } else {
          onUploadError(new Error('Unknown error preparing upload'));
        }
      }
    });

    // Handle successful upload
    uppyInstance.on('upload-success', (file, response) => {
      console.log('Upload success:', file.name);

      // Get the file path from the metadata
      const filePath = file.meta.filePath;

      if (filePath) {
        setUploadSuccess(true);
        onUploadSuccess(
          filePath,
          file.name,
          file.type || 'application/pdf',
          file.size
        );
      }
    });

    // Handle upload error
    uppyInstance.on('upload-error', (file, error, response) => {
      console.error('Upload error:', error);
      console.error('Response:', response);
      console.error('File:', {
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        meta: file.meta
      });

      // Try to extract more detailed error information
      let errorMessage = `Error uploading ${file.name}: ${error.message}`;

      if (response) {
        try {
          // If response is a string, try to parse it as JSON
          if (typeof response === 'string') {
            const parsedResponse = JSON.parse(response);
            if (parsedResponse.error) {
              errorMessage += ` - ${parsedResponse.error}`;
            }
          }
          // If response is an object with status and statusText
          else if (response.status && response.statusText) {
            errorMessage += ` - ${response.status} ${response.statusText}`;
          }
        } catch (e) {
          console.error('Error parsing response:', e);
        }
      }

      onUploadError(new Error(errorMessage));
    });

    // Set the Uppy instance
    setUppy(uppyInstance);

    // Clean up when the component unmounts
    return () => {
      if (uppyInstance && typeof uppyInstance.destroy === 'function') {
        uppyInstance.destroy();
      }
    };
  }, [user, t, onUploadSuccess, onUploadError]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileName, setFileName] = useState('');

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Check if the file is a PDF
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        onUploadError(new Error(t('documents.pdfOnly')));
        return;
      }

      setFileName(file.name);
      setUploadSuccess(false);

      if (uppy) {
        try {
          // Clear any existing files
          const existingFiles = uppy.getFiles();
          existingFiles.forEach(file => uppy.removeFile(file.id));

          // Add the new file
          uppy.addFile({
            name: file.name,
            type: file.type || 'application/pdf',
            data: file,
          });
        } catch (error) {
          console.error('Error adding file to Uppy:', error);
          onUploadError(new Error('Failed to prepare file for upload'));
        }
      }
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      // Check if the file is a PDF
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        onUploadError(new Error(t('documents.pdfOnly')));
        return;
      }

      setFileName(file.name);
      setUploadSuccess(false);

      if (uppy) {
        try {
          // Clear any existing files
          const existingFiles = uppy.getFiles();
          existingFiles.forEach(file => uppy.removeFile(file.id));

          // Add the new file
          uppy.addFile({
            name: file.name,
            type: file.type || 'application/pdf',
            data: file,
          });
        } catch (error) {
          console.error('Error adding file to Uppy:', error);
          onUploadError(new Error('Failed to prepare file for upload'));
        }
      }
    }
  };

  // Update progress when Uppy reports progress
  useEffect(() => {
    if (uppy) {
      const progressHandler = (file, progress) => {
        const percent = Math.round((progress.bytesUploaded / progress.bytesTotal) * 100);
        setUploadProgress(percent);
        setIsUploading(true);
      };

      const uploadStartHandler = () => {
        setIsUploading(true);
        setUploadSuccess(false);
      };

      const completeHandler = () => {
        setIsUploading(false);
      };

      const errorHandler = () => {
        setIsUploading(false);
        setUploadSuccess(false);
      };

      uppy.on('upload-progress', progressHandler);
      uppy.on('upload', uploadStartHandler);
      uppy.on('complete', completeHandler);
      uppy.on('error', errorHandler);

      return () => {
        uppy.off('upload-progress', progressHandler);
        uppy.off('upload', uploadStartHandler);
        uppy.off('complete', completeHandler);
        uppy.off('error', errorHandler);
      };
    }
  }, [uppy]);

  // Function to upload directly using Supabase Storage API
  const uploadDirectly = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generate a unique file ID
      const fileId = uuidv4();
      const filePath = `${user?.id}/${fileId}-${encodeURIComponent(file.name)}`;

      console.log('Uploading directly to Supabase Storage:', {
        bucket: DOCUMENTS_BUCKET,
        filePath,
        fileType: file.type,
        fileSize: file.size
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          return newProgress;
        });
      }, 300);

      // Upload the file using Supabase Storage API
      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/pdf'
        });

      // Clear the progress interval
      clearInterval(progressInterval);

      if (error) {
        console.error('Error uploading file to Supabase:', error);
        setIsUploading(false);

        // Check if it's an RLS policy error
        if (error.message.includes('row-level security policy') || error.statusCode === '403') {
          const errorMessage = `Permission denied: You don't have permission to upload files to the storage bucket. Please check the Row-Level Security (RLS) policies in your Supabase project.`;
          console.error(errorMessage);
          console.error('To fix this issue:');
          console.error('1. Go to the Supabase Dashboard');
          console.error('2. Select your project');
          console.error('3. Go to "Storage" in the left sidebar');
          console.error('4. Click on the "documents" bucket');
          console.error('5. Go to the "Policies" tab');
          console.error('6. Create a policy for INSERT operations with the following rule:');
          console.error('   (bucket_id = \'documents\' AND auth.uid() IS NOT NULL)');

          onUploadError(new Error(errorMessage));
        } else {
          onUploadError(new Error(`Error uploading file: ${error.message}`));
        }
        return;
      }

      console.log('Upload successful:', data);
      setUploadProgress(100);
      setIsUploading(false);
      setUploadSuccess(true);

      // Call the success callback
      onUploadSuccess(
        filePath,
        file.name,
        file.type || 'application/pdf',
        file.size
      );
    } catch (error) {
      console.error('Error in direct upload:', error);
      setIsUploading(false);
      if (error instanceof Error) {
        onUploadError(error);
      } else {
        onUploadError(new Error('Unknown error during upload'));
      }
    }
  };

  // Function to start the upload process
  const startUpload = () => {
    if (uppy) {
      const files = uppy.getFiles();
      if (files.length > 0) {
        try {
          // Use direct upload instead of Uppy
          uploadDirectly(files[0].data);
        } catch (error) {
          console.error('Error starting upload:', error);
          onUploadError(new Error('Failed to start upload'));
        }
      } else {
        console.warn('No files to upload');
      }
    }
  };

  return (
    <div className="uppy-uploader">
      <div
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
          dragActive ? 'border-primary bg-primary/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            className="w-8 h-8 mb-2 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mb-2 text-sm text-gray-500">
            {fileName ? fileName : t('documents.dragAndDrop')}
          </p>
          <p className="text-xs text-gray-500">
            {t('documents.pdfOnly')}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
        />
      </div>

      {fileName && !isUploading && !uploadSuccess && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm"
            onClick={startUpload}
          >
            {t('documents.uploadFile')}
          </button>
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {uploadProgress}% {t('documents.uploaded')}
          </p>
        </div>
      )}

      {uploadSuccess && (
        <div className="mt-4 text-center text-sm text-green-600">
          <svg
            className="w-6 h-6 mx-auto mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {t('documents.fileUploadedSuccessfully')}
        </div>
      )}
    </div>
  );
};

export default UppyUploader;
