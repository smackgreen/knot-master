import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";

// Mock lead data type
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'converted' | 'lost';
  createdAt: string;
  lastContact: string | null;
  value: number;
}

interface LeadManagementProps {
  fullSize?: boolean;
}

const LeadManagement = ({ fullSize = false }: LeadManagementProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Lead>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Mock leads data
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "1",
      name: "Sarah & Michael",
      email: "sarah.michael@example.com",
      phone: "+1 (555) 123-4567",
      source: "Website",
      status: "new",
      createdAt: new Date().toISOString(),
      lastContact: null,
      value: 25000
    },
    {
      id: "2",
      name: "Emma & James",
      email: "emma.james@example.com",
      phone: "+1 (555) 987-6543",
      source: "Referral",
      status: "contacted",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      value: 30000
    },
    {
      id: "3",
      name: "Olivia & Noah",
      email: "olivia.noah@example.com",
      phone: "+1 (555) 456-7890",
      source: "Instagram",
      status: "qualified",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      value: 40000
    },
    {
      id: "4",
      name: "Sophia & William",
      email: "sophia.william@example.com",
      phone: "+1 (555) 234-5678",
      source: "Wedding Fair",
      status: "proposal",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      value: 35000
    },
    {
      id: "5",
      name: "Ava & Benjamin",
      email: "ava.benjamin@example.com",
      phone: "+1 (555) 876-5432",
      source: "Google Ads",
      status: "converted",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      value: 45000
    },
    {
      id: "6",
      name: "Isabella & Ethan",
      email: "isabella.ethan@example.com",
      phone: "+1 (555) 345-6789",
      source: "Facebook",
      status: "lost",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      lastContact: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      value: 20000
    }
  ]);

  // Filter and sort leads
  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);

      const matchesStatus = statusFilter === "all" ? true : lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortField === "value" || sortField === "createdAt" || sortField === "lastContact") {
        const aValue = sortField === "lastContact" && !a[sortField] ? new Date(0).getTime() :
                      sortField === "lastContact" ? new Date(a[sortField] as string).getTime() :
                      sortField === "createdAt" ? new Date(a[sortField]).getTime() :
                      a[sortField] as number;

        const bValue = sortField === "lastContact" && !b[sortField] ? new Date(0).getTime() :
                      sortField === "lastContact" ? new Date(b[sortField] as string).getTime() :
                      sortField === "createdAt" ? new Date(b[sortField]).getTime() :
                      b[sortField] as number;

        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        comparison = (a[sortField] as string).localeCompare(b[sortField] as string);
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

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="default">{t('analytics.leadStatus.new')}</Badge>;
      case 'contacted':
        return <Badge variant="secondary">{t('analytics.leadStatus.contacted')}</Badge>;
      case 'qualified':
        return <Badge variant="outline">{t('analytics.leadStatus.qualified')}</Badge>;
      case 'proposal':
        return <Badge variant="warning">{t('analytics.leadStatus.proposal')}</Badge>;
      case 'converted':
        return <Badge variant="success">{t('analytics.leadStatus.converted')}</Badge>;
      case 'lost':
        return <Badge variant="destructive">{t('analytics.leadStatus.lost')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

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
              <SelectItem value="new">{t('analytics.leadStatus.new')}</SelectItem>
              <SelectItem value="contacted">{t('analytics.leadStatus.contacted')}</SelectItem>
              <SelectItem value="qualified">{t('analytics.leadStatus.qualified')}</SelectItem>
              <SelectItem value="proposal">{t('analytics.leadStatus.proposal')}</SelectItem>
              <SelectItem value="converted">{t('analytics.leadStatus.converted')}</SelectItem>
              <SelectItem value="lost">{t('analytics.leadStatus.lost')}</SelectItem>
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
                    {t('analytics.status')}
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
                <TableHead onClick={() => handleSort("value")} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    {t('analytics.value')}
                    {sortField === "value" && (
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
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{lead.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{lead.source}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">{formatDate(lead.createdAt)}</span>
                        </div>
                        {lead.lastContact && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {t('analytics.lastContact')}: {formatDate(lead.lastContact)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(lead.value)}
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
