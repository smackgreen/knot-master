import React, { useMemo, useCallback, useRef, useState } from 'react';
import { Group, Circle, Text, Rect, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Table, Guest, TableShape } from '@/types';

// Color palette for table categories
const TABLE_COLORS: Record<string, { fill: string; stroke: string; seatFill: string; text: string }> = {
  family: { fill: '#EDE9FE', stroke: '#8B5CF6', seatFill: '#DDD6FE', text: '#5B21B6' },
  friends: { fill: '#DBEAFE', stroke: '#3B82F6', seatFill: '#BFDBFE', text: '#1E40AF' },
  colleagues: { fill: '#D1FAE5', stroke: '#10B981', seatFill: '#A7F3D0', text: '#065F46' },
  vip: { fill: '#FEF3C7', stroke: '#F59E0B', seatFill: '#FDE68A', text: '#92400E' },
  default: { fill: '#F3E8FF', stroke: '#A78BFA', seatFill: '#E9D5FF', text: '#6D28D9' },
};

interface KonvaTableProps {
  table: Table;
  guests: Guest[];
  isSelected: boolean;
  isHovered: boolean;
  isDraggable: boolean;
  onSelect: (table: Table) => void;
  onDragEnd: (tableId: string, x: number, y: number) => void;
  onHover: (tableId: string | null) => void;
  tableRadius?: number;
}

const KonvaTable: React.FC<KonvaTableProps> = ({
  table,
  guests,
  isSelected,
  isHovered,
  isDraggable,
  onSelect,
  onDragEnd,
  onHover,
  tableRadius = 60,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Determine table category color
  const colors = useMemo(() => {
    // Try to determine category from table name or use default
    const nameLower = (table.name || '').toLowerCase();
    if (nameLower.includes('family') || nameLower.includes('famille')) return TABLE_COLORS.family;
    if (nameLower.includes('friend') || nameLower.includes('ami')) return TABLE_COLORS.friends;
    if (nameLower.includes('colleague') || nameLower.includes('collègue')) return TABLE_COLORS.colleagues;
    if (nameLower.includes('vip')) return TABLE_COLORS.vip;
    return TABLE_COLORS.default;
  }, [table.name]);

  // Calculate seat positions around the table
  const seatPositions = useMemo(() => {
    const seats: { x: number; y: number; angle: number }[] = [];
    const capacity = table.capacity || 8;
    const seatRadius = tableRadius + 28;

    for (let i = 0; i < capacity; i++) {
      const angle = (i * 2 * Math.PI) / capacity - Math.PI / 2;
      seats.push({
        x: Math.cos(angle) * seatRadius,
        y: Math.sin(angle) * seatRadius,
        angle: (angle * 180) / Math.PI,
      });
    }
    return seats;
  }, [table.capacity, tableRadius]);

  // Get guest names for each seat
  const seatGuests = useMemo(() => {
    const assigned: (Guest | null)[] = new Array(table.capacity || 8).fill(null);
    guests.forEach((guest) => {
      if (guest.seatPosition !== undefined && guest.seatPosition !== null) {
        assigned[guest.seatPosition] = guest;
      } else {
        // Fill first available seat
        const emptyIndex = assigned.indexOf(null);
        if (emptyIndex !== -1) {
          assigned[emptyIndex] = guest;
        }
      }
    });
    return assigned;
  }, [guests, table.capacity]);

  // Guest count
  const guestCount = useMemo(() => guests.length, [guests]);

  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      setIsDragging(false);
      onDragEnd(table.id, e.target.x(), e.target.y());
    },
    [table.id, onDragEnd]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onSelect(table);
    },
    [table, onSelect]
  );

  const handleMouseEnter = useCallback(() => {
    onHover(table.id);
  }, [table.id, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  // Render based on table shape
  const renderTableShape = () => {
    if (table.shape === 'round' || !table.shape) {
      return (
        <>
          {/* Outer glow when selected */}
          {isSelected && (
            <Circle
              x={0}
              y={0}
              radius={tableRadius + 6}
              stroke={colors.stroke}
              strokeWidth={3}
              dash={[6, 4]}
              opacity={0.6}
            />
          )}
          {/* Main table circle */}
          <Circle
            x={0}
            y={0}
            radius={tableRadius}
            fill={isDragging ? '#F9FAFB' : colors.fill}
            stroke={isSelected ? colors.stroke : isHovered ? colors.stroke : '#D1D5DB'}
            strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
            shadowColor="rgba(0,0,0,0.1)"
            shadowBlur={isHovered || isSelected ? 12 : 6}
            shadowOffsetY={2}
          />
        </>
      );
    }

    // Rectangular or square
    const w = table.width || 120;
    const h = table.shape === 'square' ? (table.width || 120) : (table.height || 80);
    return (
      <>
        {isSelected && (
          <Rect
            x={-w / 2 - 4}
            y={-h / 2 - 4}
            width={w + 8}
            height={h + 8}
            cornerRadius={8}
            stroke={colors.stroke}
            strokeWidth={3}
            dash={[6, 4]}
            opacity={0.6}
          />
        )}
        <Rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          cornerRadius={8}
          fill={isDragging ? '#F9FAFB' : colors.fill}
          stroke={isSelected ? colors.stroke : isHovered ? colors.stroke : '#D1D5DB'}
          strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
          shadowColor="rgba(0,0,0,0.1)"
          shadowBlur={isHovered || isSelected ? 12 : 6}
          shadowOffsetY={2}
        />
      </>
    );
  };

  return (
    <Group
      x={table.positionX}
      y={table.positionY}
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      onClick={handleClick}
      onTap={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      rotation={table.rotation || 0}
    >
      {/* Table shape */}
      {renderTableShape()}

      {/* Table name */}
      <Text
        x={-40}
        y={-12}
        width={80}
        text={table.name}
        fontSize={13}
        fontStyle="bold"
        fill={colors.text}
        align="center"
        verticalAlign="middle"
        listening={false}
      />

      {/* Guest count */}
      <Text
        x={-30}
        y={4}
        width={60}
        text={`${guestCount}/${table.capacity}`}
        fontSize={10}
        fill={colors.text}
        opacity={0.7}
        align="center"
        listening={false}
      />

      {/* Seat indicators and guest names */}
      {seatPositions.map((seat, index) => {
        const guest = seatGuests[index];
        const isOccupied = guest !== null;

        return (
          <Group key={`seat-${index}`}>
            {/* Seat circle */}
            <Circle
              x={seat.x}
              y={seat.y}
              radius={isOccupied ? 10 : 6}
              fill={isOccupied ? colors.seatFill : '#F3F4F6'}
              stroke={isOccupied ? colors.stroke : '#E5E7EB'}
              strokeWidth={1}
            />

            {/* Guest name label */}
            {isOccupied && guest && (
              <Text
                x={seat.x - 30}
                y={seat.y + 12}
                width={60}
                text={`${guest.firstName} ${guest.lastName?.charAt(0) || ''}`}
                fontSize={8}
                fill={colors.text}
                align="center"
                listening={false}
                opacity={0.85}
              />
            )}
          </Group>
        );
      })}

      {/* Occupancy bar at the bottom */}
      {guestCount > 0 && (
        <Group>
          <Rect
            x={-25}
            y={tableRadius + 22}
            width={50}
            height={4}
            cornerRadius={2}
            fill="#E5E7EB"
          />
          <Rect
            x={-25}
            y={tableRadius + 22}
            width={Math.min(50, (guestCount / (table.capacity || 1)) * 50)}
            height={4}
            cornerRadius={2}
            fill={guestCount >= (table.capacity || 1) ? '#EF4444' : colors.stroke}
          />
        </Group>
      )}
    </Group>
  );
};

export default React.memo(KonvaTable);
