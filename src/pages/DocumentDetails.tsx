import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Document, ElectronicSignature, SignatureRequest, SignatureRequestStatus } from '@/types';
import { getDocumentById, deleteDocument } from '@/services/documentService';
import { getSignedUrl } from '@/services/storageService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  ArrowLeft,
  Download,
  FileText,
  Trash,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  FileSignature,
  Copy,
} from 'lucide-react';
import SignatureDisplay from '@/components/documents/SignatureDisplay';
import RequestSignatureDialog from '@/components/documents/RequestSignatureDialog';
import SignDocumentDialog from '@/components/documents/SignDocumentDialog';

const DocumentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState<boolean>(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const doc = await getDocumentById(id);
      if (doc) {
        setDocument(doc);
      } else {
        toast({
          title: t('documents.documentNotFound'),
          description: t('documents.tryAgainLater'),
          variant: 'destructive',
        });
        navigate('/app/documents');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast({
        title: t('documents.errorLoadingDocument'),
        description: t('documents.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPP p', {
      locale: i18n.language === 'fr' ? fr : enUS,
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPP', {
      locale: i18n.language === 'fr' ? fr : enUS,
    });
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t('documents.status.pending')}</Badge>;
      case 'signed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t('documents.status.signed')}</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{t('documents.status.expired')}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t('documents.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestStatusBadge = (status: SignatureRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t('signatures.status.pending')}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t('signatures.status.completed')}</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{t('signatures.status.expired')}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t('signatures.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestStatusIcon = (status: SignatureRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      client: 'bg-blue-50 text-blue-700 border-blue-200',
      vendor: 'bg-purple-50 text-purple-700 border-purple-200',
      planner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    const colorClass = roleColors[role] || 'bg-gray-50 text-gray-700 border-gray-200';
    return (
      <Badge variant="outline" className={colorClass}>
        {t(`documents.roles.${role}`, role)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleDownload = async () => {
    if (!document) return;
    try {
      const url = await getSignedUrl(document.filePath);
      if (url) {
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.name;
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

  const handleDelete = async () => {
    if (!document) return;
    try {
      const success = await deleteDocument(document.id);
      if (success) {
        toast({
          title: t('documents.documentDeleted'),
          description: t('documents.documentDeletedSuccess'),
        });
        navigate('/app/documents');
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
      setIsDeleteDialogOpen(false);
    }
  };

  const copySigningLink = (request: SignatureRequest) => {
    const baseUrl = window.location.origin;
    const signingUrl = `${baseUrl}/sign/${request.token}`;
    navigator.clipboard.writeText(signingUrl).then(() => {
      toast({
        title: t('signatures.linkCopied'),
        description: t('signatures.linkCopiedSuccess'),
      });
    });
  };

  // Find the electronic signature for a given signature request
  const findSignatureForRequest = (request: SignatureRequest): ElectronicSignature | undefined => {
    if (!document?.signatures) return undefined;
    return document.signatures.find(
      (sig) =>
        sig.signerEmail.toLowerCase() === request.recipientEmail.toLowerCase() &&
        sig.signerRole === request.recipientRole
    );
  };

  // Get all recipients: combine signature requests and direct signatures
  const getRecipientCards = (): RecipientCardData[] => {
    if (!document) return [];

    const cards: RecipientCardData[] = [];
    const matchedSignatureIds = new Set<string>();

    // First, create cards from signature requests
    if (document.signatureRequests && document.signatureRequests.length > 0) {
      document.signatureRequests.forEach((request) => {
        const signature = findSignatureForRequest(request);
        if (signature) {
          matchedSignatureIds.add(signature.id);
        }
        cards.push({
          id: request.id,
          request,
          signature: signature || null,
        });
      });
    }

    // Then, add any signatures that don't have a matching request
    if (document.signatures && document.signatures.length > 0) {
      document.signatures.forEach((signature) => {
        if (!matchedSignatureIds.has(signature.id)) {
          cards.push({
            id: signature.id,
            request: null,
            signature,
          });
        }
      });
    }

    return cards;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-6">
        <p>{t('documents.documentNotFound')}</p>
        <Button variant="outline" onClick={() => navigate('/app/documents')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('documentDetails.backToDocuments')}
        </Button>
      </div>
    );
  }

  const recipientCards = getRecipientCards();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/app/documents')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-gray-500" />
              <h1 className="text-2xl font-bold">{document.name}</h1>
              {getDocumentStatusBadge(document.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('documentDetails.id')}: {document.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            {t('documents.download')}
          </Button>
          {!document.signatures?.some(s => s.signerRole === 'planner') && (
            <Button variant="outline" size="sm" onClick={() => setIsSignDialogOpen(true)}>
              <FileSignature className="h-4 w-4 mr-2" />
              {t('documents.sign')}
            </Button>
          )}
          {(document.signatureRequests?.length || 0) < 3 && (
            <Button variant="outline" size="sm" onClick={() => setIsRequestDialogOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              {t('documents.requestSignature')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash className="h-4 w-4 mr-2" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Document Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('documentDetails.documentInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('documentDetails.fileName')}</p>
              <p className="text-sm font-semibold">{document.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('documentDetails.fileType')}</p>
              <p className="text-sm">{document.fileType || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('documentDetails.fileSize')}</p>
              <p className="text-sm">{formatFileSize(document.fileSize)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('common.status')}</p>
              <div>{getDocumentStatusBadge(document.status)}</div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('documents.createdAt')}</p>
              <p className="text-sm">{formatShortDate(document.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('documentDetails.updatedAt')}</p>
              <p className="text-sm">{formatShortDate(document.updatedAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('documents.signatures')}</p>
              <p className="text-sm">
                {document.signatures?.length || 0} / 3
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('documentDetails.signatureRequestsCount')}</p>
              <p className="text-sm">
                {document.signatureRequests?.length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signing Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('documentDetails.signingProgress')}</CardTitle>
          <CardDescription>{t('documentDetails.signingProgressDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Progress bar */}
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(((document.signatures?.length || 0) / 3) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {document.signatures?.length || 0} {t('documentDetails.of')} 3 {t('documentDetails.signed')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {document.signatureRequests?.length || 0} {t('documentDetails.requestsSent')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipient Cards Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('documentDetails.recipientDetails')}</h2>
        {recipientCards.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">{t('documentDetails.noRecipients')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('documentDetails.noRecipientsDescription')}
                </p>
                {(document.signatureRequests?.length || 0) < 3 && (
                  <Button onClick={() => setIsRequestDialogOpen(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    {t('documents.requestSignature')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {recipientCards.map((card, index) => (
              <Card
                key={card.id}
                className={
                  card.signature
                    ? 'border-green-200 bg-green-50/30'
                    : card.request?.status === 'pending'
                    ? 'border-yellow-200 bg-yellow-50/30'
                    : card.request?.status === 'expired'
                    ? 'border-gray-200 bg-gray-50/30'
                    : card.request?.status === 'cancelled'
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-gray-200'
                }
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {getRequestStatusIcon(card.signature ? 'completed' : card.request?.status || 'pending')}
                      <div>
                        <CardTitle className="text-lg">
                          {t('documentDetails.recipient')} {index + 1}
                        </CardTitle>
                        <CardDescription>
                          {card.request
                            ? getRoleBadge(card.request.recipientRole)
                            : card.signature
                            ? getRoleBadge(card.signature.signerRole)
                            : null}
                        </CardDescription>
                      </div>
                    </div>
                    <div>
                      {card.signature
                        ? getRequestStatusBadge('completed')
                        : card.request
                        ? getRequestStatusBadge(card.request.status)
                        : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipient Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{t('documentDetails.fullName')}</p>
                        <p className="text-sm font-semibold">
                          {card.request?.recipientName || card.signature?.signerName || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{t('documentDetails.email')}</p>
                        <p className="text-sm">
                          {card.request?.recipientEmail || card.signature?.signerEmail || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{t('documentDetails.phone')}</p>
                        <p className="text-sm">
                          {card.request?.recipientPhone || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-start gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{t('documentDetails.role')}</p>
                        <div className="mt-0.5">
                          {card.request
                            ? getRoleBadge(card.request.recipientRole)
                            : card.signature
                            ? getRoleBadge(card.signature.signerRole)
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Request Details */}
                  {card.request && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t('documentDetails.requestSentOn')}</p>
                          <p className="text-sm">{formatDate(card.request.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t('documentDetails.expiresAt')}</p>
                          <p className="text-sm">{formatDate(card.request.expiresAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t('documentDetails.token')}</p>
                          <p className="text-xs font-mono text-muted-foreground break-all">{card.request.token}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signature Details (if signed) */}
                  {card.signature && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3">{t('documentDetails.signatureDetails')}</h4>
                        <SignatureDisplay signature={card.signature} />
                      </div>
                    </>
                  )}
                </CardContent>

                {/* Card Actions */}
                {card.request && !card.signature && card.request.status === 'pending' && (
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copySigningLink(card.request!)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {t('signatures.copyLink')}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

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
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Signature Dialog */}
      {document && (
        <RequestSignatureDialog
          document={document}
          open={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
          onRequestSuccess={fetchDocument}
        />
      )}

      {/* Sign Document Dialog */}
      {document && (
        <SignDocumentDialog
          document={document}
          signerRole="planner"
          open={isSignDialogOpen}
          onOpenChange={setIsSignDialogOpen}
          onSignSuccess={fetchDocument}
        />
      )}
    </div>
  );
};

interface RecipientCardData {
  id: string;
  request: SignatureRequest | null;
  signature: ElectronicSignature | null;
}

export default DocumentDetails;
