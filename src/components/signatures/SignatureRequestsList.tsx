import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { SignatureRequest, SignatureRequestStatus } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { cancelSignatureRequest, resendSignatureRequest } from '@/services/signatureService';

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
  MoreHorizontal,
  Send,
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy
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
import { Skeleton } from '@/components/ui/skeleton';

interface SignatureRequestsListProps {
  requests: SignatureRequest[];
  isLoading: boolean;
  status: SignatureRequestStatus;
  onRequestUpdated: () => void;
}

const SignatureRequestsList: React.FC<SignatureRequestsListProps> = ({
  requests,
  isLoading,
  status,
  onRequestUpdated
}) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<SignatureRequest | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPP', {
      locale: i18n.language === 'fr' ? fr : enUS,
    });
  };

  const getStatusBadge = (status: SignatureRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{t('signatures.status.pending')}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">{t('signatures.status.completed')}</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">{t('signatures.status.expired')}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700">{t('signatures.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: SignatureRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    
    setIsActionLoading(true);
    
    try {
      const success = await cancelSignatureRequest(selectedRequest.id);
      
      if (success) {
        toast({
          title: t('signatures.requestCancelled'),
          description: t('signatures.requestCancelledSuccess'),
        });
        onRequestUpdated();
      } else {
        throw new Error('Failed to cancel signature request');
      }
    } catch (error) {
      console.error('Error cancelling signature request:', error);
      toast({
        title: t('signatures.errorCancellingRequest'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
      setIsCancelDialogOpen(false);
    }
  };

  const handleResendRequest = async (request: SignatureRequest) => {
    try {
      const success = await resendSignatureRequest(request.id);
      
      if (success) {
        toast({
          title: t('signatures.requestResent'),
          description: t('signatures.requestResentSuccess'),
        });
        onRequestUpdated();
      } else {
        throw new Error('Failed to resend signature request');
      }
    } catch (error) {
      console.error('Error resending signature request:', error);
      toast({
        title: t('signatures.errorResendingRequest'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('signatures.recipient')}</TableHead>
            <TableHead>{t('signatures.documents')}</TableHead>
            <TableHead>{t('signatures.createdAt')}</TableHead>
            <TableHead>{t('signatures.expiresAt')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                {t('signatures.noRequests')}
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{request.recipientName}</span>
                    <span className="text-sm text-gray-500">{request.recipientEmail}</span>
                    <span className="text-xs text-gray-400">{t(`signatures.roles.${request.recipientRole}`)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="font-medium">{request.documents.length}</span>
                    <span className="ml-1 text-gray-500">{t('signatures.documentsCount', { count: request.documents.length })}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(request.createdAt)}</TableCell>
                <TableCell>{formatDate(request.expiresAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t('common.openMenu')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copySigningLink(request)}>
                        <Copy className="h-4 w-4 mr-2" />
                        {t('signatures.copyLink')}
                      </DropdownMenuItem>
                      
                      {status === 'pending' && (
                        <>
                          <DropdownMenuItem onClick={() => handleResendRequest(request)}>
                            <Send className="h-4 w-4 mr-2" />
                            {t('signatures.resend')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsCancelDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {t('signatures.cancel')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('signatures.confirmCancel')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('signatures.cancelWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRequest}
              disabled={isActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading ? t('common.loading') : t('signatures.cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SignatureRequestsList;
