import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Document, DocumentStatus } from '@/types';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { getSignedUrl } from '@/services/storageService';
import { deleteDocument } from '@/services/documentService';
import { useToast } from '@/components/ui/use-toast';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Download,
  MoreHorizontal,
  Trash,
  FileSignature,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SignDocumentDialog from './SignDocumentDialog';
import RequestSignatureDialog from './RequestSignatureDialog';

interface DocumentsListProps {
  documents: Document[];
  onDocumentUpdated?: () => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ documents, onDocumentUpdated }) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState<boolean>(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPP', {
      locale: i18n.language === 'fr' ? fr : enUS,
    });
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50">{t('documents.status.pending')}</Badge>;
      case 'signed':
        return <Badge variant="outline" className="bg-green-50">{t('documents.status.signed')}</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50">{t('documents.status.expired')}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50">{t('documents.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDocument = (document: Document) => {
    navigate(`/app/documents/${document.id}`);
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const url = await getSignedUrl(doc.filePath);
      if (url) {
        const link = window.document.createElement('a');
        link.href = url;
        link.download = doc.name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        toast({
          title: t('documents.errorDownloadingDocument'),
          description: t('documents.tryAgainLater'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: t('documents.errorDownloadingDocument'),
        description: t('documents.tryAgainLater'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;

    setIsLoading(true);

    try {
      const success = await deleteDocument(selectedDocument.id);
      if (success) {
        toast({
          title: t('documents.documentDeleted'),
          description: t('documents.documentDeletedSuccess'),
        });

        if (onDocumentUpdated) {
          onDocumentUpdated();
        }
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: t('documents.errorDeletingDocument'),
        description: t('documents.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSignDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsSignDialogOpen(true);
  };

  const handleRequestSignature = (document: Document) => {
    setSelectedDocument(document);
    setIsRequestDialogOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('documents.name')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead>{t('documents.createdAt')}</TableHead>
            <TableHead>{t('documents.signatures')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                {t('documents.noDocuments')}
              </TableCell>
            </TableRow>
          ) : (
            documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium">{document.name}</TableCell>
                <TableCell>{getStatusBadge(document.status)}</TableCell>
                <TableCell>{formatDate(document.createdAt)}</TableCell>
                <TableCell>
                  {document.signatures?.length || 0} / 3
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t('common.openMenu')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('documents.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                        <Download className="h-4 w-4 mr-2" />
                        {t('documents.download')}
                      </DropdownMenuItem>
                      {(() => {
                        const hasPlannerSig = document.signatures?.some(s => s.signerRole === 'planner');
                        const sigCount = document.signatures?.length || 0;
                        const allRecipientsSigned = sigCount >= 3;
                        return (!hasPlannerSig || !allRecipientsSigned);
                      })() && (
                        <>
                          {!document.signatures?.some(s => s.signerRole === 'planner') && (
                            <DropdownMenuItem onClick={() => handleSignDocument(document)}>
                              <FileSignature className="h-4 w-4 mr-2" />
                              {t('documents.sign')}
                            </DropdownMenuItem>
                          )}
                          {(document.signatureRequests?.length || 0) < 3 && (
                            <DropdownMenuItem onClick={() => handleRequestSignature(document)}>
                              <Send className="h-4 w-4 mr-2" />
                              {t('documents.requestSignature')}
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDocument(document);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sign Document Dialog */}
      {selectedDocument && (
        <SignDocumentDialog
          document={selectedDocument}
          signerRole="planner"
          open={isSignDialogOpen}
          onOpenChange={setIsSignDialogOpen}
          onSignSuccess={onDocumentUpdated}
        />
      )}

      {/* Request Signature Dialog */}
      {selectedDocument && (
        <RequestSignatureDialog
          document={selectedDocument}
          open={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
          onRequestSuccess={onDocumentUpdated}
        />
      )}
    </>
  );
};

export default DocumentsList;
