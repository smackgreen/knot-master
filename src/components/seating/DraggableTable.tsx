import React, { useState, useMemo, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Table, Guest } from '@/types';
import { Circle, Square, RectangleHorizontal, RotateCw, Edit, UserMinus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

interface DraggableTableProps {
  table: Table;
  isSelected?: boolean;
  onSelect: (table: Table, isMultiSelect: boolean) => void;
}

const DraggableTable = ({ table, isSelected = false, onSelect }: DraggableTableProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { getGuestsByClientId, removeGuestFromTable, updateTable } = useApp();

  // Get guests assigned to this table - memoized to prevent recalculation on every render
  const tableGuests = useMemo(() => {
    const allGuests = getGuestsByClientId(table.clientId);
    return allGuests.filter(guest => guest.tableId === table.id);
  }, [table.id, table.clientId, getGuestsByClientId]);

  // Use dnd-kit's useDraggable hook
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: table.id,
    data: table,
  });

  // Effect to handle showing/hiding controls
  React.useEffect(() => {
    if (isHovered) {
      setShowControls(true);
      // Clear any existing timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    } else {
      // Set a timeout to hide controls after mouse leaves
      // This gives time for the user to move from the table to the controls
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 300); // 300ms delay before hiding controls
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isHovered]);

  // Memoize the style object to prevent recalculation on every render
  const style = useMemo(() => {
    // Base styles without position (position will be handled by dnd-kit)
    const baseStyles = {
      width: `${table.width}px`,
      height: `${table.height}px`,
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: isDragging ? 50 : (isHovered || showControls || isSelected ? 20 : 10),
      transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
      boxShadow: isSelected
        ? '0 0 0 3px #6366f1' // Purple for selected
        : (isHovered || showControls)
          ? '0 0 0 2px #0ea5e9' // Blue for hover
          : 'none',
      willChange: 'transform', // Hint to browser to optimize transforms
      position: 'absolute' as const,
      left: `${table.positionX}px`,
      top: `${table.positionY}px`,
    };

    // Apply dnd-kit transform with rotation
    return {
      ...baseStyles,
      transform: CSS.Transform.toString({
        ...transform,
        scaleX: 1,
        scaleY: 1,
      }) + ` rotate(${table.rotation}deg)`,
    };
  }, [transform, table.positionX, table.positionY, table.width, table.height, table.rotation, isHovered, isDragging, isSelected, showControls]);

  // Memoize the table style class to prevent recalculation on every render
  const tableStyleClass = useMemo(() => {
    const baseStyle = "flex items-center justify-center border-2 bg-white/90";

    switch (table.shape) {
      case 'round':
        return `${baseStyle} rounded-full border-emerald-500`;
      case 'square':
        return `${baseStyle} rounded-md border-blue-500`;
      case 'rectangular':
        return `${baseStyle} rounded-md border-red-500`;
      default:
        return `${baseStyle} rounded-md border-gray-500`;
    }
  }, [table.shape]);

  // Calculate occupancy - memoized to prevent recalculation on every render
  const { totalGuests, occupancyPercentage, occupancyColor } = useMemo(() => {
    const total = tableGuests.reduce((count, guest) => {
      let guestCount = 1;
      if (guest.isCouple) guestCount++;
      if (guest.hasChildren && guest.children) guestCount += guest.children.length;
      return count + guestCount;
    }, 0);

    const percentage = Math.min(100, Math.round((total / table.capacity) * 100));

    let color = "bg-green-500";
    if (percentage >= 90) color = "bg-red-500";
    else if (percentage >= 50) color = "bg-yellow-500";

    return { totalGuests: total, occupancyPercentage: percentage, occupancyColor: color };
  }, [tableGuests, table.capacity]);

  // Memoize event handlers to prevent recreation on every render
  const handleRotate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateTable(table.id, { ...table, rotation: (table.rotation + 45) % 360 });
  }, [table, updateTable]);

  const handleRemoveGuest = useCallback((guestId: string) => {
    removeGuestFromTable(guestId);
  }, [removeGuestFromTable]);

  // Memoize the select handler to prevent recreation on every render
  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Check if shift key is pressed for multi-select
    const isMultiSelect = e.shiftKey;
    onSelect(table, isMultiSelect);
  }, [table, onSelect]);

  // Memoize the mouse enter/leave handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Memoize the guest list rendering to prevent recreation on every render
  const guestListContent = useMemo(() => {
    if (!showControls || tableGuests.length === 0) return null;

    return (
      <div
        className="absolute top-full left-0 mt-2 bg-white p-2 rounded shadow-md z-20 w-full max-h-40 overflow-y-auto"
        onMouseEnter={() => {
          // Keep controls visible when hovering over guest list
          setShowControls(true);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = null;
          }
        }}
        onMouseLeave={() => {
          // Start the timeout to hide controls when mouse leaves the guest list
          if (!isHovered) {
            controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
            }, 300);
          }
        }}
      >
        <div className="text-xs font-medium mb-1">Seated Guests:</div>
        {tableGuests.map(guest => (
          <div key={guest.id} className="flex justify-between items-center text-xs py-1">
            <span>
              {guest.firstName} {guest.lastName}
              {guest.isCouple && guest.partnerFirstName && (
                <span className="text-gray-500"> + {guest.partnerFirstName}</span>
              )}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveGuest(guest.id);
              }}
            >
              <UserMinus className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    );
  }, [showControls, isHovered, tableGuests, handleRemoveGuest]);

  // Memoize the control buttons rendering
  const controlButtons = useMemo(() => {
    if (!showControls) return null;

    return (
      <div
        className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex gap-1"
        onMouseEnter={() => {
          // Keep controls visible when hovering over them
          setShowControls(true);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = null;
          }
        }}
        onMouseLeave={() => {
          // Start the timeout to hide controls when mouse leaves the buttons
          if (!isHovered) {
            controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
            }, 300);
          }
        }}
      >
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 bg-white"
          onClick={handleRotate}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 bg-white"
          onClick={(e) => handleSelect(e)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    );
  }, [showControls, isHovered, handleRotate, handleSelect]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={tableStyleClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => handleSelect(e)}
      data-draggable="true"
      data-table-id={table.id}
      {...listeners}
      {...attributes}
    >
      <div className="flex flex-col items-center">
        <div className="font-medium text-center text-sm">{table.name}</div>

        <div className="flex items-center gap-1 mt-1">
          <Badge variant="outline" className="text-xs">
            {totalGuests}/{table.capacity}
          </Badge>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${occupancyColor}`}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {controlButtons}
      {guestListContent}
    </div>
  );
};

export default DraggableTable;
