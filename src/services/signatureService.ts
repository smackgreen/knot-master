import { supabase } from '@/integrations/supabase/client';
import { Document, SignatureRequest, SignatureRequestStatus, SignerRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { sendSignatureRequestEmail } from './emailService';

/**
 * Get signature requests by status
 * @param status The status of the signature requests to get
 * @returns The signature requests
 */
export const getSignatureRequests = async (
  status: 'pending' | 'completed' | 'expired' | 'cancelled'
): Promise<SignatureRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('signature_requests')
      .select(`
        *,
        documents:signature_request_documents(
          document:documents(*)
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Map the database records to our SignatureRequest type
    const requests: SignatureRequest[] = data.map((req: any) => ({
      id: req.id,
      recipientName: req.recipient_name,
      recipientEmail: req.recipient_email,
      recipientPhone: req.recipient_phone || null,
      recipientRole: req.recipient_role,
      status: req.status,
      token: req.token,
      expiresAt: req.expires_at,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
      documents: req.documents && req.documents.length > 0
        ? req.documents.map((doc: any) => doc.document).filter(Boolean)
        : [],
      metadata: req.metadata || {},
    }));

    return requests;
  } catch (error) {
    console.error('Error getting signature requests:', error);
    return [];
  }
};

/**
 * Get documents available for signature
 * @returns The documents available for signature
 */
export const getDocumentsForSignature = async (): Promise<Document[]> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

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
    }));

    return documents;
  } catch (error) {
    console.error('Error getting documents for signature:', error);
    return [];
  }
};

/**
 * Create a signature request
 * @param params The signature request parameters
 * @returns Whether the creation was successful
 */
export const createSignatureRequest = async (params: {
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  recipientRole: SignerRole;
  expiresInDays: number;
  documentIds: string[];
  invoiceId?: string;
  quotationId?: string;
  contractId?: string;
}): Promise<boolean> => {
  try {
    const token = uuidv4();
    const expiresAt = addDays(new Date(), params.expiresInDays);

    // Create the signature request
    try {
      // First try with recipient_phone column
      const { data, error } = await supabase
        .from('signature_requests')
        .insert({
          recipient_name: params.recipientName,
          recipient_email: params.recipientEmail,
          recipient_phone: params.recipientPhone,
          recipient_role: params.recipientRole,
          status: 'pending',
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store the data for later use
      return await processSignatureRequestCreation(data, params);
    } catch (phoneColumnError) {
      console.warn('Error creating signature request with phone column, trying without it:', phoneColumnError);

      // If the recipient_phone column doesn't exist yet, try without it
      const { data, error } = await supabase
        .from('signature_requests')
        .insert({
          recipient_name: params.recipientName,
          recipient_email: params.recipientEmail,
          recipient_role: params.recipientRole,
          status: 'pending',
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store the data for later use
      return await processSignatureRequestCreation(data, params);
    }
  } catch (error) {
    console.error('Error creating signature request:', error);
    return false;
  }
};

/**
 * Process the creation of signature request documents and events
 * @param data The created signature request data
 * @param params The original parameters
 * @returns Whether the processing was successful
 */
const processSignatureRequestCreation = async (
  data: any,
  params: {
    recipientName: string;
    recipientEmail: string;
    recipientPhone?: string;
    recipientRole: SignerRole;
    expiresInDays: number;
    documentIds: string[];
    invoiceId?: string;
    quotationId?: string;
    contractId?: string;
  }
): Promise<boolean> => {
  try {
    let allDocumentIds: string[] = [...(params.documentIds || [])];

    // If an invoice ID is provided, get its documents
    if (params.invoiceId) {
      try {
        // Import the function dynamically to avoid circular dependencies
        const { getDocumentsByInvoiceId } = await import('./documentService');
        const invoiceDocs = await getDocumentsByInvoiceId(params.invoiceId);

        if (invoiceDocs && invoiceDocs.length > 0) {
          // Add the invoice document IDs to our list
          const invoiceDocIds = invoiceDocs.map(doc => doc.id);
          allDocumentIds = [...allDocumentIds, ...invoiceDocIds];
          console.log(`Added ${invoiceDocIds.length} documents from invoice ${params.invoiceId}`);
        } else {
          console.warn(`No documents found for invoice ${params.invoiceId}`);
          // Even if no documents are found, we still want to store the invoice ID
          // This allows the signature request to be associated with the invoice
        }

        // Try to store the invoice ID in the signature request metadata
        try {
          const { error: metadataError } = await supabase
            .from('signature_requests')
            .update({
              metadata: {
                invoiceId: params.invoiceId
              }
            })
            .eq('id', data.id);

          if (metadataError) {
            console.warn('Error updating signature request metadata with invoice ID:', metadataError);
          }
        } catch (metadataError) {
          console.warn('Could not update metadata, column might not exist yet:', metadataError);
          // The metadata column might not exist yet, that's okay
        }
      } catch (error) {
        console.error('Error fetching invoice documents:', error);
      }
    }

    // If a quotation ID is provided, get its documents
    if (params.quotationId) {
      try {
        // Import the function dynamically to avoid circular dependencies
        const { getDocumentsByQuotationId } = await import('./documentService');
        const quotationDocs = await getDocumentsByQuotationId(params.quotationId);

        if (quotationDocs && quotationDocs.length > 0) {
          // Add the quotation document IDs to our list
          const quotationDocIds = quotationDocs.map(doc => doc.id);
          allDocumentIds = [...allDocumentIds, ...quotationDocIds];
          console.log(`Added ${quotationDocIds.length} documents from quotation ${params.quotationId}`);
        } else {
          console.warn(`No documents found for quotation ${params.quotationId}`);
        }

        // Try to store the quotation ID in the signature request metadata
        try {
          const { error: metadataError } = await supabase
            .from('signature_requests')
            .update({
              metadata: {
                quotationId: params.quotationId
              }
            })
            .eq('id', data.id);

          if (metadataError) {
            console.warn('Error updating signature request metadata with quotation ID:', metadataError);
          }
        } catch (metadataError) {
          console.warn('Could not update metadata, column might not exist yet:', metadataError);
          // The metadata column might not exist yet, that's okay
        }
      } catch (error) {
        console.error('Error fetching quotation documents:', error);
      }
    }

    // If a contract ID is provided, get its documents
    if (params.contractId) {
      try {
        // Import the function dynamically to avoid circular dependencies
        const { getDocumentsByContractId } = await import('./documentService');
        const contractDocs = await getDocumentsByContractId(params.contractId);

        if (contractDocs && contractDocs.length > 0) {
          // Add the contract document IDs to our list
          const contractDocIds = contractDocs.map(doc => doc.id);
          allDocumentIds = [...allDocumentIds, ...contractDocIds];
          console.log(`Added ${contractDocIds.length} documents from contract ${params.contractId}`);
        } else {
          console.warn(`No documents found for contract ${params.contractId}`);
        }

        // Try to store the contract ID in the signature request metadata
        try {
          const { error: metadataError } = await supabase
            .from('signature_requests')
            .update({
              metadata: {
                contractId: params.contractId
              }
            })
            .eq('id', data.id);

          if (metadataError) {
            console.warn('Error updating signature request metadata with contract ID:', metadataError);
          }
        } catch (metadataError) {
          console.warn('Could not update metadata, column might not exist yet:', metadataError);
          // The metadata column might not exist yet, that's okay
        }
      } catch (error) {
        console.error('Error fetching contract documents:', error);
      }
    }

    // Remove any duplicate document IDs
    allDocumentIds = [...new Set(allDocumentIds)];

    // Only process document IDs if there are any
    if (allDocumentIds.length > 0) {
      // Create the signature request documents
      const requestDocuments = allDocumentIds.map(documentId => ({
        signature_request_id: data.id,
        document_id: documentId,
      }));

      const { error: docsError } = await supabase
        .from('signature_request_documents')
        .insert(requestDocuments);

      if (docsError) {
        throw docsError;
      }

      // Create 'created' events for each document
      for (const documentId of allDocumentIds) {
        await createSignatureEvent(documentId, 'created', params.recipientEmail, params.recipientRole);
      }
    } else if (params.invoiceId || params.quotationId || params.contractId) {
      // If we have an invoice, quotation, or contract but no documents, we still want to create the signature request
      console.log('No documents found, but creating signature request with invoice/quotation/contract reference');

      // This is a valid use case - the invoice/quotation/contract itself is the document
      // We'll just continue with the process
    } else {
      console.warn('No documents provided for signature request');
      // This is still valid - we might just be sending a custom message without documents
    }

    // Send email notification using Resend
    try {
      const emailSent = await sendSignatureRequestEmail(
        data.id,
        params.recipientEmail,
        params.recipientName,
        data.token
      );

      if (emailSent) {
        console.log(`Signature request email sent to ${params.recipientEmail}`);
      } else {
        console.warn(`Failed to send signature request email to ${params.recipientEmail}`);
      }
    } catch (emailError) {
      console.error('Error sending signature request email:', emailError);
      // Continue with the process even if email sending fails
    }

    return true;
  } catch (error) {
    console.error('Error processing signature request creation:', error);
    return false;
  }
};

/**
 * Cancel a signature request
 * @param requestId The ID of the signature request
 * @returns Whether the cancellation was successful
 */
export const cancelSignatureRequest = async (requestId: string): Promise<boolean> => {
  try {
    // Get the request to get the documents
    const { data: request, error: requestError } = await supabase
      .from('signature_requests')
      .select(`
        *,
        documents:signature_request_documents(
          document_id
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError) {
      throw requestError;
    }

    // Update the signature request status
    const { error } = await supabase
      .from('signature_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) {
      throw error;
    }

    // Create 'cancelled' events for each document
    if (request.documents && request.documents.length > 0) {
      for (const doc of request.documents) {
        if (doc.document_id) {
          await createSignatureEvent(
            doc.document_id,
            'cancelled',
            request.recipient_email,
            request.recipient_role
          );
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error cancelling signature request:', error);
    return false;
  }
};

/**
 * Resend a signature request
 * @param requestId The ID of the signature request
 * @returns Whether the resend was successful
 */
export const resendSignatureRequest = async (requestId: string): Promise<boolean> => {
  try {
    // Get the request
    const { data, error } = await supabase
      .from('signature_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      throw error;
    }

    // Send the email notification again using Resend
    try {
      const emailSent = await sendSignatureRequestEmail(
        data.id,
        data.recipient_email,
        data.recipient_name,
        data.token
      );

      if (emailSent) {
        console.log(`Signature request email resent to ${data.recipient_email}`);
      } else {
        console.warn(`Failed to resend signature request email to ${data.recipient_email}`);
      }
    } catch (emailError) {
      console.error('Error resending signature request email:', emailError);
      // Continue with the process even if email sending fails
    }

    // Update the last updated timestamp
    const { error: updateError } = await supabase
      .from('signature_requests')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Error resending signature request:', error);
    return false;
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
export const createSignatureEvent = async (
  documentId: string,
  eventType: 'created' | 'viewed' | 'signed' | 'expired' | 'cancelled',
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

/**
 * Verify a signature request by token
 * @param token The token to verify
 * @returns The signature request if valid, null otherwise
 */
export const verifySignatureRequest = async (token: string): Promise<SignatureRequest | null> => {
  try {
    // STEP 1: Fetch the signature request by token
    const { data: requestData, error: requestError } = await supabase
      .from('signature_requests')
      .select('*')
      .eq('token', token)
      .single();

    console.log('[verifySignatureRequest] Step 1 - signature_requests:', {
      error: requestError?.message,
      found: !!requestData,
      status: requestData?.status,
      expires_at: requestData?.expires_at,
    });

    if (requestError || !requestData) {
      console.error('[verifySignatureRequest] Failed to fetch signature request:', requestError);
      return null;
    }

    // Check if the request has expired
    const expiresAt = new Date(requestData.expires_at);
    if (expiresAt < new Date()) {
      await supabase
        .from('signature_requests')
        .update({ status: 'expired' })
        .eq('id', requestData.id);
      return null;
    }

    // Check if the request has already been completed
    if (requestData.status === 'completed') {
      return null;
    }

    // STEP 2: Fetch junction entries (signature_request_documents)
    const { data: junctionData, error: junctionError } = await supabase
      .from('signature_request_documents')
      .select('id, document_id, signature_request_id')
      .eq('signature_request_id', requestData.id);

    console.log('[verifySignatureRequest] Step 2 - junction entries:', {
      error: junctionError?.message,
      count: junctionData?.length,
      entries: junctionData,
    });

    // STEP 3: Fetch documents separately (if junction entries exist)
    let documents: any[] = [];
    if (junctionData && junctionData.length > 0) {
      const documentIds = junctionData.map((j: any) => j.document_id);
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds);

      console.log('[verifySignatureRequest] Step 3 - documents:', {
        error: docsError?.message,
        requestedIds: documentIds,
        count: docsData?.length,
        documents: docsData,
      });

      if (docsError) {
        console.error('[verifySignatureRequest] Failed to fetch documents:', docsError);
      } else if (docsData) {
        documents = docsData;
      }
    } else {
      console.warn('[verifySignatureRequest] No junction entries found for signature request:', requestData.id);
    }

    // STEP 4: Map to SignatureRequest type
    const request: SignatureRequest = {
      id: requestData.id,
      recipientName: requestData.recipient_name,
      recipientEmail: requestData.recipient_email,
      recipientPhone: requestData.recipient_phone || null,
      recipientRole: requestData.recipient_role,
      status: requestData.status,
      token: requestData.token,
      expiresAt: requestData.expires_at,
      createdAt: requestData.created_at,
      updatedAt: requestData.updated_at,
      documents: documents,
      metadata: requestData.metadata || {},
    };

    console.log('[verifySignatureRequest] Final result:', {
      id: request.id,
      status: request.status,
      documentsCount: request.documents.length,
    });

    return request;
  } catch (error) {
    console.error('Error verifying signature request:', error);
    return null;
  }
};
