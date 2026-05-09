import React, { useMemo, useCallback, useRef, useState } from 'react';
import { Group, Circle, Text, Rect, Line, Transformer } from 'react-konva';
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

// Handle size constant
const HANDLE_SIZE = 8;
const HANDLE_HIT_SIZE = 16;
const ROTATION_HANDLE_DISTANCE = 30;
const ROTATION_HANDLE_RADIUS = 6;

interface KonvaTableProps {
  table: Table;
  guests: Guest[];
  isSelected: boolean;
  isHovered: boolean;
  isDraggable: boolean;
  onSelect: (table: Table) => void;
  onDragEnd: (tableId: string, x: number, y: number) => void;
  onHover: (tableId: string | null) => void;
  onResize?: (tableId: string, width: number, height: number) => void;
  onRotate?: (tableId: string, rotation: number) => void;
  tableRadius?: number;
}

// Corner positions for resize handles
type Corner = 'tl' | 'tr' | 'bl' | 'br';

const KonvaTable: React.FC<KonvaTableProps> = ({
  table,
  guests,
  isSelected,
  isHovered,
  isDraggable,
  onSelect,
  onDragEnd,
  onHover,
  onResize,
  onRotate,
  tableRadius = 60,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number; corner: Corner } | null>(null);

  // Determine table category color
  const colors = useMemo(() => {
    // If a custom color is set on the table, use it
    const customColor = (table as any).color;
    if (customColor && customColor !== '#FFFFFF' && customColor !== '#ffffff') {
      // Generate a color scheme from the custom color
      return {
        fill: customColor + '33', // 20% opacity for fill
        stroke: customColor,
        seatFill: customColor + '55', // 33% opacity for seats
        text: customColor,
      };
    }

    // Try to determine category from table name or use default
    const nameLower = (table.name || '').toLowerCase();
    if (nameLower.includes('family') || nameLower.includes('famille')) return TABLE_COLORS.family;
    if (nameLower.includes('friend') || nameLower.includes('ami')) return TABLE_COLORS.friends;
    if (nameLower.includes('colleague') || nameLower.includes('collègue')) return TABLE_COLORS.colleagues;
    if (nameLower.includes('vip')) return TABLE_COLORS.vip;
    return TABLE_COLORS.default;
  }, [table.name, (table as any).color]);

  // Effective dimensions
  const isRound = table.shape === 'round' || !table.shape;
  const effectiveWidth = isRound ? (table.width || 120) : (table.width || 120);
  const effectiveHeight = isRound ? (table.width || 120) : (table.shape === 'square' ? (table.width || 120) : (table.height || 80));
  const effectiveRadius = isRound ? effectiveWidth / 2 : 0;

  // Calculate seat positions around the table
  const seatPositions = useMemo(() => {
    const seats: { x: number; y: number; angle: number }[] = [];
    const capacity = table.capacity || 8;
    const seatRadius = (isRound ? effectiveRadius : Math.max(effectiveWidth, effectiveHeight) / 2) + 28;

    for (let i = 0; i < capacity; i++) {
      const angle = (i * 2 * Math.PI) / capacity - Math.PI / 2;
      seats.push({
        x: Math.cos(angle) * seatRadius,
        y: Math.sin(angle) * seatRadius,
        angle: (angle * 180) / Math.PI,
      });
    }
    return seats;
  }, [table.capacity, isRound, effectiveRadius, effectiveWidth, effectiveHeight]);

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

  // ─── Resize handle interactions ────────────────────────────────────────────
  const getHandlePositions = useCallback(() => {
    if (isRound) {
      const r = effectiveRadius;
      return {
        tl: { x: -r, y: -r },
        tr: { x: r, y: -r },
        bl: { x: -r, y: r },
        br: { x: r, y: r },
      };
    } else {
      const hw = effectiveWidth / 2;
      const hh = effectiveHeight / 2;
      return {
        tl: { x: -hw, y: -hh },
        tr: { x: hw, y: -hh },
        bl: { x: -hw, y: hh },
        br: { x: hw, y: hh },
      };
    }
  }, [isRound, effectiveRadius, effectiveWidth, effectiveHeight]);

  const handleResizeDragStart = useCallback(
    (corner: Corner, e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      setIsResizing(true);
      const stage = e.target.getStage();
      if (!stage) return;
      resizeStartRef.current = {
        x: e.evt.clientX,
        y: e.evt.clientY,
        width: effectiveWidth,
        height: effectiveHeight,
        corner,
      };
    },
    [effectiveWidth, effectiveHeight]
  );

  const handleResizeDragMove = useCallback(
    (corner: Corner, e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      if (!resizeStartRef.current || !onResize) return;

      const start = resizeStartRef.current;
      const dx = e.evt.clientX - start.x;
      const dy = e.evt.clientY - start.y;

      // Account for rotation
      const rotation = ((table.rotation || 0) * Math.PI) / 180;
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      // Rotate delta to element's local coordinate system
      const localDx = dx * cosR + dy * sinR;
      const localDy = -dx * sinR + dy * cosR;

      // Scale factor from stage zoom
      const stage = e.target.getStage();
      const zoom = stage?.scaleX() || 1;

      let newWidth = start.width;
      let newHeight = start.height;

      // Calculate new dimensions based on which corner is dragged
      const absLocalDx = Math.abs(localDx / zoom);
      const absLocalDy = Math.abs(localDy / zoom);

      if (corner === 'br') {
        newWidth = Math.max(40, start.width + localDx / zoom);
        newHeight = Math.max(40, start.height + localDy / zoom);
      } else if (corner === 'bl') {
        newWidth = Math.max(40, start.width - localDx / zoom);
        newHeight = Math.max(40, start.height + localDy / zoom);
      } else if (corner === 'tr') {
        newWidth = Math.max(40, start.width + localDx / zoom);
        newHeight = Math.max(40, start.height - localDy / zoom);
      } else if (corner === 'tl') {
        newWidth = Math.max(40, start.width - localDx / zoom);
        newHeight = Math.max(40, start.height - localDy / zoom);
      }

      // For round tables, keep width = height (maintain circle)
      if (isRound) {
        const size = Math.max(newWidth, newHeight);
        newWidth = size;
        newHeight = size;
      }

      onResize(table.id, Math.round(newWidth), Math.round(newHeight));
    },
    [table.id, table.rotation, isRound, onResize]
  );

  const handleResizeDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      setIsResizing(false);
      resizeStartRef.current = null;
    },
    []
  );

  // ─── Rotation handle interactions ──────────────────────────────────────────
  const handleRotationDragStart = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      setIsRotating(true);
    },
    []
  );

  const handleRotationDragMove = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      if (!onRotate) return;

      // Get the parent group position (table center in stage coords)
      const group = e.target.getParent();
      if (!group) return;

      const stage = group.getStage();
      if (!stage) return;

      // Get mouse position in stage coordinates
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Transform pointer position to account for stage zoom/pan
      const stageTransform = stage.getAbsoluteTransform().copy().invert();
      const stagePoint = stageTransform.point(pointerPos);

      // Calculate angle from table center to mouse
      const dx = stagePoint.x - table.positionX;
      const dy = stagePoint.y - table.positionY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

      // Snap to 5-degree increments
      angle = Math.round(angle / 5) * 5;

      // Normalize to -180 to 180
      while (angle > 180) angle -= 360;
      while (angle < -180) angle += 360;

      onRotate(table.id, angle);
    },
    [table.id, table.positionX, table.positionY, onRotate]
  );

  const handleRotationDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      setIsRotating(false);
    },
    []
  );

  // Render based on table shape
  const renderTableShape = () => {
    if (isRound) {
      return (
        <>
          {/* Outer glow when selected */}
          {isSelected && (
            <Circle
              x={0}
              y={0}
              radius={effectiveRadius + 6}
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
            radius={effectiveRadius}
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
    const w = effectiveWidth;
    const h = effectiveHeight;
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

  // ─── Render resize & rotation handles ──────────────────────────────────────
  const renderTransformHandles = () => {
    if (!isSelected) return null;

    const handles = getHandlePositions();
    const topCenter = isRound
      ? { x: 0, y: -effectiveRadius }
      : { x: 0, y: -effectiveHeight / 2 };
    const rotationHandleY = topCenter.y - ROTATION_HANDLE_DISTANCE;

    return (
      <>
        {/* Dashed bounding box for visual clarity */}
        {!isRound && (
          <Rect
            x={-effectiveWidth / 2}
            y={-effectiveHeight / 2}
            width={effectiveWidth}
            height={effectiveHeight}
            stroke={colors.stroke}
            strokeWidth={1}
            dash={[4, 4]}
            opacity={0.4}
            listening={false}
          />
        )}

        {/* Connection line from top center to rotation handle */}
        <Line
          points={[topCenter.x, topCenter.y, topCenter.x, rotationHandleY]}
          stroke={colors.stroke}
          strokeWidth={1.5}
          dash={[3, 3]}
          listening={false}
        />

        {/* Rotation handle */}
        <Circle
          x={topCenter.x}
          y={rotationHandleY}
          radius={ROTATION_HANDLE_RADIUS}
          fill="white"
          stroke={colors.stroke}
          strokeWidth={2}
          draggable
          onDragStart={handleRotationDragStart}
          onDragMove={handleRotationDragMove}
          onDragEnd={handleRotationDragEnd}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'crosshair';
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
          }}
        />
        {/* Rotation icon (small arrow) */}
        <Text
          x={topCenter.x - 5}
          y={rotationHandleY - 5}
          width={10}
          height={10}
          text="↻"
          fontSize={10}
          fill={colors.stroke}
          align="center"
          verticalAlign="middle"
          listening={false}
        />

        {/* Corner resize handles */}
        {(['tl', 'tr', 'bl', 'br'] as Corner[]).map((corner) => {
          const pos = handles[corner];
          return (
            <Rect
              key={`handle-${corner}`}
              x={pos.x - HANDLE_SIZE / 2}
              y={pos.y - HANDLE_SIZE / 2}
              width={HANDLE_SIZE}
              height={HANDLE_SIZE}
              fill="white"
              stroke={colors.stroke}
              strokeWidth={2}
              cornerRadius={2}
              draggable
              onDragStart={(e) => handleResizeDragStart(corner, e)}
              onDragMove={(e) => handleResizeDragMove(corner, e)}
              onDragEnd={handleResizeDragEnd}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  // Set cursor based on corner
                  const cursors: Record<Corner, string> = {
                    tl: 'nwse-resize',
                    tr: 'nesw-resize',
                    bl: 'nesw-resize',
                    br: 'nwse-resize',
                  };
                  stage.container().style.cursor = cursors[corner];
                }
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'default';
              }}
            />
          );
        })}
      </>
    );
  };

  return (
    <Group
      x={table.positionX}
      y={table.positionY}
      draggable={isDraggable && !isResizing && !isRotating}
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
            y={(isRound ? effectiveRadius : effectiveHeight / 2) + 22}
            width={50}
            height={4}
            cornerRadius={2}
            fill="#E5E7EB"
          />
          <Rect
            x={-25}
            y={(isRound ? effectiveRadius : effectiveHeight / 2) + 22}
            width={Math.min(50, (guestCount / (table.capacity || 1)) * 50)}
            height={4}
            cornerRadius={2}
            fill={guestCount >= (table.capacity || 1) ? '#EF4444' : colors.stroke}
          />
        </Group>
      )}

      {/* Resize & Rotation handles (only when selected) */}
      {renderTransformHandles()}
    </Group>
  );
};

export default React.memo(KonvaTable);
