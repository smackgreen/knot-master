import { supabase } from '@/integrations/supabase/client';
import { Document, ElectronicSignature, SignatureRequest, SignatureEvent, DocumentStatus, SignerRole, SignatureRequestStatus, SignatureEventType } from '@/types';
import { uploadFile, getSignedUrl, downloadFile, deleteFile } from './storageService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new document
 * @param userId The ID of the user creating the document
 * @param file The file to upload
 * @param name The name of the document
 * @param contractId Optional contract ID
 * @param quotationId Optional quotation ID
 * @param invoiceId Optional invoice ID
 * @returns The created document
 */
export const createDocument = async (
  userId: string,
  file: File,
  name: string,
  contractId?: string,
  quotationId?: string,
  invoiceId?: string
): Promise<Document | null> => {
  try {
    // Allow documents without references
    // if (!contractId && !quotationId && !invoiceId) {
    //   throw new Error('At least one of contractId, quotationId, or invoiceId must be provided');
    // }

    // Generate a unique file path
    const fileId = uuidv4();
    const filePath = `${userId}/${fileId}-${file.name}`;

    // Upload the file
    const uploadedPath = await uploadFile(file, filePath);
    if (!uploadedPath) {
      // Check if the bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets || !buckets.find(bucket => bucket.name === 'documents')) {
        throw new Error('Storage bucket "documents" does not exist. Please create it in the Supabase dashboard.');
      }
      throw new Error('Failed to upload file');
    }

    // Create the document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        contract_id: contractId,
        quotation_id: quotationId,
        invoice_id: invoiceId,
        name,
        file_path: uploadedPath,
        file_type: file.type,
        file_size: file.size,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      // Clean up the uploaded file if there was an error
      await deleteFile(uploadedPath);
      throw error;
    }

    // Create a 'created' event
    await createSignatureEvent(data.id, 'created', null, 'system');

    // Map the database record to our Document type
    const document: Document = {
      id: data.id,
      contractId: data.contract_id,
      quotationId: data.quotation_id,
      invoiceId: data.invoice_id,
      name: data.name,
      filePath: data.file_path,
      fileType: data.file_type,
      fileSize: data.file_size,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return document;
  } catch (error) {
    console.error('Error creating document:', error);
    return null;
  }
};

/**
 * Create a document with an already uploaded file path
 * @param userId The ID of the user creating the document
 * @param filePath The path of the already uploaded file
 * @param name The name of the document
 * @param fileName The original file name
 * @param fileType The file type
 * @param fileSize The file size
 * @param contractId Optional contract ID
 * @param quotationId Optional quotation ID
 * @param invoiceId Optional invoice ID
 * @returns The created document
 */
export const createDocumentWithPath = async (
  userId: string,
  filePath: string,
  name: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  contractId?: string,
  quotationId?: string,
  invoiceId?: string
): Promise<Document | null> => {
  try {
    // Check if we're trying to create a document from the Documents page
    // where we don't have actual references
    if ((contractId === undefined || contractId === null) &&
        (quotationId === undefined || quotationId === null) &&
        (invoiceId === undefined || invoiceId === null)) {
      // If we don't have any valid references, use the createStandaloneDocument function
      return createStandaloneDocument(userId, filePath, name, fileType, fileSize);
    }

    // Create the document record with the provided references
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        contract_id: contractId,
        quotation_id: quotationId,
        invoice_id: invoiceId,
        name,
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create a 'created' event
    await createSignatureEvent(data.id, 'created', null, 'system');

    // Map the database record to our Document type
    const document: Document = {
      id: data.id,
      contractId: data.contract_id,
      quotationId: data.quotation_id,
      invoiceId: data.invoice_id,
      name: data.name,
      filePath: data.file_path,
      fileType: data.file_type,
      fileSize: data.file_size,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return document;
  } catch (error) {
    console.error('Error creating document with path:', error);
    return null;
  }
};

/**
 * Get a document by ID
 * @param documentId The ID of the document
 * @returns The document
 */
export const getDocumentById = async (documentId: string): Promise<Document | null> => {
  try {
    // First try with the new schema using signature_request_documents junction table
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests:signature_request_documents!document_id(
            request:signature_requests(*)
          )
        `)
        .eq('id', documentId)
        .single();

      if (error) {
        throw error;
      }

      // Map the database record to our Document type
      const document: Document = {
        id: data.id,
        contractId: data.contract_id,
        quotationId: data.quotation_id,
        invoiceId: data.invoice_id,
        name: data.name,
        filePath: data.file_path,
        fileType: data.file_type,
        fileSize: data.file_size,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        signatures: data.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: data.signature_requests.map((srd: any) => ({
          id: srd.request.id,
          documentId: data.id,
          recipientEmail: srd.request.recipient_email,
          recipientName: srd.request.recipient_name,
          recipientRole: srd.request.recipient_role,
          status: srd.request.status,
          token: srd.request.token,
          expiresAt: srd.request.expires_at,
          createdAt: srd.request.created_at,
          updatedAt: srd.request.updated_at,
        })),
      };

      return document;
    } catch (junctionError) {
      console.warn('Error using junction table in getDocumentById, falling back to direct relationship:', junctionError);

      // Fall back to the old schema with direct relationship
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests (*)
        `)
        .eq('id', documentId)
        .single();

      if (error) {
        throw error;
      }

      // Map the database record to our Document type
      const document: Document = {
        id: data.id,
        contractId: data.contract_id,
        quotationId: data.quotation_id,
        invoiceId: data.invoice_id,
        name: data.name,
        filePath: data.file_path,
        fileType: data.file_type,
        fileSize: data.file_size,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        signatures: data.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: data.signature_requests.map((req: any) => ({
          id: req.id,
          documentId: req.document_id,
          recipientEmail: req.recipient_email,
          recipientName: req.recipient_name,
          recipientRole: req.recipient_role,
          status: req.status,
          token: req.token,
          expiresAt: req.expires_at,
          createdAt: req.created_at,
          updatedAt: req.updated_at,
        })),
      };

      return document;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
};

/**
 * Get documents by contract ID
 * @param contractId The ID of the contract
 * @returns The documents
 */
export const getDocumentsByContractId = async (contractId: string): Promise<Document[]> => {
  try {
    // First try with the new schema using signature_request_documents junction table
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests:signature_request_documents!document_id(
            request:signature_requests(*)
          )
        `)
        .eq('contract_id', contractId);

      if (error) {
        throw error;
      }

      // Map the database records to our Document type
      const documents: Document[] = data.map((doc: any) => ({
        id: doc.id,
        contractId: doc.contract_id,
        quotationId: doc.quotation_id,
        invoiceId: doc.invoice_id,
        name: doc.name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        signatures: doc.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: doc.signature_requests.map((srd: any) => ({
          id: srd.request.id,
          documentId: doc.id,
          recipientEmail: srd.request.recipient_email,
          recipientName: srd.request.recipient_name,
          recipientRole: srd.request.recipient_role,
          status: srd.request.status,
          token: srd.request.token,
          expiresAt: srd.request.expires_at,
          createdAt: srd.request.created_at,
          updatedAt: srd.request.updated_at,
        })),
      }));

      return documents;
    } catch (junctionError) {
      console.warn('Error using junction table in getDocumentsByContractId, falling back to direct relationship:', junctionError);

      // Fall back to the old schema with direct relationship
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests (*)
        `)
        .eq('contract_id', contractId);

      if (error) {
        throw error;
      }

      // Map the database records to our Document type
      const documents: Document[] = data.map((doc: any) => ({
        id: doc.id,
        contractId: doc.contract_id,
        quotationId: doc.quotation_id,
        invoiceId: doc.invoice_id,
        name: doc.name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        signatures: doc.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: doc.signature_requests.map((req: any) => ({
          id: req.id,
          documentId: req.document_id,
          recipientEmail: req.recipient_email,
          recipientName: req.recipient_name,
          recipientRole: req.recipient_role,
          status: req.status,
          token: req.token,
          expiresAt: req.expires_at,
          createdAt: req.created_at,
          updatedAt: req.updated_at,
        })),
      }));

      return documents;
    }
  } catch (error) {
    console.error('Error getting documents by contract ID:', error);
    return [];
  }
};

/**
 * Get documents by quotation ID
 * @param quotationId The ID of the quotation
 * @returns The documents
 */
export const getDocumentsByQuotationId = async (quotationId: string): Promise<Document[]> => {
  try {
    // First try with the new schema using signature_request_documents junction table
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests:signature_request_documents!document_id(
            request:signature_requests(*)
          )
        `)
        .eq('quotation_id', quotationId);

      if (error) {
        throw error;
      }

      // Map the database records to our Document type
      const documents: Document[] = data.map((doc: any) => ({
        id: doc.id,
        contractId: doc.contract_id,
        quotationId: doc.quotation_id,
        invoiceId: doc.invoice_id,
        name: doc.name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        signatures: doc.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: doc.signature_requests.map((srd: any) => ({
          id: srd.request.id,
          documentId: doc.id,
          recipientEmail: srd.request.recipient_email,
          recipientName: srd.request.recipient_name,
          recipientRole: srd.request.recipient_role,
          status: srd.request.status,
          token: srd.request.token,
          expiresAt: srd.request.expires_at,
          createdAt: srd.request.created_at,
          updatedAt: srd.request.updated_at,
        })),
      }));

      return documents;
    } catch (junctionError) {
      console.warn('Error using junction table in getDocumentsByQuotationId, falling back to direct relationship:', junctionError);

      // Fall back to the old schema with direct relationship
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests (*)
        `)
        .eq('quotation_id', quotationId);

      if (error) {
        throw error;
      }

      // Map the database records to our Document type
      const documents: Document[] = data.map((doc: any) => ({
        id: doc.id,
        contractId: doc.contract_id,
        quotationId: doc.quotation_id,
        invoiceId: doc.invoice_id,
        name: doc.name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        signatures: doc.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: doc.signature_requests.map((req: any) => ({
          id: req.id,
          documentId: req.document_id,
          recipientEmail: req.recipient_email,
          recipientName: req.recipient_name,
          recipientRole: req.recipient_role,
          status: req.status,
          token: req.token,
          expiresAt: req.expires_at,
          createdAt: req.created_at,
          updatedAt: req.updated_at,
        })),
      }));

      return documents;
    }
  } catch (error) {
    console.error('Error getting documents by quotation ID:', error);
    return [];
  }
};

/**
 * Get documents by invoice ID
 * @param invoiceId The ID of the invoice
 * @returns The documents
 */
export const getDocumentsByInvoiceId = async (invoiceId: string): Promise<Document[]> => {
  try {
    // First try with the new schema using signature_request_documents junction table
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests:signature_request_documents!document_id(
            request:signature_requests(*)
          )
        `)
        .eq('invoice_id', invoiceId);

      if (error) {
        throw error;
      }

      // Map the database records to our Document type
      const documents: Document[] = data.map((doc: any) => ({
        id: doc.id,
        contractId: doc.contract_id,
        quotationId: doc.quotation_id,
        invoiceId: doc.invoice_id,
        name: doc.name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        signatures: doc.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: doc.signature_requests.map((srd: any) => ({
          id: srd.request.id,
          documentId: doc.id,
          recipientEmail: srd.request.recipient_email,
          recipientName: srd.request.recipient_name,
          recipientRole: srd.request.recipient_role,
          status: srd.request.status,
          token: srd.request.token,
          expiresAt: srd.request.expires_at,
          createdAt: srd.request.created_at,
          updatedAt: srd.request.updated_at,
        })),
      }));

      return documents;
    } catch (junctionError) {
      console.warn('Error using junction table in getDocumentsByInvoiceId, falling back to direct relationship:', junctionError);

      // Fall back to the old schema with direct relationship
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests (*)
        `)
        .eq('invoice_id', invoiceId);

      if (error) {
        throw error;
      }

      // Map the database records to our Document type
      const documents: Document[] = data.map((doc: any) => ({
        id: doc.id,
        contractId: doc.contract_id,
        quotationId: doc.quotation_id,
        invoiceId: doc.invoice_id,
        name: doc.name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        signatures: doc.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: doc.signature_requests.map((req: any) => ({
          id: req.id,
          documentId: req.document_id,
          recipientEmail: req.recipient_email,
          recipientName: req.recipient_name,
          recipientRole: req.recipient_role,
          status: req.status,
          token: req.token,
          expiresAt: req.expires_at,
          createdAt: req.created_at,
          updatedAt: req.updated_at,
        })),
      }));

      return documents;
    }
  } catch (error) {
    console.error('Error getting documents by invoice ID:', error);
    return [];
  }
};

/**
 * Get all documents for a user
 * @param userId The ID of the user
 * @returns The documents
 */
export const getDocumentsByUserId = async (userId: string): Promise<Document[]> => {
  try {
    // First try with the new schema using signature_request_documents junction table
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests:signature_request_documents!document_id(
            request:signature_requests(*)
          )
        `)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Map the database records to our Document type
      const documents: Document[] = data.map((doc: any) => ({
        id: doc.id,
        contractId: doc.contract_id,
        quotationId: doc.quotation_id,
        invoiceId: doc.invoice_id,
        name: doc.name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        signatures: doc.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: doc.signature_requests.map((srd: any) => ({
          id: srd.request.id,
          documentId: doc.id,
          recipientEmail: srd.request.recipient_email,
          recipientName: srd.request.recipient_name,
          recipientRole: srd.request.recipient_role,
          status: srd.request.status,
          token: srd.request.token,
          expiresAt: srd.request.expires_at,
          createdAt: srd.request.created_at,
          updatedAt: srd.request.updated_at,
        })),
      }));

      return documents;
    } catch (junctionError) {
      console.warn('Error using junction table in getDocumentsByUserId, falling back to direct relationship:', junctionError);

      // Fall back to the old schema with direct relationship
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          electronic_signatures (*),
          signature_requests (*)
        `)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Map the database records to our Document type
      const documents: Document[] = data.map((doc: any) => ({
        id: doc.id,
        contractId: doc.contract_id,
        quotationId: doc.quotation_id,
        invoiceId: doc.invoice_id,
        name: doc.name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        signatures: doc.electronic_signatures.map((sig: any) => ({
          id: sig.id,
          documentId: sig.document_id,
          signerName: sig.signer_name,
          signerEmail: sig.signer_email,
          signerRole: sig.signer_role,
          signatureImage: sig.signature_image,
          ipAddress: sig.ip_address,
          consentTimestamp: sig.consent_timestamp,
          createdAt: sig.created_at,
        })),
        signatureRequests: doc.signature_requests.map((req: any) => ({
          id: req.id,
          documentId: req.document_id,
          recipientEmail: req.recipient_email,
          recipientName: req.recipient_name,
          recipientRole: req.recipient_role,
          status: req.status,
          token: req.token,
          expiresAt: req.expires_at,
          createdAt: req.created_at,
          updatedAt: req.updated_at,
        })),
      }));

      return documents;
    }
  } catch (error) {
    console.error('Error getting documents by user ID:', error);
    return [];
  }
};

/**
 * Update a document's status
 * @param documentId The ID of the document
 * @param status The new status
 * @returns Whether the update was successful
 */
export const updateDocumentStatus = async (documentId: string, status: DocumentStatus): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating document status:', error);
    return false;
  }
};

/**
 * Delete a document
 * @param documentId The ID of the document
 * @returns Whether the deletion was successful
 */
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  try {
    // Get the document to get the file path
    const document = await getDocumentById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Delete the document record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw error;
    }

    // Delete the file
    await deleteFile(document.filePath);

    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

/**
 * Create a signature request
 * @param documentId The ID of the document
 * @param recipientEmail The email of the recipient
 * @param recipientName The name of the recipient
 * @param recipientRole The role of the recipient
 * @param expiresInDays The number of days until the request expires
 * @returns The created signature request
 */
export const createSignatureRequest = async (
  documentId: string,
  recipientEmail: string,
  recipientName: string,
  recipientRole: SignerRole,
  expiresInDays: number = 7
): Promise<SignatureRequest | null> => {
  try {
    // Generate a unique token
    const token = uuidv4();

    // Calculate the expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create the signature request
    const { data, error } = await supabase
      .from('signature_requests')
      .insert({
        document_id: documentId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        recipient_role: recipientRole,
        status: 'pending',
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create a 'created' event
    await createSignatureEvent(documentId, 'created', recipientEmail, recipientRole);

    // Map the database record to our SignatureRequest type
    const signatureRequest: SignatureRequest = {
      id: data.id,
      documentId: data.document_id,
      recipientEmail: data.recipient_email,
      recipientName: data.recipient_name,
      recipientRole: data.recipient_role,
      status: data.status,
      token: data.token,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return signatureRequest;
  } catch (error) {
    console.error('Error creating signature request:', error);
    return null;
  }
};

/**
 * Get a signature request by token
 * @param token The token of the signature request
 * @returns The signature request
 */
export const getSignatureRequestByToken = async (token: string): Promise<SignatureRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('signature_requests')
      .select()
      .eq('token', token)
      .single();

    if (error) {
      throw error;
    }

    // Map the database record to our SignatureRequest type
    const signatureRequest: SignatureRequest = {
      id: data.id,
      documentId: data.document_id,
      recipientEmail: data.recipient_email,
      recipientName: data.recipient_name,
      recipientRole: data.recipient_role,
      status: data.status,
      token: data.token,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return signatureRequest;
  } catch (error) {
    console.error('Error getting signature request by token:', error);
    return null;
  }
};

/**
 * Create an electronic signature
 * @param documentId The ID of the document
 * @param signerName The name of the signer
 * @param signerEmail The email of the signer
 * @param signerRole The role of the signer
 * @param signatureImage The base64 encoded signature image
 * @param ipAddress The IP address of the signer
 * @returns The created electronic signature
 */
export const createElectronicSignature = async (
  documentId: string,
  signerName: string,
  signerEmail: string,
  signerRole: SignerRole,
  signatureImage: string,
  ipAddress?: string
): Promise<ElectronicSignature | null> => {
  try {
    // Create the electronic signature
    const { data, error } = await supabase
      .from('electronic_signatures')
      .insert({
        document_id: documentId,
        signer_name: signerName,
        signer_email: signerEmail,
        signer_role: signerRole,
        signature_image: signatureImage,
        ip_address: ipAddress,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create a 'signed' event
    await createSignatureEvent(documentId, 'signed', signerEmail, signerRole, ipAddress);

    // Update the document status if all required signatures are present
    const document = await getDocumentById(documentId);
    if (document) {
      const signatures = document.signatures || [];
      const allRolesSigned = ['client', 'vendor', 'planner'].every(role =>
        signatures.some(sig => sig.signerRole === role)
      );

      if (allRolesSigned) {
        await updateDocumentStatus(documentId, 'signed');
      }
    }

    // Map the database record to our ElectronicSignature type
    const signature: ElectronicSignature = {
      id: data.id,
      documentId: data.document_id,
      signerName: data.signer_name,
      signerEmail: data.signer_email,
      signerRole: data.signer_role,
      signatureImage: data.signature_image,
      ipAddress: data.ip_address,
      consentTimestamp: data.consent_timestamp,
      createdAt: data.created_at,
    };

    return signature;
  } catch (error) {
    console.error('Error creating electronic signature:', error);
    return null;
  }
};

/**
 * Create a signature event
 * @param documentId The ID of the document
 * @param eventType The type of event
 * @param actor The email of the actor
 * @param actorRole The role of the actor
 * @param ipAddress The IP address of the actor
 * @param userAgent The user agent of the actor
 * @returns Whether the creation was successful
 */
/**
 * Create a standalone document without requiring foreign key references
 * This is a workaround for the Documents page where we don't have actual references
 * @param userId The ID of the user creating the document
 * @param filePath The path of the already uploaded file
 * @param name The name of the document
 * @param fileType The file type
 * @param fileSize The file size
 * @returns The created document
 */
export const createStandaloneDocument = async (
  userId: string,
  filePath: string,
  name: string,
  fileType: string,
  fileSize: number
): Promise<Document | null> => {
  try {
    // First, create a temporary contract to satisfy the foreign key constraint
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .insert({
        user_id: userId,
        name: `Temp Contract for ${name}`,
        content: 'Temporary contract created for document upload',
        status: 'draft',
      })
      .select()
      .single();

    if (contractError) {
      console.error('Error creating temporary contract:', contractError);
      throw contractError;
    }

    // Now create the document with the temporary contract ID
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        contract_id: contractData.id, // Use the temporary contract ID
        name,
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      // Clean up the temporary contract if there was an error
      await supabase.from('contracts').delete().eq('id', contractData.id);
      throw error;
    }

    // Create a 'created' event
    await createSignatureEvent(data.id, 'created', null, 'system');

    // Map the database record to our Document type
    const document: Document = {
      id: data.id,
      contractId: data.contract_id,
      quotationId: data.quotation_id,
      invoiceId: data.invoice_id,
      name: data.name,
      filePath: data.file_path,
      fileType: data.file_type,
      fileSize: data.file_size,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return document;
  } catch (error) {
    console.error('Error creating standalone document:', error);
    return null;
  }
};

export const createSignatureEvent = async (
  documentId: string,
  eventType: SignatureEventType,
  actor?: string | null,
  actorRole?: string | null,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('signature_events')
      .insert({
        document_id: documentId,
        event_type: eventType,
        actor,
        actor_role: actorRole,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error creating signature event:', error);
    return false;
  }
};
