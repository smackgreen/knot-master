import { useState } from "react";
import { Guest, Table } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, UserPlus, UserMinus } from "lucide-react";

interface GuestListProps {
  guests: Guest[];
  tables: Table[];
  onAssign: (guestId: string, tableId: string) => void;
  onRemove: (guestId: string) => void;
}

const GuestList = ({ guests, tables, onAssign, onRemove }: GuestListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("all");
  
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = 
      guest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.partnerFirstName && guest.partnerFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (guest.partnerLastName && guest.partnerLastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === "assigned") {
      return matchesSearch && guest.tableId;
    } else if (filter === "unassigned") {
      return matchesSearch && !guest.tableId;
    }
    
    return matchesSearch;
  });
  
  const getStatusBadge = (guest: Guest) => {
    if (guest.tableId) {
      const table = tables.find(t => t.id === guest.tableId);
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {table?.name || "Assigned"}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        Unassigned
      </Badge>
    );
  };
  
  if (guests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No guests added yet. Add guests from the guest management page.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Guests</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {filteredGuests.map(guest => (
            <div 
              key={guest.id}
              className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50"
            >
              <div>
                <div className="font-medium">
                  {guest.firstName} {guest.lastName}
                  {guest.isCouple && guest.partnerFirstName && (
                    <span className="text-muted-foreground"> + {guest.partnerFirstName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(guest)}
                  {guest.isCouple && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Couple
                    </Badge>
                  )}
                  {guest.hasChildren && guest.children && guest.children.length > 0 && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      +{guest.children.length} {guest.children.length === 1 ? 'Child' : 'Children'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1">
                {guest.tableId ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onRemove(guest.id)}
                    title="Remove from table"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                ) : (
                  tables.length > 0 && (
                    <Select onValueChange={(tableId) => onAssign(guest.id, tableId)}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Assign to table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map(table => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default GuestList;
