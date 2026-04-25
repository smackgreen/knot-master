
import { Link } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatVendorCategory } from "@/utils/formatters";
import { Vendor } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VendorTableProps {
  vendors: Vendor[];
  clients: any[];
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendorId: string) => void;
}

const VendorTable = ({ vendors, clients, onEdit, onDelete }: VendorTableProps) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      {vendors.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('vendors.name')}</TableHead>
              <TableHead>{t('vendors.category')}</TableHead>
              <TableHead>{t('vendors.contact')}</TableHead>
              <TableHead>{t('vendors.client')}</TableHead>
              <TableHead>{t('vendors.cost')}</TableHead>
              <TableHead>{t('vendors.status')}</TableHead>
              <TableHead className="text-right">{t('vendors.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => {
              const client = clients.find(c => c.id === vendor.clientId);
              
              return (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      {formatVendorCategory(vendor.category)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {vendor.contactName && <div>{vendor.contactName}</div>}
                    <div className="text-sm text-muted-foreground">{vendor.email || t('vendors.noEmail')}</div>
                  </TableCell>
                  <TableCell>
                    {client ? (
                      <Button variant="ghost" size="sm" asChild className="p-0 h-auto font-normal">
                        <Link to={`/clients/${client.id}`}>
                          {client.name} & {client.partnerName}
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">{t('vendors.unknown')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vendor.cost ? formatCurrency(vendor.cost) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {vendor.isPaid ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {t('vendors.paid')}
                      </span>
                    ) : vendor.cost ? (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        {t('vendors.unpaid')}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                        {t('vendors.noCost')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(vendor)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">{t('vendors.edit')}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(vendor.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('vendors.delete')}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center py-4 text-muted-foreground">{t('vendors.noVendors')}</p>
      )}
    </div>
  );
};

export default VendorTable;
