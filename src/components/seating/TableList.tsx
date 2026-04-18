import { Table } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Circle, Square, RectangleHorizontal, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface TableListProps {
  tables: Table[];
  onEdit: (table: Table) => void;
  onDelete: (tableId: string) => void;
}

const TableList = ({ tables, onEdit, onDelete }: TableListProps) => {
  const getTableIcon = (shape: string) => {
    switch (shape) {
      case 'round':
        return <Circle className="h-4 w-4 text-emerald-500" />;
      case 'square':
        return <Square className="h-4 w-4 text-blue-500" />;
      case 'rectangular':
        return <RectangleHorizontal className="h-4 w-4 text-red-500" />;
      default:
        return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  if (tables.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tables created yet. Add your first table to get started.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {tables.map(table => (
          <div
            key={table.id}
            className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              {getTableIcon(table.shape)}
              <div>
                <div className="font-medium">{table.name}</div>
                <div className="text-xs text-muted-foreground">Capacity: {table.capacity}</div>
              </div>
            </div>

            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(table)}>
                <Edit className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Table</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the table "{table.name}"?
                      This will remove all guest assignments to this table.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(table.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TableList;
