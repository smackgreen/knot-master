import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, Mail, Phone, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Lead, LeadStatus } from "@/types/analytics";
import { fetchLeads } from "@/services/analyticsService";

interface LeadManagementProps {
  fullSize?: boolean;
}

const LeadManagement = ({ fullSize = false }: LeadManagementProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Lead>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leads from Supabase
  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(t('analytics.errorLoadingData'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Filter and sort leads
  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || '').includes(searchTerm);

      const matchesStatus = statusFilter === "all" ? true : lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      const aVal = a[sortField];
      const bVal = b[sortField];

      if (sortField === "estimatedBudget" || sortField === "createdAt" || sortField === "lastContactDate" || sortField === "firstContactDate") {
        const aDate = sortField === "estimatedBudget" ? Number(aVal) || 0 :
                      !aVal ? new Date(0).getTime() :
                      new Date(aVal as string).getTime();
        const bDate = sortField === "estimatedBudget" ? Number(bVal) || 0 :
                      !bVal ? new Date(0).getTime() :
                      new Date(bVal as string).getTime();

        comparison = aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
      } else {
        comparison = String(aVal || '').localeCompare(String(bVal || ''));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  const handleSort = (field: keyof Lead) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Map lead status to i18n key and badge variant
  const getStatusBadge = (status: LeadStatus) => {
    const statusConfig: Record<LeadStatus, { key: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      inquiry: { key: 'analytics.inquiry', variant: 'default' },
      contacted: { key: 'analytics.contacted', variant: 'secondary' },
      meeting_scheduled: { key: 'analytics.meetingScheduled', variant: 'outline' },
      proposal_sent: { key: 'analytics.proposalSent', variant: 'secondary' },
      contract_sent: { key: 'analytics.contractSent', variant: 'default' },
      converted: { key: 'analytics.converted', variant: 'default' },
      lost: { key: 'analytics.lost', variant: 'destructive' },
    };

    const config = statusConfig[status] || { key: 'analytics.inquiry', variant: 'default' as const };
    return <Badge variant={config.variant}>{t(config.key)}</Badge>;
  };

  // Map lead source to i18n key
  const getSourceLabel = (source: string) => {
    const sourceKeyMap: Record<string, string> = {
      website: 'analytics.website',
      referral: 'analytics.referral',
      social_media: 'analytics.socialMedia',
      wedding_fair: 'analytics.weddingFair',
      advertisement: 'analytics.advertisement',
      other: 'analytics.other',
    };
    return t(sourceKeyMap[source] || source);
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <Card className={fullSize ? "col-span-2" : ""}>
        <CardHeader>
          <CardTitle>{t('analytics.leadManagement')}</CardTitle>
          <CardDescription>{t('analytics.leadManagementDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">{t('analytics.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={fullSize ? "col-span-2" : ""}>
        <CardHeader>
          <CardTitle>{t('analytics.leadManagement')}</CardTitle>
          <CardDescription>{t('analytics.leadManagementDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={loadLeads}>
              {t('common.retry') || 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={fullSize ? "col-span-2" : ""}>
      <CardHeader>
        <CardTitle>{t('analytics.leadManagement')}</CardTitle>
        <CardDescription>{t('analytics.leadManagementDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('analytics.searchLeads')}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('analytics.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('analytics.allStatuses')}</SelectItem>
              <SelectItem value="inquiry">{t('analytics.inquiry')}</SelectItem>
              <SelectItem value="contacted">{t('analytics.contacted')}</SelectItem>
              <SelectItem value="meeting_scheduled">{t('analytics.meetingScheduled')}</SelectItem>
              <SelectItem value="proposal_sent">{t('analytics.proposalSent')}</SelectItem>
              <SelectItem value="contract_sent">{t('analytics.contractSent')}</SelectItem>
              <SelectItem value="converted">{t('analytics.converted')}</SelectItem>
              <SelectItem value="lost">{t('analytics.lost')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  <div className="flex items-center">
                    {t('analytics.leadName')}
                    {sortField === "name" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    {t('analytics.contact')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("source")} className="cursor-pointer">
                  <div className="flex items-center">
                    {t('analytics.source')}
                    {sortField === "source" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                  <div className="flex items-center">
                    {t('analytics.leadStatus')}
                    {sortField === "status" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer">
                  <div className="flex items-center">
                    {t('analytics.created')}
                    {sortField === "createdAt" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("estimatedBudget")} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    {t('analytics.value')}
                    {sortField === "estimatedBudget" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    {t('analytics.noLeadsFound')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {lead.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getSourceLabel(lead.source)}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">{formatDate(lead.createdAt)}</span>
                        </div>
                        {lead.lastContactDate && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {t('analytics.lastContact')}: {formatDate(lead.lastContactDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(lead.estimatedBudget)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadManagement;
