
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { formatDate, getWeddingStatusInfo } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Search, Calendar, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 10;

const Clients = () => {
  const { clients, isLoading } = useApp();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeClientsPage, setActiveClientsPage] = useState(1);
  const [pastClientsPage, setPastClientsPage] = useState(1);

  // Memoize filtered clients to prevent recalculation on every render
  const filteredClients = useMemo(() => {
    const searchString = searchTerm.toLowerCase();
    return clients.filter(client => {
      return (
        client.name.toLowerCase().includes(searchString) ||
        client.partnerName.toLowerCase().includes(searchString) ||
        client.email.toLowerCase().includes(searchString) ||
        client.venue.toLowerCase().includes(searchString)
      );
    });
  }, [clients, searchTerm]);

  // Memoize active clients to prevent recalculation on every render
  const activeClients = useMemo(() => {
    return filteredClients
      .filter(client => client.status === 'active')
      .sort((a, b) => new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime());
  }, [filteredClients]);

  // Memoize past clients to prevent recalculation on every render
  const pastClients = useMemo(() => {
    return filteredClients
      .filter(client => client.status === 'completed')
      .sort((a, b) => new Date(b.weddingDate).getTime() - new Date(a.weddingDate).getTime());
  }, [filteredClients]);

  // Calculate pagination for active clients
  const totalActivePages = Math.ceil(activeClients.length / ITEMS_PER_PAGE);
  const paginatedActiveClients = useMemo(() => {
    const startIndex = (activeClientsPage - 1) * ITEMS_PER_PAGE;
    return activeClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activeClients, activeClientsPage]);

  // Calculate pagination for past clients
  const totalPastPages = Math.ceil(pastClients.length / ITEMS_PER_PAGE);
  const paginatedPastClients = useMemo(() => {
    const startIndex = (pastClientsPage - 1) * ITEMS_PER_PAGE;
    return pastClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [pastClients, pastClientsPage]);

  // Reset pagination when search term changes
  useEffect(() => {
    setActiveClientsPage(1);
    setPastClientsPage(1);
  }, [searchTerm]);

  // Render pagination controls
  const renderPagination = (currentPage, totalPages, setPage) => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => setPage(page)}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Render client table rows
  const renderClientRows = (clients) => {
    return clients.map((client) => {
      const statusInfo = getWeddingStatusInfo(client.status, client.weddingDate);

      return (
        <TableRow key={client.id}>
          <TableCell>
            <div className="font-medium">{client.name}</div>
            <div className="text-sm text-muted-foreground">{client.partnerName}</div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(client.weddingDate)}
            </div>
          </TableCell>
          <TableCell>{client.venue}</TableCell>
          <TableCell>
            <div>{client.email}</div>
            <div className="text-sm text-muted-foreground">{client.phone}</div>
          </TableCell>
          <TableCell>
            <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </TableCell>
          <TableCell>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/app/clients/${client.id}`}>{t('common.details')}</Link>
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
          <Users className="h-6 w-6" /> {t('clients.title')}
        </h1>
        <Button asChild>
          <Link to="/app/clients/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('clients.addClient')}
          </Link>
        </Button>
      </div>

      {/* Search and filters */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('clients.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">{t('clients.loading')}</span>
        </div>
      ) : (
        <>
          {/* Active Clients */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('clients.activeClients')}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeClients.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('clients.couple')}</TableHead>
                          <TableHead>{t('clients.weddingDate')}</TableHead>
                          <TableHead>{t('clients.venue')}</TableHead>
                          <TableHead>{t('clients.contact')}</TableHead>
                          <TableHead>{t('clients.status')}</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderClientRows(paginatedActiveClients)}
                      </TableBody>
                    </Table>
                  </div>
                  {renderPagination(activeClientsPage, totalActivePages, setActiveClientsPage)}
                </>
              ) : (
                <p className="text-center py-4 text-muted-foreground">{t('clients.noActiveClients')}</p>
              )}
            </CardContent>
          </Card>

          {/* Past Weddings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('clients.pastWeddings')}</CardTitle>
            </CardHeader>
            <CardContent>
              {pastClients.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('clients.couple')}</TableHead>
                          <TableHead>{t('clients.weddingDate')}</TableHead>
                          <TableHead>{t('clients.venue')}</TableHead>
                          <TableHead>{t('clients.contact')}</TableHead>
                          <TableHead>{t('clients.status')}</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderClientRows(paginatedPastClients)}
                      </TableBody>
                    </Table>
                  </div>
                  {renderPagination(pastClientsPage, totalPastPages, setPastClientsPage)}
                </>
              ) : (
                <p className="text-center py-4 text-muted-foreground">{t('clients.noPastWeddings')}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Clients;
