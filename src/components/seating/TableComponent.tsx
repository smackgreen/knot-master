import { useState } from "react";
import { Table, Guest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCw, Edit, UserPlus, UserMinus } from "lucide-react";

interface TableComponentProps {
  table: Table;
  guests: Guest[];
  onDragStart: (tableId: string, offsetX: number, offsetY: number) => void;
  onRotationChange: (tableId: string, rotation: number) => void;
  onSelect: () => void;
  onGuestAssign: (guestId: string, tableId: string) => void;
  onGuestRemove: (guestId: string) => void;
}

const TableComponent = ({
  table,
  guests,
  onDragStart,
  onRotationChange,
  onSelect,
  onGuestAssign,
  onGuestRemove
}: TableComponentProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    onDragStart(table.id, offsetX, offsetY);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;
      onDragStart(table.id, offsetX, offsetY);
    }
  };
  
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRotationChange(table.id, (table.rotation + 45) % 360);
  };
  
  const getTableStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${table.positionX}px`,
      top: `${table.positionY}px`,
      width: `${table.width}px`,
      height: `${table.height}px`,
      transform: `rotate(${table.rotation}deg)`,
      cursor: 'move',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s ease',
      boxShadow: isHovered ? '0 0 0 2px #0ea5e9' : 'none',
      zIndex: isHovered ? 10 : 1
    };
    
    // Shape-specific styles
    switch (table.shape) {
      case 'round':
        return {
          ...baseStyle,
          borderRadius: '50%',
          backgroundColor: 'rgba(236, 253, 245, 0.8)',
          border: '2px solid #10b981'
        };
      case 'square':
        return {
          ...baseStyle,
          borderRadius: '4px',
          backgroundColor: 'rgba(239, 246, 255, 0.8)',
          border: '2px solid #3b82f6'
        };
      case 'rectangular':
        return {
          ...baseStyle,
          borderRadius: '4px',
          backgroundColor: 'rgba(254, 242, 242, 0.8)',
          border: '2px solid #ef4444'
        };
      default:
        return {
          ...baseStyle,
          borderRadius: '4px',
          backgroundColor: 'rgba(243, 244, 246, 0.8)',
          border: '2px solid #6b7280'
        };
    }
  };
  
  // Calculate occupancy
  const totalGuests = guests.reduce((count, guest) => {
    let guestCount = 1;
    if (guest.isCouple) guestCount++;
    if (guest.hasChildren && guest.children) guestCount += guest.children.length;
    return count + guestCount;
  }, 0);
  
  const occupancyPercentage = Math.min(100, Math.round((totalGuests / table.capacity) * 100));
  
  const getOccupancyColor = () => {
    if (occupancyPercentage < 50) return "bg-green-500";
    if (occupancyPercentage < 90) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <div
      style={getTableStyle()}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="font-medium text-center text-sm">{table.name}</div>
      
      <div className="flex items-center gap-1 mt-1">
        <Badge variant="outline" className="text-xs">
          {totalGuests}/{table.capacity}
        </Badge>
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getOccupancyColor()}`} 
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
      </div>
      
      {isHovered && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8 bg-white" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8 bg-white" onClick={onSelect}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {isHovered && guests.length > 0 && (
        <div className="absolute top-full left-0 mt-2 bg-white p-2 rounded shadow-md z-20 w-full max-h-40 overflow-y-auto">
          <div className="text-xs font-medium mb-1">Seated Guests:</div>
          {guests.map(guest => (
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
                onClick={() => onGuestRemove(guest.id)}
              >
                <UserMinus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TableComponent;
