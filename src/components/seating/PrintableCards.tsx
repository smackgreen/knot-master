import React, { useRef } from 'react';
import { Guest, Table } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import PlaceCard from './PlaceCard';
import { useReactToPrint } from 'react-to-print';

interface PrintableCardsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: Guest[];
  tables: Table[];
  selectedTableIds?: string[];
}

const PrintableCards: React.FC<PrintableCardsProps> = ({
  open,
  onOpenChange,
  guests,
  tables,
  selectedTableIds = []
}) => {
  const [filter, setFilter] = React.useState<'all' | 'selected' | 'assigned'>('all');
  const [includeUnassigned, setIncludeUnassigned] = React.useState(true);
  const [sortBy, setSortBy] = React.useState<'name' | 'table'>('name');
  const printRef = useRef<HTMLDivElement>(null);

  // Filter and sort guests
  const filteredGuests = React.useMemo(() => {
    let filtered = [...guests];

    // Apply filter
    if (filter === 'selected') {
      // Only include guests from selected tables
      filtered = filtered.filter(guest => 
        guest.tableId && selectedTableIds.includes(guest.tableId)
      );
    } else if (filter === 'assigned') {
      // Only include guests with table assignments
      filtered = filtered.filter(guest => !!guest.tableId);
    } else if (filter === 'all' && !includeUnassigned) {
      // Include all guests but exclude unassigned if specified
      filtered = filtered.filter(guest => !!guest.tableId);
    }

    // Sort guests
    if (sortBy === 'name') {
      filtered.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
    } else if (sortBy === 'table') {
      filtered.sort((a, b) => {
        // First by table name
        const tableA = a.tableId ? tables.find(t => t.id === a.tableId)?.name || '' : '';
        const tableB = b.tableId ? tables.find(t => t.id === b.tableId)?.name || '' : '';
        
        const tableCompare = tableA.localeCompare(tableB);
        if (tableCompare !== 0) return tableCompare;
        
        // Then by last name, first name
        return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      });
    }

    return filtered;
  }, [guests, tables, filter, includeUnassigned, sortBy, selectedTableIds]);

  // Get table for a guest
  const getTable = (guest: Guest) => {
    if (!guest.tableId) return undefined;
    return tables.find(t => t.id === guest.tableId);
  };

  // Handle print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Place Cards',
    pageStyle: `
      @page {
        size: letter;
        margin: 0.5in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Print Place Cards</DialogTitle>
          <DialogDescription>
            Generate printable place cards for your guests
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="filter">Show guests from</Label>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger id="filter">
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="selected" disabled={selectedTableIds.length === 0}>
                  Selected Tables ({selectedTableIds.length})
                </SelectItem>
                <SelectItem value="assigned">Assigned Guests Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sort">Sort by</Label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger id="sort">
                <SelectValue placeholder="Select sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Guest Name</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox 
              id="includeUnassigned" 
              checked={includeUnassigned} 
              onCheckedChange={(checked) => setIncludeUnassigned(checked as boolean)}
              disabled={filter !== 'all'}
            />
            <Label htmlFor="includeUnassigned">Include unassigned guests</Label>
          </div>
        </div>

        <div className="border rounded-md p-4 bg-gray-50 overflow-auto max-h-[50vh]">
          <div className="text-sm text-gray-500 mb-2">
            Preview: {filteredGuests.length} place cards
          </div>
          
          <div ref={printRef} className="grid grid-cols-1 md:grid-cols-2 gap-2 print:grid-cols-2">
            {filteredGuests.map(guest => (
              <PlaceCard 
                key={guest.id} 
                guest={guest} 
                table={getTable(guest)} 
              />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={filteredGuests.length === 0}>
            Print {filteredGuests.length} Cards
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintableCards;
